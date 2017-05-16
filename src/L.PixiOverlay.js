L.PixiOverlay = L.Layer.extend({

	options: {
		// @option padding: Number = 0.1
		// How much to extend the clip area around the map view (relative to its size)
		// e.g. 0.1 would be 10% of map view in each direction
		padding: 0.1,
		forceCanvas: false
	},

	initialize: function (drawCallback, options) {
		L.setOptions(this, options);
		L.stamp(this);
		this._drawCallback = drawCallback;
	},

	onAdd: function () {
		if (!this._container) {
			this._renderer = PIXI.autoDetectRenderer({
				transparent: true,
				resolution: L.Browser.retina ? 2 : 1,
				antialias: true,
				forceCanvas: this.options.forceCanvas
			});
			var container = this._container = this._renderer.view;

			if (this._zoomAnimated) {
				L.DomUtil.addClass(this._container, 'leaflet-zoom-animated');
			}
		}
		this.getPane().appendChild(this._container);

		var map = this._map;
		var zoom = map.getZoom();
		this._pixelOrigin = map.getPixelOrigin();
		this._wgsOrigin = L.latLng([0, 0]);
		this._disableLeafletRounding();
		this._wgsInitialShift = map.project(L.latLng(this._wgsOrigin), zoom);
		this._enableLeafletRounding();
		this._mapInitialZoom = map.getZoom();
		this._initialZoom = zoom;
		this._shift = L.point(0, 0);
		this._scale = Math.pow(2, this._mapInitialZoom - this._initialZoom);

		var _layer = this;

		this.projection = {
			latLngToLayerPoint: function (latLng, zoom) {
				zoom = (zoom === undefined) ? _layer._initialZoom : zoom;
				var projectedPoint = _layer._map.project(L.latLng(latLng), zoom);
				return projectedPoint;
			},
			layerPointToLatLng: function (point, zoom) {
				zoom = (zoom === undefined) ? _layer._initialZoom : zoom;
				var projectedPoint = L.point(point);
				return _layer._map.unproject(projectedPoint, zoom);
			},
			map: _layer._map,
			layer: _layer,
			scale: _layer._scale
		};

		// Compatibility with v.1
		this.projection.latLngToLayerFloatPoint = this.projection.latLngToLayerPoint;
		this.projection.getZoom = this._map.getZoom.bind(this._map);
		this.projection.getBounds = this._map.getBounds.bind(this._map);

		this._update();
	},

	onRemove: function () {
		L.DomUtil.remove(this._container);
	},

	getEvents: function () {
		var events = {
			zoom: this._onZoom,
			moveend: this._update,
			zoomend: this._zoomChange,
			fly: function() {this._zoomChange(); this._update();}
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
		if (this._map._animatingZoom && this._bounds) {return;}

		// Update pixel bounds of renderer container
		var p = this.options.padding,
			size = this._map.getSize(),
			min = this._map.containerPointToLayerPoint(size.multiplyBy(-p)).round();

		this._bounds = new L.Bounds(min, min.add(size.multiplyBy(1 + p * 2)).round());
		this._center = this._map.getCenter();
		this._zoom = this._map.getZoom();

		var b = this._bounds,
			container = this._container,
			size = b.getSize();
		L.DomUtil.setPosition(container, b.min);

		this._renderer.resize(size.x, size.y);
		container.style.width = size.x + 'px';
		container.style.height = size.y + 'px';

		this._disableLeafletRounding();
		this._shift = this._map.latLngToLayerPoint(this._wgsOrigin)
			._subtract(this._wgsInitialShift.multiplyBy(this._scale))._subtract(b.min);
		this._enableLeafletRounding();
		this.draw();

	},

	_disableLeafletRounding: function(){
		this._leaflet_round = L.Point.prototype._round;
		L.Point.prototype._round = function() {return this;};
	},

	_enableLeafletRounding: function(){
		L.Point.prototype._round = this._leaflet_round;
	},

	draw: function () {
		this._disableLeafletRounding();
		this._drawCallback(this, this.projection, this._map.getZoom());
		this._enableLeafletRounding();
	},

	_zoomChange: function () {
		this._zoomDiff = this._map.getZoom() - this._initialZoom;
		this._scale = Math.pow(2, this._zoomDiff);
		this.projection.scale = this._scale;
	}

});

// @factory L.pixiOverlay(drawCallback: function, options?: L.PixiOverlay options)
// Creates a PixiOverlay with the given arguments.
L.pixiOverlay = function (drawCallback, options) {
	return L.Browser.canvas ? new L.PixiOverlay(drawCallback, options) : null;
};
