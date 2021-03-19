/**
* Adam Lastowka
* IGME-102: Assignment Name, m/d/19
* Summarization of sketch activity
*/ 

"use strict"; //catch some common coding errors

let noodle;

let myfont;

function preload() {
    myfont = loadFont('DK Lemon Yellow Sun.otf');
}

/**
* setup :
*/
function setup() {
    createCanvas(innerWidth, innerHeight);
    background(0);
    smooth();
    noodle = new Strand();
    background(255);
    textFont(myfont);
    textSize(30);
}

let cls = true;

let rad = 50.0;
let erad = 50.0;
let off = 0.0;
let off2 = 0.0;
let sp = 0.02;
let lotime = 0.0;

let aelph = 255.0;

let evcls = false;

let fadval = 1.5;
/**
* draw :
*/
function draw() {
    if(cls) background(255); else evcls = true;
    fill(255, 0, 100);
    noStroke();
    if(cls && !evcls) text("Press a key to toggle clearing", 20, 20);
    
    //for(let i = 0; i < 20; i++) {
    noodle.update();
    wiggleDraw(noodle.pts);
        lotime += 0.01;
    //}
    
    fill(255, 255.0*fadval*fadval);
    rect(width/2, height/2, width+2, height+2);
    fill(255, 0, 100, 255.0*fadval*fadval);
    textAlign(CENTER);
    noStroke();
    textSize(50);
    text("My friend the worm", width/2, height/2);
    textAlign(LEFT, TOP);
    textSize(30);
    
    if(fadval > 0.0)
    fadval -= millis()/300000.0;
    else fadval = 0.0;
    
}

function keyPressed() {
    background(255);
    cls = !cls;
}

function wiggleDraw(pts) {
    rectMode(CENTER);
    off = round(off2);
    strokeWeight(1);
    noStroke();
    let extra = 0;
    for(let j = 1; j < pts.length; j++) {
        let dir = createVector(pts[j].x - pts[j-1].x, pts[j].y - pts[j-1].y);
        let steps = dir.mag();
        dir.normalize();
        let r = createVector(pts[j-1].x, pts[j-1].y);
        let i = extra;
        for(i = 0; i < steps; i++) {
            fill(sin(off/200.0)*sin(off/200.0)*255.0, 255, 100, aelph);
            if(off%70==0) {
                stroke(255);
            }
            //if((-off)%40 > 20)
            rect(r.x, r.y, wfunc(), wfunc());
            
            if(off%70==0){
                stroke(sin(off/200.0)*sin(off/200.0)*255.0, 10, 100, aelph);
                noFill();
                rect(r.x, r.y, wfunc()*2.0, wfunc()*2.0);
            } else {
                if(j%10 == 0 && i < 5) {
                    stroke(sin(off/200.0)*sin(off/200.0)*255.0, 10, 100, aelph);
                    noFill();
                    rect(r.x, r.y, wfunc()*2.0, wfunc()*3.0);
                }
            }
            
            off++;
            r.add(dir);
        }
        extra = i-steps;
    }
    off2 -= noodle.d0;
    rad = noodle.d0 + 10.0;
    erad += 0.05*(rad - erad);
}

function wfunc() {
    return sin(off*sp)*sin(off*sp)*erad + erad*0.3;
}