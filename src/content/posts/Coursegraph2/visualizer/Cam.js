
"use strict";

var CCAM = {
    x : 100.0,
    y : 700.0,
    pmp : false,
    zoom : 1.0,
    update: function() {
        if(mouseIsPressed) {
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
    }
}

function mouseWheel(event) {
    let k = event.delta;
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