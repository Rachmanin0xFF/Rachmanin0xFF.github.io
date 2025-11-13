
module.exports = function (str) {
  if (str && typeof str === "string") {
    return str.split("\\").slice(0, -1) + "/thumb/" + str.split("\\").slice(-1)[0].split('.')[0] + "_thumb.jpg";
  }
}