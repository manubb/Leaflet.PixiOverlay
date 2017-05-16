function Carte(opt) {
	var self = this;
	var sel = opt.sel;
	var center = opt.center;
	var zoom = opt.zoom;
	this.markers = [];
	var mapContainer = document.getElementById(sel);
	var map = this.map = L.map(mapContainer).setView(center, zoom);
	L.tileLayer('//stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}.png', {
		subdomains: 'abcd',
		attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.',
		minZoom: 2,
		maxZoom: 18
	}).addTo(map);
	map.attributionControl.setPosition('bottomleft');
	map.zoomControl.setPosition('bottomright');

	var pixi = (function() {
		var line = [[45.953387, 1.892341], [46.953387, 2.892341], [47.953387, 1.892341]];
		var polygon = [[47.953387, 3.892341], [48.953387, 4.892341], [49.953387, 3.892341], [48.953387, 2.892341], [47.953387, 3.892341]];
		var hole = [[48.953387, 3.892341], [48.953387, 4.292341], [49.53387, 3.892341], [48.953387, 3.892341]];
		var polygon2 = [[51.509, -0.08],
    [51.503, -0.06],
    [51.51, -0.047], [51.509, -0.08]];
		var init = false;
		var container = new PIXI.Container();
		var geo = new PIXI.Graphics();
		geo.visible = true;
		container.addChild(geo);
		var projected = [];
		var p2 = [];
		var phole = [];
		var p3 = [];
		var prevZoom;
		return L.pixiOverlay(function(overlay, proj, zoom) {
			if (!init) {
				prevZoom = zoom;
				line.forEach(function(point) {
					projected.push(proj.latLngToLayerPoint(point));
				});
				polygon.forEach(function(point) {
					p2.push(proj.latLngToLayerPoint(point));
				});
				hole.forEach(function(point) {
					phole.push(proj.latLngToLayerPoint(point));
				});
				polygon2.forEach(function(point) {
					p3.push(proj.latLngToLayerPoint(point));
				});
			}
			(function() {
				var shift = overlay._shift;
				var scale = overlay._scale;
				container.scale.set(scale);
				container.x = shift.x;
				container.y = shift.y;
				if (!init || prevZoom !== zoom) {
					geo.clear();
					geo.lineStyle(3 / scale, 0x33FF00);
					// geo.lineStyle(1, 0x33FF00);
					geo.moveTo(projected[0].x,projected[0].y);
					geo.lineTo(projected[1].x,projected[1].y);
					geo.lineTo(projected[2].x,projected[2].y);
					geo.lineStyle(3 / scale, 0x3388ff, 1);
					// geo.lineStyle(1, 0xFF3300, 0.5);

					geo.beginFill(0x3388ff, 0.2);
					p3.forEach(function(coords, index) {
						if (index == 0) geo.moveTo(p3[0].x,p3[0].y);
						else geo.lineTo(coords.x,coords.y);
					});
					geo.endFill();
					geo.lineStyle(3 / scale, 0xff0000, 1);
					geo.beginFill(0xff0033, 0.3);
					p2.forEach(function(coords, index) {
						if (index == 0) geo.moveTo(p2[0].x,p2[0].y);
						else geo.lineTo(coords.x,coords.y);
					});
					// geo.closePath();

					// phole.forEach(function(coords, index) {
					// 	if (index == 0) geo.moveTo(coords.x, coords.y);
					// 	else geo.lineTo(coords.x,coords.y);
					// });
					// geo.addHole();

					geo.endFill();

					// phole.forEach(function(coords, index) {
					// 	// if (index == phole.length - 1) return;
					// 	if (index == 0) geo.moveTo(coords.x, coords.y);
					// 	else geo.lineTo(coords.x, coords.y);
					// });

					// geo.closePath();
				}
				init = true;
				prevZoom = zoom;
				overlay._renderer.render(container);
			})();
		}, {padding: 0.1, forceCanvas: window.forceCanvas});
	})();

	pixi.addTo(map);
}
