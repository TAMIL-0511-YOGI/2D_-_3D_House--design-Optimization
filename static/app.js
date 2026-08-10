const $ = (selector) => document.querySelector(selector);
const state = { propertyType: 'Dream Home', bed: 3, bath: 2, result: null, formPayload: null, history: ['welcome'], planStyle: 'sketch', selectedFloor: 0 };
const storageKey = 'dreamhome-generated-concepts';
const planStyles = document.createElement('style');
planStyles.textContent = `.generated-plan .plan-paper{fill:url(#paper)!important}.generated-plan .dimension-line{fill:none!important;stroke:#77736b!important;stroke-width:1}.generated-plan .north{fill:#555148;font:700 9px 'DM Sans',sans-serif}.pencil-plan .plan-base{fill:#f8f5ed!important;stroke:#312f2b!important;stroke-width:6}.pencil-plan .room rect{fill:#faf8f3!important;stroke:#38352f!important;stroke-width:4}.pencil-plan .room text{fill:#34312d!important;font-family:Outfit,sans-serif;letter-spacing:.04em}.pencil-plan .room .dimension,.pencil-plan .plan-caption{fill:#6b665e!important}.pencil-plan .door{stroke:#58534c!important}.furnished-plan .plan-base{fill:#fdfbf4!important;stroke:#24211d!important;stroke-width:7}.furnished-plan .room rect{fill:#fdfbf4!important;stroke:#24211d!important;stroke-width:5}.furnished-plan .living rect{fill:#eef2e8!important}.furnished-plan .dining rect{fill:#fbf3dc!important}.furnished-plan .kitchen rect{fill:#f7ede5!important}.furnished-plan .bed rect{fill:#eff0f6!important}.furnished-plan .bath rect{fill:#e8f3f4!important}.furnished-plan .entry rect,.furnished-plan .outdoor rect{fill:#f5f3e9!important}.furnished-plan .furniture{fill:none!important;stroke:#777067!important;stroke-width:1.3}.furnished-plan .room text{font-size:12px!important;fill:#302d29!important}.furnished-plan .room .dimension{fill:#787168!important}.three-d-plan .room-wall{fill:#e8e1d5;stroke:#443f38;stroke-width:4}.three-d-plan .room-floor{stroke:#443f38;stroke-width:5}.three-d-plan .room-name{font:700 13px Outfit,sans-serif;fill:#2e2a26;text-anchor:middle}.three-d-plan .furniture{fill:none;stroke:#6c655d;stroke-width:2}`;
document.head.append(planStyles);
const floorStyles = document.createElement('style');
floorStyles.textContent = `.floor-switch{display:flex;gap:6px;max-width:1110px;margin:-7px auto 15px}.floor-switch button{border:1px solid #dce3ee;border-radius:6px;background:#fff;color:#67758c;padding:7px 11px;font:700 9px 'DM Sans',sans-serif;letter-spacing:.06em;cursor:pointer}.floor-switch button.active{border-color:#4778ec;background:#edf3ff;color:#356ce8}@media(max-width:760px){.floor-switch{margin-left:20px;margin-right:20px;overflow:auto}.floor-switch button{white-space:nowrap}}`;
document.head.append(floorStyles);
const toast = (message) => { const el = $('#toast'); el.textContent = message; el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 2800); };

function show(screen, push = true) {
  document.querySelectorAll('.screen').forEach(el => el.classList.toggle('active', el.dataset.screen === screen));
  if (push && state.history.at(-1) !== screen) state.history.push(screen);
  if (screen === 'model') renderFloorPlan(state.result?.seed || 2026);
  window.scrollTo(0, 0);
}

