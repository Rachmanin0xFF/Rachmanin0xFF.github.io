
"use strict";

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