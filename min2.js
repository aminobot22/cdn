
var client = AgoraRTC.createClient({
  mode: "rtc",
  codec: "vp8"
});
var urlParams = new URLSearchParams(window.location.search);
let chatId1=urlParams.get('chatId');
const searchUrl = "https://saavnapi-nine.vercel.app/song?query=";
let storage=false;
let audioElement = document.getElementById('audio');
var localTracks = {
  videoTrack:null,
  audioTrack: null,
  audioTrack: null,
  audioEffectTrack: null
};
var volume21=50;
var localTrackState = {
  videoTrackMuted: false,
  audioTrackMuted: false
};
let isRecording = false;
let recorder;
var remoteUsers = {};

var options = {
  appid: null,
  channel: null,
  uid: null,
  token: null
};
var audioMixing = {
  state: "IDLE",
  // "IDLE" | "LOADING | "PLAYING" | "PAUSE"
  duration: 0
};
const playButton = $(".play");
let audioMixingProgressAnimation;
var logTimeout = null;

function log(message, type) {

  var existingLog = document.querySelector('.log-entry');
  if (existingLog) {
    existingLog.remove();
  }

  // Create a new log element
  var logElement = document.createElement('div');
  logElement.textContent = message;
  logElement.classList.add('log-entry', type);
  document.getElementById('log').appendChild(logElement);

  // Set a timeout to fade out the log after 3 seconds
  logTimeout = setTimeout(function() {
    logElement.style.opacity = 0;
    setTimeout(function() {
      logElement.remove();
    }, 500); // Adjust the time before removing the element (500ms)
  }, 10000); // Adjust the time before fading out (3000ms = 3s)
}

document.getElementById('reconnectBtn').addEventListener('click', function() {
  log('Attempting to reconnect...', 'info');
  retrieveData();

});

document.getElementById('deleteDataBtn').addEventListener('click', function() {
  log('Deleting data...', 'error');
  deleteData();

});



function saveData(jsonData) {
localStorage.removeItem('myData');
var jsonString = JSON.stringify(jsonData);
localStorage.setItem('myData', jsonString);
log('Data saved successfully!',"success");
}

function retrieveData() {
  var jsonString = localStorage.getItem('myData');

  if (jsonString) {
      try {
          var retrievedData = JSON.parse(jsonString);
          if (retrievedData.token && retrievedData.channel && retrievedData.uid) {
              // alert('Retrieved data: ' + jsonString);
              console.log('Retrieved data:', retrievedData);
              join2(retrievedData.token, retrievedData.channel, retrievedData.uid);
          } else {
              log('Incomplete data found!', 'error');
          }
      } catch (error) {
          log('Error parsing retrieved data: ' + error.message, 'error');
      }
  } else {
      log('No data found!', 'error');
  }
}


function deleteData() {
localStorage.removeItem('myData');

log('Data deleted successfully!',"error");
}




log('waiting for connection', 'success');

const SOCKET_PROTOCOL = "wss://";
const SOCKET_BASE_URL = "free.blr2.piesocket.com";
const SOCKET_VERSION = "v3";
const SOCKET_ROOM_ID = "1";
const SOCKET_API_KEY = "BFJuJjDOkT7B7lKD6WodSFPXAAo123lItRb771JN";
const SOCKET_NOTIFY_SELF = "1";

const SOCKET_URL = `${SOCKET_PROTOCOL}${SOCKET_BASE_URL}/${SOCKET_VERSION}/${SOCKET_ROOM_ID}?api_key=${SOCKET_API_KEY}&notify_self=${SOCKET_NOTIFY_SELF}`;


const KEY_FUNCTION_MAP = {
    "create3": async data => {
        await join2(data.key, data.channel, data.uid);
    },
    "play1": data => ag_play(data.url,data.type),
    "volume1": data => setVolume(data.volume),
    "mute1": async data => { await muteAudio() },
    "unmute1": async data => { await unmuteAudio() },
    "stop1": async data => { await stop_play() }
};

