
/**
 * Cell: A class for project 4
 * Currently has a canvas it can draw to (fixed size so I don't create too many webGL instances) that displays one of six different 'scenes'
 * Also, not sure why, but some part of all of this seems to slow down significantly if it runs too long (memory leak?). I don't know enough about javascript to easily diagnosis it right now, if you've got any insight on this I'd appreciate it.
 * @author Adam Lastowka
 */
class Cell {
    /**
     * constructor: constructs
     * @param xpos the x-position of the cell
     * @param ypos the y-position of the cell
     * @param w the width of the cell
     * @param h the height of the cell
     */
    constructor(xpos, ypos, w, h) {
        this.position = createVector(xpos, ypos);
        this.setSize(w, h); // better to call this here than write it out again
        
        colorMode(HSB);
        this.col = color(random(90, 220) - xpos/8.0, 200, 70);
        colorMode(RGB);
        this.col = color(red(this.col), green(this.col), blue(this.col) + 30); // extra blue!
        
        this.state = 0; // Holds the state of the cell, possible states are as follows:
                        // 0 - Torus and two spheres, slider controls sphere separation
                        // 1 - Number and grid of circles, slider controls time offset of noise controlling number/circles
                        // 2 - Bouncing balls, slider controls number of balls
                        // 3 - Two rectangles that point at mouse, slider controls rectangle width
                        // 4 - Spinning rectangle depth illusion, slider controsl rectangle size
                        // 5 - Rotating circle with dual arcs, slider controls arc width
                        // 6 - Mouse drag-controlled Peter de Jong attractor, slider controls variables in attractor
        
        // weirdly lazy way of randomly selecting from a set of values (equal chance of this.state being set to each number)
        if(random(2)>1) this.state = 1;
        if(random(3)>2) this.state = 2;
        if(random(4)>3) this.state = 3;
        if(random(5)>4) this.state = 4;
        if(random(6)>5) this.state = 5;
        if(random(7)>6) this.state = 6;
        
        this.sp = random(1.0, 3.0); // animation speed multiplier, also just used as a number to make the cell unique in other situations
        
        // state 6 stuff
        this.s6a = 1.5; // attractor a and b variables (need to save these since they depend on mouse dragging)
        this.s6b = 1.5;
        this.s6prevpos = []; // array of previous points attractor had (used to make slower-moving points bigger)
        for(let i = 0; i < 200; i++) this.s6prevpos.push([0, 0]); // add 200 empty values (change number here to change point count)
        
        this.s2balls = []; // state 2 ball array
        
        switch(this.state) {
            case 0:
                // torus needs WebGL to run 3D
                this.screen = createGraphics(300, 300, WEBGL); // 3D!
                break;
            case 2:
                // add a few balls to the ball arrays
                for(let i = 0; i < 20; i++) {
                    this.s2balls[i] = new Ball(random(300), random(300), random(40));
                }
                // no break so we still create the canvas
            default:
                // Yes, it's way bigger than it needs to be. I'll just pretend like it's multisampling and not fix it...
                this.screen = createGraphics(300, 300);
                break;
        }
        
        this.slider = createSlider(0, 100, 50); // the slider changing whatever changes in the cell
        this.slider.style('width', '100px');
    }

    /**
     * display: displays the cell on the screen
     */
    display() {
        this.displayScreenContents();
        
        // wiggle around in circles (this actually affects some of the state displays, and is intentionally used in some animations)
        this.position.x += sin(frameCount/100.0 + this.sp)*0.15;
        this.position.y += cos(frameCount/100.0 + this.sp)*0.15;
        
         // scaling looks pixellated, but I kinda like it
        // reminds me of GLSL sandbox on 8-pixel mode and I have some semi-nostalgia there
        image(this.screen, this.position.x, this.position.y, this.wid, this.hit);

        this.displayBorder(); // fancy border too slow
    }

