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
const debugTextures    = false;
const fadeOnClick      = false;
const showVirtualMouse = true;

class DebugOverlay {    
    get overlay() {
        var debugContainer = document.getElementById("debugCanvasLayer");
        if(!debugContainer) {
            debugContainer = document.createElement("div");
            debugContainer.id = "debugCanvasLayer";
            document.body.appendChild(debugContainer);
            debugContainer.style.position      = "absolute";
            debugContainer.style.top           = "0px";
            debugContainer.style.left          = "0px";
            debugContainer.style.width         = "100%";
            debugContainer.style.height        = "100%";
            debugContainer.style.overflow      = "visible";
            debugContainer.style.opacity       = 0.5;
            debugContainer.style.pointerEvents = "none";
        }
        return debugContainer;
    }
    
    get virtualMouse() {
        if(!this.virtualMouseImg) {
            this.virtualMouseImg = document.createElement("img");
            this.virtualMouseImg.src                     = mouseCursorData;
            this.virtualMouseImg.style.position          = "fixed";
            this.virtualMouseImg.style["pointer-events"] = "none";
            document.body.appendChild(this.virtualMouseImg);
        }
        return this.virtualMouseImg;
    }
    
    showCanvas(canvas, clientRect) {
        if(debugTextures) {
            this.overlay.appendChild(canvas);
            canvas.style.position = "absolute";
            canvas.style.border   = "1px solid red";
            canvas.style.top      = clientRect.top  + window.scrollY + "px";
            canvas.style.left     = clientRect.left + window.scrollX + "px";
        }
    }
    
    hideVirtualMouse() {
        if(showVirtualMouse) {
            this.virtualMouse.style.display = "none";
        }
    }
    
    moveVirtualMouseTo(x, y) {
        if(showVirtualMouse) {
            const hotspotX = 8;
            const hotspotY = 0;

            this.virtualMouse.style.display = "block";
            this.virtualMouse.style.left = x - hotspotX + 'px';
            this.virtualMouse.style.top  = y - hotspotY + 'px';
            
            if(fadeOnClick) {
                fader.fadeVR();
            }
        }
    }
}

class ViewShutter {
    constructor(element) {
        this.element = element;
        
        var func = this.transitionEnd.bind(this);
        this.element.addEventListener('webkitTransitionEnd', func);
        this.element.addEventListener('transitionend', func);
        
        this.element.style.transition    = "opacity 1s";
        this.element.style.position      = "fixed";
        this.element.style.top           = 0;
        this.element.style.left          = 0;
        this.element.style.right         = 0;
        this.element.style.bottom        = 0;
        this.element.style.pointerEvents = "none";
        this.element.style.zIndex        = "99";
        
        this.hideVR();
    }
    
    transitionEnd() {
        this.element.style.opacity = 1;
    }
    
    fadeVR() {
        this.element.style.opacity = 0;
    }
    
    showVR() {
        this.element.style.display = "block";
    }
    
    hideVR() {
        this.element.style.display = "none";
    }
    
    isPresenting() {
        /* If the display is capable of presenting, we must keep
         * the VR display visible, but we can move it behind the
         * page. That way our virtual cursor still shows up. */
        this.element.style.zIndex = "-1";
    }
}