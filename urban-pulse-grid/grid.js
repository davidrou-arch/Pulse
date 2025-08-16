// Simple grid-with-subdivision prototype.
// Click a square to zoom in and replace it with a finer grid.

const map = L.map('map', { zoomControl:true }).setView([39.5, -98.35], 4); // USA-ish
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(map);

const statusEl = document.getElementById('status');
const resetBtn = document.getElementById('resetBtn');
const backBtn = document.getElementById('backBtn');

let level = 0;
let currentGridLayer = null;
let stack = []; // history of {bounds, cellsPerSide}

function updateStatus(){ statusEl.textContent = `Level: ${level}`; }

function drawGrid(bounds, cellsPerSide=6){
  if(currentGridLayer) currentGridLayer.remove();
  const group = L.layerGroup();
  const west = bounds.getWest(), east = bounds.getEast();
  const south = bounds.getSouth(), north = bounds.getNorth();
  const dx = (east - west) / cellsPerSide;
  const dy = (north - south) / cellsPerSide;

  for(let i=0;i<cellsPerSide;i++){
    for(let j=0;j<cellsPerSide;j++){
      const sw = L.latLng(south + j*dy, west + i*dx);
      const ne = L.latLng(south + (j+1)*dy, west + (i+1)*dx);
      const rect = L.rectangle([sw, ne], {
        color: '#45e2d1',
        weight: 1.2,
        fillOpacity: 0.0,
        interactive: true,
        className: 'pulse'
      });
      rect.on('click', ()=>{
        // push current state to stack for "Back"
        stack.push({ bounds, cellsPerSide });
        level++;
        updateStatus();
        const cellBounds = L.latLngBounds(sw, ne);
        map.fitBounds(cellBounds, { padding: [30,30] });
        // draw a finer grid inside this cell
        drawGrid(cellBounds, Math.min(8, Math.floor(cellsPerSide*1.5))); // increase resolution
      });
      group.addLayer(rect);
    }
  }

  // Draw outer border a tad thicker for clarity
  const outline = L.rectangle(bounds, { color:'#45e2d1', weight: 2, fillOpacity:0, className:'pulse' });
  group.addLayer(outline);

  group.addTo(map);
  currentGridLayer = group;
}

function reset(){
  stack = [];
  level = 0;
  updateStatus();
  const usaBounds = L.latLngBounds([24.396308,-124.848974],[49.384358,-66.885444]);
  map.fitBounds(usaBounds, { padding:[20,20] });
  drawGrid(usaBounds, 7);
}

function goBack(){
  if(stack.length === 0){ reset(); return; }
  const { bounds, cellsPerSide } = stack.pop();
  level = Math.max(0, level-1);
  updateStatus();
  map.fitBounds(bounds, { padding:[30,30] });
  drawGrid(bounds, cellsPerSide);
}

resetBtn.addEventListener('click', reset);
backBtn.addEventListener('click', goBack);

// init
reset();
