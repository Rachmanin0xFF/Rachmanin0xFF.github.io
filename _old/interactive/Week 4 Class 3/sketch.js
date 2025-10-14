/**
* Adam Lastowka
* IGME-101: Assignment Name, m/d/18
* Summarization of sketch activity
*/ 

"use strict";  //catch some common coding errors


function setup() {
    var cnv = createCanvas(windowWidth, windowHeight);
	cnv.parent("sketchcanvas");
    
    strokeWeight(10);
    stroke(0, 180);
    //ellipse(width/2, height/2, 250, 250);
    strokeWeight(0);
    colorMode(HSB);
}

let force = 10000.0;
function draw() {
    background(0);
    let zoomie = 150.0;
    
    blendMode(BLEND);
    
    let cenx = width/2;
    let ceny = height/2;
    stroke(frameCount/10.0 + 150, 200, 10, 4);
    strokeWeight(10);
    point(5, 5);
    strokeWeight(1);
    blendMode(ADD);
    for(let i = 0; i < 10000; i++) {
        let sc = 1.0/zoomie;
        
        let x = random(-zoomie/2, width + zoomie);
        let y = random(-zoomie/2, height + zoomie);
        
        let v = createVector(cenx - x, ceny - y);
        v.normalize();
        v.mult(-force/(10 + dist(cenx, ceny, x, y)));
        x += v.x;
        y += v.y*0.7;
        
        
        let xs = x*sc;
        let ys = y*sc;
        let n1 = noise(xs, ys)-0.5;
        let n2 = noise(10.25, ys)-0.5;
        
        x += n1*zoomie*2.0;
        y += n2*zoomie*2.0;
        
        v = createVector(cenx - x, ceny - y);
        v.normalize();
        v.mult(-force/(10 + dist(cenx, ceny, x, y)));
        x += v.x;
        y += v.y;
        
        force -= (frameCount*frameCount)/1000000000.0;
        if(force <= 0) noLoop();
        
        point(x, y);
    }
}

function keyPressed() {
    noLoop();
}
 