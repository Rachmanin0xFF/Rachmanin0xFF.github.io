/**
* Adam Lastowka
* IGME-102: Assignment Name, m/d/19
* Summarization of sketch activity
*/ 

function setup() {
    var cnv = createCanvas(512, 512);
	cnv.parent("sketchcanvas");
    background(0);
    smooth();
}


let AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;

// Stereo
let channels = 2;

function init() {
  audioCtx = new AudioContext();
}

function mouseReleased() {
  if(!audioCtx) {
    init();
  }

  // Create an empty two second stereo buffer at the
  // sample rate of the AudioContext
  let total_samples = audioCtx.sampleRate * 1.0;

  let myArrayBuffer = audioCtx.createBuffer(channels, total_samples, audioCtx.sampleRate);

  // Fill the buffer with white noise;
  //just random values between -1.0 and 1.0
  for (let channel = 0; channel < channels; channel++) {
   // This gives us the actual array that contains the data
   let nowBuffering = myArrayBuffer.getChannelData(channel);
   for (let i = 0; i < total_samples; i++) {
     // Math.random() is in [0; 1.0]
     // audio needs to be in [-1.0; 1.0]
     nowBuffering[i] = Math.random() * 2 - 1;
   }
  }

  // Get an AudioBufferSourceNode.
  // This is the AudioNode to use when we want to play an AudioBuffer
  let source = audioCtx.createBufferSource();
  // set the buffer in the AudioBufferSourceNode
  source.buffer = myArrayBuffer;
  // connect the AudioBufferSourceNode to the
  // destination so we can hear the sound
  source.connect(audioCtx.destination);
  // start the source playing
  source.start();

  source.onended = () => {
    console.log('White noise finished');
  }
}