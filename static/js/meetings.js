"use strict";
/*
    File share part adapted from https://webrtc.github.io/samples/src/content/datachannel/filetransfer/
*/
//to do. Ability to refresh a particular peer

var myHostname = window.location.hostname;
var myPort = window.location.port;
trace("Hostname: " + myHostname);
var uniqueId = null;
var myName = '';
var serverUrl = null;
var localStream = null;
var localScreenStream = null;
var iceURI = null;
var peers = {};
var audioSenders = {};
var videoSenders = {};
var dataChannels = {};
var remoteVideos = {};
var receivedFiles = {};
var minWidthInput = document.querySelector('#minWidth input');
var maxWidthInput = document.querySelector('#maxWidth input');
var minHeightInput = document.querySelector('#minHeight input');
var maxHeightInput = document.querySelector('#maxHeight input');
var framerateInput = document.querySelector('#framerate input');
minWidthInput.onchange = maxWidthInput.onchange =
    minHeightInput.onchange = maxHeightInput.onchange =
    framerateInput.onchange = displayRangeValue;
var getUserMediaConstraintsDiv =
    document.querySelector('div#getUserMediaConstraints');
var fileInput = document.querySelector('#fileInput');
var downloadSection = document.querySelector('#downloads');
var sendProgress = document.querySelector('progress#sendProgress');
var receiveProgress = document.querySelector('progress#receiveProgress');
var statusMessage = document.querySelector('span#fileStatus');
var muteAudioButton = document.getElementById('muteAudio');
var muteVideoButton = document.getElementById('muteVideo');
var screenShareButton = document.getElementById('shareScreenButton');
var toggleCallButton = document.getElementById('toggleCall');
var receiveProgressLabel = document.getElementById("receiveProgressLabel");
var chatPane = document.getElementById("chat-message");
toggleCallButton.onclick = toggleCall;
muteVideoButton.onclick = toggleMuteVideo;
muteAudioButton.onclick = toggleMuteAudio;
screenShareButton.onclick =  toggleScreenShare;
var chatBox = document.querySelector('#chat_input_value');
var sendMsgButton = document.querySelector('#post_message');
var setNameButton = document.querySelector('#setName');
var myNameField = document.querySelector('#myName');
var myNameStatus = document.querySelector('#myNameStatus');
var peopleCount = document.querySelector('#peopleCount');



fileInput.onchange = function () {
    sendData();
}
// Utility to show the value of a range in a sibling span element
function displayRangeValue(e) {
  var span = e.target.parentElement.querySelector('span');
  span.textContent = e.target.value;

}

var offerOptions = {
  offerToReceiveAudio: 1,
  offerToReceiveVideo: 1
};
var dataChannelOptions = null;
var videoContainer = document.getElementById('video-list');
var localVideoContainer = document.getElementById('myVideoContainer');
var localVideo = null;
/*
document.getElementById("my-video");
localVideo.addEventListener('loadedmetadata', function() {
      trace('Local video videoWidth: ' + this.videoWidth +
        'px,  videoHeight: ' + this.videoHeight + 'px');
    });
*/

// EXCHANGE MESSAGES //
var JOINED_ROOM = 'JOINED-ROOM';
var LEFT_ROOM = 'LEFT-ROOM';
var OFFER_REQUEST = 'OFFER';
var OFFER_ANSWER  = 'ANSWER';
var NEW_ICE_FOUND = 'NEW-ICE-FOUND';
var TEXT_MESSAGE = 'TEXT-MESSAGE';
// ---------------------//

//message types //
var SERVER_NOTICE = 1;
var PEER_TEXT = 2;
var PEER_BINARY = 3;
var MY_MESSAGES = 4;
//------------------//
var iceServers;
function getIceServers() {
    return iceServers;
}

function generateUniqueId() {
    return Math.floor((1 + Math.random()) * 0x100000);
}


function getUserMediaConstraints() {
  var constraints = {};
  constraints.audio = true;
  constraints.video = {};
  if (minWidthInput.value !== '0') {
    constraints.video.width = {};
    constraints.video.width.min = minWidthInput.value;
  }
  if (maxWidthInput.value !== '0') {
    constraints.video.width = constraints.video.width || {};
    constraints.video.width.max = maxWidthInput.value;
  }
  if (minHeightInput.value !== '0') {
    constraints.video.height = {};
    constraints.video.height.min = minHeightInput.value;
  }
  if (maxHeightInput.value !== '0') {
    constraints.video.height = constraints.video.height || {};
    constraints.video.height.max = maxHeightInput.value;
  }
//  if (framerateInput.value !== '0') {
//    constraints.video.frameRate = {};
//    constraints.video.frameRate.max = framerateInput.value;
//  } 
  return constraints;
}

