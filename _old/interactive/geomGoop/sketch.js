/**
* Adam Lastowka
* IGME-102: Assignment Name, m/d/19
* Summarization of sketch activity
*/ 

"use strict"; //catch some common coding errors


const pars = [];

let emx = 0;
let emy = 0;

/**
* setup :
*/
function setup() {
    var cnv = createCanvas(windowWidth, windowHeight - 4, WEBGL);
    cnv.parent("sketchcanvas");
	
    background(0);
    for(let i = 0; i < 20; i++) {
        pars.push(randomInSphere());
    }
    normalize(pars);
    smooth(16);
}

/**
* draw :
*/
function draw() {
    push();
    
    rotateY(emx/100);
    rotateX(emy/100);
    
    fill(200, 200);
    background(0, 30, 50);
    stroke(0);
    if(mouseIsPressed) avoid(pars);
    normalize(pars);
	strokeWeight(5);
    stroke(0 + 40, 30 + 40, 50 + 40, 255);
    //stroke(0 + 200, 30 + 200, 50 + 200, 130);
    display(pars, windowHeight/3.0);
    displayClose(pars, windowHeight/3.0);
    
    noStroke();
    displayMesh(pars, windowHeight/3.0);
    
    pop();
    fill(0, 30, 50, 130);
    //box(width*2, height*2, 2);
    noStroke()
    translate(0, 0, -width);
    ellipse(0, 0, width*2, width*2);
    
    strokeWeight(1);
    noStroke();
    stroke(0 + 40, 30 + 40, 50 + 40, 10);
    noFill();
    //sphere(windowHeight/3.0);
    
    emx += 0.1*(mouseX-emx);
    emy += 0.1*(mouseY-emy);
}

function displayClose(arr, factor) {
    for(let i = 0; i < arr.length; i++) {
        let dpars = [];
        for(let j = 0; j < arr.length; j++) {
            dpars.push([p5.Vector.sub(arr[i], arr[j]).mag(), j]);
            dpars.sort(function(a, b){return a[0]-b[0]});
        }
        
        for(let j = 0; j < 3; j++) {
            connect(arr, i, dpars[j][1], factor);
        }
    }
}

function displayMesh(arr, factor) {
    let combinedEdgeList = new Set(); // edges for both directions, no copies
    for(let i = 0; i < arr.length; i++) {
        let dpars = [];
        for(let j = 0; j < arr.length; j++) {
            dpars.push([p5.Vector.sub(arr[i], arr[j]).mag(), j]);
            dpars.sort(function(a, b){return a[0]-b[0]}); // sort nodes by distance to node i
        }
        for(let j = 0; j < 4; j++) { // select closest four nodes to make edges with
            if(i!=dpars[j][1]) {
				// avoid copies by storing edge (i, j) as i*node_count + j (takes advantage of javascript Set functionality on primitives)
                combinedEdgeList.add(min(i, dpars[j][1]) * pars.length + max(i, dpars[j][1]));
            }
        }
    }
    let edges = []; // edges in clean format
    for(let i of combinedEdgeList.keys()) {
        edges.push([floor(i/pars.length), i%pars.length]); // unpack the index pairs from compacted edges (see above comment)
    }
	
	let sortedAdjMap = []; // array where the ith element is a list contiaining the indices of the nodes connected to the ith vertex, sorted radially
	
	for(let i = 0; i < arr.length; i++) {
		let adjToVert = []; // nodes adjecant to ith vertex
		for(let j = 0; j < edges.length; j++) {
			if(edges[j][0] === i) adjToVert.push(edges[j][1]);
			else if(edges[j][1] === i) adjToVert.push(edges[j][0]); // handle cases where node is first and second in edge (no copies in edges)
		}
		
		// sort edges by the angles they appear at on the sphere
		adjToVert.sort(function(a, b) {
						// I used display() and hyperedge() to debug this part
						
						// project a and b onto normal plane
						let normProjA = p5.Vector.mult(arr[i], p5.Vector.dot(arr[a], arr[i]));
						let normProjB = p5.Vector.mult(arr[i], p5.Vector.dot(arr[b], arr[i]));
						let flattenedA = p5.Vector.sub(arr[a], normProjA).normalize();
						let flattenedB = p5.Vector.sub(arr[b], normProjB).normalize();
						
						// get new basis vectors
						let up = p5.Vector.cross(arr[i], arr[(i+1)%arr.length]).normalize(); // avoid gimbal lock by ensuring vectors are diff (i+1 index)
						let right = p5.Vector.cross(up, arr[i]).normalize();
						
						// get a and b in basis coordinates
						let aProj = createVector(p5.Vector.dot(flattenedA, right), p5.Vector.dot(flattenedA, up));
						let bProj = createVector(p5.Vector.dot(flattenedB, right), p5.Vector.dot(flattenedB, up));
						
						// return difference in 2D angles in basis
						return atan2(aProj.y, aProj.x) - atan2(bProj.y, bProj.x);
						});
		sortedAdjMap.push(adjToVert);
	}
	
	// find faces on sphere from sorted edges (sorting is necessary)
	let polygons = [];
	let tempPolySort = [];
	for(let i = 0; i < arr.length; i++) {
		for(let deg1conn of sortedAdjMap[i]) {
			let tempGon = [i]; // start list with current vertex
			
			let cycleCount = 0;
			
			let cvertex = deg1conn; // current vertex
			let pvertex = i;        // previously visited vertex
			
			// loop 'till return to start
			while(cvertex != i) {
				let edgeIndexPrev = sortedAdjMap[cvertex].indexOf(pvertex);
				pvertex = cvertex;
				cvertex = sortedAdjMap[cvertex][(edgeIndexPrev+1)%sortedAdjMap[cvertex].length]; // jump to next vertex
				tempGon.push(pvertex);
			}
			
			let sortGon = tempGon.slice().sort(function(a, b){return a-b}); // temporary sorted out-of-order face for comparison in array
																			// possible TODO: do cyclic comparison so this sort isn't necessary
																			// (faces are pre-sorted automatically but shifted, take advantage of this)
			if(!hasFace(sortGon, tempPolySort)) {
				polygons.push(tempGon);
				tempPolySort.push(sortGon);
			}
		}
	}
	
	noStroke();
	randomSeed(3);
	for(let p of polygons) {
        let brigt = 255 - (p.length-1)*50;
		fill(brigt, brigt + 50, brigt + 30); // darker for negative space play
		if(brigt > 10) hyperedge(arr, p, factor);
	}
	
	return polygons;
}

