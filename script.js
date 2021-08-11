// Element Selectors Start

const canvasContainer = document.querySelector('.canvas-container');
const canvas = document.querySelector('.draw-space');
const ctx = canvas.getContext('2d');
const allTools = document.querySelectorAll('button');
const toolStyles = document.querySelectorAll('.config__style > input');
const docInit = document.querySelectorAll('.config__file > button')
const cursor = document.querySelector('.draw-space__cursor');
const tipToggle = document.querySelector('.tool-tips__toggle');
const tips = document.querySelector('.tool-tips__modal');

// Element Selectors End

// Event Listeners Start

allTools.forEach(tool => tool.addEventListener('click',loadTool));
docInit.forEach(tool => tool.addEventListener('click',docInitialize));
toolStyles.forEach(tool => tool.addEventListener('change',updateStyles));
tipToggle.addEventListener('click',toggleTips)
canvas.addEventListener('mousemove', (e) => {
  draw(e);
});
canvas.addEventListener('mousedown',(e) => {
  [lastX, lastY,isDrawing] = [e.offsetX,e.offsetY,true];
  brushLineWidth = lineWidth;
  brushOpacity = 1;
  draw(e);
});
canvas.addEventListener('mouseup',() => {
  isDrawing = false;
  if (currentTool == 'undo' || currentTool == 'redo') return;
  undoStack.push(ctx.getImageData(0,0,canvas.width,canvas.height));
  redoStack.length = 0;
});
canvas.addEventListener('mouseout', () => isDrawing = false);

// Event Listeners End

// Default Load Scripts Start

canvas.width = (window.innerWidth/2);
canvas.height = (window.innerHeight/2);
ctx.lineJoin = 'round';
ctx.lineCap = 'round';

// Default Load Scripts End

// Control Variables Start

let isDrawing = false;
let lastX = 0;
let lastY = 0;
let currentTool = '';
let previousTool = '';
let drawColor = '#000';
let lineWidth = 10;
let brushLineWidth = 0;
let brushOpacity = 1;
let shapeCoords = [];
let hue = 0;
let undoStack = [ctx.getImageData(0,0,canvas.width,canvas.height)];
let redoStack = [];

// Control Variables End

