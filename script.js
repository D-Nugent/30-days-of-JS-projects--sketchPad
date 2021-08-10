// Element Selectors Start

const canvas = document.querySelector('.draw-space');
const ctx = canvas.getContext('2d');
const allTools = document.querySelectorAll('button');
const toolStyles = document.querySelectorAll('input');
const docInit = document.querySelectorAll('.config__file > button')

// Element Selectors End

// Event Listeners Start

allTools.forEach(tool => tool.addEventListener('click',loadTool));
docInit.forEach(tool => tool.addEventListener('click',docInitialize))
toolStyles.forEach(tool => tool.addEventListener('change',updateStyles))
canvas.addEventListener('mousemove',draw);
canvas.addEventListener('mousedown',(e) => {
  [lastX, lastY,isDrawing] = [e.offsetX,e.offsetY,true];
  brushLineWidth = lineWidth;
  brushOpacity = 1;
  draw(e);
});
canvas.addEventListener('mouseup',() => isDrawing = false);
canvas.addEventListener('mouseout', () => isDrawing = false);

// Event Listeners End

// Default Load Scripts Start

canvas.width = (window.innerWidth/2);
canvas.height = (window.innerHeight/2);
ctx.lineJoin = 'round';
ctx.lineCap = 'round';
ctx.save();

// Default Load Scripts End

// Control Variables Start

let isDrawing = false;
let lastX = 0;
let lastY = 0;
let currentTool = '';
let drawColor = '#000';
let lineWidth = 5;
let brushLineWidth = 0;
let brushOpacity = 1;
let shapeCoords = [];
let hue = 0;

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
    brushOpacity -= .05;
    const rgba = extractRgbaObj(currentColor);
    const {r,g,b} = rgba;
    ctx.strokeStyle = `rgba(${r},${g},${b},${brushOpacity})`;
    ctx.lineWidth = brushLineWidth;
    ctx.beginPath();
    ctx.moveTo(lastX,lastY);
    ctx.lineTo(e.offsetX,e.offsetY);
    ctx.stroke();
  },
  fill:(e) => {
    const [startR,startG,startB] = ctx.getImageData(e.offsetX,e.offsetY,1,1).data;
    const currentColor = ctx.strokeStyle.includes('#')?hexToRgba(ctx.strokeStyle).stringified:ctx.strokeStyle;
    const rgba = extractRgbaObj(currentColor);
    const {r,g,b} = rgba;
    let colorLayer = ctx.getImageData(0,0,canvas.width,canvas.height)
    let pixelStack = [[e.offsetX,e.offsetY]];
    floodFill(colorLayer,pixelStack,startR,startG,startB,r,g,b);
  },
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
  if (currentEffect === 'new') {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    this.classList.remove('--active');
    currentTool = '';
    lastX = 0;
    lastY = 0;
    currentTool = '';
    brushLineWidth = 0;
    brushOpacity = 1;
    shapeCoords = [];
  } else {
    const image = canvas.toDataURL('image/png').replace('image/png','image/octet-stream');
    let tempEl = document.createElement('a');
    tempEl.href = image;
    tempEl.download = 'my-masterpiece.png';
    document.body.appendChild(tempEl);
    tempEl.click();
    tempEl.remove();
  }
}

function loadTool(){
  let prevTool = document.querySelector('.--active');
  prevTool?.classList.remove('--active');
  this.classList.add('--active')
  console.log(this.getAttribute('data-tool'));
  currentTool = this.getAttribute('data-tool');
  const crossHairTools = ['line','circle','rect']
  crossHairTools.includes(currentTool)?canvas.style.cursor = 'crosshair':canvas.style.cursor = 'auto'
  shapeCoords.length = 0;
}

function updateStyles(){
  if (this.name === 'colorPicker') {
    console.log(this.value);
    drawColor = this.value;
  } else {
    console.log(this.value);
    lineWidth = this.value;
  }
}

function draw(e){
  if (!isDrawing || !currentTool) return;
  ctx.strokeStyle = drawColor;
  ctx.lineWidth = lineWidth;
  drawMethod[currentTool](e);
  [lastX, lastY] = [e.offsetX,e.offsetY];
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