/**
 * toHTML.js
 * http://git.io/vUJU2
 */
 
module.exports = function (str) {
  if (str && typeof str === "string") {
    a = str.split(".").slice(0, -1) + "\\index.html";
    return a.split('\\').join('\\\\');
  }
}