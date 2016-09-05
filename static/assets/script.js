// Code goes here
angular.module('switchdemo', []).controller('DemoController', function($scope){
  
  $scope.init = function(){
    $scope.status = true;
    $scope.muteVideoStatus = true;
    $scope.muteAudioStatus = true;
    $scope.startRecordingStatus = true;
    $scope.shareFileStatus = true;
    $scope.callStatus = true;
  }
  
  $scope.changeStatus = function(){
    $scope.status = !$scope.status;
  }

  $scope.muteVideo = function() {
      muteVideo();
      $scope.muteVideoStatus = false;
  }

  $scope.muteAudio = function() {
      muteAudio();
      $scope.muteAudioStatus = false;
  }

  $scope.unMuteVideo = function() {
      unMuteVideo();
      $scope.muteVideoStatus = true;
  }

  $scope.unMuteAudio = function() {
      unMuteAudio();
      $scope.muteAudioStatus = true;
  }

  $scope.startRecording = function() {
      startRecording();
      $scope.startRecordingStatus = false;
  }    

  $scope.stopRecording = function() {
      stopRecording();
      $scope.startRecordingStatus = true;
      download();
  }

  $scope.startShareFile = function() {
      $scope.shareFileStatus = !$scope.shareFileStatus;
	  var fileInput = document.querySelector('input#fileInput');
      fileInput.click();
  }

  $scope.disconnectCall = function() {
      stopCall();
      $scope.callStatus = false;
  }

  $scope.connectCall = function() {
      restartCall();
      $scope.callStatus = true;
  }
})

