/**
* Yourfirstand Lastname
* IGME-102: Assignment Name, m/d/19
* Summarization of sketch activity
*/ 

"use strict"; //catch some common coding errors

/**
* setup :
*/

let eased = 100.0;

let presents;
function setup() {
    var cnv = createCanvas(windowWidth, windowHeight - 4);
	cnv.parent("sketchcanvas");
    presents = new Set();
    presents.add("laundry");
    presents.add("desalinated seawater");
    presents.add("dead rats");
    presents.add("borax");
    presents.add("isolated HPV-1 strain 77");
    presents.add("expired passport");
    presents.add("witness protection program");
    for(let item of presents)
            console.log(item);
}

function zip() {
    presents.add(round(random(200))/5);
    presents.delete(round(random(200))/5);
}

/**
* draw :
*/
function draw() {
    //background(15);
    strokeWeight(5);
    background(255);
    let count = 0;
    textSize(40);
    fill(200);
    text("GIFTS:", 102, 62 + 40);
    fill(0);
    text("GIFTS:", 100, 60 + 40);
    textSize(20);
    for(let item of presents.values()) {
        text(item, 100, 100 + count*30 + 40);
        count++;
    }
    for(let i = 0; i < 100; i++) zip();
    
    eased -= 0.0001*(eased - (presents.size-7));
    text(eased, 400, 100);
    
    stroke(10, 200, 255);
    line(80, 70, 80, 2000);
    noStroke();
}

function mousePressed() {
    zip();
}
 