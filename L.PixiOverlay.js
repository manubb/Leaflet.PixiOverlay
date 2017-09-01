// Leaflet.PixiOverlay
// version: 1.0.0
// author: Manuel Baclet <mbaclet@gmail.com>
// license: MIT

(function (factory) {
		if (typeof define === 'function' && define.amd) {
				// AMD
				define(['leaflet', 'pixi.js'], factory);
		} else if (typeof module !== 'undefined') {
				// Node/CommonJS
				module.exports = factory(require('leaflet'), require('pixi.js'));
		} else {
				// Browser globals
				if (typeof window.L === 'undefined') {
						throw new Error('Leaflet must be loaded first');
				}
				if (typeof window.PIXI === 'undefined') {
						throw new Error('Pixi.js must be loaded first');
				}
				factory(window.L, window.PIXI);
		}
}(function (L, PIXI) {

	L.PixiOverlay = L.Layer.extend({

		options: {
			// @option padding: Number = 0.1
			// How much to extend the clip area around the map view (relative to its size)
			// e.g. 0.1 would be 10% of map view in each direction
			padding: 0.1,
			// @option forceCanvas: Boolean
			// Force use of a 2d-canvas
			forceCanvas: false,
			// @option resolution: Number = 1
			// Resolution of the renderer canvas
			resolution: L.Browser.retina ? 2 : 1,
			// @option projectionZoom(map: map): Number
			// return the layer projection zoom level
			projectionZoom: function(map) {return (map.getMaxZoom() + map.getMinZoom()) / 2;}
		},

		initialize: function (drawCallback, pixiContainer, options) {
			L.setOptions(this, options);
			L.stamp(this);
			this._drawCallback = drawCallback;
			this._pixiContainer = pixiContainer;
			this._rendererOptions = {
				transparent: true,
				resolution: this.options.resolution,
				antialias: true,
				forceCanvas: this.options.forceCanvas
			};
		},

		onAdd: function () {
			if (!this._container) {
				var container = this._container = L.DomUtil.create('div', 'leaflet-pixi-overlay');
				this._renderer = PIXI.autoDetectRenderer(this._rendererOptions);
				container.appendChild(this._renderer.view);
				if (this._zoomAnimated) {
					L.DomUtil.addClass(container, 'leaflet-zoom-animated');
				}
			}
			this.getPane().appendChild(this._container);

			var map = this._map;
			this._initialZoom = this.options.projectionZoom(map);
			this._wgsOrigin = L.latLng([0, 0]);
			this._disableLeafletRounding();
			this._wgsInitialShift = map.project(this._wgsOrigin, this._initialZoom);
			this._enableLeafletRounding();
			this._mapInitialZoom = map.getZoom();
			this._scale = map.getZoomScale(this._mapInitialZoom, this._initialZoom);
			var _layer = this;

			this.utils = {
				latLngToLayerPoint: function (latLng, zoom) {
					zoom = (zoom === undefined) ? _layer._initialZoom : zoom;
					var projectedPoint = map.project(L.latLng(latLng), zoom);
					return projectedPoint;
				},
				layerPointToLatLng: function (point, zoom) {
					zoom = (zoom === undefined) ? _layer._initialZoom : zoom;
					var projectedPoint = L.point(point);
					return map.unproject(projectedPoint, zoom);
				},
				getScale: function(zoom) {
					if (zoom === undefined) return _layer._scale;
					else return map.getZoomScale(zoom, _layer._initialZoom);
				},
				getRenderer: function() {
					return _layer._renderer;
				},
				getContainer: function() {
					return _layer._pixiContainer;
				},
				getMap: function() {
					return _layer._map;
				}
			};
			this._update();
		},

		onRemove: function () {
			L.DomUtil.remove(this._container);
		},

		getEvents: function () {
			var events = {
				zoom: this._onZoom,
				moveend: this._update,
				zoomend: this._zoomChange
			};
			if (this._zoomAnimated) {
				events.zoomanim = this._onAnimZoom;
			}
			return events;
		},

		_onAnimZoom: function (ev) {
			this._updateTransform(ev.center, ev.zoom);
		},

		_onZoom: function () {
			this._updateTransform(this._map.getCenter(), this._map.getZoom());
		},

		_updateTransform: function (center, zoom) {
			var scale = this._map.getZoomScale(zoom, this._zoom),
				position = L.DomUtil.getPosition(this._container),
				viewHalf = this._map.getSize().multiplyBy(0.5 + this.options.padding),
				currentCenterPoint = this._map.project(this._center, zoom),
				destCenterPoint = this._map.project(center, zoom),
				centerOffset = destCenterPoint.subtract(currentCenterPoint),
				topLeftOffset = viewHalf.multiplyBy(-scale).add(position).add(viewHalf).subtract(centerOffset);
			if (L.Browser.any3d) {
				L.DomUtil.setTransform(this._container, topLeftOffset, scale);
			} else {
				L.DomUtil.setPosition(this._container, topLeftOffset);
			}
		},

		_update: function (e) {
			// is this really useful?
			if (this._map._animatingZoom && this._bounds) {return;}

			// Update pixel bounds of renderer container
			var p = this.options.padding,
				mapSize = this._map.getSize(),
				min = this._map.containerPointToLayerPoint(mapSize.multiplyBy(-p)).round();

			this._bounds = new L.Bounds(min, min.add(mapSize.multiplyBy(1 + p * 2)).round());
			this._center = this._map.getCenter();
			this._zoom = this._map.getZoom();

			var view = this._renderer.view;
			var b = this._bounds,
				container = this._container,
				size = b.getSize();
			L.DomUtil.setPosition(container, b.min);
			if (!this._renderer.size || this._renderer.size.x !== size.x || this._renderer.size.y !== size.y) {
				if (this._renderer.gl) {
					this._renderer.resolution = this._renderer.rootRenderTarget.resolution = this.options.resolution;
				}
				this._renderer.resize(size.x, size.y);
				view.style.width = size.x + 'px';
				view.style.height = size.y + 'px';
				if (this._renderer.gl) {
					var gl = this._renderer.gl;
					if (gl.drawingBufferWidth !== this._renderer.width) {
						this._renderer.resolution = this._renderer.rootRenderTarget.resolution = this.options.resolution * gl.drawingBufferWidth / this._renderer.width;
						this._renderer.resize(size.x, size.y);
					}
				}
				this._renderer.size = size;
			}
			this._disableLeafletRounding();
			var shift = this._map.latLngToLayerPoint(this._wgsOrigin)
				._subtract(this._wgsInitialShift.multiplyBy(this._scale))._subtract(b.min);
			this._pixiContainer.scale.set(this._scale);
			this._pixiContainer.position.set(shift.x, shift.y);
			this._drawCallback(this.utils);
			this._enableLeafletRounding();
		},

		_disableLeafletRounding: function(){
			this._leaflet_round = L.Point.prototype._round;
			L.Point.prototype._round = function() {return this;};
		},

		_enableLeafletRounding: function(){
			L.Point.prototype._round = this._leaflet_round;
		},

		_zoomChange: function () {
			this._scale = this._map.getZoomScale(this._map.getZoom(), this._initialZoom);
		}

	});

	// @factory L.pixiOverlay(drawCallback: function, pixiContainer: PIXI.Container, options?: L.PixiOverlay options)
	// Creates a PixiOverlay with the given arguments.
	L.pixiOverlay = function (drawCallback, pixiContainer, options) {
		return L.Browser.canvas ? new L.PixiOverlay(drawCallback, pixiContainer, options) : null;
	};

}));