//using websockets
var connection = null;

// Simulate an ice restart.
function restartIce(peer_id) {
  offerOptions.iceRestart = true;
  trace(peer_id + ' createOffer restart');
  peers[peer_id].createOffer(
    offerOptions
  ).then(
    onCreateOfferSuccess,
    onCreateSessionDescriptionError
  );
}


function onCreateSessionDescriptionError(error) {
  trace('Failed to create session description: ' + error.toString());
}

function gotRemoteStream(e, peer_id) {
  trace('Received local stream');
  if(remoteVideos[peer_id])
	removeRemoteVideo(peer_id, true);
  else
	makeRemoteVideo(peer_id);		// only create the video element if the peer_id never existed in first place.
  var remoteVideo = document.getElementById('v'+ peer_id);
  remoteVideo.srcObject = e.streams[0];
//  remoteVideo.id = peer_id;
  remoteVideo.autoplay = true;
  attachRemoteVideo(peer_id, remoteVideo);
  trace('received remote stream from: ' + peer_id);;
}

function makeRemoteVideo(peerId) {
	var containerId = "cont_" + peerId ;
	var remoteVideoContainer = document.createElement("div");
	remoteVideoContainer.className = "col";
	remoteVideoContainer.id = containerId;
	remoteVideoContainer.innerHTML = '<div class="embed-responsive embed-responsive-16by9">' +
    '<video autoplay="autoplay" id="v' + peerId + '" class="embed-responsive-item videos" /></div>'
    + '<div class="container"><p class="peerId" /></div>';
    videoContainer.appendChild(remoteVideoContainer);
	addToggleFullScreen(remoteVideoContainer);
}

function sendThroughServer(msg) {
  msg['displayName'] = myName;		// current user display Name if any
  trace("Sending '" + msg.type + "' message: " + msg);
  var msgJSON = JSON.stringify(msg);
//  switch (connection.readyState) {
//      case WebSocket.CLOSING:
//      case WebSocket.CLOSED:
//        alert('Looks like you got offline. Pls Check your network and restart the call');
//        return;
//  }
  connection.send(msgJSON);
}

function connect(ice_uri) {
  iceURI = ice_uri;
  trace('using ice uri: ' + iceURI);
  if(!uniqueId)
    uniqueId = generateUniqueId();
  if(!myName)
    myName = uniqueId;
  var scheme = "ws";
  if(URLSearchParams) {
	  const urlParams = new URLSearchParams(window.location.search);
	  const suggestedName = urlParams.get("myName");
	  if(suggestedName != null) {
		  myNameField.value = suggestedName;
		  saveMyName();
	  }  
		  
  }
  // If this is an HTTPS connection, we have to use a secure WebSocket
  // connection too, so add another "s" to the scheme.
  serverUrl = encodeURI(document.URL);
  serverUrl =  serverUrl.replace('http', scheme);
  var req_protocol = document.location.protocol;
  initialize(serverUrl);
  ice_uri = req_protocol + "//" + myHostname + ':' + myPort + ice_uri;
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
       if (xhttp.readyState == 4 && xhttp.status == 200) {
          iceServers = JSON.parse(xhttp.responseText);
       }
  };
 trace('ice servers', iceServers);
 xhttp.open("GET", iceURI, true);
 xhttp.send();
 trace('my unique id: ' + uniqueId);
}

function initialize(serverUrl, callbacks) {
  if(callbacks === undefined)
    callbacks = {};
  connection = new WebSocket(serverUrl);
  connection.onopen = function(event) {
    trace('connection opened.');
    var onMediaInit = null;
    if(callbacks.onMediaInit)
      onMediaInit = callbacks.onMediaInit;
    //get ice servers
    start(onMediaInit);
    trace('on signal open sequence complete.');
  };

  connection.onclose = function() {
    trace('server connection closed');
  }

  connection.onmessage = function(evt) {
    handleServerMsg(evt.data);
  }
};

function handleServerMsg(msg_string) {
  trace('handle server msg recieved: ' + msg_string);
  var msg = JSON.parse(msg_string);
  trace('converted',msg)
  if(msg.name == uniqueId) {
    //trace('message not for me: '+ msg_string + ' test: ' + (msg.target == uniqueId));
    return;
  }

  if(msg.target !== undefined && msg.target != uniqueId )
    return; // mesages withouout a target are considered to be public  messages

  switch(msg.type) {
    case JOINED_ROOM:
      return handleGuest(msg.name);
    case OFFER_REQUEST:
      return handleOfferRequest(msg);
    case OFFER_ANSWER:
      return handleVideoAnswerMsg(msg);
    case NEW_ICE_FOUND:
      return handleNewICECandidateMsg(msg);
    case TEXT_MESSAGE:
      return updateChat(msg, TEXT_MESSAGE);
    case LEFT_ROOM:
        return handleGuestLeft(msg.name);
  }

  trace('unknown message: ' + msg);

}

