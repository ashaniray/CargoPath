/*
	cargoPath.js - Displays shortest path from one port to another
	Depends on:

	1. astar.js
	2. Graph.js

	Author: Ashani Ray (ashaniray@gmail.com)
	Date: 04/02/2012

	grid is addressed by grid[x][y]
	x is latitude and incrases downwards. x=grid.length
	y is longitude and increased along the array length. y=grid[x].length

*/

var cargoPath = {

	map : null,

	initialize : function () {
		'use strict';

		var myOptions = {
			center: new google.maps.LatLng(23, 88),
			zoom: 2,
			mapTypeId: google.maps.MapTypeId.ROADMAP
		};
		this.map = new google.maps.Map(document.getElementById("map_canvas"),
				  myOptions);
	},

	euclidean_distance: function (pos0, pos1) {
		'use strict';

		var lat1 = mapToGrid.X2lat(pos0.x),
			lon1 = mapToGrid.Y2lng(pos0.y),
			lat2 = mapToGrid.X2lat(pos1.x),
			lon2 = mapToGrid.Y2lng(pos1.y),
			xdiff = Math.abs(lat1 - lat2),
			ydiff = Math.abs(lon1 - lon2),
			dPyth = Math.sqrt(xdiff * xdiff + ydiff * ydiff);

		return dPyth;
	},

	spherical_distance: function (pos0, pos1) {
		'use strict';

		var degree2Rad = (Math.PI) / 180.0,
			lat1 = mapToGrid.X2lat(pos0.x) * degree2Rad,
			lon1 = mapToGrid.Y2lng(pos0.y) * degree2Rad,
			lat2 = mapToGrid.X2lat(pos1.x) * degree2Rad,
			lon2 = mapToGrid.Y2lng(pos1.y) * degree2Rad,
			//R = 6371, // km
			R = 1,
			d = Math.acos(Math.sin(lat1) * Math.sin(lat2) +
				  Math.cos(lat1) * Math.cos(lat2) *
				  Math.cos(lon2 - lon1)) * R;

		return d;
	},

	earth_distance: function (pos0, pos1) {
		'use strict';

		return cargoPath.spherical_distance(pos0, pos1);
		//return cargoPath.euclidean_distance(pos0, pos1);
	},

	isLand: function (latitude, longitude) {
		'use strict';

		var y = mapToGrid.lng2Y(parseInt(longitude, 10)),
			x = mapToGrid.lat2X(parseInt(latitude, 10)),
			grid = mapToGrid.getWorld();
		return grid[x][y];
	},

	getNearbySea: function(lat, lng) {
		var EXTENT = 3, i = 0, j = 0;

		lat = parseInt(lat + 0.5, 10);
		lng = parseInt(lng + 0.5, 10);

		for (i = -1; i < EXTENT; i += 1) {
			for (j = 0; j < EXTENT; j += 1) {
				if (cargoPath.isLand(lat - i, lng - j) === 0)
					return {lat: lat - i, lng: lng - j};
				if (cargoPath.isLand(lat + i, lng + j) === 0)
					return {lat: lat + i, lng: lng + j};
				if (cargoPath.isLand(lat + i, lng - j) === 0)
					return {lat: lat + i, lng: lng - j};
				if (cargoPath.isLand(lat - i, lng + j) === 0)
					return {lat: lat - i, lng: lng + j};
			}
		}
		return {lat: -1, lng: -1};
	},

	resultToSeaCoordinates: function (seaCoordinates, result, grid) {
		for (i = 0; i < result.length; i += 1) {
			seaCoordinates[seaCoordinates.length] = new google.maps.LatLng(
				grid.X2lat(result[i].x),
				grid.Y2lng(result[i].y)
			);
		}
	},

	getPath: function (latSrc, longSrc, latDest, longDest) {
		'use strict';

		var seaCoordinates = [ new google.maps.LatLng(latSrc, longSrc) ],
			graph = new Graph(mapToGrid.getWorld()),
			src_x = mapToGrid.lat2X(latSrc),
			src_y = mapToGrid.lng2Y(longSrc),
			dest_x = mapToGrid.lat2X(latDest),
			dest_y = mapToGrid.lng2Y(longDest),
			start = graph.nodes[src_x][src_y],
			end = graph.nodes[dest_x][dest_y],
			result,
			graph_pacific = new Graph(pacificToGrid.getWorld()),
			src_x_pacific = pacificToGrid.lat2X(latSrc),
			src_y_pacific = pacificToGrid.lng2Y(longSrc),
			dest_x_pacific = pacificToGrid.lat2X(latDest),
			dest_y_pacific = pacificToGrid.lng2Y(longDest),
			start_pacific = graph_pacific.nodes[src_x_pacific][src_y_pacific],
			end_pacific = graph_pacific.nodes[dest_x_pacific][dest_y_pacific],
			result_pacific,
			grid = mapToGrid,
			i;

		result = astar.search(graph.nodes, start, end, this.earth_distance);
		result_pacific = astar.search(graph_pacific.nodes, start_pacific, end_pacific, this.earth_distance);
		if (result_pacific.length > 0) {
			if (result.length > 0) {
				if (result[result.length - 1].g > 
						result_pacific[result_pacific.length - 1].g) {
					result = result_pacific;
					grid = pacificToGrid;
				}
			}
			if (result.length === 0) {
				result = result_pacific;
				grid = pacificToGrid;
			}
		}

		this.resultToSeaCoordinates(seaCoordinates, result, grid);

		seaCoordinates[seaCoordinates.length] =  new google.maps.LatLng(latDest, longDest);
		return seaCoordinates;
	},

	drawPath: function (latSrc, longSrc, latDest, longDest) {
		'use strict';

		var srcPort = this.getNearbySea(latSrc, longSrc),
			destPort = this.getNearbySea(latDest, longDest),
			seaCoordinates,
			seaPath;

		if (srcPort.lat !== -1 && srcPort.lng != -1 
			&& destPort.lat != -1 && destPort.lng !== -1) {
			seaCoordinates = this.getPath(srcPort.lat, srcPort.lng, destPort.lat, destPort.lng);
		}
		if (seaCoordinates.length > 2) {
			seaCoordinates.splice(0, 0, new google.maps.LatLng(latSrc, longSrc)); 
			seaCoordinates[seaCoordinates.length] = new google.maps.LatLng(latDest, longDest);
			seaPath = new google.maps.Polyline(
				{
					path: seaCoordinates,
					strokeColor: "#FF0000",
					strokeOpacity: 1.0,
					strokeWeight: 2
				}
			);
			seaPath.setMap(this.map);

			google.maps.event.addListener(seaPath,
				'click',
				function (e) {
					seaPath.setMap(null);
					seaPath = null;
				}
				);
		} else {
			alert('No Path');
		}
	}
};

