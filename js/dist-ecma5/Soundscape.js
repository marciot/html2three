var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Soundscape = function () {
    function Soundscape(scene) {
        _classCallCheck(this, Soundscape);

        this.listener = new THREE.AudioListener();

        this.touchSound = new THREE.PositionalAudio(this.listener);

        var audioLoader = new THREE.AudioLoader();

        var me = this;
        audioLoader.load('sounds/click.wav', function (buffer) {
            me.touchSound.setBuffer(buffer);
            me.touchSound.setRefDistance(20);
        });
    }

    _createClass(Soundscape, [{
        key: 'playTouchSound',
        value: function playTouchSound(position) {
            this.touchSound.position.copy(position);
            this.touchSound.play();
        }
    }]);

    return Soundscape;
}();