    /**
     * displayScreenContents: displays stuff to the cell's internal graphics object
     */
    displayScreenContents() {
        if(this.state != 6) this.screen.background(255); // everything gets its background cleared
        switch(this.state) {
            case 0:
                // 3D torus and spheres
                // looks kinda like a hydrogen orbital
                this.screen.perspective(100, this.wid/this.hit, 1, 3000); // to fix aspect ratio (not necessary with square cells but good practice)
                this.screen.rotateX(0.0077*this.sp); // apparently transform matrices aren't automatically reset on the sub-objects
                this.screen.rotateY(0.0083*this.sp); // these values copied straight from p5's setAttribute demo I think
                this.screen.rotateZ(0.0091*this.sp);
                
                this.screen.push(); // save state since we need to translate for torus / spheres

                //this.screen.normalMaterial(); // let's hear it for viewspace non-remapped normals woohoooooo
                this.screen.directionalLight(this.col, 0, 0, -0.1);
                this.screen.ambientMaterial(30);
                this.screen.ambientLight(red(this.col)/2, green(this.col)/2, blue(this.col)/2);
                this.screen.scale(0.1);
                this.screen.torus(20*20, 10*20, 30, 10);

                // draw the symmetrical spheres
                this.screen.noStroke();
                this.screen.push();
                this.screen.translate(0, 0, 400.0*this.slider.value()/100.0);
                this.screen.sphere(200.0);
                this.screen.translate(0, 0, -800.0*this.slider.value()/100.0);
                this.screen.sphere(200.0);
                this.screen.pop();
                this.screen.pop();
                break;
            case 1:
                // Circle grid and number
                
                // circle count / display number is just noise that evolves with time (offset in 3D by slider and speed (for variation))
                let randNum = int(60.0*noise(frameCount/1000.0, 10.0*this.sp, this.slider.value()/100.0));
                this.screen.fill(this.col);
                this.screen.noStroke();
                
                // simple loop to draw wrapping grid of circles
                let xc = 30;
                let yc = 30;
                for(let i = 0; i < randNum; i++) {
                    this.screen.ellipse(xc, yc, 30, 30);
                    xc += 40;
                    if(xc > this.screen.width - 30) {
                        xc = 30;
                        yc += 40;
                    }
                    
                }
                
                // Draw text displaying the number of circles on the screen.
                this.screen.textAlign(CENTER, CENTER);
                this.screen.textSize(100);
                this.screen.stroke(this.col); // Figured out you could do outlines on text like this by accident. Useful!
                this.screen.strokeWeight(10);
                this.screen.strokeCap(ROUND); // Think this is the default anyway, not much of a visible difference since outlines are small so I can't tell. Leaving it in here for kicks.
                this.screen.fill(255);
                this.screen.text(randNum, this.screen.width/2, this.screen.height/2);
                break;
            case 2:
                // bouncy balls
                
                // display and update the balls (but only up to where the slider says we should)
                this.screen.strokeWeight(5);
                this.screen.stroke(this.col);
                for(let i = 0; i < this.s2balls.length*this.slider.value()/100.0; i++) {
                    this.s2balls[i].update(this.screen, this.getLocalMouse());
                    this.s2balls[i].display(this.screen);
                }
                break;
            case 3:
                // double rectangles
                
                this.screen.push();
                this.screen.strokeWeight(this.slider.value()*2.0);
                this.screen.stroke(200);
                this.screen.stroke(this.col);
                
                // calculate direction of mouse
                let ang = atan2(this.getLocalMouse().y - this.screen.height/2.0, this.getLocalMouse().x - this.screen.width/2.0);
                this.screen.translate(this.screen.width/2, this.screen.height/2);
                this.screen.stroke(this.col);
                this.screen.rotate(ang);
                this.screen.line(-width/2, 0, width/2, 0);
                this.screen.noStroke(); this.screen.fill(255);
                this.screen.rect(-this.slider.value(), -101, this.slider.value()*2.0, 202);
                this.screen.pop();
                break;
            case 4:
                // four rectangle thing
                this.screen.stroke(this.col);
                this.screen.strokeWeight(5);
                this.screen.fill(255);
                let sc = this.slider.value()/50.0;
                
                // yeah, it's a loop... I actually was going to put a lot more in at first, but they lined up so perfectly
                // when I did this that I decided to just leave it like this.
                for(let x = 100; x < this.screen.width; x += 100) {
                    for(let y = 100; y < this.screen.height; y+= 100) {
                        this.screen.push();
                        this.screen.translate(x-25*sc, y-25*sc);
                        this.screen.rotate(millis()/1000.0); // rotation is not actually centered on the squares, but I kinda like it that way
                        this.screen.rect(0, 0, 50*sc, 508);
                        this.screen.translate(15*sc, 15*sc);
                        this.screen.rect(0, 0, 20*sc, 20*sc);
                        this.screen.pop();
                    }
                }
                break;
            case 5:
                // circles
                
                this.screen.stroke(this.col);
                this.screen.strokeWeight(40);
                this.screen.ellipse(this.screen.width/2, this.screen.height/2, 200, 200); // start with a green circle
                this.screen.fill(this.col);
                this.screen.noStroke();
                
                // sorry for the mess here, copy-pasting was quicker than making variables
                // draw big green pie slices
                this.screen.arc(this.screen.width/2, this.screen.height/2, 500, 500, (millis()/4000.0 + this.position.x/2.0)%TWO_PI, (millis()/4000.0 + (TWO_PI - (-100.0 + this.slider.value())/200.0*TWO_PI) + this.position.x/2.0)%TWO_PI);
                this.screen.arc(this.screen.width/2, this.screen.height/2, 500, 500, (millis()/4000.0 + this.position.x/2.0 + PI)%TWO_PI, (millis()/4000.0 + (TWO_PI - (-100.0 + this.slider.value())/200.0*TWO_PI) + this.position.x/2.0 + PI)%TWO_PI);
                
                
                // draw white interior arcs
                this.screen.stroke(255);
                this.screen.strokeCap(SQUARE);
                this.screen.strokeWeight(42);
                this.screen.arc(this.screen.width/2, this.screen.height/2, 200, 200, (millis()/4000.0 + this.position.x/2.0)%TWO_PI, (millis()/4000.0 + (TWO_PI - (-100.0 + this.slider.value())/200.0*TWO_PI) + this.position.x/2.0)%TWO_PI);
                
                this.screen.arc(this.screen.width/2, this.screen.height/2, 200, 200, (millis()/4000.0 + this.position.x/2.0 + PI)%TWO_PI, (millis()/4000.0 + (TWO_PI - (-100.0 + this.slider.value())/200.0*TWO_PI) + this.position.x/2.0 + PI)%TWO_PI);
                break;
            case 6:
                // Peter de Jong attractor
                
                this.screen.fill(255, 20);
                this.screen.rect(0, 0, width, height)
                this.screen.stroke(this.col);
                
                // Link to another example of these elegant attractors http://paulbourke.net/fractals/peterdejong/
                
                // vary randomness with time (need to do this because of deterministic randomSeed() call following this)
                randomSeed(millis());
                
                // By making the starting position of the attractor move slowly in a circle, you get a cool effect where points can slowly
                // appear to move when the attractor is in a fairly non-chaotic state
                let xp = sin(millis()/200000.0);
                let yp = cos(millis()/200000.0);
                
                // basically mouseDragged() with bounds checking
                if(mouseIsPressed && mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
                    this.s6a += (pmouseX - mouseX)/100.0;
                    this.s6b += (pmouseY - mouseY)/200.0;
                }
                
                // initalize all of the parameters
                let a = this.s6a; let b = this.s6b;
                randomSeed(hue(this.col)); // Hey, it's easier than making a new variable :P
                let c = this.slider.value()/10.0 - 5.0 + 1 + random(-1.0, 1.0); // constant random value based on color
                let d = this.slider.value()/10.0 - 5.0 - 1.5 + random(-1.0, 1.0);
                
                // do the actual attractor part
                for(let i = 0; i < this.s6prevpos.length; i++) {
                    let newxp = sin(a*yp) - cos(b*xp); // so simple!
                    let newyp = sin(c*xp) - cos(d*yp);
                    xp = newxp;
                    yp = newyp;
                    
                    // don't draw the first few points since they probably won't be 'in' the attractor quite yet
                    if(i > 2) {
                        // find the separation between the point at this index last frame and the point at this index this frame
                        let sep = this.dist2(xp, yp, this.s6prevpos[i][0], this.s6prevpos[i][1]);
                        // by making points that haven't changed much bigger, we can emphasize the slow-moving points when/where they appear
                        this.screen.strokeWeight(max(5, 1.0/(sep+0.2)));
                        this.deJongPoint(xp, yp);
                    }
                    this.s6prevpos[i] = [xp, yp]; // save previous position
                }
                break;
        }
    }
    
