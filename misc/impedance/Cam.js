
"use strict";

// Short for "mouse input mode"
// Changes based on current "action" being done in editor
var MIM = "CCAM";
function keyTyped() {
    if(["n", "w", "r", "c", "l"].includes(key.toLowerCase())) {
        MIM = key.toUpperCase();
    }
}
function keyPressed() {
    if(keyCode == ESCAPE) MIM = "CCAM";
}

// Camera object for p5.js apps
// Be sure to load this script AFTER p5.js loads
// TODO: center zoom on mouse
// TODO: mobile support
var CCAM = {
    x : 30.0,
    y : 110.0,
    pmp : false,
    zoom : 1.0,
    update: function() {
        if(mouseIsPressed && MIM == "CCAM") {
            this.x += (mouseX - pmouseX)/this.zoom;
            this.y += (mouseY - pmouseY)/this.zoom;
        }
    },
    apply: function() {
        push();
        translate(width/2, height/2);
        scale(this.zoom);
        translate(this.x - width/2, this.y - height/2);
    },
    unapply: function() {
        pop();
    },
    screenToMouse: function(cnvx, cnvy) {
        return {x: (cnvx - width/2)/this.zoom - this.x + width/2,
                y: (cnvy - height/2)/this.zoom - this.y + height/2};
    },
    // returns the mousecoords, but snapped to the grid shown in drawGrid()
    screenToMouseSnap: function(cnvx, cnvy) {
        var spc = 100/(2 ** round(Math.log(this.zoom)/Math.log(2)));
        return {x: round(((cnvx - width/2)/this.zoom - this.x + width/2)/spc)*spc,
                y: round(((cnvy - height/2)/this.zoom - this.y + height/2)/spc)*spc};
    },
    drawGrid: function() {
        var spc = 100/(2 ** round(Math.log(this.zoom)/Math.log(2)));
        var r = 7/this.zoom;
        var LU = this.screenToMouse(0, 0);
        var RD = this.screenToMouse(width, height);
        stroke(60, 68, 81);
        strokeWeight(1/this.zoom);
        
        for(var x = round(LU.x/spc)*spc - spc; x < round(RD.x/spc)*spc + spc; x+= spc)
        for(var y = round(LU.y/spc)*spc - spc; y < round(RD.y/spc)*spc + spc; y+= spc) {
            line(x - r, y, x + r, y);
            line(x, y - r, x, y + r);
        }
        strokeWeight(1);
    }
}

function mouseWheel(event) {
    var k = event.delta;
    while(abs(k) > 0){
        if(k > 0) {
            CCAM.zoom /= 1.1;
            k -= 100;
        } else if(k < 0) {
            CCAM.zoom *= 1.1;
            k += 100;
        }
    }
}