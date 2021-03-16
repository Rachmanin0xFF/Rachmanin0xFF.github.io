
document.addEventListener("DOMContentLoaded", function(event) {
  document.documentElement.setAttribute("color-mode", "light");

  var darkMem = localStorage.getItem("darkmodeon");
  if(darkMem !== null)
    document.documentElement.setAttribute("color-mode", darkMem);
  else if((window.matchMedia("(prefers-color-scheme: dark)").matches))
    document.documentElement.setAttribute("color-mode", "dark");


  var dmt = document.getElementById("dm-toggle");

  dmt.onclick = function() {
    var ct = document.documentElement.getAttribute("color-mode");
    var switchToTheme = ct === "dark" ? "light" : "dark"
    document.documentElement.setAttribute("color-mode", switchToTheme);
    localStorage.setItem("darkmodeon", switchToTheme);
  }
});

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
  updateScrollers();
};