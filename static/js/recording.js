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
/**
This library should be used in conjuction with meetings.js.
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
var audioMimeType = isChrome ? 'audio/webm' : 'audio/ogg';
var audioFileExt = isChrome ? '.webm' : '.ogg';
var videoMimeType = 'video/webm' ;
var videoFileExt = '.webm';
var chromeMediaSource = 'screen';
var screenStream = null;
var audioRecordStream = null;
var videoRecordStream = null;
var audioMediaSource = new MediaSource();
audioMediaSource.addEventListener('sourceopen', handleAudioSourceOpen, false);
var audioMediaSource = new MediaSource();
videoMediaSource.addEventListener('sourceopen', handleVideoSourceOpen, false);
var audioMediaRecorder;
var videoMediaRecorder;
var recordedAudioBlobs;
var recordedVideoBlobs;
var sourceBuffer;

var recordButton = document.getElementById('record');
var downloadButton = document.getElementById('downloadRecord');
recordButton.onclick = toggleRecording;
downloadButton.onclick = download;

function handleError(error) {
  console.log('navigator.getUserMedia error: ', error);
}

function handleVideoSourceOpen(event) {
  console.log('MediaSource opened');
  sourceBuffer = mediaSource.addSourceBuffer('video/webm; codecs="vp8"');
  console.log('Source buffer: ', sourceBuffer);
}

function handleAudioSourceOpen(event) {
  console.log('MediaSource opened');
  sourceBuffer = mediaSource.addSourceBuffer('video/webm; codecs="vp8"');
  console.log('Source buffer: ', sourceBuffer);
}


function handleDataAvailable(event) {
  if (event.data && event.data.size > 0) {
    recordedBlobs.push(event.data);
  }
}

function handleStop(event) {
  console.log('Recorder stopped: ', event);
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
      startScreen(function(stream){
        recordStream = stream;
        resolve();
      },function() {
        recordStream = window.stream;
        resolve();
      });
    });
}

// The nested try blocks will be simplified when Chrome 47 moves to Stable
function startRecording() {
  acquireRecordStream().then(function(){
      recordedBlobs = [];
      var stream = screenStream === null ? window.stream : screenStream;
      var options = {mimeType: mimeType+';codecs=vp9'};
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        console.log(options.mimeType + ' is not Supported');
        options = {mimeType: mimeType+';codecs=vp8'};
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          console.log(options.mimeType + ' is not Supported');
          options = {mimeType: mimeType};
          if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            console.log(options.mimeType + ' is not Supported');
            options = {mimeType: ''};
          }
        }
      }
      try {
        mediaRecorder = new MediaRecorder(stream, options);
      } catch (e) {
        console.error('Exception while creating MediaRecorder: ' + e);
        alert('Exception while creating MediaRecorder: '
          + e + '. mimeType: ' + options.mimeType);
        return;
      }
      console.log('Created MediaRecorder', mediaRecorder, 'with options', options);
      recordButton.textContent = 'Stop Recording';
      downloadButton.disabled = true;
      mediaRecorder.onstop = handleStop;
      mediaRecorder.ondataavailable = handleDataAvailable;
      mediaRecorder.start(10); // collect 10ms of data
      console.log('MediaRecorder started', mediaRecorder);
    });
}

function stopRecording() {
  mediaRecorder.stop();
  console.log('Recorded Blobs: ', recordedBlobs);
  recordStream = null;
}

function download() {
  var blob = new Blob(recordedBlobs, {type: mimeType});
  var url = window.URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  if(!uniqueId)
     var uniqueId = '';
  a.download = 'screen-' + new Date() + uniqueId + fileExt;
  document.body.appendChild(a);
  a.click();
  setTimeout(function() {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);
}

    // Firefox 1.0+
var isFirefox = typeof InstallTrigger !== 'undefined';
    // Chrome 1+
var isChrome = !!window.chrome && !!window.chrome.webstore;
var screenConstraints = {
  audio: true
};



// this function explains how to use above methods/objects
function getScreenConstraints() {
   if(isFirefox){
        return {
            mozMediaSource: 'window',
            mediaSource: 'window'
        };
    }

    // this statement defines getUserMedia constraints
    // that will be used to capture content of screen
    if(isChrome) {
        return {
            mandatory: {
                chromeMediaSource: chromeMediaSource,
                maxWidth: window.screen.width,
                maxHeight: window.screen.height
            },
            optional: []
        };
    }
    return {
            mediaSource: 'screen'
        };

}

function startScreen(successCallback, failCallback) {
    trace('using screen constrains: ' + JSON.stringify(screenConstraints));
    navigator.mediaDevices.getUserMedia(screenConstraints).then(function(stream){
        screenStream = stream;
        if(successCallback)
            successCallback(stream);
    }).catch(function(e) {
    trace('getUserMedia() error: ' + e.name);
    if(failCallback)
        failCallback(stream);
  });

}
