/**
* Adam Lastowka
* IGME-102: Assignment Name, m/d/19
* Summarization of sketch activity
*/ 

"use strict"; //catch some common coding errors

class Strand {
    constructor() {
        this.pts = [];
        this.vels = [];
        this.spacing = 10;
        this.d0 = 0.0;
        this.px = 0;
        this.py = 0;
        for(let i = 0; i < 40; i++) {
            this.pts.push(createVector(width/2, height/2 + this.spacing*i));
            this.vels.push(createVector(0,0));
        }
    }
    update() {
        this.pts[0].x = noise(lotime)*2*width - width/2;
        this.pts[0].y = noise(lotime, 5.0)*2*height - height/2;
        if(mouseIsPressed)
        this.pts[0] = createVector(mouseX, mouseY);
        
        this.d0 = dist(this.pts[0].x, this.pts[0].y, this.px, this.py);
        this.px = this.pts[0].x;
        this.py = this.pts[0].y;
        
        for(let i = 1; i < this.pts.length; i++) {
            let cpoint = this.pts[i];
            let ppoint = this.pts[i-1];
            let dist = cpoint.dist(ppoint);
            let dispv = p5.Vector.sub(cpoint, ppoint);
            dispv.limit(this.spacing);
            dispv.mult(this.spacing - dist);
            this.vels[i].add(p5.Vector.mult(dispv, 0.6));
            this.vels[i].mult(0.1);
        }
        for(let i = 1; i < this.pts.length; i++) {
            this.pts[i].add(this.vels[i]);
        }
    }
}

let noodle;

let myfont;

function preload() {
    myfont = loadFont('../../My Friend The Worm/DK Lemon Yellow Sun.otf');
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