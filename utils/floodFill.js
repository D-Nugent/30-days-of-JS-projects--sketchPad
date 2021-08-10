
function floodFill(colorLayer,pixelStack,startR,startG,startB,fillColorR,fillColorG,fillColorB) {

  while (pixelStack.length) {
    let newPos,x,y,pixelPos,reachLeft,reachRight;
    newPos = pixelStack.pop();
    x = newPos[0];
    y = newPos[1];

    pixelPos = (y * canvas.width + x) * 4;
    while(y-- >= 0 && matchStartColor(colorLayer,pixelPos,startR,startG,startB)) {
      pixelPos -= canvas.width * 4;
    }
    pixelPos += canvas.width * 4;
    ++y;
    reachLeft = false;
    reachRight = false;
    while(y++ < canvas.height-1 && matchStartColor(colorLayer,pixelPos,startR,startG,startB)) {
      colorPixel(colorLayer,pixelPos,fillColorR,fillColorG,fillColorB);
      if (x > 0) {
        if (matchStartColor(colorLayer,pixelPos - 4,startR,startG,startB)) {
          if (!reachLeft) {
            pixelStack.push([x -1,y]);
            reachLeft = true;
          }
        } else if(reachLeft) {
          reachLeft = false;
        }
      };

      if (x < canvas.width-1) {
        if (matchStartColor(colorLayer,pixelPos + 4,startR,startG,startB)) {
          if(!reachRight) {
            pixelStack.push([x+1,y]);
            reachRight = true;
          }
        } else if(reachRight) {
          reachRight = false;
        }
      }

      pixelPos += canvas.width * 4;
    }
  }
  ctx.putImageData(colorLayer,0,0);
}

function matchStartColor(colorLayer,pixelPos,startR,startG,startB) {
  let r = colorLayer.data[pixelPos];
  let g = colorLayer.data[pixelPos+1];
  let b = colorLayer.data[pixelPos+2];

  return (r == startR && g == startG && b == startB)
}

function colorPixel(colorLayer,pixelPos,fillColorR,fillColorG,fillColorB) {
  colorLayer.data[pixelPos] = fillColorR;
  colorLayer.data[pixelPos+1] = fillColorG;
  colorLayer.data[pixelPos+2] = fillColorB;
  colorLayer.data[pixelPos+3] = 255;
}