function start(onMediaInit) {
  /**
  1. Start
  2. get local stream
  3. announce presence (other whatever action is specified in onMediaInit)
  4. wait for response (basically exit. handled from listener)
  **/
  trace('Requesting local stream');
  trace('using media callback ' + onMediaInit);
  var mediaConstraints = getUserMediaConstraints();
  trace('using media constraints: ' + JSON.stringify(mediaConstraints));
  navigator.mediaDevices.getUserMedia(mediaConstraints)
  .then(function(stream) {
      trace('got user media');
      localStream = stream;
      setVideoStream(stream); //this is the self stream.
      trace('setting local stream....');
      if(onMediaInit) {
        onMediaInit();
      }
      else {
        announcePresence();
      }
  })
  .catch(function(e) {
    alert('getUserMedia() error: ' + e.name);
    throw e;
  });
}


function refreshStream(stream) {
	setVideoStream(stream);
	for(var peer_id in peers) {
		var videoTrack = stream.getVideoTracks()[0];
		videoSenders[peer_id].replaceTrack(videoTrack);
		var audioTrack = localStream.getAudioTracks()[0];	// using audio from localStream to enable synchronicity with mute/unmute button. 
		audioSenders[peer_id].replaceTrack(audioTrack);
	}
}


function startScreenShare() {
	  /*
	  Mostly replicates start(), except that the stream is gotten from the screen/window instead.
	  In addition, it kills existing stream, replacing local stream with gotten from screen/window
	  **/
	  trace('Requesting display stream');
	  getScreen()
	  .then(function(stream) {
	      trace('got display media');
	      localScreenStream = stream;
	      refreshStream(localScreenStream);
	  })
	  .catch(function(e) {
	    alert('error getting screen: ' + e.name);
	    throw e;
	  });
	}



function setVideoStream(stream) {
  trace('Received local stream');
  localVideoContainer.innerHTML = '';
  localVideo = document.createElement('video');
  localVideoContainer.appendChild(localVideo);
  localVideo.srcObject = stream;
  localVideo.id = 'v'+uniqueId;
  localVideo.autoplay = true;
  localVideo.muted = "muted";
  localVideo.allowfullscreen="true"
  localVideo.className = "embed-responsive-item videos";
  window.stream = stream;
  enableButtons();
  trace('done setting local stream ');
  addToggleFullScreen(localVideoContainer);
}

function announcePresence() {
    /* This basically announces that  */
    return sendThroughServer({'type' : JOINED_ROOM, 'name' : uniqueId});
}

function announceDropOut() {
    /* This basically announces that  */
    return sendThroughServer({'type' : LEFT_ROOM, 'name' : uniqueId});
}

function resetPeers() {
  //typically remove all the peers and videos

}

function makeOrGetPeer(id) {
  if(peers[id] !== undefined) 
     return peers[id];
  var peerConnection = new RTCPeerConnection({
        iceServers: getIceServers()
  });
  peerConnection.onicecandidate = function(e) {
        onIceCandidate(e, id);
  };
  peerConnection.oniceconnectionstatechange = function(e) {
                handleICEConnectionStateChangeEvent(e, id);
  };
  peerConnection.ontrack = function(e) {
        gotRemoteStream(e, id);
  }
/**
  disabling this for now
  peerConnection.onremovestream = function(e) {
        trace('removed stream: ' + id);
  }
 */
  peerConnection.onsignalingstatechange = function(e) {
    var state = peerConnection.signalingState;
    trace(id + ' state changed to ' + state);
//    switch(state){
//        case "closed":
//            handleGuestLeft(id);
//            break;
//    }
  }
  peers[id] = peerConnection;
  return peerConnection;
}

function handleGuest(peer_id) {
    /**
    new guest joined.
    1) Create webrtc peer connection
    2) then call the created peer
    **/
    makeOrGetPeer(peer_id);
    return call(peer_id);
}

function handleGuestLeft(peer_id) {
    trace(peer_id + ' left! cleaning up...');
    if(peer_id in peers) {
	    peers[peer_id].close();
	    delete peers[peer_id];
    }
    delete audioSenders[peer_id];
    delete videoSenders[peer_id];
    removeRemoteVideo(peer_id);
}

