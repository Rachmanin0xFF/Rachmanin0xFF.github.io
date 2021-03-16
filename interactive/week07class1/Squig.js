"use strict";

const SPRING_CONST = 0.005;

class Squig {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.pars = [];
        this.adjlist = [];
        this.adjlistc = [];
        for(let i = 0; i < 4000; i++) {
            let theta = random(TWO_PI);
            let r = sqrt(random(1))*width/2;
            
            this.pars.push({"x":sin(theta)*r, "y":cos(theta)*r, "xv":0, "yv":0, "conns":0, "hook":false});
        }
        for(let i = 0; i < 400000; i++) {
            let ida = floor(random(this.pars.length));
            let idb = floor(random(this.pars.length));
            while(ida == idb) {
                idb = floor(random(this.pars.length));
            }
            let targang = random(TWO_PI);
            let targdist = random(15, 25);
            let p1 = this.pars[ida];
            let p2 = this.pars[idb];
            let dist = (p2.x - p1.x)*(p2.x - p1.x) + (p2.y - p1.y)*(p2.y - p1.y);
            if(dist < 30*30) this.addconn([ida, idb, targdist, targang, ida*this.pars.length + idb]);
        }
    }
    addconn(args) {
        if(!this.adjlistc.includes(args[4]) && this.pars[args[0]].conns < 2 && this.pars[args[1]].conns < 2) {
            this.pars[args[0]].conns++;
            this.pars[args[1]].conns++;
            this.adjlist.push(args);
        }
    }
    move() {
        for(let i = 0; i < 200; i++)
        if(random(100) > 100 - frameCount/2) {
            let ida = floor(random(this.pars.length));
            let idb = floor(random(this.pars.length));
            let p1 = this.pars[ida];
            let p2 = this.pars[idb];
            let dist = (p2.x - p1.x)*(p2.x - p1.x) + (p2.y - p1.y)*(p2.y - p1.y);
            if(dist < 20*20)
            if(ida!= idb)
            this.addconn([ida, idb, 20, 0, ida*this.pars.length + idb]);
        }
        
        for(let i = this.adjlist.length-1; i >= 0; i--) {
            let p1 = this.pars[this.adjlist[i][0]];
            let p2 = this.pars[this.adjlist[i][1]];
            let dist2 = (p2.x - p1.x)*(p2.x - p1.x) + (p2.y - p1.y)*(p2.y - p1.y);
            if(dist2 - this.adjlist[i][2]*this.adjlist[i][2] > 100*100) {
                p1.conns--;
                p2.conns--;
                this.adjlist.splice(i, 1);
            }
        }
        for(let e of this.adjlist) {
            let p1 = this.pars[e[0]];
            let p2 = this.pars[e[1]];
            let dist = sqrt((p2.x - p1.x)*(p2.x - p1.x) + (p2.y - p1.y)*(p2.y - p1.y));
            let hooke = dist - e[2];
            let to2x = p2.x - p1.x;
            let to2y = p2.y - p1.y;
            p1.xv += to2x*hooke*SPRING_CONST;
            p1.yv += to2y*hooke*SPRING_CONST;
            p2.xv -= to2x*hooke*SPRING_CONST;
            p2.yv -= to2y*hooke*SPRING_CONST;
        }
        
        if(mouseIsPressed)
        for(let p of this.pars) {
            let tmx = mouseX - p.x - width/2;
            let tmy = mouseY - p.y - height/2;
            let dis = tmx*tmx + tmy*tmy + 50*50;
            
            dis /= 800.0;
            
            p.xv += (mouseX - pmouseX) / dis;
            p.yv += (mouseY - pmouseY) / dis;
        }
        
        if(keyIsPressed && key=='r')
        for(let p of this.pars) {
            let tmx = mouseX - p.x - width/2;
            let tmy = mouseY - p.y - height/2;
            let dis = tmx*tmx + tmy*tmy + 50*50;
            
            dis /= 2000.0;
            
            p.xv -= tmx / dis;
            p.yv -= tmy / dis;
        }
        
        for(let p of this.pars) {
            
            p.xv += noise(p.x/100.0, p.y/100.0, frameCount/100.0 + p.conns)-0.5;
            p.yv += noise(p.x/100.0 + 50.0 - p.conns, p.y/100.0, frameCount/100.0)-0.5;
            
            if(p.x < -width/2) {
                p.x = -width/2;
                p.xv = -p.xv;
            } else if(p.x > width/2) {
                p.x = width/2;
                p.xv = -p.xv;
            }
            
            if(p.y < -height/2) {
                p.y = -height/2;
                p.yv = -p.yv;
            } else if(p.y > height/2) {
                p.y = height/2;
                p.yv = -p.yv;
            }
            
            
            if(keyIsPressed && key=='g') {
                p.yv+= 1;
            }
            if(!p.hook) {
                p.x += p.xv;
                p.y += p.yv;
            }
            
            p.xv /= 1.1;
            p.yv /= 1.1;
        }
        
        let xsum = 0.0;
        let ysum = 0.0;
        for(let p of this.pars) {
            xsum += p.x;
            ysum += p.y;
        }
        xsum /= this.pars.length;
        ysum /= this.pars.length;
        for(let p of this.pars) {
            //p.x -= xsum;
            //p.y -= ysum;
        }
    }
    display() {
        push();
        translate(this.x, this.y);
        for(let p of this.pars) {
            //ellipse(p.x, p.y, 5, 5);
            //point(p.x, p.y);
        }
        for(let e of this.adjlist) {
            let p1 = this.pars[e[0]];
            let p2 = this.pars[e[1]];
            line(p1.x, p1.y, p2.x, p2.y);
        }
        pop();
        noStroke();
        text("EDGE COUNT: " + this.adjlist.length, 40, 40);
    }
}