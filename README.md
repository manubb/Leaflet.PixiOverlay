Leaflet.PixiOverlay
===================

An overlay class for [Leaflet](http://leafletjs.com), a JS
library for interactive maps.  Allows drawing overlay using [Pixi.js](http://www.pixijs.com/), a JavaScript library
for drawing using WebGL that seamlessly falls back to HTML5's canvas if needed. Thanks to [Leaflet.D3SvgOverlay](https://github.com/teralytics/Leaflet.D3SvgOverlay) for inspiration.

[![screenshot](/docs/img/Leaflet.PixiOverlay.png)](https://manubb.github.io/Leaflet.PixiOverlay/demo.html)

## Features

 * No limitations to polylines, circles or geoJSON. Draw whatever you want with Pixi.js
 * No need to reproject your geometries on zoom, this is done using scaling
 * Zoom animation where Leaflet supports it

*Compatible with Leaflet 0.7.x and 1.x*

## Demo

A very basic [demo](https://manubb.github.io/Leaflet.PixiOverlay/leaflet-quickstart.html).

Largest [US cities](https://manubb.github.io/Leaflet.PixiOverlay/us-cities.html) (1000 animated markers).

[French cities](https://manubb.github.io/Leaflet.PixiOverlay/french-cities.html) (36700 animated markers).

[One million markers](https://manubb.github.io/Leaflet.PixiOverlay/many-markers.html)

[Rotating markers with constant size during zoom](https://manubb.github.io/Leaflet.PixiOverlay/animated-markers.html)

French presidential 2017 election results: [first round](https://manubb.github.io/Leaflet.PixiOverlay/t1.html) and [second round](https://manubb.github.io/Leaflet.PixiOverlay/t2.html) (36000 polygons).

French legislative 2017 election results: [first round](https://manubb.github.io/Leaflet.PixiOverlay/leg-t1.html) and [second round](https://manubb.github.io/Leaflet.PixiOverlay/leg-t2.html) (36000 polygons).

(*[graph-draw](https://www.npmjs.com/package/graph-draw) is used to display boundaries in the election demos when rendered in WebGL*)

## Installation
Leaflet.PixiOverlay is available as a npm package:
```
npm install leaflet-pixi-overlay
```

or can be included in a page with [jsDelivr CDN](https://www.jsdelivr.com/package/npm/leaflet-pixi-overlay).

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

### *Factory method*

    L.pixiOverlay(<function> drawCallback, <PIXI.Container> container, <options> options?)

 * `drawCallback` - callback to draw/update overlay contents.
 * `container` - a Pixi container (a subclass of `PIXI.Container`).
 * `options` - overlay options object.

*Drawing callback function*

    drawCallback(utils, eventOrCustomData)

 * `utils` - helper object. Contains methods to work with layers coordinate system and scaling.
 * `eventOrCustomData` - Contains either the Leaflet event that causes the redraw (`moveend` event) or a plain object `{type: 'add'}` when the pixi layer is added to the map or the argument of a `redraw` call.

*Overlay options object*

available fields:

 * `padding` - (number; defaults to `0.1`) How much to extend the drawing area around the map view (relative to its size).
 * `forceCanvas` - (bool; defaults to `false`) Force use of a 2d-canvas for rendering.
 * `doubleBuffering` - (bool; default to `false`) Activate double buffering to prevent flickering when refreshing display on some devices (especially iOS devices). This field is ignored if rendering is done with 2d-canvas.
 * `resolution` - (number; defaults to `2` on retina devices and `1` elsewhere) Resolution of the renderer.
 * `projectionZoom` - (function(map): Number; defaults to function that returns the average of `map.getMinZoom()` and `map.getMaxZoom()` if the latter is finite else it returns `map.getMinZoom() + 8`) returns the projection zoom level. Customizing this option can help if you experience visual artifacts.
 * `pane` - (string; defaults to `'overlayPane'`) The Leaflet [pane](http://leafletjs.com/reference-1.3.0.html#map-pane) where the overlay container is inserted.
 * `destroyInteractionManager` - (bool; defaults to `false`) Destroy [PIXI Interaction Manager](http://pixijs.download/release/docs/PIXI.interaction.InteractionManager.html). This is useful when you do not need to use PIXI interaction.
 * `autoPreventDefault` - (bool; defaults to `true`) Customize [PIXI Interaction Manager](http://pixijs.download/release/docs/PIXI.interaction.InteractionManager.html) `autoPreventDefault` property. This option is ignored if `destroyInteractionManager` is `true`. This should be set to `false` in most situations to let all dom events flow from PIXI to leaflet but it is set by default for compatibility reason.
 * `preserveDrawingBuffer` - (bool; defaults to `false`) Enables drawing buffer preservation, enable this if you need to call toDataUrl on the webgl context.
 * `clearBeforeRender` - (bool; defaults to `true`) This sets if the renderer will clear the canvas or not before the new render pass.
 * `shouldRedrawOnMove` - (function(e: moveEvent): Boolean; defaults to `function () {return false;}`) Move events trigger a redraw when this function returns `true`. For example using `function (e) {return e.flyTo || e.pinch;}` will trigger redraws during `flyTo` animation and pinch zooms.

*Utils object*

available methods:

 * `latLngToLayerPoint(latLng, zoom?)` - (function) returns `L.Point` projected from `L.LatLng` in the coordinate system of the overlay.
 * `layerPointToLatLng(point, zoom?)` - (function) returns `L.LatLng` projected back from `L.Point` into the original CRS.
 * `getScale(zoom?)` - (function) return the current scale factor of the overlay or the scale factor associated to zoom value.
 * `getRenderer()` - (function) return the current PIXI renderer.
 * `getContainer()` - (function) return the PIXI container used in the overlay.
 * `getMap()` - (function) return the current map.

### *Instance methods*

* `redraw(data)` - (function) trigger a refresh of the layer. `data` is passed as second argument of `drawCallback` function. This is useful for example when you modify something in the `container` or if you want to animate using `PIXI.ticker.Ticker`.

## Changelog

### 1.8.2 (May 18, 2021)
- Improve default `projectionZoom` function

### 1.8.1 (May 2, 2019)
- Fix a pinch zoom regression introduced in 1.8.0

### 1.8.0 (Apr 30, 2019)
- Add support for redrawing the layer during flyTo animations and pinch zooms. (This is disabled by default. See `shouldRedrawOnMove` option to enable it,)
- Both pixi.js@5 and pixi.js-legacy@5 should be supported now.

### 1.7.0 (Mar 20, 2019)
- Add basic support for pixi.js-legacy@5

### 1.6.0 (Nov 26, 2018)
- Add `preserveDrawingBuffer` and `clearBeforeRender` options

### 1.5.0 (Apr 13, 2018)
- Bug fixes
- Add options for PIXI Interaction Manager
- Improved documentation

### 1.4.2 (Mar 27, 2018)
- Improved behavior when `doubleBuffering` is enabled
- Remove event listeners on layer remove wih Leaflet 0.7.x

### 1.4.0 (Mar 25, 2018)
- Add second argument to `drawCallback`, improving control over redraw logic
- No need to recompute container transform on `redraw` calls (performance improvement)

### 1.3.0 (Jan 22, 2018)
- Add `redraw` method

### 1.2.0 (Jan 20, 2018)
- Add `doubleBuffering` option to get rid of flickering on iOS devices

### 1.1.3 (Jan 20, 2018)
- Minor improvements
- Add support for leaflet@0.7.x (thanks to [dzwiedzmin](https://github.com/dzwiedzmin))

### 1.0.0 (Sep 2, 2017)

- Initial release.

## License

This code is provided under the MIT License (MIT).
