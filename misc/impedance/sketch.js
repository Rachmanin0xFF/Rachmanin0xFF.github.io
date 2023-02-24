
"use strict";

var mouse;
var mynetwork;
var electron;

function preload() {
}

function setup() {
	createCanvas(windowWidth, windowHeight);
	document.body.style.overflow = 'hidden';
	mynetwork = new Network();
	electron = color(244, 225, 117);
}

function set_canvas() {
	mouse = CCAM.screenToMouseSnap(mouseX, mouseY);
	CCAM.update();
	CCAM.apply();

	textFont('Atkinson Hyperlegible');
	background(40, 45, 49);
	CCAM.drawGrid();
	fill(electron);
	noStroke();
	textSize(100);
	text("Impedance Calculator", 0, 0);
	textSize(32);
	text("By Adam Lastowka", 0, 70);
}

function unset_canvas() {
	CCAM.unapply();
}

function draw() {
	set_canvas();
	
	mynetwork.update();
	mynetwork.display();

	if(mouseIsPressed) {
		print(mynetwork.get_graph(7.0));
	}

	unset_canvas();
}



function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
 }