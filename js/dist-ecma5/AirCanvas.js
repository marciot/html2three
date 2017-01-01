var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var AirCanvas = function () {
    function AirCanvas(scene) {
        _classCallCheck(this, AirCanvas);

        this.objects = new THREE.Object3D();
        scene.add(this.objects);

        this.expandingMarker = null;
    }

    _createClass(AirCanvas, [{
        key: "createDot",
        value: function createDot(position, color) {
            var geometry = new THREE.SphereGeometry(0.001, 0.001, 0.001);
            var material = new THREE.MeshBasicMaterial({ color: color || 0xFF0000 });
            var sphere = new THREE.Mesh(geometry, material);
            sphere.position.copy(position);
            this.objects.add(sphere);
        }
    }, {
        key: "expandMarker",
        value: function expandMarker(position, color) {
            if (!this.expandingMarker) {
                var geometry = new THREE.SphereGeometry(0.025, 0.025, 0.025);
                var material = new THREE.MeshBasicMaterial({
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
    }, {
        key: "animate",
        value: function animate() {
            if (this.expandingMarker) {
                if (this.expandingMarkerScale < 1) {
                    this.expandingMarkerScale += 0.1;
                    var powScale = this.expandingMarkerScale * this.expandingMarkerScale;
                    this.expandingMarker.scale.set(powScale, powScale, powScale);
                } else {
                    this.expandingMarker.visible = false;
                }
            }
        }
    }]);

    return AirCanvas;
}();