// Object Literal function controls Start
const drawMethod = {
  pencil: (e) => {
    ctx.beginPath();
    ctx.moveTo(lastX,lastY);
    ctx.lineTo(e.offsetX,e.offsetY);
    ctx.stroke();
  },
  brush: (e) => {
    const widthReducer = brushLineWidth / 20
    if (brushLineWidth > 1) brushLineWidth -= widthReducer;
    const currentColor = ctx.strokeStyle.includes('#')?hexToRgba(ctx.strokeStyle).stringified:ctx.strokeStyle;
    if (brushOpacity>= 0) brushOpacity -= .05;
    const rgba = extractRgbaObj(currentColor);
    const {r,g,b} = rgba;
    ctx.strokeStyle = `rgba(${r},${g},${b},${brushOpacity})`;
    ctx.lineWidth = brushLineWidth;
    ctx.beginPath();
    ctx.moveTo(lastX,lastY);
    ctx.lineTo(e.offsetX,e.offsetY);
    ctx.stroke();
  },
  dropper:(e) => {
    const [r,g,b] = ctx.getImageData(e.offsetX,e.offsetY,1,1).data;
    const colorSelect = document.querySelector('.style__color');
    colorSelect.value = rgbToHex(r,g,b);
    cursor.style.backgroundColor = `rgb(${r},${g},${b})`;
    drawColor = `rgb(${r},${g},${b})`;
    previousTool.click();
    cursor.style.display = 'flex';
  },
  // Further research needed on fill:
  // fill:(e) => {
  //   const [startR,startG,startB] = ctx.getImageData(e.offsetX,e.offsetY,1,1).data;
  //   const currentColor = ctx.strokeStyle.includes('#')?hexToRgba(ctx.strokeStyle).stringified:ctx.strokeStyle;
  //   const rgba = extractRgbaObj(currentColor);
  //   const {r,g,b} = rgba;
  //   let colorLayer = ctx.getImageData(0,0,canvas.width,canvas.height)
  //   let pixelStack = [[e.offsetX,e.offsetY]];
  //   floodFill(colorLayer,pixelStack,startR,startG,startB,r,g,b);
  // },
  eraser:(e) => {
    ctx.strokeStyle = '#f5f5f5' 
    ctx.beginPath();
    ctx.moveTo(lastX,lastY);
    ctx.lineTo(e.offsetX,e.offsetY);
    ctx.stroke();
  },
  line:(e) => {
    let coords = plotCoords(e);
    if (coords.length<2) return;
    const [xStart,yStart,xEnd,yEnd] = [coords[0][0],coords[0][1],coords[1][0],coords[1][1]];
    ctx.beginPath();
    ctx.moveTo(xStart,yStart);
    ctx.lineTo(xEnd,yEnd);
    ctx.stroke();
  }, 
  circle:(e) => {
    let coords = plotCoords(e);
    if (coords.length<2) return;
    const [xStart,yStart,xEnd,yEnd] = [coords[0][0],coords[0][1],coords[1][0],coords[1][1]];
    const xOffset = xEnd < xStart ? xStart - xEnd : xEnd - xStart;
    const yOffset = yEnd < yStart ? yStart - yEnd : yEnd - yStart;
    const radius = xOffset > yOffset ? xOffset : yOffset;
    ctx.beginPath();
    ctx.arc(xStart,yStart,radius,0,Math.PI * 2);
    ctx.stroke()
  }, 
  rect:(e) => {
    let coords = plotCoords(e);
    if (coords.length<2) return;
    const [xStart,yStart] = [coords[0][0],coords[0][1]];
    const rectWidth = coords[1][0] - xStart;
    const rectHeight = coords[1][1] - yStart;
    ctx.strokeRect(xStart,yStart,rectWidth,rectHeight);
  }, 
  rmode:(e) => {
    ctx.strokeStyle = `hsl(${hue},100%,50%)`
    ctx.beginPath();
    ctx.moveTo(lastX,lastY);
    ctx.lineTo(e.offsetX,e.offsetY);
    ctx.stroke();
    hue++
    if(hue >= 360) hue = 0;
  }, 
}
// Object Literal function controls End

// Functions Start
function docInitialize() {
  let currentEffect = this.getAttribute('data-tool');
  const initType = {
    new: () => {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      this.classList.remove('--active');
      currentTool = '';
      lastX = 0;
      lastY = 0;
      currentTool = '';
      brushLineWidth = 0;
      brushOpacity = 1;
      shapeCoords = [];
    },
    save: () => {
      const image = canvas.toDataURL('image/png').replace('image/png','image/octet-stream');
      let tempEl = document.createElement('a');
      tempEl.href = image;
      tempEl.download = 'my-masterpiece.png';
      document.body.appendChild(tempEl);
      tempEl.click();
      tempEl.remove();
    },
    undo: () => {
      const prevTool = previousTool.getAttribute('data-tool');
      let currentCanvas;
      if(prevTool !== 'undo') {
        currentCanvas = undoStack.pop();
      }
      const prevCanvas = undoStack.pop();
      // const prevCanvas = undoStack.pop();
      if (typeof prevCanvas == 'undefined') return;
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.putImageData(prevCanvas,0,0);
      typeof currentCanvas == 'undefined'?redoStack.push(prevCanvas):redoStack.push(currentCanvas,prevCanvas)
      previousTool.click();
    },
    redo: () => {
      const prevTool = previousTool.getAttribute('data-tool');
      let currentCanvas;
      if (prevTool !== 'redo') {
        currentCanvas = redoStack.pop()
      }
      const nextCanvas = redoStack.pop();
      if (typeof nextCanvas == 'undefined') return;
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.putImageData(nextCanvas,0,0);
      typeof currentCanvas == 'undefined'?undoStack.push(nextCanvas):undoStack.push(currentCanvas,nextCanvas)
      previousTool.click();
    }
  }
  initType[currentEffect]();
}