    /**
     * deJongPoint: remaps point for Peter de Jong attractors and draws it on the pgraphics with point()
     * @param x the x-coordinate to draw
     * @param y the y-coordinate to draw
     */
    deJongPoint(x, y) {
        this.screen.point(x*80.0 + this.screen.width/2.0 + 40, y*80.0 + this.screen.height/2.0 + 40);
    }
    
    /**
     * dist2: a simple distance squared function (faster than dist() sine no square roots are involved)
     * @param x the x-coordinate of the first vector
     * @param y the y-coordinate of the first vector
     * @param x2 the x-coordinate of the second vector
     * @param y2 the y-coordinate of the second vector
     * @returns (x2 - x)^2 + (y2 - y)^2
     */
    dist2(x, y, x2, y2) {
        return (x2-x)*(x2-x) + (y2-y)*(y2-y);
    }
    
    /**
     * getLocalMouse: returns the mouse coordinates mapped to the cell's graphics space
     * @returns a p5.Vector with the (x, y) remapped mouse coordinates
     */
    getLocalMouse() {
        let facX = this.screen.width*1.0/this.wid;
        let facY = this.screen.height*1.0/this.hit;
        return createVector(facX*(mouseX - this.position.x), facY*(mouseY - this.position.y));
    }
    
    /**
     * displayBorder: displays the border in a more simple way
     */
    displayBorder() {
        stroke(this.col);
        noFill();
        strokeWeight(5);
        rect(this.position.x, this.position.y, this.wid, this.hit, 6);
    }
    
