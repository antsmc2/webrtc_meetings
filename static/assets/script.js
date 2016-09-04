// Code goes here
angular.module('switchdemo', []).controller('DemoController', function($scope){
  
  $scope.init = function(){
    $scope.status = true;
  }
  
  $scope.changeStatus = function(){
    $scope.status = !$scope.status;
  }
  

})

