class MotionTracker {
    constructor(callback) {
        if('VRFrameData' in window) {
            if(!this.frameData) {
                this.frameData = new VRFrameData();
            }
        }

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
        });

        this.rotationalBoost = new RotationalBoost();
        this.helper = new SphericalOps();
    }

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
        var pose;
        if (vrDisplay.getFrameData) {
            vrDisplay.getFrameData(this.frameData);
            pose = this.frameData.pose;
        } else if (vrDisplay.getPose) {
            pose = vrDisplay.getPose();
        }
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

    performMotionAdjustments() {
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
        const maxDistanceFromOrigin = 0.3;
        if(this.adjustedPose.length() > maxDistanceFromOrigin) {
            this.resetPose();
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
        const doubleTapTime = 0.3;

        if(tapDetected) {
            if(!this.tapClock.running) {
                // Click event will be dispatched when timer runs down.
                this.tapClock.start();
            } else {
                if(this.tapClock.elapsedTime < doubleTapTime) {
                    this.dispatchEvent("doubletap");
                }
                this.tapClock.stop();
            }
        } else {
            if(this.tapClock.running && this.tapClock.elapsedTime > doubleTapTime) {
                this.tapClock.stop();
                this.dispatchEvent("tap");
            }
        }
    }
}