function info(key, data) {
    if (key in KEY_FUNCTION_MAP) {
        KEY_FUNCTION_MAP[key](data);
    }
}

function handleMessage(message) {
    try {
        const messageObject = JSON.parse(message);
        if (messageObject && messageObject.selenium) {
            const { key, data } = messageObject.selenium;
            if (key && data) {
                console.log(`RESPONSE (as object):`, messageObject);
                if (chatId1 == data.chatId) {
                    log("data received trying to connect","info");
                    info(key, data);
                }
            }
        }
    } catch (error) {
        console.error(`RESPONSE (not a valid JSON): ${message}`);
    }
}

function runWebSocket() {
    try {
        const ws = new WebSocket(SOCKET_URL);

        ws.onmessage = event => handleMessage(event.data);

        console.log("[socket][start] Socket Started");
    } catch (error) {
        log(error,"error");
    }
}

runWebSocket();




$(() => {
  var urlParams = new URL(location.href).searchParams;
  options.appid = urlParams.get("appid");
  options.channel = urlParams.get("channel");
  options.token = urlParams.get("token");
  options.uid = urlParams.get("uid");
  
  if (options.appid && options.channel) {
    
    $("#uid").val(options.uid);
    $("#appid").val(options.appid);
    $("#token").val(options.token);
    
    // Assign the modified channel value to the channel input field
    $("#channel").val(options.channel);
    
    // Submit the form
    $("#join-form").submit();
  }
});




$("#mute-audio").click(async function  (e) {
  
    await muteAudio();
});

$("#unmute-audio").click(async function  (e) {
    await unmuteAudio();
});

$("#resume").click(function  (e) {
  resume();
});

$("#pause").click(function  (e) {
  pause();
});

$("#join-form").submit(async function (e) {
  e.preventDefault();
  $("#join").attr("disabled", true);
  try {
    options.channel = $("#channel").val();
    options.uid = Number($("#uid").val());
    options.appid = $("#appid").val();
    options.token = $("#token").val();
    console.log(options.channel);
    chatId1 = options.channel.replace("-AUDIO", "");
    console.log(chatId1);
    await join();
    if (options.token) {
      $("#success-alert-with-token").css("display", "block");
    } else {
      $("#success-alert a").attr("href", `index.html?appid=${options.appid}&channel=${options.channel}&token=${options.token}`);
      $("#success-alert").css("display", "block");
    }
  } catch (error) {
    console.error(error);
  } finally {
    $("#leave").attr("disabled", false);
    $("#audio-mixing").attr("disabled", false);
    $("#audio-effect").attr("disabled", false);
    $("#stop-audio-mixing").attr("disabled", false);
    $("#local-audio-mixing").attr("disabled", false);
  }
});
$("#leave").click(async function (e) {
  leave();
});
$("#audio-mixing").click(function (e) {
  startAudioMixing();
});
$("#audio-effect").click(async function (e) {
  // play the audio effect
  await playEffect(1, {
    source: "audio.mp3"
  });
  console.log("play audio effect success");
});
$("#stop-audio-mixing").click(async function (e) {
  stopAudioMixing();
  await muteAudio()
  return false;
});
$(".audio-bar .progress").click(function (e) {
  setAudioMixingPosition(e.offsetX);
  return false;
});
$("#volume").click(function (e) {
  setVolume($("#volume").val());
});
$("#local-audio-mixing").click(async function (e) {
  var urlInput = document.getElementById('urlInput');
  var enteredUrl = urlInput.value;
  if (enteredUrl) {
    console.log(enteredUrl);
      //const videoURL = URL.createObjectURL(enteredUrl);
      await ag_play(enteredUrl);
  
  }
});
playButton.click(function () {
  if (audioMixing.state === "IDLE" || audioMixing.state === "LOADING") return;
  toggleAudioMixing();
  return false;
});
function setAudioMixingPosition(clickPosX) {
  if (audioMixing.state === "IDLE" || audioMixing.state === "LOADING") return;
  const newPosition = clickPosX / $(".progress").width();

  // set the audio mixing playing position
  localTracks.audioTrack.seekAudioBuffer(newPosition * audioMixing.duration);
}
function setVolume(value) {
  // set the audio mixing playing position
  localTracks.audioTrack.setVolume(parseInt(value));
  volume21=value;
  console.log(value);
}
async function startAudioMixing(file) {
  if (audioMixing.state === "PLAYING" || audioMixing.state === "LOADING") return;
  const options = {};
  if (file) {
    options.source = file;
  } else {
    options.source = "HeroicAdventure.mp3";
  }
  try {
    audioMixing.state = "LOADING";
    // if the published track will not be used, you had better unpublish it
    if (localTracks.audioTrack) {
      await client.unpublish(localTracks.audioTrack);
    }
    // start audio mixing with local file or the preset file
    localTracks.audioTrack = await AgoraRTC.createBufferSourceAudioTrack(options);
    await client.publish(localTracks.audioTrack);
    localTracks.audioTrack.play();
    localTracks.audioTrack.startProcessAudioBuffer({
      loop: true
    });
    audioMixing.duration = localTracks.audioTrack.duration;
    $(".audio-duration").text(toMMSS(audioMixing.duration));
    playButton.toggleClass('active', true);
    setAudioMixingProgress();
    audioMixing.state = "PLAYING";
    console.log("start audio mixing");
  } catch (e) {
    audioMixing.state = "IDLE";
    console.error(e);
  }
}

