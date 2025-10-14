/**
* Yourfirstand Lastname
* IGME-102: Assignment Name, m/d/19
* Summarization of sketch activity
*/ 

"use strict"; //catch some common coding errors

/**
* setup :
*/
function setup() {
    var cnv = createCanvas(800, 800);
	cnv.parent("sketchcanvas");
    let nihilist = {
        falter: true,
        angle: 12.0,
        lumbar: "braniac",
        indent() {
            this.falter = false;
            this.angle++;
        }
    };
    console.log(nihilist);
    let l = new Lemon();
    console.log(l);
    delete nihilist.falter;
    console.log(nihilist);
}

class Lemon {
    constructor() {
        this.diameter = 4.0;
        this.heart = "golden";
    }
}

/**
* draw :
*/
let emx = 400.0;
let emy = 400.0;
let pemx = emx;
let pemy = emy;
function draw() {
    background(15);
    
    fill(255);
    noStroke();
    ellipse(emx, emy, 200, 200);
    stroke(255);
    strokeWeight(20);
    strokeCap(SQUARE);
    line(emx*2, emy, width, emy);
    line(0, emy, emx*2 - width, emy);
    
    line(emx*2, emy-10, emx*2, height);
    line(emx*2-width, emy+10, emx*2 - width, 0);
    
    fill(15);
    noStroke();
    ellipse(emx, emy, 100, 100);
    
    stroke(15);
    strokeWeight(40);
    line(emx*3.0 - width, 0, emx*3.0 - width, height);
    stroke(255);
    strokeWeight(20);
    line(emx*3.0 - width, 0, emx*3.0 - width, height);
    
    //line(emx*3.0 - width, 0, emx*3.0 - width, height);
    
    //line(width, emy*3.0 - height, emx*3.0 - width + 20, emy*3.0 - height);
    //line(0, emy*3.0 - height, emx*3.0 - width - 20, emy*3.0 - height);
    //line(width, emy*3.0 - height, 0, emy*3.0 - height);
    
    strokeWeight(1);
    stroke(255);
    let nsc = 70.0;
    randomSeed(3);
    for(let i = 0; i < 70; i++) {
        let x = random(width);
        let y = random(height);
        for(let j = 0; j < 100; j++) {
            let n1 = noise((x + emx/10.0)/nsc, (y + emy/10.0)/nsc)-0.5;
            let n2 = noise((x - emx/10.0 + width)/nsc, (y - emy/10.0)/nsc)-0.5;
            point(x, y);
            x += n1*20.0;
            y += n2*20.0;
        }
    }
    
    pemx = emx;
    pemy = emy;
    emx -= 0.1*(emx-mouseX);
    emy -= 0.1*(emy-mouseY);
}