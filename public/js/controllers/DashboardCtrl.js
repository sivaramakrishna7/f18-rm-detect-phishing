angular.module('DashboardCtrl', [])

	// inject the Todo service factory into our controller
	.controller('DashboardController', ['$scope','$http','URLFactory','$location', function($scope, $http, URLFactory, $location) {
		$scope.formData = {};
		$scope.loading = true;

		$scope.urlInfo = URLFactory.getData();
		$scope.imgsrc = 'images/'+$scope.urlInfo.data[0]._id+'.jpg';
		console.log("Printing data from Dash");
		console.log($scope.urlInfo);
		// GET =====================================================================
		// when landing on the page, get all todos and show them
		// use the service to get all the todos
		URLFactory.get($scope.urlInfo.data[0]._id)
			.then(function(data) {
				$scope.urlInfo = data.data[0];
				$scope.loading = false;
			});


		// DELETE ==================================================================
		// delete a todo after checking it
		$scope.deleteTodo = function(id) {
			$scope.loading = true;

			URLFactory.delete(id)
				// if successful creation, call our get function to get all the new todos
				.then(function(data) {
					$scope.loading = false;
					$scope.urlInfo = data; // assign our new list of todos
				});
		};

		//Redirect to home
		$scope.goHome = function() {
			$location.path("/home");
		};
	}]);