function planRooms(seed) {
  const data = state.formPayload || {}, floors = Math.max(1, Number(data.floors || 1));
  const hasTerrace = floors > 1 && state.propertyType === 'Dream Home';
  const floor = Math.min(state.selectedFloor, floors - 1 + Number(hasTerrace));
  const bedrooms = Math.max(1, Number(data.bedrooms || state.bed));
  const bathrooms = Math.max(1, Number(data.bathrooms || state.bath));
  const plotSize = Math.max(300, Number(data.landSize || 2400));
  const layoutCycle = Number(data.layoutCycle || 0);
  const variation = layoutCycle % 3;
  const direction = String(data.entrance || 'North-facing').split('-')[0].toUpperCase();
  const common = (n, x, y, w, h, c, door = 'bottom') => ({ n, x, y, w, h, c, door });
  // The seed changes the arrangement itself, rather than only changing a label.
  // It also makes smaller plots more compact and wider plots more open.
  const finish = rooms => {
    const scale = Math.min(1.08, Math.max(.88, Math.sqrt(plotSize / 2400))) * (1 + ((layoutCycle % 5) - 2) * .012);
    const resized = rooms.map(room => ({ ...room, x: 350 + (room.x - 350) * scale, y: 235 + (room.y - 235) * scale, w: room.w * scale, h: room.h * scale }));
    if (variation === 1) return resized.map(room => ({ ...room, x: 700 - room.x - room.w, door: room.door === 'left' ? 'right' : room.door === 'right' ? 'left' : room.door }));
    if (variation === 2) return resized.map(room => ({ ...room, y: 470 - room.y - room.h, door: room.door === 'bottom' ? 'top' : room.door }));
    return resized;
  };
  const bedroomSuite = (index, x, y, w, h) => [
    common(index === 1 ? 'MASTER BEDROOM' : `BEDROOM ${index}`, x, y, w - 58, h, 'bed', 'top'),
    common('ATT. BATH', x + w - 58, y, 58, Math.round(h * .62), 'bath', 'left'),
    common('BALCONY', x + w - 58, y + Math.round(h * .62), 58, h - Math.round(h * .62), 'outdoor')
  ];
  const bedroomZone = (startY, height, startX = 35, zoneWidth = 630) => {
    const columns = bedrooms <= 3 ? bedrooms : 2;
    const rows = Math.ceil(bedrooms / columns), gap = 10;
    const cellW = (zoneWidth - gap * (columns - 1)) / columns, cellH = (height - gap * (rows - 1)) / rows;
    return Array.from({ length: bedrooms }, (_, i) => bedroomSuite(i + 1, startX + (i % columns) * (cellW + gap), startY + Math.floor(i / columns) * (cellH + gap), cellW, cellH)).flat();
  };

  // A two-storey home deliberately keeps sleeping spaces upstairs.  Every upper
  // bedroom is drawn as a self-contained suite, rather than a loose rectangle.
  if (floors > 1 && state.propertyType === 'Dream Home') {
    if (floor === 0) return finish([
      common(`${direction} ENTRY`, 35, 230, 105, 160, 'entry', 'right'),
      common('CENTRAL LIVING ROOM', 140, 80, 310, 310, 'living', 'left'),
      common('KITCHEN', 450, 80, 120, 130, 'kitchen', 'left'),
      common('POOJA ROOM', 570, 80, 95, 130, 'outdoor', 'left'),
      common('DINING', 450, 210, 105, 180, 'dining', 'left'),
      common('STAIRCASE UP', 555, 210, 110, 180, 'entry', 'left'),
      ...(bathrooms > bedrooms && String(data.parking || '').startsWith('No') ? [common('COMMON BATH', 35, 80, 105, 150, 'bath', 'right')] : []),
      ...(String(data.parking || '').startsWith('No') ? [] : [common('CAR PORCH', 35, 80, 105, 150, 'outdoor', 'right')])
    ]);
    if (floor === floors) return finish([
      common('OPEN TERRACE', 35, 80, 415, 310, 'outdoor'), common('TERRACE LOUNGE', 450, 80, 125, 180, 'living'),
      common('ROOF GARDEN', 450, 260, 125, 130, 'outdoor'), common('STAIRCASE DOWN', 575, 80, 90, 310, 'entry')
    ]);
    return finish([common('FAMILY LOUNGE', 35, 80, 630, 80, 'living'), common('STAIRCASE', 35, 160, 110, 230, 'entry'), ...bedroomZone(160, 230, 145, 520)]);
  }

  // Single-floor homes retain the same entrance-to-living hierarchy, followed
  // by a private bedroom zone along the rear of the plot.
  return finish([
    common(`${direction} ENTRY`, 35, 80, 115, 160, 'entry', 'right'), common('CENTRAL LIVING ROOM', 150, 80, 275, 160, 'living', 'left'),
    common('KITCHEN', 425, 80, 145, 115, 'kitchen', 'left'), common('POOJA ROOM', 570, 80, 95, 115, 'outdoor', 'left'),
    common('DINING', 425, 195, 240, 45, 'dining', 'left'), ...bedroomZone(250, 140)
  ]);
}

