Leaflet.PixiOverlay
===================

An overlay class for [Leaflet](http://leafletjs.com), a JS
library for interactive maps.  Allows drawing overlay using [Pixi.js](http://www.pixijs.com/), a JavaScript library
for drawing using WebGL that seamlessly falls back to HTML5's canvas if needed. Thanks to [Leaflet.D3SvgOverlay](https://github.com/teralytics/Leaflet.D3SvgOverlay) for inspiration.

## Features

 * No limitations to polylines, circles or geoJSON. Draw whatever you want with Pixi.js
 * No need to reproject your geometries on zoom, this is done using scaling
 * Zoom animation where Leaflet supports it

*Compatible with Leaflet 1.0.x*

## Demo

A very basic [demo](https://manubb.github.io/Leaflet.PixiOverlay/leaflet-quickstart.html).

Largest [US cities](https://manubb.github.io/Leaflet.PixiOverlay/us-cities.html) (1000 markers).

[French cities](https://manubb.github.io/Leaflet.PixiOverlay/french-cities.html) (36700 markers).

## Basic usage

Todo

## API

*Factory method*

    L.pixiOverlay(<function> drawCallback, <PIXI.Container> container, <options> options?)

 * `drawCallback`  - callback to draw/update overlay contents.
 * `container` a Pixi container (a subclass of `PIXI.Container`).
 * `options`  - overlay options object.


*Drawing callback function*

    drawCallback(utils)

 * `utils`  - helper object. Contains methods to work with layers coordinate system and scaling.

*Overlay options object*

available fields:

 * `padding` - (number; defaults to `0.1`) How much to extend the drawing area around the map view (relative to its size).
 * `forceCanvas` - (bool; defaults to `false`) Force use of a 2d-canvas for rendering.
 * `doubleBuffering` - (bool; default to `false`) Activate double buffering to prevent flicker when refreshing display on some devices (e.g. iOS devices). This field is ignored if rendering is done with 2d-canvas.

*Utils object*

available methods:

 * `latLngToLayerPoint(latLng, zoom?)`   - (function) returns `L.Point` projected from `L.LatLng` in the coordinate system of the overlay.
 * `layerPointToLatLng(point, zoom?)`    - (function) returns `L.LatLng` projected back from `L.Point` into the original CRS.
 * `getScale(zoom?)`  - (function) return the current scale factor of the overlay or the scale factor associated to zoom value.
 * `getRenderer()` - (function) return the current PIXI renderer.
 * `getContainer()` - (function) return the PIXI container used in the overlay.
 * `getZoom()` - (function) return the current zoom value.

## License

This code is provided under the MIT License (MIT).
