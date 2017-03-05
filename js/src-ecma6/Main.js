const mirrorToScreen = false;

var loader = new THREE.TextureLoader();
var clock  = new THREE.Clock();
var vrDisplay, vrElements, container, vrMode, leapController, scene, motionTracker;
var vrOnlyStylesheet;
var interactionManager, fader, debugOverlay, skydomeMaterial, soundscape, airCanvas;
var mirrorRenderer;

const mouseCursorData = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAWAgMAAAC52oSoAAAACVBMVEVwAIcAAAD///8+z9h7AAAAAXRSTlMAQObYZgAAAEdJREFUCNdjYGB0YAABtgl4qKkQalYIhMp0gFBAWVa3WZlLgJxpq1aCqGWrVgEpxlVgiiELhZKCUyBT2VAooA4HJCo01IEBAFzUIZQhQIXZAAAAAElFTkSuQmCC";

function setupVR() {
    try {
        // Get the VRDisplay and save it for later.
        vrDisplay = null;
        navigator.getVRDisplays().then(
            function(displays) {
                if(displays.length > 0) {
                    vrDisplay = displays[0];
                } else {
                    console.log("WebVR is supported, but no VR displays found");
                }

                // Kick off the render loop.
                if(vrDisplay) {
                    effect.setVRDisplay(vrDisplay);
                    vrDisplay.requestAnimationFrame(animate);
                }

                const wasInVr = sessionStorage.getItem('vrModeWasEnabled');
                if(wasInVr === "yes") {
                    window.setTimeout(function() {
                        HTML2VR.startVR();
                    }, 1000);
                }
            }
        );

        window.onbeforeunload = function() {
            sessionStorage.setItem('vrModeWasEnabled', vrMode ? 'yes' : 'no');
        }
    } catch(e) {
        console.log("Query of VRDisplays failed");
    }
}

function setupScene() {
    console.log("Setting up scene");

    renderer  = new THREE.WebGLRenderer();    
    effect    = new THREE.VREffect(renderer);
    
    //renderer.autoClear = false;
    
    cameraParent = new THREE.Object3D(); 
    camera       = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.001, 700 );
    cameraParent.add(camera);
    
    addReticule(cameraParent);

    window.addEventListener('resize', resize, false);
    
    document.body.insertBefore(renderer.domElement, document.body.firstChild);
    
    scene     = new THREE.Scene();
    //hudScene  = new THREE.Scene();
    
    skydome           = new Skydome(scene, renderer);
    skydome.image     = 'textures/sky-day.jpg';
    skydome.symmetric = true;
    
    addLightingToScene(scene);
    
    airCanvas = new AirCanvas(scene);
    
    vrElements = new ThreeHtmlElements();
    scene.add(vrElements.representation);
    
    scene.add(cameraParent);
    //hudScene.add(cameraParent);
    
    container = renderer.domElement;
    fader = new ViewShutter(container);
    renderer.domElement.id = "rendererElement";

    motionTracker = new MotionTracker(
        (pose, orientation) => {
            cameraParent.rotation.setFromQuaternion(orientation);
            cameraParent.position.copy(pose);
        }
    );
}

function setupAudio() {
    soundscape = new Soundscape();
    camera.add(soundscape.listener);
}

function addReticule(obj) {
    const visualAngleDeg = 1;
    const distance = 0.25;
    const dimension = 2 * distance * Math.tan(visualAngleDeg/180*Math.PI);
    
    var texture = loader.load(mouseCursorData);
    
    var material = new THREE.MeshBasicMaterial({
            color:        0xffffff,
            shading:      THREE.FlatShading,
            map:          texture,
            side:         THREE.FrontSide,
            transparent:  true
        });
        
    var geometry = new THREE.PlaneGeometry(dimension, dimension);
    var mesh     = new THREE.Mesh(geometry, material);   
    
    mesh.position.z = -distance;

    obj.add( mesh );
}

function addLightingToScene(scene) {
    var light = new THREE.AmbientLight(0xFFFFFF, 0.47);
    scene.add(light);

    var directionalLight = new THREE.DirectionalLight(0xFFFFFF,0.85);
    directionalLight.position.set(0.25, 1, 0.15);
    scene.add(directionalLight);
}