    /**
     * displayBorderFancy: displays the border around the edge of the cell (takes a lot of CPU time)
     */
    displayBorderFancy() {
        // draw the bumps (just done by drawing points around the border whose weights are wiggled with sine waves)
        stroke(this.col);
        for(let x = 0; x < this.wid; x++) {
            strokeWeight(abs(sin(x*0.1))*10.0+3);
            point(this.position.x + x, this.position.y);

            strokeWeight(abs(sin((x + this.hit)*0.1))*10.0+2); // adding height makes them smoothly wrap onto the bars
            point(this.position.x + x, this.position.y + this.hit);
        }
        // same but for y
        for(let y = 0; y < this.hit; y++) {
            strokeWeight(abs(sin(y*0.1))*10.0+2);
            point(this.position.x, this.position.y + y);

            strokeWeight(abs(sin((y + this.wid)*0.1))*10.0+2);
            point(this.position.x + this.wid, this.position.y + y);
        }

        // draw the cool circle things (to stop the bumps from looking weird in the lower-right where they meet up out of phase)
        // draw the dark outlines...
        fill(255);
        noStroke();
        fill(this.col);
        ellipse(this.position.x, this.position.y, 40, 40);
        ellipse(this.position.x + this.wid, this.position.y + this.hit, 40, 40);

        // ...then the light centers
        fill(255);
        ellipse(this.position.x, this.position.y, 25, 25);
        ellipse(this.position.x + this.wid, this.position.y + this.hit, 25, 25);
        noFill();
    }

    /**
     * setSize: sets the size of the cell
     * @param w the input witdth of the cell / 3 (I'll change this later TODO)
     * @param h the input height of the cell / 3
     */
    setSize(w, h) {
        this.wid = max(1, w*3);
        this.hit = max(1, h*3);
    }
}