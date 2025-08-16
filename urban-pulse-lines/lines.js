// Animated, looser grid over a static US map.
// - Lines use SVG gradients to appear transparent→neon turquoise.
// - Lines fade in and flash in sequence with staggered delays.
// - Clicking a cell shows its bbox (optional).

const map = L.map('map', { zoomControl:true, minZoom:3, maxZoom: 12 }).setView([39.5, -98.35], 4);

// Simple, clean OSM tiles
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19, attribution: '&copy; OpenStreetMap'
}).addTo(map);

// US bounds to keep it "static-ish" to the US frame
const US_BOUNDS = L.latLngBounds([24.396308, -124.848974], [49.384358, -66.885444]);
map.setMaxBounds(US_BOUNDS.pad(0.2));

const resetBtn = document.getElementById('resetBtn');
resetBtn.addEventListener('click', ()=> map.fitBounds(US_BOUNDS, { padding:[20,20] }));

const cellInfo = document.getElementById('cellInfo');

let lineGroup = null;
let cellGroup = null;

// Inject gradient defs into Leaflet's SVG once it exists
function ensureGradients(){
  const pane = map.getPanes().overlayPane;
  const svgs = pane.getElementsByTagName('svg');
  if(!svgs.length) return null;
  const svg = svgs[0];
  let defs = svg.querySelector('defs');
  if(!defs){
    defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    svg.prepend(defs);
  }
  // Horizontal gradient: left (transparent) -> right (neon)
  if(!svg.querySelector('#gradH')){
    const gH = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gH.setAttribute('id','gradH');
    gH.setAttribute('x1','0%'); gH.setAttribute('y1','0%');
    gH.setAttribute('x2','100%'); gH.setAttribute('y2','0%');
    const s1 = document.createElementNS('http://www.w3.org/2000/svg','stop');
    s1.setAttribute('offset','0%'); s1.setAttribute('stop-color','rgba(69,226,209,0)');
    const s2 = document.createElementNS('http://www.w3.org/2000/svg','stop');
    s2.setAttribute('offset','100%'); s2.setAttribute('stop-color','rgba(69,226,209,1)');
    gH.appendChild(s1); gH.appendChild(s2);
    defs.appendChild(gH);
  }
  // Vertical gradient: bottom (transparent) -> top (neon)
  if(!svg.querySelector('#gradV')){
    const gV = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gV.setAttribute('id','gradV');
    gV.setAttribute('x1','0%'); gV.setAttribute('y1','100%');
    gV.setAttribute('x2','0%'); gV.setAttribute('y2','0%');
    const s1v = document.createElementNS('http://www.w3.org/2000/svg','stop');
    s1v.setAttribute('offset','0%'); s1v.setAttribute('stop-color','rgba(69,226,209,0)');
    const s2v = document.createElementNS('http://www.w3.org/2000/svg','stop');
    s2v.setAttribute('offset','100%'); s2v.setAttribute('stop-color','rgba(69,226,209,1)');
    gV.appendChild(s1v); gV.appendChild(s2v);
    defs.appendChild(gV);
  }
  return svg;
}

// Draw a looser grid (thinner lines, fewer cells)
function drawAnimatedGrid(bounds, cols=8, rows=5){
  if(lineGroup) lineGroup.remove();
  if(cellGroup) cellGroup.remove();
  lineGroup = L.layerGroup().addTo(map);
  cellGroup = L.layerGroup().addTo(map);

  const west = bounds.getWest(), east = bounds.getEast();
  const south = bounds.getSouth(), north = bounds.getNorth();

  // Create clickable cells (optional) and collect line positions
  const dx = (east - west) / cols;
  const dy = (north - south) / rows;

  // Vertical lines
  const vLines = [];
  for(let i=0;i<=cols;i++){
    const lng = west + i*dx;
    vLines.push([[south, lng],[north, lng]]);
  }
  // Horizontal lines
  const hLines = [];
  for(let j=0;j<=rows;j++){
    const lat = south + j*dy;
    hLines.push([[lat, west],[lat, east]]);
  }

  // Add lines to map first
  const svg = ensureGradients();
  const delays = [];

  // staggered delays for sequence (left→right then top→bottom)
  const vDelayStep = 0.15, hDelayStep = 0.15;

  vLines.forEach((pts, idx)=>{
    const ln = L.polyline(pts, {
      weight: 0.8, opacity: 0, color: '#45e2d1' // color is fallback
    }).addTo(lineGroup);
    const el = ln.getElement();
    if(el){
      el.classList.add('grid-line');
      el.style.setProperty('--delay', `${idx*vDelayStep}s`);
      el.setAttribute('stroke','url(#gradV)');
    }
  });

  hLines.forEach((pts, idx)=>{
    const ln = L.polyline(pts, {
      weight: 0.8, opacity: 0, color: '#45e2d1'
    }).addTo(lineGroup);
    const el = ln.getElement();
    if(el){
      el.classList.add('grid-line');
      el.style.setProperty('--delay', `${(vLines.length*vDelayStep) + idx*hDelayStep}s`);
      el.setAttribute('stroke','url(#gradH)');
    }
  });

  // Optional: clickable, lightly outlined cells
  for(let i=0;i<cols;i++){
    for(let j=0;j<rows;j++){
      const sw = L.latLng(south + j*dy, west + i*dx);
      const ne = L.latLng(south + (j+1)*dy, west + (i+1)*dx);
      const rect = L.rectangle([sw, ne], { className:'', weight:0.6, color:'#ffffff1f', fill:false });
      rect.on('click', ()=>{
        cellInfo.textContent = `Cell: [${sw.lat.toFixed(4)}, ${sw.lng.toFixed(4)}] → [${ne.lat.toFixed(4)}, ${ne.lng.toFixed(4)}]`;
      });
      rect.addTo(cellGroup);
    }
  }
}

// Ensure gradients exist after map renders SVG, then draw grid
map.whenReady(()=>{
  map.fitBounds(US_BOUNDS, { padding:[20,20] });
  ensureGradients();
  drawAnimatedGrid(US_BOUNDS, 9, 6); // looser grid: 9x6 lines → 8x5 cells
});

// Redraw gradients/lines on zoomend (Leaflet may recreate paths)
map.on('zoomend moveend', ()=>{
  ensureGradients();
});