function furniture(room) {
  const { x, y, w, h, c } = room, f = 'class="furniture"';
  if (room.n.includes('STAIRCASE')) return Array.from({ length: 7 }, (_, i) => `<line ${f} x1="${x+w*.18}" y1="${y+h*(.14+i*.10)}" x2="${x+w*.82}" y2="${y+h*(.14+i*.10)}"/>`).join('');
  if (room.n === 'POOJA ROOM') return `<rect ${f} x="${x+w*.30}" y="${y+h*.32}" width="${w*.40}" height="${h*.42}"/><path ${f} d="M${x+w*.38} ${y+h*.32}l${w*.12}-${h*.16}l${w*.12} ${h*.16}"/>`;
  if (c === 'living') return `<rect ${f} x="${x+w*.34}" y="${y+h*.40}" width="${w*.32}" height="${h*.22}"/><rect ${f} x="${x+w*.42}" y="${y+h*.15}" width="${w*.16}" height="${h*.13}"/><rect ${f} x="${x+w*.42}" y="${y+h*.74}" width="${w*.16}" height="${h*.09}"/>`;
  if (c === 'dining') return `<rect ${f} x="${x+w*.29}" y="${y+h*.33}" width="${w*.42}" height="${h*.30}"/>${[0,1,2,3].map(i => `<rect ${f} x="${x+w*(.20+(i%2)*.52)}" y="${y+h*(.32+Math.floor(i/2)*.31)}" width="${w*.08}" height="${h*.11}"/>`).join('')}`;
  if (c === 'kitchen') return `<path ${f} d="M${x+w*.10} ${y+h*.15}v${h*.65}h${w*.27}v-${h*.18}h${w*.42}v-${h*.47}"/><circle ${f} cx="${x+w*.20}" cy="${y+h*.62}" r="${Math.min(w,h)*.055}"/><circle ${f} cx="${x+w*.32}" cy="${y+h*.62}" r="${Math.min(w,h)*.055}"/>`;
  if (c === 'bed') return `<rect ${f} x="${x+w*.25}" y="${y+h*.24}" width="${w*.50}" height="${h*.50}"/><line ${f} x1="${x+w*.25}" y1="${y+h*.38}" x2="${x+w*.75}" y2="${y+h*.38}"/>`;
  if (c === 'bath') return `<rect ${f} x="${x+w*.20}" y="${y+h*.18}" width="${w*.58}" height="${h*.27}" rx="8"/><ellipse ${f} cx="${x+w*.50}" cy="${y+h*.70}" rx="${w*.16}" ry="${h*.11}"/>`;
  if (c === 'entry') return `<path ${f} d="M${x+w*.18} ${y+h*.24}h${w*.60}v${h*.18}h-${w*.60}z M${x+w*.34} ${y+h*.63}h${w*.32}v${h*.16}h-${w*.32}z"/>`;
  if (c === 'outdoor') return `<path ${f} d="M${x+w*.28} ${y+h*.75}v-${h*.48}h${w*.18}v${h*.48} M${x+w*.57} ${y+h*.75}v-${h*.48}h${w*.18}v${h*.48}"/>`;
  return '';
}

