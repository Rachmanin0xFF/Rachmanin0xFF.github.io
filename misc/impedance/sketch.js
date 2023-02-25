
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
	
	let ZA = new Cpl(1, 1);
	let ZB = new Cpl(1, 2);
	let mat = [[c_zero(), ZA, ZB],
				[ZA, c_zero(), c_infty()],
				[ZB, c_infty(), c_zero()]]
	get_equivalent_impedance(mat, 1, 2).print_self();
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

	unset_canvas();
}

function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
 }