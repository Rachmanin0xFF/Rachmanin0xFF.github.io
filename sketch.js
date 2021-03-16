/**
* Adam Lastowka
* IGME-102: Assignment Name, m/d/19
* Summarization of sketch activity
*/ 

"use strict"; //catch some common coding errors

let points = [];

let zob = null;
let zobdir = null;
let thata = 0.0;

const epsil = 0.01*8;

/**
* setup :
*/
function setup() {
    createCanvas(1000, 400);
    background(0);
    zob = createVector(width/2, height/2);
    zobdir = createVector(random(1), random(1));
    zobdir.normalize();
}

let gip = 0;

/**
* draw :
*/
function draw() {
    
    background(255);
    stroke(0);
    if(mouseIsPressed) fill(255); else noFill();
    
    if(points.length > 1)
    translate(-points[points.length-1].x + width/2, -points[points.length-1].y + height/2);
    
    let mstamp = millis();
    
    let focont = 0;
    
    beginShape();
    for(let i = 0; i < points.length; i++) {
        let dx = random(-0.5, 0.5);
        let dy = random(-0.5, 0.5);
        dx += sin(i/20.0 + mstamp/2000.0)*2.0;
        dy += cos(i/20.0 + mstamp/2000.0)*2.0;
        vertex(points[i].x + dx, points[i].y + dy);
        
        focont++;
    }
    for(let i = points.length-1; i >= 0; i--) {
        let dx = random(-0.5, 0.5);
        let dy = random(-0.5, 0.5);
        dx += -sin(i/20.0  + mstamp/2000.0)*2.0;
        dy += -cos(i/20.0  + mstamp/2000.0)*2.0;
        vertex(-points[i].x + points[points.length-1].x*2 - dx, -points[i].y  + points[points.length-1].y*2 - dy);
        
        focont++;
    }
    endShape();
    
    print("DONE");
    
    for(let j = 0; j < 2; j++) { 
        if(random(100) > 99) thata += random(PI/2 - epsil, PI/2 + epsil);
        if(gip < 0) {
            thata -= random(PI/2 - epsil, PI/2 + epsil);
            gip = pow(random(1), 8)*1000;
        }

        zobdir = createVector(cos(thata), sin(thata));
        zob.add(zobdir);
        
        thata += random(0.002);


        points.push(createVector(zob.x + random(-0.5, 0.5), zob.y + random(-0.5, 0.5)));

        if(points.length > 10000) points.shift(1);
        gip--;

    }
}

function keyPressed() {
    points = [points[points.length-1]];
}