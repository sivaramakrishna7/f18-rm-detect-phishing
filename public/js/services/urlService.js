angular.module('URLService', [])

	// super simple service
	// each function returns a promise object 
	.factory('URLFactory', ['$http',function($http) {
		let data;
		return {
			getData : function(){
				return data;
			},
			setData: function(dat){
				data = dat;
				return null;
			},
			get : function(id) {
				return $http.get('/api/url'+id);
			},
			create : function(todoData) {
				return $http.post('/api/url', todoData);
			},
			delete : function(id) {
				return $http.delete('/api/url/' + id);
			}
		}
	}]);