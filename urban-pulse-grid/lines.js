\// Animated, looser grid over a static US map with staggered fade/flash and SVG gradients.

const map = L.map('map', { zoomControl:true, minZoom:3, maxZoom:12 })
  .setView([39.5, -98.35], 4);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19, attribution: '&copy; OpenStreetMap'
}).addTo(map);

const US_BOUNDS = L.latLngBounds([24.396308, -124.848974], [49.384358, -66.885444]);
map.setMaxBounds(US_BOUNDS.pad(0.2));
map.fitBounds(US_BOUNDS, { padding:[20,20] });

document.getElementById('resetBtn').addEventListener('click', () => {
  map.fitBounds(US_BOUNDS, { padding:[20,20] });
});

const cellInfo = document.getElementById('cellInfo');
let lineGroup = null;
let cellGroup = null;

// Ensure SVG <defs> with gradients exist (transparent → neon turquoise)
function ensureGradients(){
  const pane = map.getPanes().overlayPane;
  const svgs = pane.getElementsByTagName('svg');
  if(!svgs.length) return;
  const svg = svgs[0];
  let defs = svg.querySelector('defs');
  if(!defs){
    defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    svg.prepend(defs);
  }
  if(!svg.querySelector('#gradH')){
    const gH = document.createElementNS('http://www.w3.org/2000/svg','linearGradient');
    gH.setAttribute('id','gradH'); gH.setAttribute('x1','0%'); gH.setAttribute('y1','0%');
    gH.setAttribute('x2','100%'); gH.setAttribute('y2','0%');
    const s1 = document.createElementNS('http://www.w3.org/2000/svg','stop');
    s1.setAttribute('offset','0%'); s1.setAttribute('stop-color','rgba(69,226,209,0)');
    const s2 = document.createElementNS('http://www.w3.org/2000/svg','stop');
    s2.setAttribute('offset','100%'); s2.setAttribute('stop-color','rgba(69,226,209,1)');
    gH.appendChild(s1); gH.appendChild(s2); defs.appendChild(gH);
  }
  if(!svg.querySelector('#gradV')){
    const gV = document.createElementNS('http://www.w3.org/2000/svg','linearGradient');
    gV.setAttribute('id','gradV'); gV.setAttribute('x1','0%'); gV.setAttribute('y1','100%');
    gV.setAttribute('x2','0%'); gV.setAttribute('y2','0%');
    const s1v = document.createElementNS('http://www.w3.org/2000/svg','stop');
    s1v.setAttribute('offset','0%'); s1v.setAttribute('stop-color','rgba(69,226,209,0)');
    const s2v = document.createElementNS('http://www.w3.org/2000/svg','stop');
    s2v.setAttribute('offset','100%'); s2v.setAttribute('stop-color','rgba(69,226,209,1)');
    gV.appendChild(s1v); gV.appendChild(s2v); defs.appendChild(gV);
  }
}

// Draw a looser grid; lines fade in and flash with staggered delays
function drawAnimatedGrid(bounds, cols=9, rows=6){
  if(lineGroup) lineGroup.remove();
  if(cellGroup) cellGroup.remove();
  lineGroup = L.layerGroup().addTo(map);
  cellGroup = L.layerGroup().addTo(map);

  const west = bounds.getWest(), east = bounds.getEast();
  const south = bounds.getSouth(), north = bounds.getNorth();
  const dx = (east - west) / cols;
  const dy = (north - south) / rows;

  const vLines = [], hLines = [];
  for(let i=0;i<=cols;i++) vLines.push([[south, west + i*dx],[north, west + i*dx]]);
  for(let j=0;j<=rows;j++) hLines.push([[south + j*dy, west],[south + j*dy, east]]);

  ensureGradients();

  const vDelayStep = 0.15, hDelayStep = 0.15;

  vLines.forEach((pts, idx)=>{
    const ln = L.polyline(pts, { weight:0.8, opacity:0, color:'#45e2d1' }).addTo(lineGroup);
    const el = ln.getElement();
    if(el){
      el.classList.add('grid-line');
      el.style.setProperty('--delay', `${idx*vDelayStep}s`);
      el.setAttribute('stroke','url(#gradV)');
    }
  });

  hLines.forEach((pts, idx)=>{
    const ln = L.polyline(pts, { weight:0.8, opacity:0, color:'#45e2d1' }).addTo(lineGroup);
    const el = ln.getElement();
    if(el){
      el.classList.add('grid-line');
      el.style.setProperty('--delay', `${(vLines.length*vDelayStep) + idx*hDelayStep}s`);
      el.setAttribute('stroke','url(#gradH)');
    }
  });

  // Optional: light clickable cells
  for(let i=0;i<cols;i++){
    for(let j=0;j<rows;j++){
      const sw = L.latLng(south + j*dy, west + i*dx);
      const ne = L.latLng(south + (j+1)*dy, west + (i+1)*dx);
      L.rectangle([sw, ne], {
        className:'cell-rect', weight:0.6, color:'#ffffff1f', fill:false
      }).on('click', () => {
        cellInfo.textContent = `Cell: [${sw.lat.toFixed(4)}, ${sw.lng.toFixed(4)}] → [${ne.lat.toFixed(4)}, ${ne.lng.toFixed(4)}]`;
      }).addTo(cellGroup);
    }
  }
}

map.whenReady(() => {
  drawAnimatedGrid(US_BOUNDS, 9, 6); // looser grid (thinner & fewer lines)
});

// Re-ensure gradients after zoom/move (Leaflet may recreate paths)
map.on('zoomend moveend', ensureGradients);
