"use strict";

var PMX = 0;
var PMY = 0;
var MOUSE_WAS_TAPPED = false
var DEBUG_PHYS = false;
var globalDamping = 1.0;
function mousePressed() {
    PMX = mouseX;
    PMY = mouseY;
    globalDamping = 1.0;
}
function mouseReleased() {
    if(PMX == mouseX && PMY == mouseY) MOUSE_WAS_TAPPED = true;
}
function luma(col) {
    return red(col)*0.2126 + green(col)*0.7152 + blue(col)*0.0722;
}
let do_gray = false;
function bezline(x, y, x2, y2, met=false) {
    let r = max(abs(x - x2), abs(y - y2))*0.5;
    /*
    if(abs(x2 - x) > abs(y2 - y)) {
        r *= (x > x2 ? -1.0 : 1.0);
        bezier(x, y, x + r, y, x2 - r, y2, x2, y2);
    } else {
        r *= (y > y2 ? -1.0 : 1.0);
        bezier(x, y, x, y + r, x2, y2 - r, x2, y2);
    }*/
    r *= (x > x2 ? -1.0 : 1.0);
    if(met) stroke(45, 180, 80); else stroke(20, 20, 60);
    bezier(x, y, x + r, y, x2 - r, y2, x2, y2);
    let r2 = -(x > x2 ? -1.0 : 1.0)*55

    noStroke();
    if(met) fill(45, 180, 80); else fill(20, 20, 60);
    let steps = 8;
    let arw = 10;
    for (let i = 0; i <= steps; i++) {
        let t = i / steps;
        let xc = bezierPoint(x, x + r, x2 - r, x2, t);
        let yc = bezierPoint(y, y, y2, y2, t);
        let xt = bezierTangent(x, x + r, x2 - r, x2, t);
        let yt = bezierTangent(y, y, y2, y2, t);
        let a = atan2(yt, xt);
        a += PI;
        print
        triangle(xc + cos(a)*arw, yc + sin(a)*arw,
                xc + cos(a+1.571)*arw, yc + sin(a+1.571)*arw,
                xc + cos(a-1.571)*arw, yc + sin(a-1.571)*arw);
    }
    stroke(20, 20, 60);
    noFill();
}

function doSpring(pos, target, force, lg, force2={}) {
    let toSource = createVector(target.x - pos.x, target.y - pos.y);
    let power = Math.sign(toSource.mag() - lg)*abs(toSource.mag() - lg);
    toSource.normalize();
    force.x += toSource.x*power;
    force.y += toSource.y*power;
    force2.x -= toSource.x*power*0.1;
    force2.y -= toSource.y*power*0.1;
}

class Course {
    constructor(is_met, name, cid, dept, num, credits, desc, tags, semesters, reqs, col) {
        this.met = is_met;
        this.name = name;
        this.course_id = cid;
        this.dept = dept;
        this.num = num;
        this.credits = credits;
        this.description = desc.replace(/<[^<]+?>/, '');
        this.tags = tags;
        this.semesters = semesters;
        this.req_ids = reqs;

        this.prereqs = [];
        this.coreqs = [];
        this.complements = [];

        this.box_width = 240;
        this.box_height = 105;
        this.big_width = 600;
        this.big_height = 350;

        this.bkg_col = col;
        colorMode(HSB, 255);
        this.bkg_col = color(hue(this.bkg_col), saturation(this.bkg_col), 128 + 0.5*brightness(this.bkg_col));
        colorMode(RGB, 255);
        this.bkg_white = color(255, 255, 255);
        this.fg_col = color(20, 20, 60);
        this.muted_col = color(120, 120, 120);

        this.r = {x: 100 + random(-10, 10), y: -500 + random(-10, 10)};
        this.v = {x: 0, y: 0};
        this.F = {x: 0, y: 0};

        this.positions = [];
        this.anybig = false;
        this.anyvis = false;
        this.noAvoid = false;

        this.frontdraws = [];

        this.cut_name = this.name.slice();
        textSize(16);
        textStyle(BOLD);
        if(textWidth(this.cut_name) > this.box_width - 10) {
            while(textWidth(this.cut_name) > this.box_width - 30) {
                this.cut_name = this.cut_name.slice(0, -1);
            }
            this.cut_name += '...';
        }
    }