async function stop_play(){
  if (localTracks.audioTrack) {
    await client.unpublish(localTracks.audioTrack);
  }
}
function formatTime(seconds) {
  let minutes = Math.floor(seconds / 60);
  let remainingSeconds = Math.floor(seconds % 60);
  if (remainingSeconds < 10) {
    remainingSeconds = "0" + remainingSeconds;
  }
  return minutes + ":" + remainingSeconds;
}
async function ag_play(url,type){
  var video_url;
  if (localTracks.audioTrack) {
    await client.unpublish(localTracks.audioTrack);
  }
console.log(url);
const videoFromDiv = document.getElementById("sample-audio");

if (type=="yt"){
video_url='https://streanwer-0d475b960871.herokuapp.com/get_audio?ytlink='+url;

}else{
const response = await fetch(url);
console.log(response);
if (!response.ok) {
    throw new Error(`Failed to fetch video URL. Status: ${response.status}`);
              }
  const videoBlob = await response.blob();

  video_url = URL.createObjectURL(videoBlob);
  console.log(video_url);
}
   
  videoFromDiv.src = video_url;
  videoFromDiv.onloadedmetadata = function() {
    document.getElementById('total-time').textContent = formatTime(videoFromDiv.duration);
 };
  await videoFromDiv.play()
.then(async function() {
  var videoStream = navigator.userAgent.indexOf("Firefox") > -1 ? videoFromDiv.mozCaptureStream() : videoFromDiv.captureStream();

  [localTracks.audioTrack] = await Promise.all([
    AgoraRTC.createCustomAudioTrack({
      mediaStreamTrack: videoStream.getAudioTracks()[0]
    })
  ]);
  await client.publish(localTracks.audioTrack);
  setVolume(volume21);
  videoFromDiv.ontimeupdate = function() {
    document.getElementById('current-time').textContent = formatTime(videoFromDiv.currentTime);
 };

 videoFromDiv.onended = async function() {
    // Mute the audio track after the song has completely played
    await muteAudio();
    console.log('Song ended, audio muted');
 };

});
}


  
  
  