function attachRemoteVideo(peer_id, remoteStreamObj) {
    remoteVideos[peer_id] = remoteStreamObj;
}

function removeRemoteVideo(peer_id, retainVideoContainer) {
	trace("Stopping Video");
	var deleteVideoElement = true;
	if(retainVideoContainer === true)
		deleteVideoElement = false;
    if(remoteVideos[peer_id])
    {
        delete remoteVideos[peer_id];
        if(deleteVideoElement) {
	        var liElement = document.getElementById('cont_' + peer_id);
	        videoContainer.removeChild(liElement);
        }
    }
}


function handleVideoAnswerMsg(msg) {
  var peer_id = msg.name;
  var desc = new RTCSessionDescription(msg.sdp);
  trace(peer_id + ': setRemoteDescription start');
  var peerConnection = makeOrGetPeer(peer_id);
  peerConnection.setRemoteDescription(desc)
   .then(function() {
    onSetRemoteSuccess(peer_id);
  })
  .catch(function(error) {
    onSetSessionDescriptionError(error, peer_id);
  });
}

function handleNewICECandidateMsg(msg) {
  var peer_id = msg.name;
  var candidate = new RTCIceCandidate(msg.candidate);
  trace(peer_id + ": Adding received ICE candidate: " + JSON.stringify(candidate));
  var peerConnection = makeOrGetPeer(peer_id);
  peerConnection.addIceCandidate(candidate)
    .then(
        function() {
          onAddIceCandidateSuccess(peerConnection);
        })
    .catch(
        function(err) {
          onAddIceCandidateError(peerConnection, err);
        });

}

function onIceCandidate(event, peer_id) {
  if (event.candidate) {
//    myPeerConnection.onicecandidate = function(){};
    trace(peer_id + ': sending ice candidate: ' + event.candidate);
    sendThroughServer({
      name: uniqueId,
      type: NEW_ICE_FOUND,
      target: peer_id,
      candidate: event.candidate
    });
    trace(peer_id + ' ICE candidate: \n' + event.candidate);
  }
}

function handleICEConnectionStateChangeEvent(event, peer_id) {
  var peerConnection = makeOrGetPeer(peer_id);
  trace(peer_id + "*** ICE connection state changed to " + peerConnection.iceConnectionState);

  switch(peerConnection.iceConnectionState) {
    case "closed":
    case "failed":
//    case "disconnected": 
      //updateChat({text: peer_id + ' disconnected.'});
      //closeVideoCall();
      handleGuestLeft(peer_id);
      refreshAttendantsCount();
      break;
    case "completed":
    //case "connected":    //stated might be connected but might still get better connection. Thos is allow new ice
      //peerConnected = true;
      trace(peer_id + ': has been connection completed');
      break;
  }
}


function onAddIceCandidateSuccess(peer_id) {
  trace(peer_id + ' addIceCandidate success');
}

function onAddIceCandidateError(peer_id, error) {
  trace(peer_id + ' failed to add ICE Candidate: ' + error.toString());
}


function handleOfferRequest(msg) {
  var peer_id = msg.name;
  var peerConnection = makeOrGetPeer(peer_id);
//  hangupButton.disabled = false;
  peerConnection.ondatachannel = function(e) { receiveDataChannel(e, peer_id); }; //register to use callers datachannel
  var desc = new RTCSessionDescription(msg.sdp);
  trace('Accepting call from: '+ peer_id);
  trace('recieved offer: '+ peer_id + ' is ' + desc);
  peerConnection.setRemoteDescription(desc)
    .then(function() {
    onSetRemoteSuccess(peer_id);
    var peerConnection = makeOrGetPeer(peer_id);
    trace('Adding remote stream to: ' + peer_id);
    var videoTrack = localStream.getVideoTracks()[0];
    videoSenders[peer_id] = peerConnection.addTrack(videoTrack, localStream);
    var audioTrack = localStream.getAudioTracks()[0];
    audioSenders[peer_id] = peerConnection.addTrack(audioTrack, localStream);
    trace(peer_id + ' createAnswer start');
      // Since the 'remote' side has no media stream we need
      // to pass in the right constraints in order for it to
      // accept the incoming offer of audio and video.
    peerConnection.createAnswer(function(desc) {
                                    onCreateAnswerSuccess(desc, peer_id);
                                }, onCreateSessionDescriptionError);
  })
  .catch(function(error) {
    onSetSessionDescriptionError(error, peer_id);
  });
}

function onSetRemoteSuccess(peer_id) {
  trace(peer_id + ' setRemoteDescription complete');
}

