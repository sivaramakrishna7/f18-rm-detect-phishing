angular.module('HomeCtrl', [])

	// inject the Todo service factory into our controller
	.controller('HomeController', ['$scope','$http','URLFactory','$location', function($scope, $http, URLFactory, $location) {
		$scope.formData = {};
		$scope.loading = true;

		$scope.createTodo = function() {

			// validate the formData to make sure that something is there
			// if form is empty, nothing will happen
			if ($scope.formData.text != undefined) {
				$scope.loading = true;

				console.log("Given URL : " + $scope.formData.text);

				// URLFactory the create function from our service (returns a promise object)
				URLFactory.create($scope.formData)

					// if successful creation, call our get function to get all the new todos
					.then(function(data) {
						$scope.loading = false;
						$scope.formData = {}; // clear the form so our user is ready to enter another
						URLFactory.setData(data); // assign our new list of todos
						$location.path("/dashboard");
					});
			}
		};

		// DELETE ==================================================================
		$scope.deleteTodo = function(id) {
			$scope.loading = true;

			URLFactory.delete(id)
				// if successful creation, call our get function to get all the new todos
				.then(function(data) {
					$scope.loading = false;
					$scope.urlInfo = data; // assign our new list of todos
				});
		};
	}]);