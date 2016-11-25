var ccApp = angular.module('ccApp', ['ngRoute', 'firebase']);

var myDataRef = firebase.database().ref().child('reports');

ccApp.config(['$routeProvider', function($routeProvider) {
	$routeProvider.
	when('/home', {
		templateUrl: 'templates/home.html',
		controller: 'HomeController'
	}).
	when('/calamity', {
		redirectTo: '/home'
	}).
	when('/calamity/:location', {
		templateUrl: 'templates/calamity.html',
		controller: 'CalamityController'
	}).
	otherwise({
		redirectTo: '/home'
	});
}]);

/**
	HomeController
**/
ccApp.controller('HomeController', function($scope, $firebaseArray) {
	$scope.cclogo = 'assets/cclogo.png';
	$scope.report = {};

	$scope.getLocation = function() {
		var options = {
			enableHighAccuracy: true,
			timeout: 5000,
			maximumAge: 0
		};

		function success(position) {
			var latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

			var geocoder = new google.maps.Geocoder();
		    geocoder.geocode({ 'latLng': latlng }, function (results, status) {
		        if (status !== google.maps.GeocoderStatus.OK) {
		            alert(status);
		        }
		        if (status == google.maps.GeocoderStatus.OK) {
		            var address = (results[0].formatted_address);
		            $('#report_address').val(address);
		        }
		    });
		};

		function error(err) {
			alert('We are not able to get your location automatically, please enter it manually.');
			console.warn('ERROR(' + err.code + '): ' + err.message);
		};

		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(success, error, options);
		} else {
			alert('We are not able to get your location automatically, please enter it manually.');
		}
	};

	var ref = firebase.database().ref().child("reports");
	var list = new $firebaseArray(ref);

	$scope.reportCalamity = function() {
		$scope.report.type = $('#report_type').val();
		$scope.report.address = $('#report_address').val();

		var geocoder = new google.maps.Geocoder();
		geocoder.geocode( { "address": $scope.report.address }, function(results, status) {
		    if (status == google.maps.GeocoderStatus.OK && results.length > 0) {
		    	console.log('uploading lat lng');
		    	$scope.report.location = {};

		        $scope.report.location.lat = results[0].geometry.location.lat();
		        $scope.report.location.lng = results[0].geometry.location.lng();

		        list.$add($scope.report);
				$scope.list = list;

				$('#reportModal').modal('toggle');
		    } else {
		    	console.log('not getting lat lng');
		    }
		});
	};
});

/**
	CalamityController
**/
ccApp.controller('CalamityController', function($scope, $routeParams, $http, $firebaseArray) {
	$scope.rep_count = 0;
	$scope.reports = $firebaseArray(myDataRef);
	var arLatLng = [];

	$scope.location = $routeParams.location.toLowerCase().replace(/\b[a-z]/g, function(letter) {
	    return letter.toUpperCase();
	});

	$scope.initialize = function() {
		var geocoder = new google.maps.Geocoder();
		var mapOptions = { zoom: 10 };
		var map = new google.maps.Map(document.getElementById("map"), mapOptions);

		geocoder.geocode( { "address": $scope.location }, function(results, status) {
		    if (status == google.maps.GeocoderStatus.OK && results.length > 0) {
		        var location = results[0].geometry.location;
		        map.panTo(location);
		    } else {
		    	$('#map').html('<div class="container"><div class="alert alert-dismissible alert-danger">\
					<button type="button" class="close" data-dismiss="alert">&times;</button>\
					<strong>Oh snap!</strong> <a href="#home" class="alert-link">Location could not be found, please try again!.\
					</div></div>')
		    }
		});

		myDataRef.on('child_added', function(snapshot) {
			snapshot = snapshot.val();
			var latLng = new google.maps.LatLng(snapshot.location.lat, snapshot.location.lng);
			arLatLng.push(latLng);
			// var marker = new google.maps.Marker({
			// 				position: latLng,
			// 				map: map
			// 		});
			// var infowindow = new google.maps.InfoWindow({
			// 			content: '<strong>Address:</strong> ' + snapshot.address + '<br>' + '<strong>Type:</strong> ' + snapshot.type
			// 		});
			// marker.addListener('click', function() {
			// 	infowindow.open(map, marker);
			// });
			$scope.rep_count += 1;
			var heatmap = new google.maps.visualization.HeatmapLayer({
          data: arLatLng,
          map: map
        });
		});
    }

    var headers = {
			headers: {
				'Ocp-Apim-Subscription-Key': '6d9f6ab57e95463d811301c01b28f033',
				'Access-Control-Allow-Origin': '*'
			}
		};

		$scope.latest_news = [];

    $http.get('https://api.cognitive.microsoft.com/bing/v5.0/news/search?q=' + $scope.location + '&count=5&offset=0&mkt=en-us&safeSearch=Moderate', headers).
	    success(function(data, status, headers, config) {
	    	$.each(data.value, function(k, v) {
	    		$scope.latest_news.push({
	    			name: v.name,
	    			url: v.url,
	    			provider: v.provider[0].name
	    		});
	    	});
	    }).
	    error(function(data, status, headers, config) {
    		// log error
	    });
});