function resize() {
    var width  = window.innerWidth;
    var height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    effect.setSize(width, height);
    if(mirrorRenderer) {
        mirrorRenderer.setSize(width, height);
    }
    
    vrElements.resize();
}

function update(dt) {
    camera.updateProjectionMatrix();
    interactionManager.poll(dt);
    motionTracker.update();

    skydome.animate();
    airCanvas.animate();
}

function render(dt) {
    //renderer.clear();
    effect.render(scene, camera);
    if(mirrorRenderer) {
        mirrorRenderer.render(scene, camera);
    }
    //renderer.clearDepth();
    //effect.render(hudScene, camera);
}

function animate() {
    var delta = clock.getDelta();
    update(delta);
    render(delta);
    
    vrDisplay.requestAnimationFrame(animate);
}

function setupControllers(container) {
    interactionManager = new InteractionManager();
}

class HTML2VR {
    static init() {
        debugOverlay = new DebugOverlay();
        setupScene();
        setupAudio();
        setupControllers(container);
        setupVR();
        
        window.addEventListener('resize', resize, true);
        window.addEventListener("DOMContentLoaded", resize, false);
    }
    
    static add(...args) {
        vrElements.add.apply(vrElements, args);
    }
    
    static setStylesheet(...args) {
        vrElements.setStylesheet.apply(vrElements, args);
    }


    static setVrOnlyStylesheet(sheet) {
        vrOnlyStylesheet = sheet;
        this.useVrOnlyStylesheet(false);
    }

    static useVrOnlyStylesheet(bool){
        for( var i in document.styleSheets ){
            if( document.styleSheets[i].ownerNode && document.styleSheets[i].ownerNode.id === vrOnlyStylesheet) {
                void(document.styleSheets.item(i).disabled = !bool );
            }
        }
    }
    
    static setBackground(imageUrl, symmetric) {
        document.body.style.backgroundImage = 'url('+imageUrl+')';
        document.body.style["background-repeat"] = "no-repeat";
        document.body.style["background-attachment"] = "fixed";
        document.body.style["background-position"] = "center center";
        document.body.style["-webkit-background-size"] = "cover";
        document.body.style["-moz-background-size"] = "cover";
        document.body.style["background-size"] = "cover";
        skydome.image = imageUrl;
        skydome.symmetric = symmetric;
    }
    
    static startVR() {
        if(!vrMode) {
            if(!HtmlElement3D.isSupported) {
                alert("Sorry, this browser does not support the capabilities necessary for html2three");
                return;
            }
            if(vrDisplay) {
                vrMode = true;
                fader.showVR();
                if(vrOnlyStylesheet)
                        this.useVrOnlyStylesheet(true);
                if(vrDisplay.capabilities.canPresent) {
                    if(!vrDisplay.isPresenting) {
                        effect.requestPresent();
                        if(mirrorToScreen) {
                            console.log("Mirror mode enabled");
                            mirrorRenderer = new THREE.WebGLRenderer();
                            const mirrorDOM = mirrorRenderer.domElement;
                            document.body.appendChild(mirrorDOM);
                            mirrorDOM.style.position      = "fixed";
                            mirrorDOM.style.top           = "0px";
                            mirrorDOM.style.left          = "0px";
                            mirrorDOM.style.width         = "100%";
                            mirrorDOM.style.height        = "100%";
                            mirrorDOM.style.overflow      = "none";
                            mirrorDOM.style.zIndex        = 101;
                            mirrorDOM.style.pointerEvents = "none";
                        }
                    }
                    fader.isPresenting();
                } else {
                    if(!isPointerLocked()) {
                        requestPointerLock(container);
                    }
                }
            } else {
                alert("Sorry, your computer does not have WebVR or VR displays.");
            }
        }
    }
    
    static stopVR() {
        if(vrMode) {
            fader.hideVR();
            vrMode = false;
            debugOverlay.hideVirtualMouse();
            exitPointerLock();
            effect.exitPresent();
            this.useVrOnlyStylesheet(false);
        }
    }
    
    static toggleVR() {
        if(!vrMode) {
            HTML2VR.startVR();
        } else {
            HTML2VR.stopVR();
        }
    }
    
    static get inVR() {
        return vrMode;
    }

    static set seatedExperience(enabled) {
        motionTracker.setMotionScaling(enabled ? 2.0 : 1.0);
    }
}