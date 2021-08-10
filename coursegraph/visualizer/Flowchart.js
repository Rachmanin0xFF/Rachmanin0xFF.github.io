
"use strict";

var nodeInstances = {};
var avoiderz = [];

class LogicNode {
    constructor(statement, operator) {
        this.course_id = statement;
        this.operator = operator;

        this.connected_to = [];
        this.type = 'NO TYPE???';
        this.name = 'LOGIC NODE'
        this.met = false;
        this.is_semester = false;

        this.r = {x: random(10), y: random(10)};
        this.v = {x: 0.0, y: 0.0};
        this.F = {x: 0.0, y: 0.0};
    }

    drawGraph(NL, x, y) {
        stroke(0);
        noFill();

        this.met = (this.operator == 'AND');
        for(let i = 0; i < this.connected_to.length; i++) {
            if(this.operator == 'OR')
                this.met |= NL[this.connected_to[i]].met;
            else
                this.met &= NL[this.connected_to[i]].met;
        }
            
        bezline(x, y, this.r.x, this.r.y, this.met);
        
        doSpring(this.r, {x: x, y: y}, this.F, 500);
        
        let xoff = 1;
        for(let i of this.connected_to) {
            if(NL[i].name == 'LOGIC NODE') {
                NL[i].drawGraph(NL, this.r.x, this.r.y);
            } else {
                if(NL[i].positions.length == 0) {
                    bezline(this.r.x, this.r.y, NL[i].r.x, NL[i].r.y, NL[i].met);
                    let dat = NL[i].display_sub(NL, NL[i].r.x, NL[i].r.y, this.course_id);

                    doSpring(NL[i].r, this.r, NL[i].F, 500, this.F);
                    //NL[i].r.x = this.r.x;// - (10 - dat.w)*xoff;
                    //NL[i].r.y = this.r.y;
                    xoff++;

                    rectMode(CORNER);
                    stroke(0);
                    noFill();

                    //this.F.x -= (this.r.x - NL[i].r.x)*0.1;
                    //this.F.y -= (this.r.y - NL[i].r.y)*0.1;

                    //NL[i].F.x += (this.r.x - NL[i].r.x)*0.1;
                    //NL[i].F.y += (this.r.y - NL[i].r.y)*0.1;
                } else {
                    for(let p of NL[i].positions) {
                        NL[i].frontdraws.push({x: p.x, y: p.y, big: p.big});
                        bezline(this.r.x, this.r.y, p.x, p.y, NL[i].met);
                        doSpring(p, this.r, NL[i].F, 500, this.F);
                        //this.F.x -= (this.r.x - p.x)*0.1;
                        //this.F.y -= (this.r.y - p.y)*0.1;
                    }
                }
            }
        }
        if(this.met) stroke(80, 255, 120); else stroke(20, 20, 60);
        fill(245, 248, 249);
        rectMode(CENTER);
        rect(this.r.x, this.r.y, 50, 40, 5);
        rectMode(CORNER);
        textAlign(CENTER, CENTER);
        noStroke();
        if(this.met) fill(80, 255, 120); else fill(20, 20, 60);
        textSize(18);
        textStyle(BOLD);
        text(this.operator, this.r.x, this.r.y);
        textAlign(LEFT, TOP);
        avoiderz.push({x: this.r.x, y: this.r.y, a: 1.0, id: this.course_id});
        this.anyvis = true;
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
                let fx = (this.r.x - v.x)*40000000.0*v.a/(dsq*dsq);
                let fy = (this.r.y - v.y)*40000000.0*v.a/(dsq*dsq);

                this.F.x += fx;
                this.F.y += fy;

                if(DEBUG_PHYS) line(this.r.x, this.r.y, this.r.x + fx*5, this.r.y + fy*5);
            }
        }
        this.v.x += this.F.x; this.v.y += this.F.y;
        this.F.x = 0.0; this.F.y = 0.0;
        this.r.x += this.v.x; this.r.y += this.v.y;
        this.v.x *= globalDamping; this.v.y *= globalDamping;
    }

    displayPoint(NL) {
        ellipse(this.r.x, this.r.y, 10, 10);
        avoiderz.push({x: this.r.x, y: this.r.y, a: 1.0, id: this.course_id});
        noStroke();
        fill(0);
        if(dist(mouse.x, mouse.y, this.r.x, this.r.y) < 10) {
            text(this.course_id, this.r.x, this.r.y);
            for(let i = 0; i < this.connected_to.length; i++) {
                text(NL[this.connected_to[i]].name, this.r.x, this.r.y + (i+1)*40);
            }
        }
        stroke(0);
        noFill();
        strokeWeight(1);
        for(let i of this.connected_to) {
            if(NL[i].name == 'LOGIC NODE') {
                bezline(this.r.x, this.r.y, NL[i].r.x, NL[i].r.y);
                //this.F.x -= (this.r.x - NL[i].r.x)*0.1;
                //this.F.y -= (this.r.y - NL[i].r.y)*0.1;
            } else {
                if(NL[i].positions.length == 0) {
                    //NL[i].x += (this.r.x - NL[i].x)*0.1;
                    //NL[i].y += (this.r.y - NL[i].y)*0.1;

                    NL[i].display_sub(NL, NL[i].x, NL[i].y, true);
                    noFill();
                    strokeWeight(1);
                    stroke(0);
                } else {
                    for(let p of NL[i].positions) {
                        bezline(p.x + p.w, p.y + p.h, this.r.x, this.r.y);
                        //this.F.x -= (this.r.x - p.x + p.w)*0.01;
                        //this.F.y -= (this.r.y - p.y + p.h)*0.01;
                    }
                }
            }
        }
        this.anyvis = true;
    }

    displayParens(NL, rootName, y) {
        let a = this.display_sub(NL, 0, y, rootName);
        noStroke();
        fill(20, 20, 60);
        text(rootName, 0, y - a.h/2.0 - 40);
        return a.maxH;
    }

    clear_pos() {
        this.positions = [];
    }
    display_sub(NL, x, y, reqid) {
        strokeWeight(1);
        this.met = (this.operator == 'AND');
        for(let i = 0; i < this.connected_to.length; i++) {
            if(this.operator == 'OR')
                this.met |= NL[this.connected_to[i]].met;
            else
                this.met &= NL[this.connected_to[i]].met;
        }

        let totalW = 0.0;
        let subH = 0.0;
        let mxh = 0.0;
        for(let i = 0; i < this.connected_to.length; i++) {
            let crs = NL[this.connected_to[i]].display_sub(NL, x + totalW + 25, y, reqid);
            totalW += crs.w;
            subH = crs.h;
            mxh = max(mxh, crs.maxH);
            textSize(24);
            noStroke();
            textAlign(CENTER);
            textStyle(BOLD);
            fill(20, 20, 60);
            if(i < this.connected_to.length-1) {
                if(this.operator == 'OR') fill(255, 100, 180);
                else fill(100, 180, 255);
                text(this.operator, x + totalW - 35, y);
            }
            textStyle(NORMAL);
            textAlign(LEFT, TOP);
        }
        noFill();
        stroke(20, 20, 60);
        //if(this.operator == 'OR') fill(255, 0, 0, 10);
        //if(this.operator == 'AND') fill(0, 255, 0, 10);
        if(this.met) {
            stroke(80, 255, 120);
            strokeWeight(4);
        } else strokeWeight(1);
        rect(x, y - 25 - subH/2, totalW - 60, subH + mxh, 10);
        
        let bw = totalW - 60;
        let bh = subH + mxh;

        strokeWeight(3);
        push();
        translate(x + totalW - 85, y - 25 - subH/2 + subH + mxh - 25);
        if(this.met) {
            stroke(80, 255, 120);
            line(15, 0, 7.5, 15);
            line(0, 7.5, 7.5, 15);
        } else {
            stroke(255, 120, 80);
            line(5, 5, 15, 15);
            line(15, 5, 5, 15);
        }
        pop();
        return {w: totalW + 50, h: subH + 50, maxH: mxh};
    }
}

