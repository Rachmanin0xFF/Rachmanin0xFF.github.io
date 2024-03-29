
function debounce(func, wait, immediate) {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
};

updateScrollers = function() {
  var body = document.body;
  var docElem = document.documentElement;
  var x = window.pageYOffset || docElem.scrollTop || body.scrollTop;


  document.getElementById('bkg').style['background-position'] = ('0% '  + parseInt(x*0.75) + 'px');
  document.getElementById('spikes').style['top'] = (parseInt(x) + 50 + 'px');
  var fac = (parseInt(x) - 10.0) / 100.0;
  if(fac > 1.0) fac = 1.0; if(fac < 0.0) fac = 0.0;
  document.getElementById('spikes').style['top'] = ((parseInt(x) + 50)*(1.0-fac) + (parseInt(x) + 20)*fac + 'px');
  document.getElementById('spikes').style['height'] = (120 + fac*30 + 'px');
}

window.onscroll = function() {
  debounce(updateScrollers(), 25);
};