function renderFloorSelector() {
  const holder = $('#floorSelector');
  if (!holder) return;
  const floors = Math.max(1, Number(state.formPayload?.floors || 1));
  const hasTerrace = floors > 1 && state.propertyType === 'Dream Home';
  holder.innerHTML = Array.from({ length: floors + Number(hasTerrace) }, (_, floor) => `<button class="${floor === state.selectedFloor ? 'active' : ''}" data-floor="${floor}">${floor === 0 ? 'GROUND FLOOR' : hasTerrace && floor === floors ? 'OPEN TERRACE' : `FLOOR ${floor}`}</button>`).join('');
  holder.querySelectorAll('[data-floor]').forEach(button => button.onclick = () => { state.selectedFloor = Number(button.dataset.floor); renderFloorPlan(state.result?.seed || 2026); });
}

function renderFloorPlan(seed) {
  renderFloorSelector();
  const rooms = planRooms(seed);
  const doorPath = room => {
    if (room.door === 'left') return `M${room.x} ${room.y + room.h - 42} h28 a28 28 0 0 0 -28 -28`;
    if (room.door === 'right') return `M${room.x + room.w} ${room.y + room.h - 42} h-28 a28 28 0 0 1 28 -28`;
    if (room.door === 'top') return `M${room.x + room.w - 42} ${room.y} v28 a28 28 0 0 1 -28 -28`;
    return `M${room.x + room.w - 42} ${room.y + room.h} v-28 a28 28 0 0 0 -28 28`;
  };
  if (state.planStyle === '3d') {
    const colours = { living:'#dfe9d7', dining:'#f9e8b9', kitchen:'#f2ddd0', bed:'#dce5f3', bath:'#d6edf1', entry:'#eee9dd', outdoor:'#dce8c5' };
    const room3d = rooms.map(room => {
      const colour = colours[room.c] || '#eee9dd';
      const wallHeight = 22;
      return `<g><path class="room-wall" d="M${room.x} ${room.y}h${room.w}v-${wallHeight}h-${room.w}z M${room.x + room.w} ${room.y}v${room.h}l${wallHeight} -${wallHeight}v-${room.h}z M${room.x} ${room.y + room.h}h${room.w}v18h-${room.w}z"/><rect class="room-floor" fill="${colour}" x="${room.x}" y="${room.y}" width="${room.w}" height="${room.h}"/>${furniture(room)}<text class="room-name" x="${room.x + room.w / 2}" y="${room.y + room.h / 2}">${room.n}</text></g>`;
    }).join('');
    $('#floorPlan').innerHTML = `<svg class="generated-plan three-d-plan" viewBox="0 0 700 420" role="img" aria-label="3D floor plan generated from the current 2D layout"><rect width="700" height="420" fill="#e8edf0"/><ellipse cx="360" cy="350" rx="280" ry="42" fill="#b9c6be" opacity=".45"/><g transform="translate(45 12) skewX(-22) scale(0.88 0.78)"><rect x="15" y="55" width="670" height="350" fill="#d8d1c4" stroke="#443f38" stroke-width="8"/>${room3d}</g><text x="34" y="392" fill="#4d5960" font-family="DM Sans, sans-serif" font-size="10" font-weight="700">3D FLOOR PLAN · SAME LAYOUT AS THE SELECTED 2D PLAN</text></svg>`;
    return;
  }
  const furnished = state.planStyle === 'furnished';
  const roomSvg2 = rooms.map(room => {
    const compact = room.w < 90 || room.h < 85;
    const labelSize = compact ? 7 : room.w < 130 ? 9 : 12;
    const labelY = room.y + room.h / 2 - (furnished && !compact ? 34 : compact ? 0 : 4);
    const dimension = compact ? '' : `<text class="dimension" x="${room.x + room.w / 2}" y="${room.y + room.h / 2 + (furnished ? -15 : 18)}">${Math.max(9, Math.round(room.w / 18))}' x ${Math.max(8, Math.round(room.h / 17))}'</text>`;
    return `<g class="room ${room.c}"><rect x="${room.x}" y="${room.y}" width="${room.w}" height="${room.h}"/><path class="door" d="${doorPath(room)}"/>${furnished ? furniture(room) : ''}<text style="font-size:${labelSize}px!important" x="${room.x + room.w / 2}" y="${labelY}">${room.n}</text>${dimension}</g>`;
  }).join('');
  const type = furnished ? 'FURNISHED 2D PLAN' : 'PENCIL SKETCH PLAN';
  $('#floorPlan').innerHTML = `<svg class="generated-plan ${furnished ? 'furnished-plan' : 'pencil-plan'}" viewBox="0 0 700 420" role="img" aria-label="${type}"><defs><pattern id="paper" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".35" fill="#bdb7aa" opacity=".32"/></pattern></defs><rect class="plan-base" x="12" y="5" width="676" height="405"/><rect class="plan-paper" x="12" y="5" width="676" height="405"/>${roomSvg2}<path class="dimension-line" d="M35 25H665 M35 20v10 M665 20v10"/><text class="north" x="653" y="48">N ↑</text><text class="plan-caption" x="28" y="402">${type} · ${state.formPayload?.entrance || 'NORTH-FACING'} · VARIATION ${String(seed).slice(-3)}</text></svg>`;
  return;
  const roomSvg = rooms.map(room => `<g class="room ${room.c}"><rect x="${room.x}" y="${room.y}" width="${room.w}" height="${room.h}" rx="2"/><path class="door" d="M${room.x + room.w - 42} ${room.y + room.h} v-28 a28 28 0 0 0 -28 28"/><text x="${room.x + room.w / 2}" y="${room.y + room.h / 2 - 4}">${room.n}</text><text class="dimension" x="${room.x + room.w / 2}" y="${room.y + room.h / 2 + 18}">${Math.max(9, Math.round(room.w / 18))}' × ${Math.max(8, Math.round(room.h / 17))}'</text></g>`).join('');
  $('#floorPlan').innerHTML = `<svg class="generated-plan" viewBox="0 0 700 420" role="img" aria-label="Generated 2D floor plan"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="#d7d1c5" stroke-width=".4"/></pattern></defs><rect class="plan-base" x="12" y="5" width="676" height="405" rx="5"/><rect class="plan-grid" x="12" y="5" width="676" height="405" rx="5"/>${roomSvg}<text class="plan-caption" x="28" y="404">GENERATED 2D CONCEPT · VARIATION ${String(seed).slice(-3)}</text></svg>`;
}

