Leaflet.PixiOverlay
===================

An overlay class for [Leaflet](http://leafletjs.com), a JS
library for interactive maps.  Allows drawing overlay using [Pixi.js](http://www.pixijs.com/), a JavaScript library
for drawing using WebGL that seamlessly falls back to HTML5's canvas if needed. Thanks to [Leaflet.D3SvgOverlay](https://github.com/teralytics/Leaflet.D3SvgOverlay) for inspiration.

![screenshot](/docs/img/Leaflet.PixiOverlay.png)

## Features

 * No limitations to polylines, circles or geoJSON. Draw whatever you want with Pixi.js
 * No need to reproject your geometries on zoom, this is done using scaling
 * Zoom animation where Leaflet supports it

*Compatible with Leaflet 1.0.x*

## Demo

A very basic [demo](https://manubb.github.io/Leaflet.PixiOverlay/leaflet-quickstart.html).

Largest [US cities](https://manubb.github.io/Leaflet.PixiOverlay/us-cities.html) (1000 markers).

[French cities](https://manubb.github.io/Leaflet.PixiOverlay/french-cities.html) (36700 markers).

## Usage

Include Pixi.js and the PixiOverlay libraries:

```js
    <script src="pixi.min.js"></script>
    <script src="L.PixiOverlay.min.js"></script>
```
Create a map:

```js
    var map = L.map(...);
```

Create an overlay:

```js
    var pixiOverlay = L.pixiOverlay(function(utils) {
        // your drawing code here
    }, new PIXI.Container());
```

Add it to the map:

```js
    pixiOverlay.addTo(map);
```
## Examples

### Draw a marker
```js
var loader = new PIXI.loaders.Loader();
loader.add('marker', 'img/marker-icon.png');
loader.load(function(loader, resources) {
    var markerTexture = resources.marker.texture;
    var markerLatLng = [51.5, -0.09];
    var marker = new PIXI.Sprite(markerTexture);
    marker.anchor.set(0.5, 1);

    var pixiContainer = new PIXI.Container();
    pixiContainer.addChild(marker);

    var firstDraw = true;
    var prevZoom;

    var pixiOverlay = L.pixiOverlay(function(utils) {
        var zoom = utils.getMap().getZoom();
        var container = utils.getContainer();
        var renderer = utils.getRenderer();
        var project = utils.latLngToLayerPoint;
        var scale = utils.getScale();

        if (firstDraw) {
            var markerCoords = project(markerLatLng);
            marker.x = markerCoords.x;
            marker.y = markerCoords.y;
        }

        if (firstDraw || prevZoom !== zoom) {
            marker.scale.set(1 / scale);
        }

        firstDraw = false;
        prevZoom = zoom;
        renderer.render(container);
    }, pixiContainer);
    pixiOverlay.addTo(map);
});
```
### Draw a triangle
```js
var polygonLatLngs = [
    [51.509, -0.08],
    [51.503, -0.06],
    [51.51, -0.047],
    [51.509, -0.08]
];
var projectedPolygon;
var triangle = new PIXI.Graphics();

var pixiContainer = new PIXI.Container();
pixiContainer.addChild(triangle);

var firstDraw = true;
var prevZoom;

var pixiOverlay = L.pixiOverlay(function(utils) {
    var zoom = utils.getMap().getZoom();
    var container = utils.getContainer();
    var renderer = utils.getRenderer();
    var project = utils.latLngToLayerPoint;
    var scale = utils.getScale();

    if (firstDraw) {
        projectedPolygon = polygonLatLngs.map(function(coords) {return project(coords);});
    }
    if (firstDraw || prevZoom !== zoom) {
        triangle.clear();
        triangle.lineStyle(3 / scale, 0x3388ff, 1);
        triangle.beginFill(0x3388ff, 0.2);
        projectedPolygon.forEach(function(coords, index) {
            if (index == 0) triangle.moveTo(coords.x, coords.y);
            else triangle.lineTo(coords.x, coords.y);
        });
        triangle.endFill();
    }
    firstDraw = false;
    prevZoom = zoom;
    renderer.render(container);
}, pixiContainer);
pixiOverlay.addTo(map);
```

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
 * `getMap()` - (function) return the current map.

## License

This code is provided under the MIT License (MIT).
