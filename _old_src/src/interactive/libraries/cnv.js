
var window_aspect_ratio = 1.0;
var got_window_aspect_ratio = false;

function windowResized(){
	var dim = document.getElementById('sketchcanvas').getBoundingClientRect();
	resizeCanvas(dim.right - dim.x, window_aspect_ratio*(dim.right - dim.x));
}


(function() {
    var _setup = setup;
    setup = function() {
		_setup();
		var dim = document.getElementById('sketchcanvas').getBoundingClientRect();
        if(!got_window_aspect_ratio) {
            window_aspect_ratio = (dim.bottom-dim.y)*1.0/(dim.right - dim.x);
            got_window_aspect_ratio = true;
        }
        resizeCanvas(dim.right - dim.x, window_aspect_ratio*(dim.right - dim.x));
    };
})();