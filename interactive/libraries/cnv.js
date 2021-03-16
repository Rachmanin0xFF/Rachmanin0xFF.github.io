
function windowResized(){
	var dim = document.getElementById('sketchcanvas').getBoundingClientRect();
	resizeCanvas(dim.right - dim.x, dim.bottom-dim.y);
}


(function() {
    var _setup = setup;
    setup = function() {
		_setup();
		var dim = document.getElementById('sketchcanvas').getBoundingClientRect();
        resizeCanvas(dim.right - dim.x, dim.bottom-dim.y);
    };
})();