class MotionTracker {
    constructor(callback, recenterCallback) {
        console.log("Motion tracker initialized");

        this.zeroPose             = new THREE.Vector3();
        this.zeroOrientation      = new THREE.Quaternion();

        this.adjustedPose         = new THREE.Vector3();
        this.adjustedOrientation  = new THREE.Quaternion();

        this.headsetPose          = new THREE.Vector3();
        this.headsetAcceleration  = new THREE.Vector3();
        this.headsetOrientation   = new THREE.Quaternion();

        this.callback = callback;

        this.motionScaling = 1;

        var me = this;
        this.tapDetector = new TapDetector();
        this.tapDetector.addEventListener("doubletap", function() {
            me.resetPose();
            me.resetOrientation();
            if(recenterCallback) {
                recenterCallback();
            }
        });

        this.rotationalBoost = new RotationalBoost();
        this.helper = new SphericalOps();

        this.motionModel = MotionTracker.POSITIONAL_TRACKING;

        // The following is used with motionModel.GEARVR_EMULATION
        this.eyeToNeckDistance = new THREE.Vector3(0, 0.075, -0.0805);
    }

    dispose() {
        this.callback = null;
        this.tapDetector.dispose();
    }

    static get IGNORE_POSE()         {return 0;}
    static get GEARVR_EMULATION()    {return 1;}
    static get POSITIONAL_TRACKING() {return 2;}

    resetPose() {
        this.zeroPose.copy(this.headsetPose);
        this.zeroPose.negate();
    }

    resetOrientation() {
        this.zeroOrientation = new THREE.Quaternion().setFromAxisAngle(
            new THREE.Vector3(0, 1, 0),
            -this.helper.fromQuaternion(this.headsetOrientation).anticlockwiseBearing
        );
    }

    setMotionScaling(scale) {
        this.motionScaling = scale;
    }

    update() {
        // Get the headset position and orientation.
        var pose = vrDisplay.getPose();
        if (pose.position !== null) {
            this.headsetPose.fromArray(pose.position);
        }
        if (pose.orientation !== null) {
            this.headsetOrientation.fromArray(pose.orientation);
        }
        if (pose.linearAcceleration !== null) {
            this.headsetAcceleration.fromArray(pose.linearAcceleration);
            this.tapDetector.detectFromVector(this.headsetAcceleration);
        }

        this.performMotionAdjustments();

        this.callback(this.adjustedPose, this.adjustedOrientation);
    }

    riftTracking() {
        this.adjustedPose.copy(this.headsetPose);
        this.adjustedOrientation.copy(this.headsetOrientation);

        // Offset the origin
        this.adjustedPose.add(this.zeroPose);
        if(this.zeroOrientation) {
            this.adjustedOrientation.multiplyQuaternions(
                this.zeroOrientation,
                this.adjustedOrientation);
            this.adjustedPose.applyQuaternion(this.zeroOrientation);
        }

        // Don't let the user's head wander too far from the origin
        /*const maxDistanceFromOrigin = 0.3;
        if(this.adjustedPose.length() > maxDistanceFromOrigin) {
            this.resetPose();
        }*/
    }

    gearEmulation() {
        /* Reference:
          https://forums.oculus.com/vip/discussion/20885/head-neck-model-extreme
          https://product-guides.oculus.com/en-us/documentation/dk2/latest/concepts/ug-tray-start-advanced/
         */
        this.adjustedPose.copy(this.eyeToNeckDistance).applyQuaternion(this.headsetOrientation);
        this.adjustedOrientation.copy(this.headsetOrientation);
    }

    ignorePose() {
        this.adjustedPose.set(0, 0, 0);
        this.adjustedOrientation.copy(this.headsetOrientation);
    }

    performMotionAdjustments() {
        switch(this.motionModel) {
            case MotionTracker.IGNORE_POSE:
                this.ignorePose();
                break;
            case MotionTracker.GEARVR_EMULATION:
                this.gearEmulation();
                break;
            case MotionTracker.POSITIONAL_TRACKING:
                this.riftTracking();
                break;
        }

        if(this.motionScaling > 1) {
            this.rotationalBoost.apply(
                this.adjustedOrientation,
                this.adjustedPose,
                this.motionScaling
            );
        }
    }
}

class SphericalOps {
    constructor() {
        this.u = new THREE.Vector3();
    }

    fromQuaternion(orientation) {
        this.u.set(0, 0, 1);
        this.u.applyQuaternion(orientation);
        return this;
    }

    get anticlockwiseBearing() {
        return Math.atan2(this.u.x, this.u.z);
    }

    get bearing() {
        return -Math.atan2(this.u.x, this.u.z);
    }

    get elevation() {
        return Math.atan2(u.y, this.projectionMagnitude);
    }

    get projectionMagnitude() {
        return Math.sqrt(this.u.x*this.u.x + this.u.z*this.u.z);
    }
}

class RotationalBoost {
    constructor(factor) {
        this.up      = new THREE.Vector3(0, 1, 0);
        this.rotator = new THREE.Quaternion();
        this.helper = new SphericalOps();
    }

    apply(orientation, pose, factor) {
        this.rotator.setFromAxisAngle(
            this.up,
            this.helper.fromQuaternion(orientation).anticlockwiseBearing * factor
        );
        orientation.multiplyQuaternions(this.rotator, orientation);
        pose.applyQuaternion(this.rotator);
    }
}

class TapDetector {
    constructor() {
        // Moving average
        const mavWindowSize = 21;
        this.mavWindow      = new Float32Array(mavWindowSize);
        this.mavIndex       = 0;
        this.mavSum         = 0;

        this.eventListeners = {
            tap:       [],
            doubletap: []
        };

        this.tapClock = new THREE.Clock(false);
    }

    dispose() {
        this.eventListeners.length = 0;
    }

    addEventListener(eventStr, callback) {
        this.eventListeners[eventStr].push(callback);
    }

    dispatchEvent(eventStr, ...args) {
        for(var i = 0; i < this.eventListeners[eventStr].length; i++) {
            this.eventListeners[eventStr][i].apply(null, args);
        }
    }

    addValueToMovingAverage(value) {
        this.mavSum -= this.mavWindow[this.mavIndex];
        this.mavWindow[this.mavIndex] = value;
        this.mavIndex = (this.mavIndex + 1) % this.mavWindow.length;
        this.mavSum += value;
    }

    get movingAverage() {
        return this.mavSum/this.mavWindow.length;
    }

    detectFromVector(v) {
        const magnitude = Math.sqrt(v.x*v.x + v.y*v.y + v.z*v.z);
        return this.detectFromScalar(magnitude);
    }

    detectFromScalar(value) {
        const tapThreshold  = 4;
        const tapDetected = value > this.movingAverage * tapThreshold;
        this.timerAction(tapDetected);
        this.addValueToMovingAverage(value);
    }

    timerAction(tapDetected) {
        const minDoubleTapTime = 0.15;
        const doubleTapTime    = 0.50;

        if(tapDetected) {
            if(!this.tapClock.running) {
                // Click event will be dispatched when timer runs down.
                this.tapClock.start();
            } else if(this.tapClock.getElapsedTime() > minDoubleTapTime) {
                this.tapClock.stop();
                this.dispatchEvent("doubletap");
            }
        } else {
            if(this.tapClock.running && this.tapClock.getElapsedTime() > doubleTapTime) {
                this.tapClock.stop();
                this.dispatchEvent("tap");
            }
        }
    }
}
