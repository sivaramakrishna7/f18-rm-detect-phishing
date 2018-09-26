angular.module('DashboardCtrl', [])

	// inject the Todo service factory into our controller
	.controller('DashboardController', ['$scope','$http','URLFactory','$location', function($scope, $http, URLFactory, $location) {
		$scope.formData = {};
		$scope.loading = true;

		let id = localStorage._id;
		URLFactory.get(id)
			.then(function(data) {
				$scope.urlInfo = data.data[0];
				if(($scope.urlInfo.applications).length ==0)
					$scope.urlInfo.applications = ['No Apps Available'];
				$scope.loading = false;
				console.log($scope.urlInfo);
				$scope.imgsrc = 'public/images/'+$scope.urlInfo._id+'.jpg';
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
			$location.path("/");
		};
	}]);