function stopAudioMixing() {
  if (audioMixing.state === "IDLE" || audioMixing.state === "LOADING") return;
  audioMixing.state = "IDLE";

  // stop audio mixing track
  localTracks.audioTrack.stopProcessAudioBuffer();
  localTracks.audioTrack.stop();
  $(".progress-bar").css("width", "0%");
  $(".audio-current-time").text(toMMSS(0));
  $(".audio-duration").text(toMMSS(0));
  playButton.toggleClass('active', false);
  cancelAnimationFrame(audioMixingProgressAnimation);
  console.log("stop audio mixing");
}
function resume() {
  localTracks.audioTrack.resumeProcessAudioBuffer();
  audioMixing.state = "PLAYING";
  }
function pause() {
    localTracks.audioTrack.pauseProcessAudioBuffer();
    audioMixing.state = "PAUSE";}


function setProgressBar(percentage) {
      const progressBar = document.getElementById("p-bar");
      progressBar.style.width = `${percentage}%`;
      progressBar.setAttribute("aria-valuenow", percentage);
    }
    

function setAudioMixingProgress() {
  audioMixingProgressAnimation = requestAnimationFrame(setAudioMixingProgress);
  const currentTime = localTracks.audioTrack.getCurrentTime();
  $(".progress-bar").css("width", `${currentTime / audioMixing.duration * 100}%`);
  $(".audio-current-time").text(toMMSS(currentTime));
}

// use buffer source audio track to play effect.
async function playEffect(cycle, options) {
  // if the published track will not be used, you had better unpublish it
  if (localTracks.audioEffectTrack) {
    await client.unpublish(localTracks.audioEffectTrack);
  }
  localTracks.audioEffectTrack = await AgoraRTC.createBufferSourceAudioTrack(options);
  await client.publish(localTracks.audioEffectTrack);
  localTracks.audioEffectTrack.play();
  localTracks.audioEffectTrack.startProcessAudioBuffer({
    cycle
  });
}


async function join2(token, channel, uid) {
  try {

      client.on("user-published", handleUserPublished);
      client.on("user-unpublished", handleUserUnpublished);
      
      
      [options.uid] = await Promise.all([
          client.join('2b0567d3ff534f0593528432dac20dc1', channel, token || null, uid || null)
      ]);


      // await client.publish(Object.values(localTracks).filter(track => track !== null));

      if (!storage) {
        var jsonData = {
          "token": token,
          "channel": channel,
          "uid": uid
      };
        saveData(jsonData)
        log("data saved", "success");
      }

      log("Voice connected", "success");
  } catch (error) {
      console.error("Error during join operation:", error);
      log("Error during join operation: " + error.message, "error");
  }
}

async function join() {
  // add event listener to play remote tracks when remote user publishs.
  client.on("user-published", handleUserPublished);
  client.on("user-unpublished", handleUserUnpublished);

  // join a channel and create local tracks, we can use Promise.all to run them concurrently
  [options.uid] = await Promise.all([
  // join the channel
  client.join('2b0567d3ff534f0593528432dac20dc1', options.channel, options.token || null,options.uid || null)])
  await client.publish(Object.values(localTracks).filter(track => track !== null));
  console.log("publish success");
  
}
async function leave() {
  stopAudioMixing();
  for (trackName in localTracks) {
    var track = localTracks[trackName];
    if (track) {
      track.stop();
      track.close();
      localTracks[trackName] = null;
    }
  }
  // remove remote users and player views
  remoteUsers = {};
  $("#remote-playerlist").html("");

  // leave the channel
  await client.leave();
  $("#local-player-name").text("");
  $("#join").attr("disabled", false);
  $("#leave").attr("disabled", true);
  $("#audio-mixing").attr("disabled", true);
  $("#audio-effect").attr("disabled", true);
  $("#stop-audio-mixing").attr("disabled", true);
  $("#local-audio-mixing").attr("disabled", true);
  console.log("client leaves channel success");
}