function onCreateAnswerSuccess(desc, peer_id) {
  trace('Answer from ' + peer_id + ': ' + desc.sdp);
  trace(peer_id + ' myPeerConnection setLocalDescription start');
  var peerConnection = makeOrGetPeer(peer_id);
  peerConnection.setLocalDescription(desc)
    .then( function() {
      onSetLocalSuccess(peer_id);
      trace("Sending answer packet back to: " + peer_id);
      sendThroughServer({
          name: uniqueId,
          target: peer_id,
          type: OFFER_ANSWER,
          sdp: desc
        });
  })
   .catch(
   function(error) {
        onSetSessionDescriptionError(error, peer_id);
   });
  // We've configured our end of the call now. Time to send our
  // answer back to the caller so they know that we want to talk
  // and how to talk to us.

}

function onSetLocalSuccess(peer_id) {
  trace(peer_id + ' setLocalDescription complete');
}

function call(peer_id) {
//  hangupButton.disabled = false;
  trace('Starting call');
  trace('creating data channel');
  var peerConnection = makeOrGetPeer(peer_id);
  dataChannels[peer_id] = peerConnection.createDataChannel("chat", dataChannelOptions);
  setUpDataChannel(peer_id);
  createOffer(peer_id);
}

function createOffer(peer_id) {
  var peerConnection = makeOrGetPeer(peer_id);
  trace(peer_id + ' Adding local stream to myPeerConnection');
  var videoTrack = localStream.getVideoTracks()[0];
  videoSenders[peer_id] = peerConnection.addTrack(videoTrack, localStream);
  var audioTrack = localStream.getAudioTracks()[0];
  audioSenders[peer_id] = peerConnection.addTrack(audioTrack, localStream);
  trace(peer_id + ' createOffer start');
  peerConnection.createOffer(offerOptions)
    .then(function(desc){
        onCreateOfferSuccess(desc, peer_id);
    })
    .catch(function(error) {
        onCreateSessionDescriptionError(error);
    });
}

function onCreateOfferSuccess(desc, peer_id) {
  var localDesc = desc;
  trace('Offer from '+ peer_id + ': '  + desc.sdp);
  trace(peer_id+ ' setLocalDescription start');
  var peerConnection = makeOrGetPeer(peer_id);
  peerConnection.setLocalDescription(desc)
  .then(function() {
    onSetLocalSuccess(peerConnection);
    trace("Sending offer packet back to: " + peer_id);
    sendThroughServer({
        name: uniqueId,
        target: peer_id,
        type: OFFER_REQUEST,
        sdp: desc
      });
  })
  .catch(function(error) {
    onSetSessionDescriptionError(error, peer_id);
    });
}

function onSetSessionDescriptionError(error, peer_id) {
  trace('Failed to set session description ' + peer_id+ ': ' + error.toString());
}

function receiveDataChannel(event, peer_id) {
        trace('recieved data channel: '+ peer_id);
        dataChannels[peer_id] = event.channel;
        setUpDataChannel(peer_id);
}

function setUpDataChannel(peer_id) {
  trace('setting up data channel: ' + peer_id);
  var dataChannel = dataChannels[peer_id];
  dataChannel.binaryType = 'arraybuffer';
  dataChannel.onerror = function (error) {
    trace(peer_id + ": Data Channel Error:" + error);
  };

  dataChannel.onmessage = function(e) { onReceiveDataChannelMessage(e, peer_id); };

  dataChannel.onopen = function () {
    trace(peer_id + ' Send channel state is: ' + dataChannel.readyState);
    updateChat({text: peer_id+ " now Connected.", id: uniqueId, type: SERVER_NOTICE});
    refreshAttendantsCount();
    trace('people keys: ' + Object.keys(peers));
    enableChat();
  };

  dataChannel.onclose = function () {
    trace(peer_id + ": The Data Channel is Closed");
    handleGuestLeft(peer_id);
    updateChat({text: peer_id+ " Left.", id: uniqueId, type: SERVER_NOTICE});
    if(Object.keys(peers).length == 0)
        disableChat();
    refreshAttendantsCount();
    trace('people keys: ' + Object.keys(peers));
  };
  trace('done setting up channel: '+ peer_id);
}

function refreshAttendantsCount() {
	//peopleCount.textContent = Object.keys(peers).length + 1;
}


function onReceiveDataChannelMessage(event, peer_id) {
    trace(peer_id + ": Got Data Channel message: " + event.data);
    var msg = JSON.parse(event.data);
    switch(msg['msgType']) {
        case PEER_TEXT:
            updateChat(msg);
            break;
        case PEER_BINARY:
            handleReceivedBinaryMessage(msg);
            break;
    };
};

