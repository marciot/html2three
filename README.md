![alt text][logo]

html2three
=============

_html2three_ is an experimental library for creating VR content using HTML, CSS and JavaScript. The library has the following features:

* Float _div_ elements in VR space.
* Embed images using _img_ tags.
* Use stylesheets for sophisticated text formatting.
* Design interactive elements using HTML, CSS and JavaScript.
* See your hands using a Leap Motion controller.
* No WebGL or THREE.js knowledge required.

This library provides an effect very similar to [CSS 3D transforms] or the THREE.js [CSS3DRenderer], but neither of these technologies work in VR or in stereo. _html2three_ attempts to bridge that gap.

## Online demo:

If you have an Oculus Rift or HTC Vive, you can try the [online demo](http://marciot.com/html2three). You will need a  WebVR enabled build of either [Chrome] or [Firefox]. If you have a Leap Motion device, you should download the [Orion Beta SDK] so that you can use your hands to interact with the content. Otherwise, you may use a game pad.

## How does it work?

This library uses [WebGL], [WebVR], [WebAudio] and the [Gamepad API]. It uses a trick to [render HTML content to a Canvas], which is then made into a WebGL texture. When the user interacts with the object in VR, the touch coordinates are transformed back into document space and HTML2THREE library sends a synthetic click event to the corresponding element on the web page. The HTML2THREE library uses the [MutationObserver] web API to detect changes to DOM elements and updates the WebGL textures whenever a change is detected. This closed interaction loop allows the user to interact with the web page while in VR.

## Limitations:

The current version renders under the GearVR, but interaction is not working. Since I don't own a GearVR, correcting this
problem is difficult.

## Licensing:

I am a strong believer in open source. As such, this code has been released under the Affero GPL license.

## How can you help this project?

Please visit my [Patreon page] to learn how you can support this open-source project with a donation!

Code contributions are welcome, especially if you are able to test and submit patches for hardware I don't
have, such as the Google Daydream, GearVR or HTC Vive.

## Credits:

This project makes use of [THREE.js], the [WebVR polyfill] and Leap Motion's [Orion Beta SDK]

[logo]: https://github.com/marciot/html2three/raw/master/artwork/banner-animated.gif "A screenshot of the html2three demo using a Leap Motion controller"
[Patreon page]: https://www.patreon.com/marciot
[Chrome]: https://webvr.info/get-chrome/
[Firefox]: https://mozvr.com/
[render HTML content to a Canvas]:https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Drawing_DOM_objects_into_a_canvas
[THREE.js]: https://threejs.org
[CSS 3D transforms]: http://www.w3schools.com/css/css3_3dtransforms.asp
[CSS3DRenderer]: https://threejs.org/examples/css3d_periodictable.html
[WebVR polyfill]: https://github.com/googlevr/webvr-polyfill
[WebGL]: https://www.khronos.org/webgl
[WebVR]: https://webvr.info
[WebAudio]: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
[Gamepad API]: https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API/Using_the_Gamepad_API
[MutationObserver]: https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
[Orion Beta SDK]:https://developer.leapmotion.com/get-started
