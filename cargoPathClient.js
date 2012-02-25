/*
	cargoPathClient.js - Client for cargoPath.js
	Depends on:
	1. astar.js
	2. Graph.js
	3. cargoPath.js

	Author: Ashani Ray (ashaniray@gmail.com)
	Date: 04/02/2012

*/

var cargoPathClient = {

	src: null,
	dest: null,

	updateLink: function (position) {
		'use strict';

		if (cargoPathClient.src !== null && cargoPathClient.dest !== null) {
			cargoPathClient.src = cargoPathClient.dest;
			cargoPathClient.dest = position;
		} else if (cargoPathClient.src !== null && cargoPathClient.dest === null) {
			cargoPathClient.dest = position;
		} else if (cargoPathClient.src === null && cargoPathClient.dest === null) {
			cargoPathClient.src = position;
		}
	},

	placeMarker: function (position, map) {
		'use strict';

		var 
			//lat = parseInt(position.lat(), 10),
			//lng = parseInt(position.lng(), 10),
			lat = position.lat(),
			lng = position.lng(),
			isLand,
			newPosition,
			marker, port;

		//isLand = cargoPath.isLand(lat, lng);
		port = cargoPath.getNearbySea(lat, lng);
		if (port.lat !== -1 && port.lng != -1) {
			newPosition = new google.maps.LatLng(lat, lng);
			marker = new google.maps.Marker({
				position: newPosition,
				map: map,
				animation: google.maps.Animation.DROP,
				title: newPosition.toString()
			});
			cargoPathClient.updateLink(newPosition);

			google.maps.event.addListener(marker,
				'click',
				function (e) {
					marker.setMap(null);
					marker = null;
				});
		}
	},

	initialize: function () {
		'use strict';

		var input, autocomplete,
			infowindow = new google.maps.InfoWindow();

		cargoPath.initialize();
		google.maps.event.addListener(
			cargoPath.map,
			'click',
			function (e) {
				cargoPathClient.placeMarker(e.latLng, cargoPath.map);
			}
		);
		input = document.getElementById('searchTextField');
		autocomplete = new google.maps.places.Autocomplete(input);
		autocomplete.bindTo('bounds', cargoPath.map);

		google.maps.event.addListener(
			autocomplete,
			'place_changed',
			function () {
				var place = autocomplete.getPlace();
				cargoPath.map.setCenter(place.geometry.location);
				cargoPath.map.setZoom(2);

				infowindow.setOptions({position: place.geometry.location});
				infowindow.setContent('<div><strong>' + place.name
									+ '</strong><br>' + 'Click here to add '
									+ place.name + ' as a port');
				infowindow.open(cargoPath.map);
			}
		);

	},

	drawPath: function () {
		'use strict';

		if (this.src !== null && this.dest !== null) {
			cargoPath.drawPath(this.src.lat(), this.src.lng(),
				this.dest.lat(), this.dest.lng()
				);
		}
	}
};