function handleReceivedBinaryMessage(msg) {
  var downloadAnchor = null; 
  var progressHTML = null;
  var receiveProgress = null;

  msg['payload'] = base64ToArrayBuffer(msg['payload']);
  if(!(msg['sendId'] in receivedFiles)){
     trace('creating binary file: ' + msg['sendId']);
     receivedFiles[msg['sendId']] = {'file-name': msg['fileName'],
                                        'uploaded': msg['uploaded'],
                                        'payload': [], //payload would serve as receive buffer
                                        'sender': msg['sender'],
                                        'size': 0,
                                        'expectedSize': msg['fileSize']
                                        };
     progressHTML = '<span id="fs' + msg['sendId'] + '">' + msg['fileName'] + '</span><progress id="p' + 
				msg['sendId'] + '" max="0" value="0"></progress><a id="d' + msg['sendId'] + '" />';
     postToChat(msg['sender'], progressHTML);
     receiveProgress = document.getElementById('p' + msg['sendId']);
     receiveProgressLabel = document.getElementById('fs' + msg['sendId']);
     receiveProgress.max = msg['fileSize'];
     downloadAnchor = document.getElementById('d' + msg['sendId']);
  } else {
     receiveProgress = document.getElementById('p' + msg['sendId']);
     receiveProgressLabel = document.getElementById('fs' + msg['sendId']);
     downloadAnchor = document.getElementById('d' + msg['sendId']);
  }
  receivedFiles[msg['sendId']]['payload'].push(msg['payload']);
  receivedFiles[msg['sendId']]['size'] += msg['payload'].byteLength;
  var receivedSize = receivedFiles[msg['sendId']]['size'];
  receiveProgress.value = receivedFiles[msg['sendId']]['size'];

  // we are assuming that our signaling protocol told
  // about the expected file size (and name, hash, etc).
  if (receivedSize === msg['fileSize']) {
    var received = new window.Blob(receivedFiles[msg['sendId']]['payload']);

    downloadAnchor.href = URL.createObjectURL(received);
    downloadAnchor.download = msg['fileName'];
    downloadAnchor.textContent =
      'Click to download \'' + msg['fileName'] + '\' (' + formatBytes(msg['fileSize']) + ')';
    downloadAnchor.style.display = 'block';
  }
}

//Apercu@http://stackoverflow.com/questions/15900485/correct-way-to-convert-size-in-bytes-to-kb-mb-gb-in-javascript
function formatBytes(bytes,decimals) {
   if(bytes == 0) return '0 Byte';
   var k = 1024;
   var dm = decimals + 1 || 3;
   var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
   var i = Math.floor(Math.log(bytes) / Math.log(k));
   return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}


function updateChat(msg)
{
  if(!(msg.text && msg.text.trim()))
    return;
  var date = Date.now();
  if(msg.date)
    date = msg.date;
  var className = ''
  var name = msg.name ? msg.name : '';
  switch(msg.type){
    case MY_MESSAGES:
      className = 'myChats';
      break;
    case SERVER_NOTICE:
      className = 'notification';
      break;
    case PEER_TEXT:
      className = 'peerMsg'
  }
//  var text = '<span class="' + className + '">(' + timeStr + ') <b>' + name + '</b>: ' + msg.text + '<br></span>';
  //chatPane.innerHTML = chatPane.innerHTML + '<p class="chat">' + text + '</p>';
  //document.querySelector('#chatPane .chat:last-of-type').scrollIntoView();
  postToChat(name, msg.text, date);
}

function postToChat(speakerName, content, date) {
  if(!date)
	date = Date.now();
  var time = new Date(date);
  var timeStr = time.toLocaleTimeString();
  var text = '<li id="msg-1470377427366" data-author="EgozXv0whiBkuutjAACD" class="chat"><div class="clroom-groupchat-img">' +
  '<a href="javascript:void(0);"></a></div><div class="clroom-groupchat-right"<div class="clroom-groupchat-right-in">' +
   '<div class="clroom-groupchat-name"><a href="javascript:void(0);">' + speakerName + '</a><div class="clroom-groupchat-date">'+
   timeStr + '</div></div><div class="clroom-groupchat-text">' + content + '</div><ul class="clroom-group-chat-subnav">' +
   '<li><a href="javascript:void(0);" class="subnav-delete" style="display: block"></a></li></ul></div></div></li>';
 // chatPane.innerHTML = chatPane.innerHTML + text;
  //document.querySelector('#chat-message .chat:last-of-type').scrollIntoView();    
}


function enableChat() {
//    sendMsgButton.disabled = false;
//    chatBox.disabled = false;
}

