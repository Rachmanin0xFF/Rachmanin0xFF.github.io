if (localStorage.getItem("color-mode") === "dark" ||
   (window.matchMedia("(prefers-color-scheme: dark)").matches && !localStorage.getItem("color-mode"))
) {
	document.documentElement.setAttribute("color-mode", "dark");
}

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