function paintHouse(seed) {
  const palettes = [ ['#34466c','#f5eee5','#d6c5b5','#80b8c2'], ['#263c58','#f1eee7','#c9c4b9','#9cc9d8'], ['#55415c','#f5eee5','#d9c8bd','#9ec0ad'] ][seed % 3];
  $('#house .roof').style.borderBottomColor = palettes[0];
  $('#house .front-wall').style.background = palettes[1];
  $('#house .side-wall').style.background = palettes[2];
  document.querySelectorAll('#house .front-wall i').forEach(window => window.style.background = palettes[3]);
  rotation = -30 + (seed % 60); $('#house').style.transform = `perspective(600px) rotateY(${rotation}deg)`;
}

function persistConcept(record) {
  const concepts = JSON.parse(localStorage.getItem(storageKey) || '[]');
  concepts.unshift(record); localStorage.setItem(storageKey, JSON.stringify(concepts.slice(0, 15)));
}

function historyPreview(seed) {
  const blocks = [['#e6edf7','#f8e8cf','#ebe5f4'], ['#e9f1e2','#dceef1','#f8f0ca'], ['#ebe5f4','#e6edf7','#dce8dd']][seed % 3];
  return `<div class="history-preview"><div class="mini-plan"><i style="background:${blocks[0]}"></i><i style="background:${blocks[1]}"></i><i style="background:${blocks[2]}"></i><i style="background:${blocks[0]}"></i></div><div class="mini-house"><span style="--mini-roof:${blocks[2]}"></span><i></i></div></div>`;
}