function disableChat() {
    //dont expect to disabe the chat after it has been enabled initially
//    sendMsgButton.disabled = true;
//    chatBox.disabled = true;
}


function sendData() {
  var file = fileInput.files[0];
  var sendId = uniqueId + '.' + Math.floor((1 + Math.random()) * 0x1000000);
  trace('file is ' + [file.name, file.size, file.type,
      file.lastModifiedDate].join(' '));
  var progressHTML = '<span id="fs' + sendId + '"></span><progress id="p' + sendId +
				'" max="0" value="0"></progress>';
  postToChat(myName, progressHTML);
  var sendProgress = document.getElementById('p' + sendId);
  var statusMessage = document.getElementById('fs' + sendId);
  // Handle 0 size files.
  statusMessage.textContent = '';
  if (file.size === 0) {
    bitrateDiv.innerHTML = '';
    statusMessage.textContent = 'File is empty, please select a non-empty file';
    closeDataChannels();
    return;
  }
  statusMessage.textContent = file.name;
  sendProgress.max = file.size;
  var chunkSize = 10240;
  var sliceFile = function(offset) {
    var reader = new window.FileReader();
    reader.onload = (function() {
      return function(e) {
        for(var peer_id in dataChannels) {
           try{
                trace('sending ' + e.target.result);
                var piece = {'msgType': PEER_BINARY, 'payload': arrayBufferToBase64(e.target.result),
                                        'sender': uniqueId, 'fileName': file.name,
                                        'offset': offset, 'fileSize': file.size, 'uploaded': new Date(),
                                        'sendId': sendId, 'sender': myName};
                piece = JSON.stringify(piece);
                trace('sending: ' + piece);
                dataChannels[peer_id].send(piece);
            }catch(e){
               trace(peer_id + ' unable to send: ' + offset + 'error '+ e);
            }
         }
        if (file.size > offset + e.target.result.byteLength)
          window.setTimeout(sliceFile, 0, offset + chunkSize);
        sendProgress.value = offset + e.target.result.byteLength;
      };
    })(file);
    var slice = file.slice(offset, offset + chunkSize);
    reader.readAsArrayBuffer(slice);
  };
  sliceFile(0);
}

//thanks to https://chawi3.com/2015/03/03/arraybuffer-to-base64-base64-to-arraybuffer-javascript/
function arrayBufferToBase64( buffer ) {
    var binary = '';
    var bytes = new Uint8Array( buffer );
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode( bytes[ i ] );
    }
    return window.btoa( binary );
}

function base64ToArrayBuffer(base64) {
    var binary_string =  window.atob(base64);
    var len = binary_string.length;
    var bytes = new Uint8Array( len );
    for (var i = 0; i < len; i++)        {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}


function muteVideo() {
  if(localStream)
    localStream.getVideoTracks().forEach(track => track.enabled = false);
}

function muteAudio() {
  if(localStream)
    localStream.getAudioTracks().forEach(track => track.enabled = false);
}

function unMuteVideo() {
  if(localStream)
    localStream.getVideoTracks().forEach(track => track.enabled = true);
}

function unMuteAudio() {
  if(localStream)
    localStream.getAudioTracks().forEach(track => track.enabled = true);
}

function toggleMuteVideo() {
   if(muteVideoButton.textContent.toLowerCase() == 'mute video')
   {
        muteVideoButton.textContent = 'Unmute Video';
        muteVideo();
   }else {
        muteVideoButton.textContent = 'Mute Video';
        unMuteVideo();
   }
}

function toggleMuteAudio() {
   if(muteAudioButton.textContent.toLowerCase() == 'mute audio')
   {
        muteAudioButton.textContent = 'Unmute Audio';
        muteAudio();
   }else {
        muteAudioButton.textContent = 'Mute Audio';
        unMuteAudio();
   }
}

function toggleCall() {
    if(toggleCallButton.textContent.toLowerCase() == 'disconnect'){
        stopCall();
        toggleCallButton.textContent = 'Connect';
    }else{
        restartCall();
        toggleCallButton.textContent = 'Disconnect';
    }

}

function toggleScreenShare() {
    if(shareScreenButton.textContent.toLowerCase() == 'share screen'){
    	if(!localScreenStream)
    		startScreenShare();
    	else refreshStream(localScreenStream);
        shareScreenButton.textContent = 'Stop Screen Share';
    }else{
    	refreshStream(localStream); 
        shareScreenButton.textContent = 'Share Screen';
    }

}

function stopLocalStream() {
    if(localStream && localStream.getTracks()) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
        localVideo.src = null;
        localVideo.srcObject = null;
        localVideoContainer.removeChild(localVideo);
        localVideo = null;
    }
}

