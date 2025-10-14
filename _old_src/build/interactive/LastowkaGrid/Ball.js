/**
 * Ball: A class copy-pasted from some other project in my sketches program
 * It just makes a simple bouncy ball
 * @author Adam Lastowka
 */

class Ball {
    /**
     * @param x the x-coordinate of the ball
     * @param y the y-coordinate of the ball
     * @param r the radius of the ball
     */
    constructor(x, y, r) {
        this.x = x;
        this.y = y;
        this.px = this.x;
        this.py = this.y;
        this.xv = 0;
        this.yv = 0;
        this.ball_radius = r;
    }
    /**
     * update: updates the ball's physics
     * @param renderTarget the canvas / graphics object that the ball is displayed on (anything with a width and height works)
     * @param mousePos a p5.Vector containing the mouse's position in ball-space
     */
    update(renderTarget, mousePos) {
        this.px = this.x;
        this.py = this.y;
        
        // bouncing is the only way the ball can slow down (air friction looks wrong when cells are moving)
        if (this.x >= renderTarget.width - this.ball_radius && this.xv > 0) {
            this.xv *= -0.8;
            this.x = min(this.x, renderTarget.width - this.ball_radius);

        } else if (this.x <= this.ball_radius && this.xv < 0) { //left border
            this.xv *= -0.8;
            this.x = max(this.x, this.ball_radius);
        }
        if (this.y >= renderTarget.height - this.ball_radius && this.yv > 0) { //bottom border
            this.yv *= -0.8;
            this.y = min(this.y, renderTarget.height - this.ball_radius);
        } else if (this.y <= this.ball_radius && this.yv < 0) { //top border
            this.yv *= -0.8;
            this.y = max(this.y, this.ball_radius);
        }
        
        // attract to mouse with gravity when mouse is pressed
        if(mouseIsPressed) {
            let d = (this.x - mousePos.x)*(this.x - mousePos.x) + (this.y - mousePos.y)*(this.y - mousePos.y);
            this.xv += (mousePos.x - this.x)/d*100.0;
            this.yv += (mousePos.y - this.y)/d*100.0;
        }
        
        this.x += this.xv;
        this.y += this.yv;
    }
    /**
     * display: displays the ball
     * @param renderTarget the canvas / graphics object that the ball is displayed on (anything with a width and height works)
     */
    display(renderTarget) {
        renderTarget.ellipse(this.x, this.y, this.ball_radius*2.0, this.ball_radius*2.0);
    }
}