function wordsAfterTargets(targetWords, sentence) {
  const words = sentence.split(' ');
  const result = {};

  targetWords.forEach(targetWord => {
    const targetIndex = words.indexOf(targetWord);

    if (targetIndex !== -1 && targetIndex !== words.length - 1) {
      const wordsAfter = words.slice(targetIndex + 1);
      result[targetWord] = wordsAfter.join(' ');
    } else {
      result[targetWord] = null;
    }
  });

  return result;
}
function printOnSecondCall(user, mediaType) {
  let lastCallTime = 0;

  return async function() {
    const currentTime = new Date().getTime();

    if (currentTime - lastCallTime <= 2000) {
      await subscribe(user, mediaType);
    }

    // Update the last call time
    lastCallTime = currentTime;
  };
}
async function subscribe(user, mediaType) {
  await client.subscribe(user, "audio");
  let userAudioElement = document.createElement('audio');
    userAudioElement.id = user.uid;
    document.body.appendChild(userAudioElement);
			let stream = new MediaStream();
			stream.addTrack(user.audioTrack.getMediaStreamTrack());
			userAudioElement.srcObject = stream;
			recordinguser = user.uid;
			user.audioTrack.play();
			// user.audioTrack.setVolume(100);
			console.log("audio enabled for " + user.uid)
}
async function handleUserPublished(user, mediaType) {
  console.log("dddd");
  const id = user.uid;
  await subscribe(user,mediaType);
  startRecording(user.uid);
}

function handleUserUnpublished(user, mediaType) {
  let userAudioElement = document.getElementById(user.uid);
    
    if (userAudioElement) {
        userAudioElement.parentNode.removeChild(userAudioElement);}
  const id = user.uid;
  
}

function startRecording(userId) {
  if (!isRecording) {
    let userAudioElement = document.getElementById(userId);
      let stream = userAudioElement.srcObject;
      recorder = new MediaRecorder(stream);
      let chunks = [];

      recorder.ondataavailable = function (event) {
          if (event.data.size > 0) {
              chunks.push(event.data);
          }
      };

      recorder.onstop = function () {
          // Send audio chunks to the server
          sendChunks(chunks);
      };

      recorder.start();
      isRecording = true;

      // Stop recording after 5 seconds
      setTimeout(stopRecording, 4000);
  }
}

function sendChunks(chunks) {
  let formData = new FormData();
 
  chunks.forEach((chunk, index) => {
       formData.append('audio_chunks', chunk, `chunk_${index}.webm`);
  });
 
  fetch('https://speech2txt-00dfc093af6a.herokuapp.com/upload', {
       method: 'POST',
       body: formData,
  })
  .then(response => response.json())
  .then(async data => {
     console.log(data); // Log the entire response to check its structure
     if (data.status === 'ok') {
       var transcript = data.message;
       const targetWords = ['play', 'volume'];
       const result = wordsAfterTargets(targetWords, data.message);
       console.log(result);
       
       console.log(transcript);
       if (transcript.toLowerCase().includes('mute')) {
         muteAudio();
         console.log('Mute');
       } 
       if (transcript.toLowerCase().includes('unmute')) {
         unmuteAudio();
       }
       if (transcript.toLowerCase().includes('stop song')) {
         stop_play();
       }
       if (result.play !== null) {
         try {
           var response = await fetch(searchUrl + result.play);
           var jsonResponse = await response.json();
           ag_play(jsonResponse[0].media_url);
           
           
         } catch(error) {
           console.log(error);
         }
       }
       if (result.volume !== null) {
         setVolume(result.volume);
       }
     }
  })
  .catch(error => {
       console.error('Error:', error);
  });
 }
 

function stopRecording() {
  if (isRecording) {
      recorder.stop();
      isRecording = false;
  }
}

async function muteAudio() {
  
  localTracks.audioTrack.setMuted(true);
  
}


async function unmuteAudio() {
  
  localTracks.audioTrack.setMuted(false);

}

// calculate the MM:SS format from millisecond
function toMMSS(second) {
  // const second = millisecond / 1000;
  let MM = parseInt(second / 60);
  let SS = parseInt(second % 60);
  MM = MM < 10 ? "0" + MM : MM;
  SS = SS < 10 ? "0" + SS : SS;
  return `${MM}:${SS}`;
}
