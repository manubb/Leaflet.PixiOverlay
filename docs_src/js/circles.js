window.solveCollision = function(circles, opts) {
	opts = opts || {};
	var tree = d3.quadtree()
		.x(function(d) {return d.xp;})
		.y(function(d) {return d.yp;});
	if (opts.extent !== undefined) tree.extent(opts.extent);
	var rMax = 0;
	circles.forEach(function(circle) {
		circle.xp = circle.x0;
		circle.yp = circle.y0;
		if (opts.r0 !== undefined) circle.r0 = opts.r0;
		circle.r = circle.r0;
		circle.xMin = circle.x0 - circle.r0;
		circle.xMax = circle.x0 + circle.r0;
		circle.yMin = circle.y0 - circle.r0;
		circle.yMax = circle.y0 + circle.r0;
		var colliding = [];

		function collide(d) {
			function fixCollision(node) {
				var x = d.xp - node.xp;
				var y = d.yp - node.yp;
				var l = x * x + y * y;
				var r = d.r + node.r;
				if (l < r * r) {
					var nodeClone = {
						r: node.r,
						xp: node.xp,
						yp: node.yp,
						from: node,
					};
					colliding.push(nodeClone);
					var c1, c2, lambda1, lambda2, u1, u2;
					var delta = Math.sqrt(l);
					if (d.r < nodeClone.r) {
						c1 = nodeClone; c2 = d;
					} else {
						c1 = d; c2 = nodeClone;
					}
					var r1 = c1.r;
					var r2 = c2.r;
					var alpha = (r1 + r2 + delta) / 4;
					if (l > 0) {
						u1 = (c2.xp - c1.xp) / delta;
						u2 = (c2.yp - c1.yp) / delta;
					} else {
						var theta = 2 * Math.PI * Math.random();
						u1 = Math.cos(theta);
						u2 = Math.sin(theta);
					}

					if (r2 >= alpha) {
						lambda1 = alpha / r1;
						lambda2 = alpha / r2;
					} else {
						lambda1 = (r1 - r2 + delta) / (2 * r1);
						lambda2 = 1;
					}
					c1.r *= lambda1;
					c2.r *= lambda2;
					c1.xp += (lambda1 - 1) * r1 * u1;
					c1.yp += (lambda1 - 1) * r1 * u2;
					c2.xp += (1 - lambda2) * r2 * u1;
					c2.yp += (1 - lambda2) * r2 * u2;
					c1.xMin = c1.xp - c1.r;
					c1.xMax = c1.xp + c1.r;
					c1.yMin = c1.yp - c1.r;
					c1.yMax = c1.yp + c1.r;
					c2.xMin = c2.xp - c2.r;
					c2.xMax = c2.xp + c2.r;
					c2.yMin = c2.yp - c2.r;
					c2.yMax = c2.yp + c2.r;
				}
			}
			return function(quad, x1, y1, x2, y2) {
				if (!quad.length) {
					do {
						if (d.xMax > quad.data.xMin && d.xMin < quad.data.xMax && d.yMax > quad.data.yMin && d.yMin < quad.data.yMax) {
							fixCollision(quad.data);
						}
					} while (quad = quad.next)
				}
				return x1 > d.xMax + rMax || x2 + rMax < d.xMin || y1 > d.yMax + rMax || y2 + rMax < d.yMin;
			};
		}

		tree.visit(collide(circle));
		rMax = Math.max(rMax, circle.r);
		tree.removeAll(colliding.map(function(node) {return node.from;}))
		var newNodes = colliding.map(function(node) {
			var from = node.from;
			from.xp = node.xp;
			from.yp = node.yp;
			from.r = node.r;
			from.xMin = node.xMin;
			from.xMax = node.xMax;
			from.yMin = node.yMin;
			from.yMax = node.yMax;

			return from;
		});
		newNodes.push(circle);
		tree.addAll(newNodes);
	});

	if (opts.zoom !== undefined) {
		circles.forEach(function(circle) {
			circle.cache = circle.cache || {};
			circle.cache[opts.zoom] = {
				x: circle.xp,
				y: circle.yp,
				r: circle.r
			};
		});
	}

	var rMax2 = 0;
	circles.forEach(function(circle) {
		rMax2 = Math.max(rMax2, circle.r);
	})
	tree.rMax = rMax2;

	return tree;
}
