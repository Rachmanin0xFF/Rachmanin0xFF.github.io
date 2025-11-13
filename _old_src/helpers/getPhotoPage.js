
module.exports = function (str) {
  if (str && typeof str === "string") {
    return str.split("\\").slice(0, -1) + "/descs/" + str.split("\\").slice(-1)[0].split('.')[0] + "/index.html";
  }
}