function renderHistory() {
  const concepts = JSON.parse(localStorage.getItem(storageKey) || '[]');
  $('#historyList').innerHTML = concepts.length ? concepts.map((concept, index) => `<button class="history-item" data-history-index="${index}">${historyPreview(concept.seed)}<span><b>${concept.result.style}</b><small>${concept.payload.propertyType} · ${Number(concept.result.builtUp).toLocaleString()} sq ft · variation ${String(concept.seed).slice(-3)}</small><strong>2D layout + 3D home view</strong></span><em>Open concept →</em></button>`).join('') : '<p class="empty-history">Your generated concepts will appear here after you create your first design.</p>';
  document.querySelectorAll('[data-history-index]').forEach(button => button.onclick = () => { const concept = concepts[Number(button.dataset.historyIndex)]; applyConcept(concept.result, concept.payload, false); show('model'); toast('Previous concept reopened.'); });
}

function applyConcept(result, payload, store = true) {
  state.result = result; state.formPayload = payload; state.selectedFloor = 0;
  $('#designTitle').textContent = result.style;
  $('#areaMetric').textContent = Number(result.builtUp).toLocaleString() + ' sq ft';
  $('#scoreMetric').textContent = result.score;
  $('#ideaSummary').textContent = payload.ideas?.trim() || 'Thoughtful family living';
  renderFloorPlan(result.seed);
  if (store) { persistConcept({ seed: result.seed, result, payload, generatedAt: new Date().toISOString() }); renderHistory(); }
}

async function generateConcept(payload) {
  const response = await fetch('/api/generate', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
  if (!response.ok) throw new Error('Generation failed');
  applyConcept(await response.json(), payload);
}

document.querySelectorAll('[data-go]').forEach(btn => btn.onclick = () => show(btn.dataset.go));
document.querySelectorAll('[data-back]').forEach(btn => btn.onclick = () => { if (state.history.length > 1) { state.history.pop(); show(state.history.at(-1), false); } else show('welcome', false); });
document.querySelectorAll('#propertyType button').forEach(button => button.onclick = () => { document.querySelectorAll('#propertyType button').forEach(b => b.classList.remove('chosen')); button.classList.add('chosen'); state.propertyType = button.dataset.value; document.querySelectorAll('[data-type-panel]').forEach(panel => panel.classList.toggle('active', panel.dataset.typePanel === state.propertyType)); });
document.querySelectorAll('.qty').forEach(button => button.onclick = () => { const room = button.dataset.room; state[room] = Math.max(1, state[room] + Number(button.dataset.change)); $('#' + room + 'Count').textContent = state[room]; });
document.querySelectorAll('.mode-switch button').forEach(button => button.onclick = () => { state.planStyle = button.dataset.mode; document.querySelectorAll('.mode-switch button').forEach(b => b.classList.toggle('active', b === button)); renderFloorPlan(state.result?.seed || 2026); });

$('#designForm').onsubmit = async event => { event.preventDefault(); const button = $('.generate'); button.disabled = true; button.textContent = 'Creating your concept…'; const values = Object.fromEntries(new FormData(event.currentTarget).entries()); const payload = { ...values, propertyType: state.propertyType, bedrooms: state.bed, bathrooms: state.bath, features: [...event.currentTarget.querySelectorAll('input[type="checkbox"]:checked')].map(input => input.name), ideas: $('#designIdeas').value }; try { await generateConcept(payload); show('model'); toast('A unique layout variation is ready to explore.'); } catch { toast('Could not generate. Please try again.'); } finally { button.disabled = false; button.innerHTML = 'Create my design <span>→</span>'; } };

$('#regenerate').onclick = async () => { if (!state.formPayload) return; const button = $('#regenerate'); button.disabled = true; button.textContent = 'Generating…'; state.formPayload.layoutCycle = Number(state.formPayload.layoutCycle || 0) + 1; try { await generateConcept(state.formPayload); toast(`New layout variation ${state.formPayload.layoutCycle + 1} generated.`); } catch { toast('Could not generate. Please try again.'); } finally { button.disabled = false; button.innerHTML = '↻ Regenerate'; } };
$('#openHistory').onclick = () => { renderHistory(); show('history'); };

$('#saveDesign').onclick = async () => { const data = { ...state, title: $('#designTitle').textContent, ideas: $('#designIdeas').value }; try { await fetch('/api/save', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) }); toast('Concept saved to your local library.'); } catch { toast('Could not save your concept.'); } };

renderFloorPlan(2026); renderHistory();
