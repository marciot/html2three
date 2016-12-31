class ThreeHtmlElements {
    constructor() {
        this.raycaster = new THREE.Raycaster();
        this.obj       = new THREE.Object3D();
        
        this.elements = [];
        this.domStyles = null;
    }
    
    setStylesheet(domStyles) {
        if(typeof domStyles === "string") {
            this.domStyles = document.querySelector(domStyles);
        } else {
            this.domStyles = domStyles;
        }
    }
    
    add(domElement, position) {
        const glWidth  = 0.3;
        const glHeight = 0.15;
        
        if(typeof domElement === "string") {
            domElement = document.querySelector(domElement);
        }
        
        var element3D = new HtmlElement3D(
            domElement,
            {
                glWidth:   0.3,
                glHeight:  0.15,
                styles:    this.domStyles
            }
        );
        
        element3D.update();
        
        // Compute the distance at which the text spans the indicated
        // percentage of the view port.
        const coverage = 0.50;
        const halfFovInRadians = camera.fov/2 * Math.PI/180;
        const distance = (glWidth/coverage) / (2*Math.tan(halfFovInRadians));
        
        element3D.object3D.position.z = -distance;
        
        var container = new THREE.Object3D();
        container.rotation.order = "ZYX";
        container.add(element3D.object3D);
        if(position.elevation) {
            container.rotation.x = position.elevation * Math.PI/180;
        }
        if(position.azimuth) {
            container.rotation.y = position.azimuth * Math.PI/180;
        }
        
        this.obj.add(container);
        this.elements.push(element3D);
    }

    get representation() {
        return this.obj;
    }
    
    /* Casts a ray to the objects in the scene, returning the intersection with
     * an object. If a maximum distance is specified, intersections further than
     * that point are not reported. For instance, in Leap Motion finger tracking,
     * a ray is cast from a knuckle and maxDistance is set such that the ray will
     * not extend past the tip of that finger.
     */
    castRayToElement(maxDistance) {
        for(var i = 0; i < this.elements.length; i++) {
            var intersects = this.raycaster.intersectObject(this.elements[i].object3D);
            if(intersects.length) {
                for (var j = 0; j < intersects.length; j++) {
                    var intersection = intersects[j];
                    if(!maxDistance || intersection.distance < maxDistance) { 
                        return {
                            el: this.elements[i],
                            uv:       intersection.uv,
                            distance: intersection.distance,
                            point:    intersection.point,
                            normal:   intersection.face.normal
                        }
                    }
                    break;
                }
            }
        }
    }
    
    elementAlongRay(origin, direction, maxDistance) {
        this.raycaster.set(origin, direction);
        return this.castRayToElement(maxDistance);
    }
    
    elementInGaze() {
        this.raycaster.setFromCamera({x: 0, y:0}, camera);
        return this.castRayToElement();
    }
    
    resize() {
        for(var i = 0; i < this.elements.length; i++) {
            this.elements[i].resize();
        }
    }
}

class HtmlElement3D {
    constructor(domElement, options) {
        var clientRect = domElement.getBoundingClientRect();
        
        this.canvas        = document.createElement("canvas");
        this.canvas.width  = clientRect.width;
        this.canvas.height = clientRect.height;
        
        const glWidth  = (options && options.glWidth)  || 1;
        const glHeight = glWidth/clientRect.width * clientRect.height;
        
        this.texture       = new THREE.Texture(this.canvas);
        
        this.material      = new THREE.MeshBasicMaterial({
            color:        0xffffff,
            shading:      THREE.FlatShading,
            map:          this.texture,
            side:         THREE.FrontSide,
            transparent:  true
        });
        
        var geometry    = new THREE.PlaneGeometry(glWidth, glHeight);
        this.obj        = new THREE.Mesh(geometry, this.material);
        
        this.domElement = domElement;
        this.domStyles  = options && options.styles;
        
        this.update();
        
        var observer = new MutationObserver(this.update.bind(this));
        var config = {attributes: true, childList: true, characterData: true, subtree: true};
        observer.observe(this.domElement, config);
        
        this.convertImagesToDataUrl();
    }
    
    get object3D() {
        return this.obj;
    }
    
