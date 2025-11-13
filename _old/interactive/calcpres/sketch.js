
"use strict"; 

let alpha = 20;
let beta = 40;

let aSlider, bSlider;

/**
* setup :
*/
function setup() {
    var cnv = createCanvas(windowWidth, windowHeight - 4);

    aSlider = createSlider(0, 90, 40);

    bSlider = createSlider(0, 90, 20);

    background(255);
    textFont('Times New Roman', 32);
    smooth(16);
}

/**
* draw :
*/
function draw() {
    background(255);

    aSlider.position(width/2 - 270, height/2 + 15);
    bSlider.position(width/2 + 140, height/2 + 15);

    translate(width/2, height/2);
    fill(0);
    let cubedown = 50;
    rect(-50, cubedown, 100, 100);
    fill(255);
    textAlign(CENTER, CENTER);
    text("100", 0, cubedown + 50);
    strokeWeight(2);
    line(0, 0, 0, cubedown);
    let lineup = 200;
    fill(0);
    rect(-width/2, -lineup - 1000, width+10, 1000);

    alpha = aSlider.value();
    beta = bSlider.value();

    angleMode(DEGREES);
    let F1 = createVector(-cos(alpha), -sin(alpha));
    let F2 = createVector(cos(beta), -sin(beta));
    let w = 190;
    let mult1 = w*cos(beta)/sin(alpha + beta);
    let mult2 = w*cos(alpha)/sin(alpha + beta);

    line(0, 0, F1.x*1000, F1.y*1000);
    line(0, 0, F2.x*1000, F2.y*1000);

    F1.mult(mult1);
    F2.mult(mult2);

    let zero = createVector(0, 0);
    noFill();
    stroke(color(224, 75, 34));
    arc(0, 0, 100, 100, 180, 180+alpha);
    line(0, 0, F1.x, 0);
    line(F1.x, 0, F1.x, F1.y);
    noStroke();
    fill(224, 75, 34);
    text("F1", F1.x + 50, F1.y);
    noFill();

    stroke(color(46, 209, 206));
    arc(0, 0, 100, 100, -beta, 0);
    line(0, 0, F2.x, 0);
    line(F2.x, 0, F2.x, F2.y);
    noStroke();
    fill(46, 209, 206);
    text("F2", F2.x - 50, F2.y);
    
    stroke(0);

    drawArrow(zero, F1, color(224, 75, 34));
    drawArrow(zero, F2, color(46, 209, 206));

    drawArrow(zero, p5.Vector.add(F1, F2), color(235, 168, 52));

    noStroke();
    fill(color(224, 75, 34));
    textAlign(RIGHT, TOP);
    text("α: " + alpha + "°", -40, 10);
    textAlign(LEFT, TOP);
    fill(color(46, 209, 206));
    text("β: " + beta + "°", 40, 10);

    strokeWeight(1);
    stroke(0);

    fill(color(235, 168, 52));
    textAlign(CENTER, TOP);
    text("F1 + F2", 0, F1.y + F2.y - 50);
    textAlign(LEFT, TOP)

    fill(0);
    text("|F1| = " + mult1.toFixed(2), -400, 100);
    text("|F2| = " + mult2.toFixed(2), -400, 150);
    text("α + β = " + (alpha + beta).toFixed(2), -400, 200);
    text("cos(α + β) = " + (cos(alpha + beta)).toFixed(3), -400, 250);
}

function drawArrow(base, vec, myColor) {
    push();
    stroke(myColor);
    strokeWeight(3);
    fill(myColor);
    translate(base.x, base.y);
    line(0, 0, vec.x, vec.y);
    rotate(vec.heading());
    let arrowSize = 18;
    translate(vec.mag() - arrowSize, 0);
    triangle(0, arrowSize / 2, 0, -arrowSize / 2, arrowSize, 0);
    pop();
  }