    clear_pos() {
        this.positions = [];
        MOUSE_WAS_TAPPED = false;
        this.anybig = false;
        this.anyvis = false;
    }

    doPhys() {
        if(DEBUG_PHYS) {
            stroke(255, 0, 0);
            line(this.r.x, this.r.y, this.r.x + this.F.x*5, this.r.y + this.F.y*5);
            stroke(0, 0, 255);
        }
        for(let v of avoiderz) {
            let dsq = 4000 + (v.x - this.r.x)*(v.x - this.r.x) + (v.y - this.r.y)*(v.y - this.r.y);
            if(dsq < 1000*1000 && v.id != this.course_id) {
                let fx = (this.r.x - v.x)*100000000.0*v.a/(dsq*dsq);
                let fy = (this.r.y - v.y)*100000000.0*v.a/(dsq*dsq);
                this.F.x += fx;
                this.F.y += fy;

                if(DEBUG_PHYS) line(this.r.x, this.r.y, this.r.x + fx*5, this.r.y + fy*5);
            }
        }
        this.v.x += this.F.x*0.5; this.v.y += this.F.y*0.5;
        this.F.x = 0.0; this.F.y = 0.0;
        this.r.x += this.v.x*0.5; this.r.y += this.v.y*0.5;
        this.v.x *= globalDamping; this.v.y *= globalDamping;

        stroke(0);
    }

    display_conns(NL) {
        noFill();
        stroke(0);
        strokeWeight(1);
        for(let p of this.positions) {
            if(p.big)
            for(let i of this.prereqs) {
                if(NL[i].name == 'LOGIC NODE') {
                    NL[i].drawGraph(NL, p.x, p.y);
                } else {
                    if(NL[i].semesters.length == 0) {
                        doSpring(NL[i].r, p, NL[i].F, 400, this.F);
                        let dat = NL[i].display_sub(NL, NL[i].r.x + 30, NL[i].r.y, this.course_id, true);
                        
                        rectMode(CORNER);
                        stroke(0);
                        noFill();
                        bezline(p.x, p.y - 15, NL[i].r.x + 30, NL[i].r.y, NL[i].met);
                    } else {
                        for(let q of NL[i].positions) {
                            bezline(p.x, p.y - 15, q.x + q.w, q.y + q.h - 30, NL[i].met);
                            NL[i].frontdraws.push({x: q.x, y: q.y, big: NL[i].anybig});
                        }
                    }
                }
            }
        }
        noStroke();
    }

    display_front(bigz=false) {
        for(let d of this.frontdraws) {
            translate(d.x, d.y - 25);
            if(d.big) this.disp_enlarged();
            else if(!bigz) this.disp_small();

            translate(-d.x, 25 - d.y);
        }
    }

    display_sub(NL, x, y, reqid, fdpush = false) {
        if(reqid + this.course_id in nodeInstances) {

        } else {
            nodeInstances[reqid + this.course_id] = {w: 0, h: 0, x: x, y: y, big: false};
        }
        let hh = this.box_height;
        let ww = this.box_width;
        translate(x, y - 25);
        
        if(nodeInstances[reqid + this.course_id].big) {
            this.disp_enlarged();
            hh = this.big_height;
            ww = this.big_width;
            this.anybig |= true;
        } else this.disp_small();

        if(this.semesters.length === 0 || fdpush || nodeInstances[reqid + this.course_id].big)
            this.frontdraws.push({x: x, y: y, big: nodeInstances[reqid + this.course_id].big});

        this.positions.push({x: x, y: y, h: hh, w: ww, big: nodeInstances[reqid + this.course_id].big});

        translate(-x, -y + 25);
        nodeInstances[reqid + this.course_id].w = ww;
        nodeInstances[reqid + this.course_id].h = hh;

        // use xor for toggle
        if(MOUSE_WAS_TAPPED)
            nodeInstances[reqid + this.course_id].big ^= mouse.x < x + ww && mouse.x > x && mouse.y < y-25 + hh && mouse.y > y-25;

        avoiderz.push({x: x + ww/2 - 25, y: y + hh/2 - 25, a: nodeInstances[reqid + this.course_id].big ? 7.0 : 1.0, id: this.course_id});
        return {w: ww + 120, h: 50, maxH: hh};
    }