function hasFace(face, polygons) {
	let output = false;
	for(let p of polygons) {
		output |= equivalent(p, face);
	}
	return output;
}

function equivalent(a, b) {
	if(a.length === b.length)
		for(let i = 0; i < a.length; i++) {
			if(a[i] != b[i]) return false;
		}
	else
		return false;
	return true;
}

function avoid(arr) {
    let temparr = [];
    for(let i = 0; i < arr.length; i++) {
        let tempadd = createVector();
        for(let j = 0; j < i; j++) {
            let delta = p5.Vector.sub(arr[i], arr[j]);
            let force = 0.008/delta.mag();
            delta.mult(force);
            arr[i].add(delta);
            arr[j].sub(delta);
        }
        temparr.push(tempadd);
    }
}

function avoid2(arr) {
    let temparr = [];
    for(let i = 0; i < arr.length; i++) {
        let tempadd = createVector();
        for(let j = 0; j < arr.length; j++) {
            if(i != j) {
                let delta = p5.Vector.sub(arr[i], arr[j]);
                let force = 2.5/(delta.mag());
                delta.mult(force);
                tempadd.add(delta);
            }
        }
        randomSeed(i + millis());
        temparr.push(tempadd);
    }
    for(let i = 0; i < arr.length; i++) {
        arr[i].add(temparr[i]);
    }
}

function normalize(arr) {
    for(let i = 0; i < arr.length; i++) {
        arr[i].normalize();
    }
}

function display(arr, factor) {
    for(let i = 0; i < arr.length; i++) {
        let v = p5.Vector.mult(arr[i], factor);
        point(v.x, v.y, v.z);
    }
}

function connect(arr, i, j, factor) {
    arcline(arr[i].x, arr[i].y, arr[i].z, arr[j].x, arr[j].y, arr[j].z, factor);
	//line(arr[i].x, arr[i].y, arr[i].z, arr[j].x, arr[j].y, arr[j].z);
}

function hyperedge(arr, list, factor) {
    beginShape();
    for(let i of list) {
        vertex(arr[i].x*factor, arr[i].y*factor, arr[i].z*factor);
    }
    endShape(CLOSE);
}

function randomInSphere() {
    let v = createVector(random(-1, 1), random(-1, 1), random(-1, 1));
    while(v.mag() > 1) v = createVector(random(-1, 1), random(-1, 1), random(-1, 1));
    return v;
}

// make a line on the surface of a sphere with radius [factor]
function arcline(x1, y1, z1, x2, y2, z2, factor) {
	let a = createVector(x1, y1, z1);
	let b = createVector(x2, y2, z2);
	for(let i = 0.0; i < 1.0; i+=1.0) {
		let v0 = p5.Vector.lerp(a, b, i);
		let v1 = p5.Vector.lerp(a, b, i+1.0);
		v0.normalize();
		v1.normalize();
		line(v0.x*factor, v0.y*factor, v0.z*factor, v1.x*factor, v1.y*factor, v1.z*factor);
	}
}