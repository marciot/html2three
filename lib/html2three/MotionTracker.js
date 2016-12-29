class MotionTracker {
    constructor(callback) {
        if('VRFrameData' in window) {
            if(!this.frameData) {
                this.frameData = new VRFrameData();
            }
        }
        this.origin             = new THREE.Vector3();
        this.displacement       = new THREE.Vector3();
        this.headsetPose        = new THREE.Vector3();
        this.headsetOrientation = new THREE.Quaternion();
        
        this.callback = callback;
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
        if (pose.orientation !== null ) {
            this.headsetOrientation.fromArray(pose.orientation);
        }

        // Don't let the user's head wander too far from the origin
        this.displacement.copy(this.headsetPose);
        this.displacement.sub(this.origin);

        const maxDistanceFromOrigin = 0.3;
        
        if(this.displacement.length() > maxDistanceFromOrigin) {
            this.origin.copy(this.headsetPose);
            this.displacement.set(0,0,0);
        }

        this.callback(this.displacement, this.headsetOrientation);
    }
}