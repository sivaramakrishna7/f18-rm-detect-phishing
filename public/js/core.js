let app = angular.module('URLScanner', ['HomeCtrl',"ngRoute", "appRoutes", 'DashboardCtrl', 'URLService']);

app.run(function ($rootScope, $location) { 
  $rootScope.$on("$locationChangeStart", function (event, next, current) {
        if (next === current) {
          $location.path("");
        }
    });
});