
"use strict"; //catch some common coding errors

class Par {
    constructor(x, y, bond) {
        this.b = bond;
        this.x = x;
        this.y = y;
        this.px = x;
        this.py = y;
        this.h = random(360);
		this.q = 0;
    }
    disp() {
        colorMode(HSB);
        stroke(this.h%360, 50, abs(sin(this.h/200.0))*100*this.q);
        colorMode(RGB);
        line(this.px + width/2, this.py + height/2, this.x + width/2, this.y + height/2);
        //point(this.px + width/2, this.py + height/2);
        this.px = this.x;
        this.py = this.y;
		this.q += 0.005;
    }
    doKill() {
        return (this.x*this.x + this.y*this.y) > this.b*this.b;
    }
    runAway(x, y) {
        if(!(x === this.x && y === this.y)) {
            let diff = createVector(this.x - x, this.y - y);
            if(diff.x*diff.x + diff.y*diff.y < 200*200) {
                let pow = 10000.0/(diff.mag()*diff.mag() + 1000.0);
                diff = diff.normalize();
                diff.mult(pow);
                this.x += diff.x;
                this.y += diff.y;
            }
        }
    }
    cloon() {
        let theta = random(TWO_PI);
        let p = new Par(this.x + cos(theta), this.y + sin(theta), this.b);
        p.h = this.h + random(-5, 10)*3.0;
        return p;
    }
}