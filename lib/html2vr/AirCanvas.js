class AirCanvas {
    constructor(scene) {
        this.objects = new THREE.Object3D();
        scene.add(this.objects);
        
        this.expandingMarker = null;
    }
    
    createDot(position, color) {
        var geometry = new THREE.SphereGeometry(0.001, 0.001, 0.001);
        var material = new THREE.MeshBasicMaterial( {color: color || 0xFF0000} );
        var sphere = new THREE.Mesh(geometry, material);
        sphere.position.copy(position);
        this.objects.add(sphere);
    }
    
    expandMarker(position, color) {
        if(!this.expandingMarker) {
            var geometry = new THREE.SphereGeometry(0.025, 0.025, 0.025);
            var material = new THREE.MeshBasicMaterial( {
                color: color || 0xFF0000,
                wireframe: true
            });
            var sphere = new THREE.Mesh(geometry, material);
            sphere.position.copy(position);
            this.objects.add(sphere);
            
            this.expandingMarker = sphere;
        }
        
        // Start the expansion of the marker
        this.expandingMarker.position.copy(position);
        this.expandingMarkerScale = 0.001;
        this.expandingMarker.visible = true;
        this.animate();
    }
    
    animate() {
        if(this.expandingMarker) {
            if(this.expandingMarkerScale < 1) {
                this.expandingMarkerScale += 0.1;
                var powScale = this.expandingMarkerScale * this.expandingMarkerScale;
                this.expandingMarker.scale.set(powScale,powScale,powScale);
            } else {
                this.expandingMarker.visible = false;
            }
        }
    }
}