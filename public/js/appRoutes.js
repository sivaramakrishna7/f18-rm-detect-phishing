angular.module('appRoutes', []).config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {

    $routeProvider
		//home page
        .when('/', {
            templateUrl: 'public/views/home.html',
            controller: 'HomeController'
        })
        .when('/dashboard', {
            templateUrl: 'public/views/dashboard.html',
            controller: 'DashboardController'
        })
        .otherwise({
            redirectTo: '/'
        });
        
        $locationProvider.html5Mode(true);

}]);