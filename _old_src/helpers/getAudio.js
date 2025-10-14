/**
 * toHTML.js
 * http://git.io/vUJU2
 */
 
 module.exports = function (str) {
  if (str && typeof str === "string") {
    return str.split("\\").slice(0, -2) + "/" + str.split("\\").slice(-1)[0].split('.')[0] + ".mp3";
  }
}