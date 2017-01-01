var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/* When "debugTextureCanvas" is enabled, the texture canvases will
 * be superimposed on the page so that their contents can be compared
 * with the original HTML. If it is not pixel perfect match, the
 * interaction in VR will be incorrect.
 *
 * When "showVirtualMouse", a mouse cursor will be superimposed
 * on the web page showing the location of clicks performed in VR.
 *
 * When "fadeOnClick" is true, the VR DOMElement will fade out to
 * momentarily show the location of the click on the web page. This
 * is useful when "showVirtualMouse" is enabled, but the computer
 * is not able to present.
 *
 */
var debugTextures = false;
var fadeOnClick = false;
var showVirtualMouse = true;

var DebugOverlay = function () {
    function DebugOverlay() {
        _classCallCheck(this, DebugOverlay);
    }

    _createClass(DebugOverlay, [{
        key: "showCanvas",
        value: function showCanvas(canvas, clientRect) {
            if (debugTextures) {
                this.overlay.appendChild(canvas);
                canvas.style.position = "absolute";
                canvas.style.border = "1px solid red";
                canvas.style.top = clientRect.top + window.scrollY + "px";
                canvas.style.left = clientRect.left + window.scrollX + "px";
            }
        }
    }, {
        key: "hideVirtualMouse",
        value: function hideVirtualMouse() {
            if (showVirtualMouse) {
                this.virtualMouse.style.display = "none";
            }
        }
    }, {
        key: "moveVirtualMouseTo",
        value: function moveVirtualMouseTo(x, y) {
            if (showVirtualMouse) {
                var hotspotX = 8;
                var hotspotY = 0;

                this.virtualMouse.style.display = "block";
                this.virtualMouse.style.left = x - hotspotX + 'px';
                this.virtualMouse.style.top = y - hotspotY + 'px';

                if (fadeOnClick) {
                    fader.fadeVR();
                }
            }
        }
    }, {
        key: "overlay",
        get: function () {
            var debugContainer = document.getElementById("debugCanvasLayer");
            if (!debugContainer) {
                debugContainer = document.createElement("div");
                debugContainer.id = "debugCanvasLayer";
                document.body.appendChild(debugContainer);
                debugContainer.style.position = "absolute";
                debugContainer.style.top = "0px";
                debugContainer.style.left = "0px";
                debugContainer.style.width = "100%";
                debugContainer.style.height = "100%";
                debugContainer.style.overflow = "visible";
                debugContainer.style.opacity = 0.5;
                debugContainer.style.pointerEvents = "none";
            }
            return debugContainer;
        }
    }, {
        key: "virtualMouse",
        get: function () {
            if (!this.virtualMouseImg) {
                this.virtualMouseImg = document.createElement("img");
                this.virtualMouseImg.src = mouseCursorData;
                this.virtualMouseImg.style.position = "fixed";
                this.virtualMouseImg.style["pointer-events"] = "none";
                document.body.appendChild(this.virtualMouseImg);
            }
            return this.virtualMouseImg;
        }
    }]);

    return DebugOverlay;
}();

var ViewShutter = function () {
    function ViewShutter(element) {
        _classCallCheck(this, ViewShutter);

        this.element = element;

        var func = this.transitionEnd.bind(this);
        this.element.addEventListener('webkitTransitionEnd', func);
        this.element.addEventListener('transitionend', func);

        this.element.style.transition = "opacity 1s";
        this.element.style.position = "fixed";
        this.element.style.top = 0;
        this.element.style.left = 0;
        this.element.style.right = 0;
        this.element.style.bottom = 0;
        this.element.style.pointerEvents = "none";
        this.element.style.zIndex = "99";

        this.hideVR();
    }

    _createClass(ViewShutter, [{
        key: "transitionEnd",
        value: function transitionEnd() {
            this.element.style.opacity = 1;
        }
    }, {
        key: "fadeVR",
        value: function fadeVR() {
            this.element.style.opacity = 0;
        }
    }, {
        key: "showVR",
        value: function showVR() {
            this.element.style.display = "block";
        }
    }, {
        key: "hideVR",
        value: function hideVR() {
            this.element.style.display = "none";
        }
    }, {
        key: "isPresenting",
        value: function isPresenting() {
            /* If the display is capable of presenting, we must keep
             * the VR display visible, but we can move it behind the
             * page. That way our virtual cursor still shows up. */
            this.element.style.zIndex = "-1";
        }
    }]);

    return ViewShutter;
}();