var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var MotionTracker = function () {
    function MotionTracker(callback, recenterCallback) {
        _classCallCheck(this, MotionTracker);

        console.log("Motion tracker initialized");

        this.zeroPose = new THREE.Vector3();
        this.zeroOrientation = new THREE.Quaternion();

        this.adjustedPose = new THREE.Vector3();
        this.adjustedOrientation = new THREE.Quaternion();

        this.headsetPose = new THREE.Vector3();
        this.headsetAcceleration = new THREE.Vector3();
        this.headsetOrientation = new THREE.Quaternion();

        this.callback = callback;

        this.motionScaling = 1;

        var me = this;
        this.tapDetector = new TapDetector();
        this.tapDetector.addEventListener("doubletap", function () {
            me.resetPose();
            me.resetOrientation();
            if (recenterCallback) {
                recenterCallback();
            }
        });

        this.rotationalBoost = new RotationalBoost();
        this.helper = new SphericalOps();

        this.motionModel = MotionTracker.POSITIONAL_TRACKING;

        // The following is used with motionModel.GEARVR_EMULATION
        this.eyeToNeckDistance = new THREE.Vector3(0, 0.075, -0.0805);
    }

    _createClass(MotionTracker, [{
        key: "dispose",
        value: function dispose() {
            this.callback = null;
            this.tapDetector.dispose();
        }
    }, {
        key: "resetPose",
        value: function resetPose() {
            this.zeroPose.copy(this.headsetPose);
            this.zeroPose.negate();
        }
    }, {
        key: "resetOrientation",
        value: function resetOrientation() {
            this.zeroOrientation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -this.helper.fromQuaternion(this.headsetOrientation).anticlockwiseBearing);
        }
    }, {
        key: "setMotionScaling",
        value: function setMotionScaling(scale) {
            this.motionScaling = scale;
        }
    }, {
        key: "update",
        value: function update() {
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
    }, {
        key: "riftTracking",
        value: function riftTracking() {
            this.adjustedPose.copy(this.headsetPose);
            this.adjustedOrientation.copy(this.headsetOrientation);

            // Offset the origin
            this.adjustedPose.add(this.zeroPose);
            if (this.zeroOrientation) {
                this.adjustedOrientation.multiplyQuaternions(this.zeroOrientation, this.adjustedOrientation);
                this.adjustedPose.applyQuaternion(this.zeroOrientation);
            }

            // Don't let the user's head wander too far from the origin
            /*const maxDistanceFromOrigin = 0.3;
            if(this.adjustedPose.length() > maxDistanceFromOrigin) {
                this.resetPose();
            }*/
        }
    }, {
        key: "gearEmulation",
        value: function gearEmulation() {
            /* Reference:
              https://forums.oculus.com/vip/discussion/20885/head-neck-model-extreme
              https://product-guides.oculus.com/en-us/documentation/dk2/latest/concepts/ug-tray-start-advanced/
             */
            this.adjustedPose.copy(this.eyeToNeckDistance).applyQuaternion(this.headsetOrientation);
            this.adjustedOrientation.copy(this.headsetOrientation);
        }
    }, {
        key: "ignorePose",
        value: function ignorePose() {
            this.adjustedPose.set(0, 0, 0);
            this.adjustedOrientation.copy(this.headsetOrientation);
        }
    }, {
        key: "performMotionAdjustments",
        value: function performMotionAdjustments() {
            switch (this.motionModel) {
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

            if (this.motionScaling > 1) {
                this.rotationalBoost.apply(this.adjustedOrientation, this.adjustedPose, this.motionScaling);
            }
        }
    }], [{
        key: "IGNORE_POSE",
        get: function () {
            return 0;
        }
    }, {
        key: "GEARVR_EMULATION",
        get: function () {
            return 1;
        }
    }, {
        key: "POSITIONAL_TRACKING",
        get: function () {
            return 2;
        }
    }]);

    return MotionTracker;
}();

var SphericalOps = function () {
    function SphericalOps() {
        _classCallCheck(this, SphericalOps);

        this.u = new THREE.Vector3();
    }

    _createClass(SphericalOps, [{
        key: "fromQuaternion",
        value: function fromQuaternion(orientation) {
            this.u.set(0, 0, 1);
            this.u.applyQuaternion(orientation);
            return this;
        }
    }, {
        key: "anticlockwiseBearing",
        get: function () {
            return Math.atan2(this.u.x, this.u.z);
        }
    }, {
        key: "bearing",
        get: function () {
            return -Math.atan2(this.u.x, this.u.z);
        }
    }, {
        key: "elevation",
        get: function () {
            return Math.atan2(u.y, this.projectionMagnitude);
        }
    }, {
        key: "projectionMagnitude",
        get: function () {
            return Math.sqrt(this.u.x * this.u.x + this.u.z * this.u.z);
        }
    }]);

    return SphericalOps;
}();

var RotationalBoost = function () {
    function RotationalBoost(factor) {
        _classCallCheck(this, RotationalBoost);

        this.up = new THREE.Vector3(0, 1, 0);
        this.rotator = new THREE.Quaternion();
        this.helper = new SphericalOps();
    }

    _createClass(RotationalBoost, [{
        key: "apply",
        value: function apply(orientation, pose, factor) {
            this.rotator.setFromAxisAngle(this.up, this.helper.fromQuaternion(orientation).anticlockwiseBearing * factor);
            orientation.multiplyQuaternions(this.rotator, orientation);
            pose.applyQuaternion(this.rotator);
        }
    }]);

    return RotationalBoost;
}();

var TapDetector = function () {
    function TapDetector() {
        _classCallCheck(this, TapDetector);

        // Moving average
        var mavWindowSize = 21;
        this.mavWindow = new Float32Array(mavWindowSize);
        this.mavIndex = 0;
        this.mavSum = 0;

        this.eventListeners = {
            tap: [],
            doubletap: []
        };

        this.tapClock = new THREE.Clock(false);
    }

    _createClass(TapDetector, [{
        key: "dispose",
        value: function dispose() {
            this.eventListeners.length = 0;
        }
    }, {
        key: "addEventListener",
        value: function addEventListener(eventStr, callback) {
            this.eventListeners[eventStr].push(callback);
        }
    }, {
        key: "dispatchEvent",
        value: function dispatchEvent(eventStr) {
            for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                args[_key - 1] = arguments[_key];
            }

            for (var i = 0; i < this.eventListeners[eventStr].length; i++) {
                this.eventListeners[eventStr][i].apply(null, args);
            }
        }
    }, {
        key: "addValueToMovingAverage",
        value: function addValueToMovingAverage(value) {
            this.mavSum -= this.mavWindow[this.mavIndex];
            this.mavWindow[this.mavIndex] = value;
            this.mavIndex = (this.mavIndex + 1) % this.mavWindow.length;
            this.mavSum += value;
        }
    }, {
        key: "detectFromVector",
        value: function detectFromVector(v) {
            var magnitude = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
            return this.detectFromScalar(magnitude);
        }
    }, {
        key: "detectFromScalar",
        value: function detectFromScalar(value) {
            var tapThreshold = 4;
            var tapDetected = value > this.movingAverage * tapThreshold;
            this.timerAction(tapDetected);
            this.addValueToMovingAverage(value);
        }
    }, {
        key: "timerAction",
        value: function timerAction(tapDetected) {
            var minDoubleTapTime = 0.15;
            var doubleTapTime = 0.50;

            if (tapDetected) {
                if (!this.tapClock.running) {
                    // Click event will be dispatched when timer runs down.
                    this.tapClock.start();
                } else if (this.tapClock.getElapsedTime() > minDoubleTapTime) {
                    this.tapClock.stop();
                    this.dispatchEvent("doubletap");
                }
            } else {
                if (this.tapClock.running && this.tapClock.getElapsedTime() > doubleTapTime) {
                    this.tapClock.stop();
                    this.dispatchEvent("tap");
                }
            }
        }
    }, {
        key: "movingAverage",
        get: function () {
            return this.mavSum / this.mavWindow.length;
        }
    }]);

    return TapDetector;
}();