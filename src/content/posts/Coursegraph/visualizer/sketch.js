
// @author Adam Lastowka
// This is probably the messiest code I have ever written, and that's saying something.
// So many edge cases, weird formatting rules, junk code...
// Very few comments, too. Good luck understanding this.

"use strict";

let flo;
var mouse;

function preload() {
    flo = new Flowchart('mynetwork.json')
}

function setup() {
	flo.init();
	createCanvas(windowWidth, windowHeight);
	document.body.style.overflow = 'hidden'
}

function drawGrid() {
	let spc = 100/(2 ** round(Math.log(CCAM.zoom)/Math.log(2)));
	let r = 7/CCAM.zoom;
	let LU = CCAM.screenToMouse(0, 0);
	let RD = CCAM.screenToMouse(width, height);
	stroke(200);
	strokeWeight(1/CCAM.zoom);
	
	for(let x = round(LU.x/spc)*spc - spc; x < round(RD.x/spc)*spc + spc; x+= spc)
	for(let y = round(LU.y/spc)*spc - spc; y < round(RD.y/spc)*spc + spc; y+= spc) {
		line(x - r, y, x + r, y);
		line(x, y - r, x, y + r);
	}
	strokeWeight(1);
}

function draw() {
	mouse = CCAM.screenToMouse(mouseX, mouseY);
	CCAM.update();
	CCAM.apply();

	textFont('Atkinson Hyperlegible');
	background(245, 248, 249);
	drawGrid();

	flo.display();
	CCAM.unapply();

}

function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
 }