    update() {
        /* https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Drawing_DOM_objects_into_a_canvas */
        
        const width  = this.canvas.width;
        const height = this.canvas.height;
        
        var ctx = this.canvas.getContext('2d');
        ctx.clearRect(0, 0, width, height);
        
        const styleData = this.domStyles ?
            (
                '<style type="text/css">' +
                    '/*<![CDATA[*/' +
                    this.domStyles.innerText +
                    '/*]]>*/' +
                '</style>'
            ) : "";
                
        const htmlData = (new XMLSerializer()).serializeToString(this.domElement);
        
        if(styleData.indexOf("#") > 0) {
            console.log('WARNING: Detected "#" in stylesheet. This may break rendering in Firefox');
        }
        
        var data =
            '<svg xmlns="http://www.w3.org/2000/svg" ' +
                'width="'  + width + '" '  +
                'height="' + height + '">' +
                '<foreignObject width="'  + width + '" height="' + height + '">' +
                    styleData +
                    htmlData +
                '</foreignObject>' +
            '</svg>';

        var me  = this;
        var img = new Image();
        img.onload = function () {
            ctx.drawImage(img, 0, 0);
            me.texture.needsUpdate = true;
        }
        img.src = "data:image/svg+xml," + data;
    }
    
    resize() {
        var clientRect = this.domElement.getBoundingClientRect();
        this.canvas.width  = clientRect.width;
        this.canvas.height = clientRect.height;
        
        this.update();
        
        if(debugOverlay) {
            debugOverlay.showCanvas(this.canvas, clientRect);
        }
    }
    
    uvToDocumentCoordinates(uv, scrollToElement) {
        var clientRect = this.domElement.getBoundingClientRect();
        var x = uv.x       * clientRect.width  + clientRect.left;
        var y = (1 - uv.y) * clientRect.height + clientRect.top;
        
        if(scrollToElement) {
            if(x < 0 || y < 0 || x > window.innerWidth || y > window.innerHeight) {
                window.scrollTo(
                    window.scrollX + x - window.innerWidth/2,
                    window.scrollY + y - window.innerHeight/2
                );
            }

            clientRect = this.domElement.getBoundingClientRect();
            x = uv.x       * clientRect.width  + clientRect.left;
            y = (1 - uv.y) * clientRect.height + clientRect.top;
        }
       
        if(debugOverlay) {
            debugOverlay.moveVirtualMouseTo(x, y);
        }
        
        return {x: x, y: y};
    }
    
    uvToElement(uv) {
        // We call uvToDocumentCoordinates with scrollToElement
        // set since elementFromPoint only works on elements
        // visible in the viewport.
        var pt = this.uvToDocumentCoordinates(uv, true);
        
        var oldZ = this.domElement.style.zIndex;
        this.domElement.style.zIndex = 99;
        var el = document.elementFromPoint(pt.x, pt.y);
        this.domElement.style.zIndex = oldZ;
        return el;
    }
    
    /* The key operation used in this library is painting HTML to a Canvas via an
     * SVG image. The following tests whether this particular operation is supported
     * in the current browser */
    static isSupported() {        
        var img = new Image();
        var canvas = document.createElement("canvas");
        var ctx =  canvas.getContext("2d");
        img.src = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'>" +
            "<rect width='10' height='10' style='fill:rgb(255,128,64);' /></svg>";

        try {
            ctx.drawImage(img, 0, 0);
            var data = canvas.toDataURL();
            if(!data) {
                return false;
            }

            var data = ctx.getImageData(0, 0, canvas.width, canvas.height);
            if(!(data.data[0] === 255 && data.data[1] === 128 && data.data[2] === 64)) {
                info.str =
                    data.data[0].toString() + "," +
                    data.data[1].toString() + "," +
                    data.data[2].toString();
                return false;
            }
        } catch(e) {
            return false;
        }
        return true;
    }
    
    /* Rendering IMG tags into an SVG only works when that image has a data url,
     * so we convert all images to a data URL here. */
    convertImagesToDataUrl() {
        var me = this;
        function getReplaceFunc(image) {
            return function (url) {
                image.src = url;
            }
        }
        var images = this.domElement.getElementsByTagName("img");
        for(var i = 0; i < images.length; i++) {
            HtmlElement3D.toDataUrl(images[i].src, getReplaceFunc(images[i]));
        }
    }
    
    static toDataUrl(url, callback) {
        var xhr = new XMLHttpRequest();
        xhr.responseType = 'blob';
        xhr.onload = function() {
            var reader = new FileReader();
            reader.onloadend = function() {
                callback(reader.result);
            }
            reader.readAsDataURL(xhr.response);
        };
        xhr.open('GET', url);
        xhr.send();
    }
}