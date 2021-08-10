function hexToRgba(hex) {
  hex = hex.slice(1);
  let bigint = parseInt(hex,16);
  let r = (bigint >> 16) & 255;
  let g = (bigint >> 8) & 255;
  let b = bigint & 255;
  return {
    stringified: `rgba(${r},${g},${b},1)`,
    r,
    g,
    b
  }
}

function extractRgbaObj(rgbStr) {
  let separatedVals = rgbStr.split(/,|\(|\)/);
  return {
    r: separatedVals[1],
    g: separatedVals[2],
    b: separatedVals[3],
    a: separatedVals[4],
    get stringified() {
      return `rgba(${this.r},${this.g},${this.b},${this.a})`
    }
  }
}