/*
*  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
*
*  Use of this source code is governed by a BSD-style license
*  that can be found in the LICENSE file in the root of the source
*  tree.
*/
/*
***********
//Adapted for current use
//For more details see: https://webrtc.github.io/samples/src/content/getusermedia/record/
*************
*/
/* globals MediaRecorder */

// This code is adapted from
// https://rawgit.com/Miguelao/demos/master/mediarecorder.html
/*
This library should be used in conjuction with meetings.js and adapter.js file.
Start recording should only be possible when window.stram is populated. Typically from meetings.js get Localstrem
or something. I have chosen to let window.stream to be defined in the accompanying script so that I can chose which
stream to record independently.

*/

'use strict';

/* globals MediaRecorder */

    // Firefox 1.0+
var isFirefox = typeof InstallTrigger !== 'undefined';
    // Chrome 1+
var isChrome = !!window.chrome && !!window.chrome.webstore;
var videoMimeType = 'video/webm' ;
var videoFileExt = '.webm';
var chromeMediaSource = 'screen';
var screenStream = null;
var videoRecordStream = null;
var videoMediaSource = new MediaSource();
videoMediaSource.addEventListener('sourceopen', handleVideoSourceOpen, false);
var videoMediaRecorder;
var recordedVideoBlobs;
var sourceBuffer;

var recordButton = document.getElementById('recordButton');
var downloadButton = document.getElementById('downloadRecordButton');
recordButton.onclick = toggleRecording;
downloadButton.onclick = download;

function handleError(error) {
  console.log('navigator.getUserMedia error: ', error);
}

function handleVideoSourceOpen(event) {
  console.log('MediaSource opened');
  sourceBuffer = videoMediaSource.addSourceBuffer('video/webm; codecs="vp8"');
  console.log('Source buffer: ', sourceBuffer);
}


function handleVideoDataAvailable(event) {
  if (event.data && event.data.size > 0) {
	  recordedVideoBlobs.push(event.data);
  }
}

function handleVideoStop(event) {
  console.log('Video Recorder stopped: ', event);
}

function toggleRecording() {
  if (recordButton.textContent === 'Start Recording') {
    startRecording();
  } else {
    stopRecording();
    recordButton.textContent = 'Start Recording';
    downloadButton.disabled = false;
  }
}

function acquireRecordStream() {
    return new Promise(function(resolve, reject) {
      startScreenRecording(function(){
        resolve();
      },function() {
        reject();
      });
    });
}

// The nested try blocks will be simplified when Chrome 47 moves to Stable
function startRecording() {
  acquireRecordStream().then(function(){
        recordVideo();
    });
}

function recordVideo() {
      recordedVideoBlobs = [];
      var options = {mimeType: videoMimeType+';codecs=vp9'};
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        console.log(options.mimeType + ' is not Supported');
        options = {mimeType: videoMimeType+';codecs=vp8'};
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          console.log(options.mimeType + ' is not Supported');
          options = {mimeType: videoMimeType};
          if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            console.log(options.mimeType + ' is not Supported');
            options = {mimeType: ''};
          }
        }
      }
      try {
        videoMediaRecorder = new MediaRecorder(videoRecordStream, options);
      } catch (e) {
        console.error('Exception while creating MediaRecorder: ' + e);
        alert('Exception while creating MediaRecorder: '
          + e + '. mimeType: ' + options.mimeType);
        return;
      }
      console.log('Created MediaRecorder', videoMediaRecorder, 'with options', options);
      recordButton.textContent = 'Stop Recording';
      downloadButton.disabled = true;
      videoMediaRecorder.onstop = handleVideoStop;
      videoMediaRecorder.ondataavailable = handleVideoDataAvailable;
      videoMediaRecorder.start(10);
      console.log('Video MediaRecorder started', videoMediaRecorder);
}


function stopRecording() {
  videoRecordStream.getTracks().forEach(track => track.stop());	
  videoMediaRecorder.stop();
  console.log('video Recorded Blobs length: ', recordedVideoBlobs.length);
  recordButton.textContent = 'Start Recording';
  downloadButton.disabled = false;
  videoRecordStream = null;
}

function download() {
    downloadVideo();
}

function downloadVideo() {
  var blob = new Blob(recordedVideoBlobs, {type: videoMimeType});
  var url = window.URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  if(!uniqueId)
     var uniqueId = '';
  a.download = 'video-screen-' + new Date() + uniqueId + videoFileExt;
  document.body.appendChild(a);
  a.click();
  setTimeout(function() {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);
}

function startScreenRecording(successCallback, failCallback) {
    getScreenMedia().then(function(stream){
    	videoRecordStream = stream;
    	successCallback(); 
    }).catch(function(e) {
    trace('unable to get screen error: ' + e.name);
        failCallback();
  });

}

function enableScreenCapture() {
	if (adapter.browserDetails.browser == 'firefox') {
		  adapter.browserShim.shimGetDisplayMedia(window, 'screen');
	}
}


function getScreenMedia() {
	//enable media if not already done
	enableScreenCapture();
	if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) 
		return navigator.mediaDevices.getDisplayMedia({video: true, audio: true});
	else
		return navigator.getDisplayMedia({video: true});
}
