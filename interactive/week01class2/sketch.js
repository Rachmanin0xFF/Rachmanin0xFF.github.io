/**
* Yourfirstand Lastname
* IGME-102: Assignment Name, m/d/19
* Summarization of sketch activity
*/ 

"use strict"; //catch some common coding errors

const NSPEED = 0.3;
const IVEL = 0.1;

class Particle {
    constructor(x, y, id) {
        this.respawn(x, y);
        this.id = id;
    }
    update(x, y) {
        this.radius /= 1.05;
        this.ppos = createVector(this.pos.x, this.pos.y);
        this.pos.add(this.vel);
        let nsamp = 10.0*noise(this.pos.x/50.0, this.pos.y/50.0, sin(frameCount/500.0)*5.0+this.id/100.0);
        this.vel.add(createVector(NSPEED*cos(nsamp), NSPEED*sin(nsamp)));
        if(this.radius < 0.1) this.respawn(x, y);
    }
    respawn(x, y) {
        this.pos = createVector(x, y);
        this.ppos = createVector(x, y);
        let theta = random(TWO_PI);
        let vel = random(IVEL);
        this.vel = createVector(cos(theta)*vel, sin(theta)*vel);
        this.radius = 100 + random(-50, 0);
    }
    display() {
        strokeWeight(this.radius*1.9);
        line(this.pos.x, this.pos.y, this.ppos.x, this.ppos.y);
    }
}

let pars = [];

/**
* setup :
*/
function setup() {
    var cnv = createCanvas(800, 800);
	cnv.parent("sketchcanvas");
    noSmooth();
    strokeCap(SQUARE);
}

/**
* draw :
*/
let pcount = 0;
function draw() {
    for(let i = 0; i < 10; i++)
    if(pars.length < 2000) {
        pars.push(new Particle(mouseX, mouseY, random(5, 20), pcount));
        pcount++;
    }
    fill(255, 70, 100, 100);
    noStroke();
    rect(-1, -1, width+1, height+1);
    stroke(255);
    for(let p of pars) {
        p.update(mouseX, mouseY);
        p.display();
    }
    
    noStroke();
    fill(255, 70, 100);
    ellipse(mouseX, mouseY, 200, 200);
    stroke(255);
    strokeWeight(1);
    ellipse(mouseX, mouseY, 100, 100);
}
