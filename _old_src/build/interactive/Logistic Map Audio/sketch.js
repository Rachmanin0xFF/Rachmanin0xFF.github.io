
const blob = new Blob(
    [`
    let x = 0.1;
    let k = 0;
        class MyProcessor extends AudioWorkletProcessor {
            static get parameterDescriptors() {
                return [
                  {name: 'r',
                   defaultValue: 3.7,
                   minValue: 0.0,
                   maxValue: 4.0}
                ];
            }
            constructor() {
                super();
                this.x = 0.1;
              }            
            process(inputs, outputs, parameters) {
                for (const output of outputs) {
                    for (const channelData of output) {
                        for (let i = 0; i < channelData.length; i += 1) {
                            channelData[i] = (this.x-0.5)*0.2;
                            this.x = (parameters['r'].length > 1? parameters['r'][i]:parameters['r'][0])*this.x*(1.0-this.x);
                            k++;
                        }
                    }
                }

                return true;
            }
        }

        registerProcessor('my-processor', MyProcessor);
    `],
    { type: 'application/javascript' }
);
const url = URL.createObjectURL(blob);
let workletNode;
let AudioContext = window.AudioContext || window.webkitAudioContext;
let audioContext;
let rParam;
let analyser;
let dataArray;

// Stereo
let channels = 2;

function init_audio_context() {
  audioContext = new AudioContext({sampleRate:4096});
}

async function init_audio() {
  if(!audioContext) {
    init_audio_context();
  }

  await audioContext.audioWorklet.addModule(url);
  workletNode = new AudioWorkletNode(audioContext, 'my-processor');
  rParam = workletNode.parameters.get('r');

  analyser = audioContext.createAnalyser();
  analyser.fftSize = 2048;
  analyser.smoothingTimeConstant = 0.9;
  let bufferLength = analyser.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength);
  analyser.getByteTimeDomainData(dataArray);
  workletNode.connect(analyser);
  workletNode.connect(audioContext.destination);
}

let r_val = 3.7;
function mousePressed() {
    if(mouseX > 0 && mouseY > 0 && mouseX < width && mouseY < height) {
        if(!audioContext) {
            init_audio();
            pg = createGraphics(width, height/2.0);
            pg.background(26, 27, 30);
            pg.smooth();
        } else {
            rParam.exponentialRampToValueAtTime(3 + mouseX / width, audioContext.currentTime + 0.5);
        }
    }
}

let myfont;

function preload() {
    myfont = loadFont('../../Logistic Map Audio/SpaceMono-Regular.otf');
}

let pg;
function setup() {
    var cnv = createCanvas(512, 512);
	cnv.parent("sketchcanvas");
    background(0);
    smooth();
    textFont(myfont);
    textSize(16);
}
let tot = 0;

function draw() {

    if(pg) {
        tot++;
        if(tot < 1000)
        for(kk = 0; kk < 20; kk++) {
            let rr = random(3, 4);
            let xx = random(1);
            pg.stroke(255, 10);
            for(let i = 0; i < 100; i++) {
                xx = xx*rr*(1-xx);
                if(i > 40)
                pg.point((rr - 3)*width, height/2.0-xx*height/2.0);
            }
        }
        image(pg, 0, 0, width, height/2);
    } else {
        fill(26, 27, 30);
        rect(0, 0, width, height);
    }
    let xbord = width/6.0;
    fill(26, 27, 30);
    rect(0, height/2, width, height/2);
    stroke(18, 231, 185);
    if(audioContext) {
        try {
            r_val = rParam.value;
            analyser.getByteFrequencyData(dataArray);
        } catch(error) {
            //ignore...
        }
    }
    r_screen_x = (r_val - 3)*width;
    line(r_screen_x, 0, r_screen_x, height/2);
    stroke(255, 255);
    let x = Math.random()*0.2 + 0.4;
    let px = x;
    for(let i = 0; i < 100; i++) {
        x = r_val*x*(1.0-x);
        yc = height/4.0*3.0-x*height/4.0;
        line(i/100.0*(width), yc, (i-1)/100.0*(width), height/4.0*3.0-px*height/4.0);
        px = x;
    }
    try {
        let max_dat = -1000000.0;
        for(let i = 0; i < dataArray.length; i++) {
            if(dataArray[i] > max_dat) max_dat = dataArray[i];
        }
        for(let i = 1; i < dataArray.length; i++) {
            line(map(i, 0, dataArray.length, xbord, width), map(dataArray[i], -5, max_dat, height, height - height/4), map(i-1, 0, dataArray.length, xbord, width), map(dataArray[i-1], -5, max_dat, height, height - height/4));
        }
    }catch(error) {
    }
    
    noStroke();
    fill(26, 27, 30);
    rect(0, 0, xbord, height);
    drawingContext.setLineDash([5, 5]);
    stroke(255, 100);
    strokeWeight(2);
    line(0, height/4.0*3.0, width, height/4.0*3.0);
    line(0, height/2.0, width, height/2.0);
    line(xbord, 0, xbord, height);
    drawingContext.setLineDash([]);
    strokeWeight(1);
    noStroke();
    fill(255);
    text("Bifurcation\nDiagram", 5, height/4);
    text("Raw Series", 5, height/8*5);
    text("Fourier\nTransform", 5, height/8*7);

    fill(18, 231, 185);
    text("r: " + nf(r_val, 1, 5), xbord + 5, height/2 - 10);
}