function loadTool(){
  let prevTool = document.querySelector('.--active:not(aside)');
  prevTool?.classList.remove('--active');
  this.classList.add('--active')
  previousTool = prevTool;
  currentTool = this.getAttribute('data-tool');
  const crossHairTools = ['line','circle','rect','dropper']
  if(crossHairTools.includes(currentTool)) {
    canvas.style.cursor = 'crosshair';
    if (currentTool === 'dropper') cursor.style.display = 'none';
  } else {
    canvas.style.cursor = `none`;
    cursor.style.display = 'flex';
  }
  tips.classList.remove('--new-tip');
  loadToolTip[currentTool]();
  tips.classList.add('--new-tip');
  shapeCoords.length = 0;
}

function updateStyles(){
  if (this.name === 'colorPicker') {
    drawColor = this.value;
    cursor.style.backgroundColor = this.value
  } else {
    lineWidth = this.value;
    cursor.style.width = `${this.value}px`;
    cursor.style.height = `${this.value}px`;
  }
}

function draw(e){
  const cursorSize = cursor.offsetHeight;
  const cursorXOffset = ((cursorSize / canvasContainer.offsetWidth) * 100)/2;
  const cursorYOffset = ((cursorSize / canvasContainer.offsetHeight) * 100)/2;
  const xPerc = ((e.offsetX / (canvasContainer.offsetWidth))*100) + 25 - cursorXOffset;
  const yPerc = ((e.offsetY / (canvasContainer.offsetHeight))*100) + 23.4 - cursorYOffset;
  cursor.style.left = `${xPerc}%`;
  cursor.style.top = `${yPerc}%`;
  if (!isDrawing || !currentTool) return;
  ctx.strokeStyle = drawColor;
  ctx.lineWidth = lineWidth;
  if(drawMethod[currentTool])drawMethod[currentTool](e);
  [lastX, lastY] = [e.offsetX,e.offsetY];
}

function toggleTips(){
  tips.classList.toggle('--active');
  // this.checked ? tips.classList.add('--active'): tips.classList.remove('--active');
}

const loadToolTip = {
  new: () => tips.querySelector('span').innerText = 'Try using the eraser to delete only portions of your art',
  save: () => tips.querySelector('span').innerText = 'Your masterpiece is saved directly to your downloads folder',
  undo: () => tips.querySelector('span').innerText = 'You can undo as many times as you like!',
  redo: () => tips.querySelector('span').innerText = 'You can redo as many times as you like!',
  pencil: () => tips.querySelector('span').innerText = 'Try adjusting the line-width to create more intricate pieces of art',
  brush: () => tips.querySelector('span').innerText = 'The weight of your strokes fades as you use it, try a long sweeping stroke',
  dropper: () => tips.querySelector('span').innerText = 'The dropper will automatically switch back to your last used tool once you have selected a color',
  eraser: () => tips.querySelector('span').innerText = 'Make sure you adjust the line-width before erasing!',
  line: () => tips.querySelector('span').innerText = 'Click the starting position followed by the ending position to draw a straight line',
  circle: () => tips.querySelector('span').innerText = 'Your first click is the center of your circle, the second is its radius (outside)',
  rect: () => tips.querySelector('span').innerText = 'Click the starting position followed by the ending position to draw a rectangle',
  rmode: () => tips.querySelector('span').innerText = 'Have fun!',
}

const plotCoords = (e) => {
  return {
    0: (e) => {
      shapeCoords.push([e.offsetX,e.offsetY]);
      return shapeCoords;
    },
    1: (e) => {
      shapeCoords.push([e.offsetX,e.offsetY]);
      return shapeCoords;
    },
    2: (e) => {
      shapeCoords.length = 0;
      shapeCoords.push([e.offsetX,e.offsetY]);
      return shapeCoords;
    }
  }[shapeCoords.length](e)
}
// Functions End