function stopScreenStream() {
    if(localScreenStream && localScreenStream.getTracks()) {
    	localScreenStream.getTracks().forEach(track => track.stop());
    	localScreenStream = null;
    }
}

function stopCall() {
	stopLocalStream();
	stopScreenStream();
	for(var peer_id in peers) {
        handleGuestLeft(peer_id);
    }
    announceDropOut();
    connection.close();
    connection = null;
    resetButtons();
    disableButtons();
    disableChat();
    refreshAttendantsCount();
}

function restartCall() {
    connect(iceURI);
}

function resetButtons() {
    muteAudioButton.textContent = 'Mute Audio';
    muteVideoButton.textContent = 'Mute Video';
    shareScreenButton.textContent = 'Share Screen';
}

function enableButtons() {
    muteAudioButton.disabled = false;
    muteVideoButton.disabled = false;
    toggleCallButton.disabled = false;
    fileInput.disabled = false;
    //inverse for name setting enablement :)
    myNameField.disabled = true;
    setNameButton.disabled = true;
    var camSettings = document.querySelectorAll('#constraints input');
    for(var i=0; i < camSettings.length; i++) {
        camSettings[i].disabled = true;
    }
}

function disableButtons() {
    muteAudioButton.disabled = true;
    muteVideoButton.disabled = true;
    fileInput.disabled = true;
    //inverse for name setting enablement :)
    myNameField.disabled = false;
    setNameButton.disabled = false;
    var camSettings = document.querySelectorAll('#constraints input');
    for(var i=0; i < camSettings.length; i++) {
        camSettings[i].disabled = false;
    }
}

// Handles a click on the Send button (or pressing return/enter) by
// building a "message" object and sending it to the server.
function handleSendButton() {
  var msg = {
    text: chatBox.value,
    msgType: PEER_TEXT,
    id: uniqueId,
    name: myName,
    date: Date.now()
  };
  chatBox.value = "";
  var time = new Date(msg.date);
  var timeStr = time.toLocaleTimeString();
  if (msg.text.length) {
      for(var peer_id in dataChannels) {
      //simply try to send for each. Its okay if any one fails
          try {
                trace('sending to ' + peer_id);
                dataChannels[peer_id].send(JSON.stringify(msg));
          }catch(e) {
              trace(peer_id + ' Error sending msg: ' + e);
          }
      }
      updateChat(msg);
  }
}


// Handler for keyboard events. This is used to intercept the return and
// enter keys so that we can call send() to transmit the entered text
// to the server.
function handleKey(evt) {
  if (evt.keyCode === 13 || evt.keyCode === 14) {
    if (!sendMsgButton.disabled) {
      handleSendButton();
    }
  }
}

function saveMyName() {
    myName = myNameField.value;
    trace('my name now set to: ' + myName);
    myNameStatus.textContent = 'saved!';
    setTimeout(function(){ myNameStatus.textContent = ''; }, 1000);
}

function triggerFileSelect() {
    if (!sendMsgButton.disabled)
   	 fileInput.click();
    return false;
}

function toggleFullscreen(elem) {
	  if (!document.fullscreenElement && !document.mozFullScreenElement &&
	    !document.webkitFullscreenElement && !document.msFullscreenElement) {
	    if (elem.requestFullscreen) {
	      elem.requestFullscreen();
	    } else if (elem.msRequestFullscreen) {
	      elem.msRequestFullscreen();
	    } else if (elem.mozRequestFullScreen) {
	      elem.mozRequestFullScreen();
	    } else if (elem.webkitRequestFullscreen) {
	      elem.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
	    }
	  } else {
	    if (document.exitFullscreen) {
	      document.exitFullscreen();
	    } else if (document.msExitFullscreen) {
	      document.msExitFullscreen();
	    } else if (document.mozCancelFullScreen) {
	      document.mozCancelFullScreen();
	    } else if (document.webkitExitFullscreen) {
	      document.webkitExitFullscreen();
	    }
	  }
}

function addToggleFullScreen(elem) {
	elem.addEventListener('click', function(event) {
		  toggleFullscreen(event.target || event.srcElement);
	});
}

function enableMeetingScreenCapture() {
	if (adapter.browserDetails.browser == 'firefox') {
		  adapter.browserShim.shimGetDisplayMedia(window, 'screen');
	}
}


function getScreen() {
	//enable media if not already done
	enableMeetingScreenCapture();
	var screenConstraint = {video: true}; 		// would take audio from localStream.
	if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia)
		return navigator.mediaDevices.getDisplayMedia(screenConstraint);
	else
		return navigator.getDisplayMedia(screenConstraint);
}