class Semester {
    constructor(met, credits, name, statement, id) {
        this.met = met;
        this.credits = credits;
        this.name = name;
        this.statement = statement;
        this.id = id;
        this.nodelist = [];
        this.logicNode = -1;
    }

    display(NL, y) {
        NL[this.logicNode].is_semester = true;
        return NL[this.logicNode].displayParens(NL, this.name, y);
    }
}

var escapeChars = { lt: '<', gt: '>', quot: '"', apos: "'", amp: '&' };

function rmTags(str) {
    const regex = /<[^>]*>/g;
    return str.replaceAll(regex, '');
}

function unescapeHTML(str) {//modified from underscore.string and string.js
    str = rmTags(str);
    const regex = /\&([^;]+);/g;
    return str.replaceAll(regex, function(entity, entityCode) {
        var match;

        if ( entityCode in escapeChars) {
            return escapeChars[entityCode];
        } else if ( match = entityCode.match(/^#x([\da-fA-F]+)$/)) {
            return String.fromCharCode(parseInt(match[1], 16));
        } else if ( match = entityCode.match(/^#(\d+)$/)) {
            return String.fromCharCode(~~match[1]);
        } else {
            return entity;
        }
    });
}
class Flowchart {
	constructor(path) {
		this.rawJSON = loadJSON(path);
	}
    init() {
        let nodemap = this.rawJSON['nodes'];
        let edgemap = this.rawJSON['edges'];
        let reqmap = this.rawJSON['requirements'];
        
        this.nodelist = []
        this.semesters = []
        for(let x in reqmap) {
            let r = reqmap[x];
            if(r['is semester']) {
                let s = new Semester(r['met'],
                                     r['credits'],
                                     r['req id'],
                                     r['statement'],
                                     r['semester id']);
                this.semesters.push(s);
            }
        }
        for(let x in nodemap) {
            let n = nodemap[x]
            if(n['is semester']) {

            } else if(n['is logic']) {
                let lo = new LogicNode(x, n['operator'])
                this.nodelist.push(lo);
            } else {
                let c = new Course(n['met'],
                                   n['name'],
                                   x,
                                   n['code'],
                                   n['num'],
                                   n['credits'],
                                   rmTags(unescapeHTML(n['description'])),
                                   n['tags'],
                                   n['semesters'],
                                   n['req ids'],
                                   n['color']);
                this.nodelist.push(c);
                for(let x of n['semesters']) {
                    if(x != -1) {
                        this.semesters[x].nodelist.push(this.nodelist.length-1);
                    }
                }
            }
        }
        for(let x in edgemap) {
            let a = edgemap[x]['start'];
            let b = edgemap[x]['end'];

            let iStartNode = this.nodelist.findIndex(x => x.course_id === a);
            let iEndNode = this.nodelist.findIndex(x => x.course_id === b);
            if(iStartNode === -1) {
                let iSemester = this.semesters.findIndex(x => x.name === a);
                if(iSemester != -1) {
                    this.semesters[iSemester].logicNode = iEndNode;
                }
            } else {
                let startNode = this.nodelist[iStartNode];
                let endNode = this.nodelist[iEndNode];
                if(startNode.name === 'LOGIC NODE') {
                    startNode.type = edgemap[x]['type'];
                    startNode.connected_to.push(iEndNode);
                } else {
                    switch(edgemap[x]['type']) {
                        case 'prerequisite':
                            startNode.prereqs.push(iEndNode);
                            break;
                        case 'corequisite':
                            startNode.coreqs.push(iEndNode);
                            break;
                        case 'complements':
                            startNode.complements.push(iEndNode);
                            break;
                    }
                }
            }
        }
    }

    display() {
        noStroke();
        textStyle(BOLD);
        fill(20, 20, 60);
        textSize(100);
        text('CAPP Report Visualizer', 0, -510);
        textSize(64);
        text('Semesters', 0, -180);
        let h = 0;

        for(let i = 0; i < this.semesters.length; i++) {
            h += this.semesters[i].display(this.nodelist, h) + 350;
        }

        for(let i = 0; i < this.nodelist.length; i++) {
            if(this.nodelist[i].name == 'LOGIC NODE') {
               // if(! this.nodelist[i].is_semester)
                    //this.nodelist[i].displayPoint(this.nodelist);
            } else
            this.nodelist[i].display_conns(this.nodelist);
        }

        stroke(0);
        strokeWeight(3);
        for(let i = 0; i < this.nodelist.length; i++) {
            /*if(this.nodelist[i].name == 'LOGIC NODE' && !this.nodelist[i].is_semester) {
                this.nodelist[i].doPhys();
            } else if(this.nodelist[i].name != 'LOGIC NODE' && this.nodelist[i].semesters.length === 0) {
                this.nodelist[i].doPhys();
            }*/
            if(this.nodelist[i].anyvis)
                this.nodelist[i].doPhys();
        }

        for(let i = 0; i < this.nodelist.length; i++) {
            if(this.nodelist[i].name != 'LOGIC NODE')
            this.nodelist[i].display_front();
        }
        for(let i = 0; i < this.nodelist.length; i++) {
            if(this.nodelist[i].name != 'LOGIC NODE') {
                this.nodelist[i].display_front(true);
                this.nodelist[i].frontdraws = [];
            }
        }
        for(let i = 0; i < this.nodelist.length; i++) this.nodelist[i].clear_pos();

        fill(20, 20, 60);
        noStroke();
        textStyle(NORMAL);
        textSize(24);
        text('By Adam Lastowka', 0, -480);
        translate(0, 0);
        text('Instructions:', 0, -420);
        textSize(18);
        push();
        text('Click and drag to move', 0, -380);
        text('Scroll to zoom', 0, -350);
        text('Click on a course to view info and prerequisites', 0, -320);
        pop();

        textSize(24);
        text('Disclaimer:', 0, -280);
        textSize(18);
        text('The following program may contain innacurate or incomplete data. Do not use as a reference.', 125, -276);
        avoiderz = [];
        globalDamping = 0.5;
        /*
        for(let i = 0; i < this.semesters.length; i++) {
            let s = this.semesters[i];
            for(let j = 0; j < s.nodelist.length; j++) {
                let n = this.nodelist[s.nodelist[j]];
                n.in_focus |= dist(n.lastx, n.lasty, mouse.x, mouse.y) < 50;
                n.disp_card(j*350, i*200);
            }
        }

        for(let i = 0; i < this.semesters.length; i++) {
            let s = this.semesters[i];
            for(let j = 0; j < s.nodelist.length; j++) {
                let n = this.nodelist[s.nodelist[j]];
                n.disp_stage2();
                n.in_focus = false;
            }
        }
        */

        /*
        // simple lines for debugging
        stroke(0);
        for(let j = 0; j < this.nodelist.length; j++) {
            let xa = this.nodelist[j].lastx;
            let ya = this.nodelist[j].lasty;
            if(this.nodelist[j].name != 'LOGIC NODE')
            for(let k = 0; k < this.nodelist[j].prereqs.length; k++) {
                if(this.nodelist[this.nodelist[j].prereqs[k]] != 'LOGIC NODE') {
                    let xb = this.nodelist[this.nodelist[j].prereqs[k]].lastx;
                    let yb = this.nodelist[this.nodelist[j].prereqs[k]].lasty;
                    line(xa, ya, xb, yb);
                }
            }
        }
        */
    }
    /*
    // Also for debugging
    displayCoursesRandom() {
        let z = 0;
        randomSeed(10);
        for(const x of this.courselist) {
            let xp = random(width);
            let yp = random(height);
            x.in_focus = dist(xp, yp, mouseX, mouseY) < 20;
            x.disp_card(xp, yp);
        }
        for(const x of this.courselist) {
            x.disp_stage2();
        }
    }
    */
}