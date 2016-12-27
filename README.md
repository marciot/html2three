![alt text][logo]

html2vr
=============

_html2vr_ is an experimental library for creating VR content using HTML and CSS. The library has the following features:

* Embed images using _img_ tags
* Use stylesheets for sophisticated text formatting
* See your hands using a Leap Motion controller
* Easy-to-use, no WebGL or THREE.js knowledge required

## Online demo:

If you have an Oculus Rift or HTC Vive, you can try the [online demo](http://marciot.com/html2vr). You will need a  WebVR enabled build of either [Chrome] or [Firefox]. If you have a Leap Motion device, you should download the [Orion Beta SDK] so that you can use your hands to interact with the content. Otherwise, you may use a game pad.

## How does it work?

This library uses [WebGL], [WebVR], [WebAudio] and the [Gamepad API]. It uses a trick to [render HTML content to a Canvas], which is then made into a WebGL texture. When the user interacts with the object in VR, the touch coordinates are transformed back into document space and HTML2VR library sends a synthetic click event to the corresponding element on the web page. The HTML2VR library uses the [MutationObserver] web API to detect changes to DOM elements and updates the WebGL textures whenever a change is detected. This closed interaction loop allows the user to interact with the web page while in VR.

## Licensing:

I am a strong believer in open source. As such, this code has been released under the Affero GPL license.

## Credits:

This project makes use of [THREE.js], the [WebVR polyfill] and Leap Motion's [Orion Beta SDK]

[logo]: https://github.com/marciot/html2vr/raw/master/artwork/banner.png "A screenshot of the html2vr demo using a Leap Motion controller"
[Chrome]: https://webvr.info/get-chrome/
[Firefox]: https://mozvr.com/
[render HTML content to a Canvas]:https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Drawing_DOM_objects_into_a_canvas
[THREE.js]: https://threejs.org
[WebVR polyfill]: https://github.com/googlevr/webvr-polyfill
[WebGL]: https://www.khronos.org/webgl
[WebVR]: https://webvr.info
[WebAudio]: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
[Gamepad API]: https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API/Using_the_Gamepad_API
[MutationObserver]: https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
[Orion Beta SDK]:https://developer.leapmotion.com/get-started