    disp_small() {
        this.anyvis = true;
        fill(this.bkg_col);
        stroke(this.fg_col);
        if(this.met) {
            if(do_gray) stroke(luma(color(80, 255, 120))); else stroke(80, 255, 120);
            strokeWeight(8);
        }
        rect(0, 0, this.box_width, this.box_height, 5);
        strokeWeight(1);
        if(do_gray) fill(luma(this.bkg_col)); else
        fill(this.bkg_col);
        noStroke();
        rect(0, 0, this.box_width, 34, 5, 5, 0, 0);
        fill(this.bkg_white);
        rect(0, 34, this.box_width, this.box_height - 34, 0, 0, 5, 5);
        textAlign(CENTER, TOP);
        textSize(16);
        textStyle(BOLD);
        fill(this.fg_col);
        text(this.cut_name, this.box_width/2, 10);

        stroke(this.muted_col);
        line(0, 34, this.box_width, 34);
        noStroke();
        textAlign(LEFT, TOP);
        textStyle(NORMAL);
        fill(this.muted_col);
        text('Code: ' + this.course_id, 10, 45);
        textAlign(RIGHT, TOP);
        text(this.credits + (this.credits===1?' Credit':' Credits'), this.box_width - 10, 45);
        textAlign(LEFT, TOP);
        text(this.tags.length > 0 ? 'Tags: ' : 'Tags: --', 10, 75);
        let xp = textWidth('Tags: ') + 10;
        for(const t of this.tags) {
            fill(this.bkg_white);
            stroke(this.muted_col);
            rect(xp, 72, textWidth(t) + 10, 20, 4);
            noStroke();
            fill(this.muted_col);
            text(t, xp + 5, 75);
            xp += textWidth(t) + 15;
        }
        strokeWeight(3);
        if(this.met) {
            fill(80, 255, 120);
            translate(this.box_width - 25, this.box_height - 25);
            rect(0, 0, 20, 20, 5);
            stroke(this.bkg_white);
            line(20, 0, 10, 20);
            line(0, 10, 10, 20);

            translate(-this.box_width + 25, -this.box_height + 25);
        } else {
            translate(this.box_width - 25, this.box_height - 25);
            stroke(255, 120, 80);
            line(5, 5, 15, 15);
            line(15, 5, 5, 15);

            translate(-this.box_width + 25, -this.box_height + 25);
        }
        strokeWeight(1);
    }
    disp_enlarged() {
        this.anyvis = true;
        push();
        fill(this.bkg_col);
        stroke(this.fg_col);
        if(this.met) {
            stroke(80, 255, 120);
            strokeWeight(8);
        }
        rect(0, 0, this.big_width, this.big_height, 10);
        strokeWeight(1);
        fill(this.bkg_col);
        noStroke();
        rect(0, 0, this.big_width, 50, 10, 10, 0, 0);

        noStroke();
        fill(this.bkg_white);
        rect(0, 50, this.big_width, this.big_height - 50, 0, 0, 10, 10);
        let ts = 24;
        textSize(24);
        textStyle(BOLD);
        while(textWidth(this.name) > this.big_width - 30) {
            ts--;
            textSize(ts);
        }
        textAlign(CENTER, TOP);
        fill(this.fg_col);
        noStroke();
        text(this.name, this.big_width/2, 15);

        stroke(this.muted_col);
        line(0, 50, this.big_width, 50);
        noStroke();
        textAlign(LEFT, TOP);
        textStyle(NORMAL);

        textSize(16);
        fill(this.muted_col);
        text('Course code: ' + this.course_id, 10, 65);
        text('Credits: ' + this.credits, 10, 90);
        text('Description: ', 10, 140);

        text(this.tags.length > 0 ? 'Tags: ' : 'Tags: --', 10, 115);
        strokeWeight(1);
        let xp = textWidth('Tags: ') + 10;
        for(const t of this.tags) {
            fill(this.bkg_white);
            stroke(this.muted_col);
            rect(xp, 112, textWidth(t) + 10, 20, 4);
            noStroke();
            fill(this.muted_col);
            text(t, xp + 5, 115);
            xp += textWidth(t) + 15;
        }

        textStyle(ITALIC);
        text(rmTags(this.description), 10, 165, this.big_width-40, 500);

        pop();
    }
}