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
var videoMediaSource = new MediaSource();
videoMediaSource.addEventListener('sourceopen', handleVideoSourceOpen, false);
var audioMediaRecorder;
var videoMediaRecorder;
var recordedAudioBlobs;
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

function handleAudioSourceOpen(event) {
  console.log('MediaSource opened');
  sourceBuffer = audioMediaSource.addSourceBuffer('video/webm; codecs="vp8"');
  console.log('Source buffer: ', sourceBuffer);
}


function handleAudioDataAvailable(event) {
  if (event.data && event.data.size > 0) {
    recordedAudioBlobs.push(event.data);
  }
}

function handleAudioStop(event) {
  console.log('Audio Recorder stopped: ', event);
}

function handleVideoDataAvailable(event) {
  if (event.data && event.data.size > 0) {
    recordedAudioBlobs.push(event.data);
  }
}

function handleVideoStop(event) {
  console.log('Audio Recorder stopped: ', event);
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
        recordAudio();
        if(videoRecordStream)
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

function recordAudio() {
      recordedAudioBlobs = [];
      var options = {mimeType: audioMimeType+';codecs=FLAC'};
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          console.log(options.mimeType + ' is not Supported');
          options = {mimeType: ''};
      }
      try {
        audioMediaRecorder = new MediaRecorder(audioRecordStream, options);
      } catch (e) {
        console.error('Exception while creating MediaRecorder: ' + e);
        alert('Exception while creating MediaRecorder: '
          + e + '. mimeType: ' + options.mimeType);
        return;
      }
      console.log('Created MediaRecorder', audioMediaRecorder, 'with options', options);
      recordButton.textContent = 'Stop Recording';
      downloadButton.disabled = true;
      audioMediaRecorder.onstop = handleAudioStop;
      audioMediaRecorder.ondataavailable = handleAudioDataAvailable;
      audioMediaRecorder.start(10);
      console.log('Audio MediaRecorder started', audioMediaRecorder);
}

function stopRecording() {
  audioMediaRecorder.stop();
  if(videoMediaRecorder)
    videoMediaRecorder.stop();
  console.log('audio Recorded Blobs: ', recordedAudioBlobs);
  console.log('video Recorded Blobs: ', recordedVideoBlobs);
  recordButton.textContent = 'Start Recording';
  downloadButton.disabled = false;
  audioRecordStream = null;
  videoRecordStream = null;
}

function download() {
    downloadAudio();
    if(recordedVideoBlobs)
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

function downloadAudio() {
  var blob = new Blob(recordedAudioBlobs, {type: audioMimeType});
  var url = window.URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  if(!uniqueId)
     var uniqueId = '';
  a.download = 'audio-screen-' + new Date() + uniqueId + audioFileExt;
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

function startScreenRecording(successCallback, failCallback) {
    trace('using screen constrains: ' + JSON.stringify(screenConstraints));
    navigator.mediaDevices.getUserMedia({audio: true}).then(function(stream){
        audioRecordStream = stream;
        navigator.mediaDevices.getUserMedia({video: getScreenConstraints()}).then(function(stream){
            videoRecordStream = stream;
            successCallback();  // attempt to get both audio/video
        }).catch(function(e) {
            trace('unable to screen: ' + e.name);
            successCallback();  // its okay  if we have just audio
          });

    }).catch(function(e) {
    trace('unable to get audio error: ' + e.name);
        failCallback()  //fail only if audio fails
  });

}