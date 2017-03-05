class GamePadController {
    constructor(pressedCallback, releasedCallback) {
        this.buttonCaptured  = false;
        this.lastButtonState = false;

        if(this.gamepads) {
            console.log("Gamepads identified:", this.gamepads.length);
        }
            
        this.pressedCallback  = pressedCallback;
        this.releasedCallback = releasedCallback;
    }
    
    get gamepads() {
        return navigator.getGamepads ?
            navigator.getGamepads() :
            (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
    }
    
    scanForButton() {
        var gamepads = this.gamepads;
        if(gamepads && gamepads.length) {
            for(var gpIndex = 0; gpIndex < gamepads.length; gpIndex++) {
                var gp = gamepads[gpIndex];
                if(gp && gp.connected) {
                    for(var btnIndex = 0; btnIndex < gp.buttons.length; btnIndex++) {
                        if(gp.buttons[btnIndex].pressed) {
                            console.log("Gamepad clicked:", gpIndex, btnIndex);
                            return {
                                gamepadIndex: gpIndex,
                                buttonIndex: btnIndex
                            }
                        }
                    }
                }
            }
        } else {
            return -1;
        }
    }
    
    captureInteractionButton() {
        var btn = this.scanForButton();
        if(btn === -1) {
            return;
        }
        if(btn) {
            console.log("Button", btn.btnIndex, "on controller", btn.gpIndex, "bound to clicks");
            this.buttonCaptured = true;
            this.gpIndex        = btn.gamepadIndex;
            this.btnIndex       = btn.buttonIndex;
        }        
    }

    poll() {
        if(this.buttonCaptured) {
            var gamepads = this.gamepads;          
            var gp = gamepads[this.gpIndex];
            if(gp.buttons[this.btnIndex].pressed) {
                if(this.lastButtonState === false) {
                    this.lastButtonState = true;
                    if(this.pressedCallback) {
                        this.pressedCallback();
                    }
                }
            } else {
                if(this.lastButtonState === true) {
                    this.lastButtonState = false;
                    if(this.releasedCallback) {
                        this.releasedCallback();
                    }
                }
            }
        } else {
            this.captureInteractionButton();
        }
    }
}

class TouchPoint {
    constructor(handId, touchPoint, surfaceNormal) {
        this.handId        = handId;
        this.point         = touchPoint;
        this.surfaceNormal = surfaceNormal;
        this.tracked       = true;
        
        this.plungeVector = new THREE.Vector3();
    }
    
    updateFingerTip(tipPoint) {
        this.plungeVector.subVectors(this.point, tipPoint);
        this.tracked = true;
    }
    
    get plungeDepth() {
        return -this.surfaceNormal.dot(this.plungeVector);
    }
    
    get touching() {
        return this.plungeDepth < 0;
    }
}

class LeapMotionController {
    constructor() {
        if(typeof Leap === 'undefined') {
            console.log("LeapMotionController: Leap Motion API undefined, not loading");
            return;
        }
        
        console.log("LeapMotionController: Connecting to leap motion controller");
                
        this.leapController = new Leap.Controller({
            optimizeHMD: true
        });
        this.leapController.connect();
        this.leapController.use('transform', {
            vr:              true,
            effectiveParent: camera,
            scale:           0.0001
        }).use('boneHand', {
            scene: scene,
            arm: false
        });
        
        this.pushedElement = null;
        this.touchPoint = null;
        
        this.boneDirection = new THREE.Vector3();
        this.boneBase      = new THREE.Vector3();
        this.boneTip       = new THREE.Vector3();
    }
    
    /* Currently only tracks the distal portion of the index finger */
    poll(dt, indexFingerCallback) {
        if(this.leapController) {
            this.markTouchPointsUntracked();
            
            var frame = this.leapController.frame();
            for(var h = 0; h < frame.hands.length; h++) {
                var indexFinger = frame.hands[h].indexFinger;
                var handId = frame.hands[h].id;
                if(indexFinger.extended) {
                    var boneLength = indexFinger.distal.length;
                    this.boneBase.fromArray(indexFinger.distal.prevJoint);
                    this.boneTip.fromArray(indexFinger.distal.nextJoint);
                    this.boneDirection.subVectors(this.boneTip, this.boneBase);
                    
                    this.detectButtonPush(handId, this.boneBase, this.boneTip, this.boneDirection, boneLength);
                }
            }
            this.clearUntrackedTouchPoints();
        }
    }
    
    markTouchPointsUntracked() {
        if(this.touchPoint) {
            this.touchPoint.tracked = false;
        }
    }
    
    clearUntrackedTouchPoints() {
        if(this.touchPoint && !this.touchPoint.tracked) {
            console.log("Touch point dropped because hand no longer is in frame.");
            soundscape.playTouchSound(this.touchPoint.point);
            this.touchPoint    = null;
            this.pushedElement = null;
        }
    }
    
    detectButtonPush(handId, base, tip, direction, length) {
        if(!this.touchPoint) {
            var el = vrElements.elementAlongRay(base, direction, length);
            if(el) {
                var child = el.el.uvToElement(el.uv);
                this.pushedElement = child;
                this.touchPoint    = new TouchPoint(handId, el.point, el.normal);
                soundscape.playTouchSound(this.touchPoint.point);
                
                airCanvas.expandMarker(this.touchPoint.point, 0xDAA520);
            }
        } else if(handId === this.touchPoint.handId) {
            this.touchPoint.updateFingerTip(tip);
            if(!this.touchPoint.touching) {
                soundscape.playTouchSound(this.touchPoint.point);
                this.pushedElement.click();
                this.touchPoint    = null;
                this.pushedElement = null;
            }
        }
    }
}

class MouseController {
    constructor(triggerPressed, triggerReleased) {
        var mouseObj = window;
        
        var useTouch = false;
        var me = this;

        this.mousedownFunc  = function(e) {if(!useTouch){ triggerPressed(e); checkPointerLock(); }};
        this.mouseupFunc    = function(e) {if(!useTouch)  triggerReleased(e);};
        this.touchStartFunc = function(e) {useTouch=true; triggerPressed(e);};
        this.touchEndFunc   = function(e) {useTouch=true; triggerReleased(e);};

        mouseObj.addEventListener('mousedown',  this.mousedownFunc);
        mouseObj.addEventListener('mouseup',    this.mouseupFunc);
        mouseObj.addEventListener('touchstart', this.touchStartFunc);
        mouseObj.addEventListener('touchend',   this.touchEndFunc);
    }
}

class InteractionManager {
    constructor() {
        const triggerPressedFunc  = this.triggerPressed.bind(this);
        const triggerReleasedFunc = this.triggerReleased.bind(this);
        
        this.leapMotion = new LeapMotionController();
        this.mouse      = new MouseController(triggerPressedFunc, triggerReleasedFunc);
        this.gamePad    = new GamePadController(triggerPressedFunc, triggerReleasedFunc);
        
        this.pushedElement = null;
        this.touchPoint    = null;
    }
        
    poll(dt) {
        this.leapMotion.poll(dt);
        this.gamePad.poll(dt);
    }
    
    triggerPressed(e) {
        if(!vrMode) {
            return;
        }
        if(e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        var el = vrElements.elementInGaze();
        if(el) {
            var child = el.el.uvToElement(el.uv);
            this.pushedElement = child;
            this.touchPoint = el.point;
            soundscape.playTouchSound(this.touchPoint);
            airCanvas.expandMarker(this.touchPoint, 0xDAA520);
        }
    }
    
    triggerReleased(e) {
        if(!vrMode) {
            return;
        }
        if(e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        if(this.pushedElement) {
            this.pushedElement.click();
            soundscape.playTouchSound(this.touchPoint);
        }
        this.pushedElement = null;
    }
}

/* Pointer Lock API Support */
var last_pointer_lock_element;

function requestPointerLock(element) {
    element.requestPointerLock = element.requestPointerLock ||
                                 element.mozRequestPointerLock ||
                                 element.webkitRequestPointerLock;
    // Ask the browser to lock the pointer
    if(element.requestPointerLock) {
        element.requestPointerLock();
        last_pointer_lock_element = element;
    }
}

function exitPointerLock() {
    document.exitPointerLock = document.exitPointerLock    ||
                               document.mozExitPointerLock;
    document.exitPointerLock();
}

function isPointerLocked() {
    return document.pointerLockElement ||
           document.mozPointerLockElement ||
           document.webkitPointerLockElement;
}

function checkPointerLock(){
    if(HTML2VR.inVR && !isPointerLocked() && last_pointer_lock_element)
        requestPointerLock(last_pointer_lock_element);
}