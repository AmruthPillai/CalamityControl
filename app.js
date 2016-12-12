var ccApp = angular.module('ccApp', ['ngRoute', 'firebase']);

var myDataRef = firebase.database().ref();

ccApp.config(['$routeProvider', function($routeProvider) {
	$routeProvider.
	when('/home', {
		templateUrl: 'templates/home.html',
		controller: 'HomeController'
	}).
	when('/calamity', {
		redirectTo: '/home'
	}).
	when('/calamity/donate', {
		templateUrl: 'templates/donate.html',
		controller: 'DonationController'
	}).
	when('/calamity/volunteer', {
		templateUrl: 'templates/volunteer.html',
		controller: 'VolunteerController'
	}).
	when('/calamity/contact', {
		templateUrl: 'templates/contact.html',
		controller: 'EmergencyContactController'
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

	$scope.reportCalamity = function() {
		var ref = firebase.database().ref().child("reports");
		var list = new $firebaseArray(ref);

		$scope.report.condition = parseInt( $('#report_condition').val() );

		var currentdate = new Date();
		$scope.report.time = currentdate.getDate() + "-" + (currentdate.getMonth()+1)  + "-" + currentdate.getFullYear() + " " + currentdate.getHours() + ":" + currentdate.getMinutes() + ":" + currentdate.getSeconds();

		var address = $('#report_area').val() + ", " + $('#report_city').val();
		console.log(address);

		var geocoder = new google.maps.Geocoder();
		geocoder.geocode( { "address": address }, function(result, status) {
		    if (status == google.maps.GeocoderStatus.OK && result.length > 0) {
	        	$scope.report.lat = result[0].geometry.location.lat();
	        	$scope.report.lng = result[0].geometry.location.lng();

				console.log('We got the lat|lng!');
	        	list.$add($scope.report);
				$scope.list = list;

				$('#reportModal').modal('toggle');
		    } else {
				console.log('We don\'t got the lat|lng!');
				list.$add($scope.report);
				$scope.list = list;

				$('#reportModal').modal('toggle');
			}
		});
	};
});

/**
	CalamityController
**/
ccApp.controller('CalamityController', function($scope, $routeParams, $http, $firebaseArray) {
	$scope.rep_count = 0;

	var ref = myDataRef.child("reports");
	$scope.reports = $firebaseArray(ref);

	var arLatLng = [];

	$scope.location = $routeParams.location.toLowerCase().replace(/\b[a-z]/g, function(letter) {
	    return letter.toUpperCase();
	});

	$scope.initialize = function() {
		var geocoder = new google.maps.Geocoder();
		var mapOptions = { zoom: 6 };
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

		ref.on('child_added', function(snapshot) {
			snapshot = snapshot.val();
			console.log(snapshot);
			var latLng = new google.maps.LatLng(snapshot.lat, snapshot.lng);
			arLatLng.push(latLng);

			$scope.rep_count += 1;
			var heatmap = new google.maps.visualization.HeatmapLayer({
          data: arLatLng,
          map: map
        });
		});
  }
});

ccApp.controller('DonationController', function($scope, $firebaseArray) {
	var ref = myDataRef.child("donations");
	var list = new $firebaseArray(ref);
	$scope.donors = $firebaseArray(ref);
	$scope.donor = {};

	$scope.donate = function() {
		list.$add($scope.donor);
		$('#donateModal').modal('toggle');
	};
});

ccApp.controller('VolunteerController', function($scope, $firebaseArray) {
	var ref = myDataRef.child("volunteers");
	var list = new $firebaseArray(ref);
	$scope.volunteers = $firebaseArray(ref);
	$scope.volunteer = {};

	$scope.volunteerRegistration = function() {
		list.$add($scope.volunteer);
		$('#volunteerModal').modal('toggle');
	};
});

ccApp.controller('EmergencyContactController', function($scope, $firebaseArray) {

});
