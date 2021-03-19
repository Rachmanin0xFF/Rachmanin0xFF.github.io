
class Strand {
    constructor() {
        this.pts = [];
        this.vels = [];
        this.spacing = 10;
        this.d0 = 0.0;
        this.px = 0;
        this.py = 0;
        for(let i = 0; i < 40; i++) {
            this.pts.push(createVector(width/2, height/2 + this.spacing*i));
            this.vels.push(createVector(0,0));
        }
    }
    update() {
        this.pts[0].x = noise(lotime)*2*width - width/2;
        this.pts[0].y = noise(lotime, 5.0)*2*height - height/2;
        if(mouseIsPressed)
        this.pts[0] = createVector(mouseX, mouseY);
        
        this.d0 = dist(this.pts[0].x, this.pts[0].y, this.px, this.py);
        this.px = this.pts[0].x;
        this.py = this.pts[0].y;
        
        for(let i = 1; i < this.pts.length; i++) {
            let cpoint = this.pts[i];
            let ppoint = this.pts[i-1];
            let dist = cpoint.dist(ppoint);
            let dispv = p5.Vector.sub(cpoint, ppoint);
            dispv.limit(this.spacing);
            dispv.mult(this.spacing - dist);
            this.vels[i].add(p5.Vector.mult(dispv, 0.6));
            this.vels[i].mult(0.1);
        }
        for(let i = 1; i < this.pts.length; i++) {
            this.pts[i].add(this.vels[i]);
        }
    }
}