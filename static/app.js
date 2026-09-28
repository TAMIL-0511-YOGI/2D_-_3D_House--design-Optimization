const $ = (selector) => document.querySelector(selector);
const state = {
  propertyType: 'Dream Home',
  bed: 3,
  bath: 2,
  result: null,
  formPayload: null,
  history: ['welcome'],
  planStyle: 'furnished',
  selectedFloor: 0,
  cameraView: 'iso',
  lightingMode: 'day'
};
const storageKey = 'dreamhome-generated-concepts';

// Inject plan-specific styles
const planStyles = document.createElement('style');
planStyles.textContent = `
.floor-switch{display:flex;gap:6px;max-width:1110px;margin:-7px auto 14px;flex-wrap:wrap}
.floor-switch button{border:1px solid #dce3ee;border-radius:7px;background:#fff;color:#5e6d85;padding:8px 14px;font:700 10px 'DM Sans',sans-serif;letter-spacing:.06em;cursor:pointer;transition:all .15s ease}
.floor-switch button:hover{background:#f0f5fc;border-color:#b9cce6;color:#2c5ec7}
.floor-switch button.active{border-color:#356ce8;background:#edf3ff;color:#275bcf;font-weight:700;box-shadow:0 2px 6px #356ce822}

.generated-plan{width:100%;height:100%;display:block}
.pencil-plan .plan-bg{fill:#fbf9f4}
.pencil-plan .blueprint-grid{stroke:#d8d3c5;stroke-width:0.5;opacity:0.6}
.pencil-plan .wall{fill:none;stroke:#2c2824;stroke-width:5;stroke-linecap:square}
.pencil-plan .wall-hatch{stroke:#787267;stroke-width:1}
.pencil-plan .room-label{font-family:'DM Sans',sans-serif;font-weight:700;fill:#2c2824;text-anchor:middle}
.pencil-plan .dim-text{font-family:'DM Sans',sans-serif;font-size:9px;fill:#6f695e;text-anchor:middle}
.pencil-plan .dim-line{stroke:#8c8475;stroke-width:1;stroke-dasharray:3 2}
.pencil-plan .door-swing{fill:none;stroke:#5c5549;stroke-width:1.4;stroke-dasharray:4 2}

.furnished-plan .plan-bg{fill:#f4f6f9}
.furnished-plan .room-outline{stroke:#212529;stroke-width:4.5;stroke-linejoin:round}
.furnished-plan .room-name{font-family:Outfit,sans-serif;font-weight:700;fill:#1b2434;text-anchor:middle}
.furnished-plan .room-size{font-family:'DM Sans',sans-serif;font-size:9.5px;font-weight:600;fill:#5a687d;text-anchor:middle}
.furnished-plan .door-arc{fill:none;stroke:#687890;stroke-width:1.2;stroke-dasharray:3 2}
.furnished-plan .glass-window{stroke:#75a8d9;stroke-width:3;stroke-linecap:round}
`;
document.head.append(planStyles);

const toast = (message) => {
  const el = $('#toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2800);
};

function show(screen, push = true) {
  document.querySelectorAll('.screen').forEach(el => el.classList.toggle('active', el.dataset.screen === screen));
  if (push && state.history.at(-1) !== screen) state.history.push(screen);
  if (screen === 'model') renderFloorPlan(state.result?.seed || 2026);
  window.scrollTo(0, 0);
}

// -------------------------------------------------------------
// Multi-Property Procedural Architectural Layout Generator
// Handles: Dream Home (Personal), Rental Homes (Full Rental Building), and Home + Rental (Owner Ground + Upper Rentals)
// -------------------------------------------------------------
function planRooms(seed) {
  const data = state.formPayload || {};
  const propType = state.propertyType || data.propertyType || 'Home + Rental';
  const floors = Math.max(1, Number(data.floors || 2));
  const hasTerrace = floors > 1;
  const floor = Math.min(state.selectedFloor, floors - 1 + Number(hasTerrace));
  const plotSize = Math.max(300, Number(data.landSize || 2400));
  const layoutCycle = Number(data.layoutCycle || 0);
  const cycle = layoutCycle % 4;
  const direction = String(data.entrance || 'North-facing').split('-')[0].toUpperCase();
  const parkingType = String(data.parking || '2 cars');
  const carCount = parkingType.startsWith('No') ? 0 : parkingType.startsWith('1') ? 1 : 2;

  const make = (n, x, y, w, h, c, door = 'bottom', extra = {}) => ({ n, x, y, w, h, c, door, ...extra });
  const finish = (rooms) => rooms;

  // =========================================================================
  // 1. HOME + RENTAL (Ground Floor: Owner House, Upper Floors: Rental Houses)
  // =========================================================================
  if (propType === 'Home + Rental') {
    // --- GROUND FLOOR: OWNER RESIDENCE ---
    if (floor === 0) {
      if (cycle === 0) {
        // Executive Owner Residence with Independent Tenant Staircase & Meter Tower
        return finish([
          make('OWNER 2-CAR PORCH', 25, 190, 160, 195, 'garage', 'top', { cars: 2 }),
          make(`OWNER ${direction} FOYER`, 25, 55, 160, 125, 'entry', 'right'),
          make('OWNER GRAND LIVING', 195, 55, 260, 200, 'living', 'left'),
          make('OWNER DINING AREA', 195, 265, 150, 120, 'dining', 'top'),
          make('OWNER GOURMET KITCHEN', 465, 55, 130, 150, 'kitchen', 'left'),
          make('OWNER MASTER SUITE', 465, 215, 130, 170, 'bed', 'left', { isMaster: true }),
          make('OWNER POOJA & UTILITY', 355, 265, 100, 120, 'bath', 'left'),
          make('TENANT EXTERNAL STAIRS', 605, 55, 75, 200, 'stairs', 'left'),
          make('TENANT METERS & BIKE DECK', 605, 265, 75, 120, 'entry', 'left')
        ]);
      } else if (cycle === 1) {
        // Courtyard Owner Villa with Side Tenant Pathway
        return finish([
          make('OWNER CARPORT & LAWN', 25, 55, 160, 140, 'garage', 'bottom', { cars: 1 }),
          make('OWNER MASTER SUITE', 25, 205, 160, 180, 'bed', 'right', { isMaster: true }),
          make('OWNER CENTRAL COURTYARD', 195, 55, 130, 140, 'outdoor', 'left'),
          make('OWNER FAMILY LIVING', 195, 205, 260, 180, 'living', 'top'),
          make('OWNER KITCHEN & DINING', 335, 55, 120, 140, 'kitchen', 'bottom'),
          make('OWNER BEDROOM 2 / STUDY', 465, 205, 130, 180, 'bed', 'left'),
          make('OWNER BATHROOM', 465, 55, 130, 140, 'bath', 'left'),
          make('TENANT EXTERNAL STAIRCASE', 605, 55, 75, 220, 'stairs', 'left'),
          make('TENANT SUB-METERS & WALKWAY', 605, 285, 75, 100, 'entry', 'left')
        ]);
      } else if (cycle === 2) {
        // Symmetrical Owner House + Rear Tenant Staircase
        return finish([
          make('OWNER DOUBLE GARAGE', 25, 190, 160, 195, 'garage', 'top', { cars: 2 }),
          make(`OWNER ${direction} ENTRY`, 25, 55, 160, 125, 'entry', 'right'),
          make('OWNER LIVING & LOUNGE', 195, 55, 260, 200, 'living', 'left'),
          make('OWNER DINING ROOM', 195, 265, 160, 120, 'dining', 'top'),
          make('OWNER ISLAND KITCHEN', 465, 55, 130, 150, 'kitchen', 'left'),
          make('OWNER MASTER BEDROOM', 465, 215, 130, 170, 'bed', 'left', { isMaster: true }),
          make('TENANT EXTERNAL STAIRS', 605, 55, 70, 200, 'stairs', 'left'),
          make('TENANT METERS & UTILITY', 605, 265, 70, 120, 'entry', 'left')
        ]);
      } else {
        // Dual-Frontage Owner Villa & Tenant Entry Walkway
        return finish([
          make('OWNER VERANDAH & CARPORT', 25, 55, 180, 130, 'garage', 'bottom', { cars: 2 }),
          make('OWNER MASTER BEDROOM', 25, 195, 180, 190, 'bed', 'top', { isMaster: true }),
          make('OWNER GREAT HALL & DINING', 215, 55, 250, 210, 'living', 'left'),
          make('OWNER CHEF KITCHEN', 215, 275, 150, 110, 'kitchen', 'top'),
          make('OWNER ATTACHED BATH', 375, 275, 90, 110, 'bath', 'left'),
          make('TENANT ACCESS WALKWAY', 475, 55, 190, 60, 'entry', 'bottom'),
          make('TENANT EXTERNAL STAIRWAY', 475, 125, 190, 130, 'stairs', 'top'),
          make('TENANT BIKE PARKING & METERS', 475, 265, 190, 120, 'entry', 'left')
        ]);
      }
    }

    // --- 1ST FLOOR / UPPER FLOORS: INDEPENDENT RENTAL HOUSES ---
    if (floor === 1 || (floor > 1 && floor < floors)) {
      if (cycle === 0 || cycle === 3) {
        // Twin 1BHK Independent Rental Flats (Each with Private Balcony & Sub-Meters)
        return finish([
          make('TENANT STAIR LANDING & LOBBY', 295, 55, 100, 120, 'stairs', 'bottom'),
          make('COMMON UTILITY & METERS', 295, 185, 100, 200, 'entry', 'left'),
          // Rental Flat 1 (Left 1BHK Unit)
          make('RENTAL 1 LIVING ROOM', 25, 55, 160, 195, 'living', 'right'),
          make('RENTAL 1 KITCHENETTE', 25, 260, 160, 125, 'kitchen', 'top'),
          make('RENTAL 1 BEDROOM', 195, 55, 90, 195, 'bed', 'left'),
          make('RENTAL 1 BATH & BALCONY', 195, 260, 90, 125, 'bath', 'left'),
          // Rental Flat 2 (Right 1BHK Unit)
          make('RENTAL 2 BEDROOM', 405, 55, 95, 195, 'bed', 'right'),
          make('RENTAL 2 BATH & BALCONY', 405, 260, 95, 125, 'bath', 'right'),
          make('RENTAL 2 LIVING ROOM', 510, 55, 165, 195, 'living', 'left'),
          make('RENTAL 2 KITCHENETTE', 510, 260, 165, 125, 'kitchen', 'top')
        ]);
      } else if (cycle === 1) {
        // Spacious 2BHK Rental House for Premium Tenant Family
        return finish([
          make('TENANT STAIRWAY & ENTRY FOYER', 25, 55, 110, 130, 'stairs', 'bottom'),
          make('RENTAL 2BHK LIVING & DINING', 145, 55, 240, 195, 'living', 'left'),
          make('RENTAL FRONT BALCONY', 145, 260, 240, 125, 'outdoor', 'top'),
          make('RENTAL MODULAR KITCHEN & UTILITY', 395, 55, 135, 150, 'kitchen', 'left'),
          make('RENTAL MASTER BEDROOM', 395, 215, 135, 170, 'bed', 'left', { isMaster: true }),
          make('RENTAL BEDROOM 2', 540, 55, 140, 180, 'bed', 'left'),
          make('RENTAL BATHROOM & BALCONY', 540, 245, 140, 140, 'bath', 'left')
        ]);
      } else {
        // 1BHK Flat + Studio/Bachelor Unit Combo
        return finish([
          make('TENANT STAIRWAY & LOBBY', 305, 55, 90, 120, 'stairs', 'bottom'),
          make('TENANT SUB-METER DUCT', 305, 185, 90, 200, 'entry', 'left'),
          // Flat A (1BHK)
          make('RENTAL 1BHK LIVING & DINING', 25, 55, 170, 200, 'living', 'right'),
          make('RENTAL 1BHK KITCHEN', 25, 265, 170, 120, 'kitchen', 'top'),
          make('RENTAL 1BHK BEDROOM', 205, 55, 90, 190, 'bed', 'left'),
          make('RENTAL 1BHK BATH & BALCONY', 205, 255, 90, 130, 'bath', 'left'),
          // Flat B (Studio / 1RK)
          make('STUDIO LIVING & BED', 405, 55, 145, 200, 'living', 'left'),
          make('STUDIO KITCHENETTE', 405, 265, 145, 120, 'kitchen', 'top'),
          make('STUDIO BATH & BALCONY', 560, 55, 115, 330, 'bath', 'left')
        ]);
      }
    }

    // --- ROOF TERRACE ---
    return finish([
      make('OWNER PRIVATE ROOF TERRACE', 25, 55, 320, 330, 'outdoor'),
      make('STAIRCASE CABIN', 355, 270, 105, 115, 'stairs'),
      make('TENANT OVERHEAD WATER TANKS', 475, 55, 100, 190, 'entry'),
      make('OWNER & TENANT SOLAR DECK', 475, 255, 195, 130, 'outdoor')
    ]);
  }

  // =========================================================================
  // 2. RENTAL HOMES (Full Multi-Unit Commercial Rental Building)
  // =========================================================================
  if (propType === 'Rental Homes') {
    if (floor === 0) {
      // Ground Floor: Covered Stilt Parking + Two 1BHK Units
      return finish([
        make('COVERED STILT PARKING', 25, 55, 260, 160, 'garage', 'bottom', { cars: 2 }),
        make('BIKE PARKING & METERS', 25, 225, 260, 160, 'garage', 'top', { cars: 1 }),
        make('CENTRAL STAIRCASE & LOBBY', 295, 55, 90, 330, 'stairs', 'left'),
        make('GROUND FLAT 1 LIVING', 395, 55, 140, 180, 'living', 'left'),
        make('GROUND FLAT 1 KITCHEN', 395, 245, 140, 140, 'kitchen', 'top'),
        make('GROUND FLAT 1 BEDROOM', 545, 55, 130, 180, 'bed', 'left'),
        make('GROUND FLAT 1 BATH', 545, 245, 130, 140, 'bath', 'left')
      ]);
    } else if (floor < floors) {
      // Upper Floors: Two Independent 1BHK / 2BHK Rental Flats
      return finish([
        make('COMMON STAIR LANDING', 295, 55, 90, 130, 'stairs', 'bottom'),
        make('ELECTRICAL & WATER DUCT', 295, 195, 90, 190, 'entry', 'left'),
        // Rental Flat Left
        make('RENTAL FLAT A LIVING', 25, 55, 165, 190, 'living', 'right'),
        make('RENTAL FLAT A KITCHEN', 25, 255, 165, 130, 'kitchen', 'top'),
        make('RENTAL FLAT A BEDROOM', 200, 55, 85, 190, 'bed', 'left'),
        make('RENTAL FLAT A BATH', 200, 255, 85, 130, 'bath', 'left'),
        // Rental Flat Right
        make('RENTAL FLAT B BEDROOM', 395, 55, 95, 190, 'bed', 'right'),
        make('RENTAL FLAT B BATH', 395, 255, 95, 130, 'bath', 'right'),
        make('RENTAL FLAT B LIVING', 500, 55, 175, 190, 'living', 'left'),
        make('RENTAL FLAT B KITCHEN', 500, 255, 175, 130, 'kitchen', 'top')
      ]);
    } else {
      // Common Roof Terrace
      return finish([
        make('COMMON ROOF TERRACE', 25, 55, 320, 330, 'outdoor'),
        make('STAIRCASE CABIN', 355, 270, 105, 115, 'stairs'),
        make('SOLAR POWER & TANKS', 475, 55, 200, 330, 'outdoor')
      ]);
    }
  }

  // =========================================================================
  // 3. DREAM HOME (Personal House - 4 Distinct Architectural Variations)
  // =========================================================================
  if (floor === 0) {
    if (cycle === 0) {
      // Variation 0: Courtyard Modern Residence
      const list = [];
      if (carCount > 0) list.push(make(carCount === 1 ? '1-CAR GARAGE' : 'DOUBLE GARAGE', 35, 190, 160, 195, 'garage', 'top', { cars: carCount }));
      else list.push(make('FRONT VERANDAH', 35, 190, 160, 195, 'outdoor', 'top'));
      list.push(make(`${direction} ENTRY FOYER`, 35, 60, 160, 120, 'entry', 'right'));
      list.push(make('GREAT LIVING ROOM', 205, 60, 260, 205, 'living', 'left'));
      list.push(make('DINING AREA', 205, 275, 155, 110, 'dining', 'top'));
      list.push(make('GOURMET KITCHEN', 475, 60, 190, 150, 'kitchen', 'left'));
      list.push(make('STAIRCASE', 370, 275, 95, 110, 'stairs', 'left'));
      list.push(make('GUEST BEDROOM', 475, 220, 190, 115, 'bed', 'left'));
      list.push(make('GUEST BATH', 475, 345, 190, 40, 'bath', 'left'));
      return finish(list);
    } else if (cycle === 1) {
      // Variation 1: Open-Concept L-Shaped Executive Villa
      return finish([
        make('CARPORT & ENTRYWAY', 35, 55, 165, 150, 'garage', 'bottom', { cars: 2 }),
        make('HOME OFFICE / STUDY', 35, 215, 165, 170, 'office', 'right'),
        make('OPEN GREAT HALL', 210, 55, 275, 220, 'living', 'left'),
        make('CHEF PENINSULA KITCHEN', 210, 285, 165, 100, 'kitchen', 'top'),
        make('DINING SPACE', 385, 285, 100, 100, 'dining', 'top'),
        make('MASTER BEDROOM SUITE', 495, 55, 170, 200, 'bed', 'left', { isMaster: true }),
        make('MASTER ENSUITE BATH', 495, 265, 90, 120, 'bath', 'top'),
        make('ALFRESCO PATIO DECK', 595, 265, 70, 120, 'outdoor', 'top')
      ]);
    } else if (cycle === 2) {
      // Variation 2: Symmetrical Center-Hall Estate
      return finish([
        make('WEST FORMAL LIVING', 35, 55, 190, 215, 'living', 'right'),
        make('MEDIA & ENTERTAINMENT', 35, 280, 190, 105, 'living', 'top'),
        make('GRAND CENTER FOYER', 235, 55, 190, 170, 'entry', 'bottom'),
        make('CIRCULAR STAIRCASE', 235, 235, 190, 150, 'stairs', 'top'),
        make('FORMAL DINING ROOM', 435, 55, 230, 140, 'dining', 'left'),
        make('CHEF ISLAND KITCHEN', 435, 205, 150, 180, 'kitchen', 'left'),
        make('POWDER & PANTRY', 595, 205, 70, 180, 'bath', 'left')
      ]);
    } else {
      // Variation 3: Dual-Wing Modern Pavilion Home
      return finish([
        make('GRAND LIVING PAVILION', 35, 55, 215, 200, 'living', 'right'),
        make('ALFRESCO OUTDOOR DECK', 35, 265, 215, 120, 'outdoor', 'top'),
        make('GLASS BREEZEWAY ENTRY', 260, 55, 140, 140, 'entry', 'bottom'),
        make('OPEN CHEF KITCHEN & DINING', 260, 205, 140, 180, 'kitchen', 'top'),
        make('MASTER SUITE', 410, 55, 160, 190, 'bed', 'left', { isMaster: true }),
        make('MASTER LUXURY BATH', 580, 55, 85, 190, 'bath', 'left'),
        make('BEDROOM 2', 410, 255, 160, 130, 'bed', 'left'),
        make('BATHROOM 2', 580, 255, 85, 130, 'bath', 'left')
      ]);
    }
  }

  // --- Dream Home Floor 1 ---
  if (floor === 1 && floors > 1) {
    return finish([
      make('MASTER BEDROOM SUITE', 35, 60, 240, 200, 'bed', 'right', { isMaster: true }),
      make('MASTER LUXURY BATH', 35, 270, 140, 115, 'bath', 'top'),
      make('PRIVATE BALCONY', 185, 270, 90, 115, 'outdoor', 'top'),
      make('UPPER FAMILY LOUNGE', 285, 60, 180, 190, 'living', 'left'),
      make('STAIRCASE DOWN', 285, 260, 95, 125, 'stairs', 'top'),
      make('BEDROOM 2', 475, 60, 190, 155, 'bed', 'left'),
      make('EN-SUITE BATH 2', 475, 225, 95, 80, 'bath', 'left'),
      make('WALK-IN CLOSET', 570, 225, 95, 80, 'entry', 'left'),
      make('REAR BALCONY', 475, 315, 190, 70, 'outdoor', 'top')
    ]);
  }

  // --- Terrace ---
  return finish([
    make('ROOF GARDEN & TURF', 35, 60, 310, 325, 'outdoor'),
    make('TERRACE PERGOLA LOUNGE', 355, 60, 205, 200, 'living'),
    make('STAIRCASE CABIN', 355, 270, 105, 115, 'stairs'),
    make('SOLAR & UTILITY DECK', 570, 60, 95, 325, 'outdoor')
  ]);
}

// -------------------------------------------------------------
// 2D High-Detail Furnished Architectural Plan (SVG)
// -------------------------------------------------------------
function renderFurnishedSvg(rooms, seed) {
  const defs = `
    <defs>
      <!-- Wood Plank Parquet Pattern -->
      <pattern id="woodFloor" width="40" height="20" patternUnits="userSpaceOnUse">
        <rect width="40" height="20" fill="#e8dfd1"/>
        <line x1="0" y1="0" x2="40" y2="0" stroke="#d5c7b3" stroke-width="0.8"/>
        <line x1="0" y1="10" x2="40" y2="10" stroke="#d5c7b3" stroke-width="0.8"/>
        <line x1="20" y1="0" x2="20" y2="10" stroke="#d5c7b3" stroke-width="0.8"/>
        <line x1="0" y1="10" x2="0" y2="20" stroke="#d5c7b3" stroke-width="0.8"/>
        <line x1="40" y1="10" x2="40" y2="20" stroke="#d5c7b3" stroke-width="0.8"/>
      </pattern>
      <!-- Ceramic Tile Grid Pattern -->
      <pattern id="tileFloor" width="18" height="18" patternUnits="userSpaceOnUse">
        <rect width="18" height="18" fill="#f0ece4"/>
        <rect x="0.5" y="0.5" width="17" height="17" fill="#f7f4ed" stroke="#ded8cb" stroke-width="0.7"/>
      </pattern>
      <!-- Marble Pattern for Kitchen & Bath -->
      <pattern id="marbleFloor" width="30" height="30" patternUnits="userSpaceOnUse">
        <rect width="30" height="30" fill="#eef2f5"/>
        <path d="M0 10 Q15 5 30 18 M5 30 Q20 22 25 0" stroke="#dce3ea" stroke-width="1.2" fill="none"/>
      </pattern>
      <!-- Concrete Garage Pattern -->
      <pattern id="garageFloor" width="50" height="50" patternUnits="userSpaceOnUse">
        <rect width="50" height="50" fill="#d9dde2"/>
        <circle cx="12" cy="12" r="1.5" fill="#c3c8cf" opacity="0.4"/>
        <circle cx="38" cy="35" r="1.5" fill="#c3c8cf" opacity="0.4"/>
      </pattern>
      <!-- Outdoor Grass Pattern -->
      <pattern id="grassPattern" width="20" height="20" patternUnits="userSpaceOnUse">
        <rect width="20" height="20" fill="#d8e6d2"/>
        <circle cx="5" cy="5" r="1" fill="#bad2b0"/>
        <circle cx="15" cy="15" r="1" fill="#bad2b0"/>
      </pattern>
      <!-- Drop Shadows -->
      <filter id="furnitureShadow" x="-10%" y="-10%" width="130%" height="130%">
        <feDropShadow dx="1.5" dy="2" stdDeviation="1.8" flood-color="#141c2c" flood-opacity="0.18"/>
      </filter>
      <filter id="wallShadow" x="-5%" y="-5%" width="115%" height="115%">
        <feDropShadow dx="2" dy="3" stdDeviation="3" flood-color="#101828" flood-opacity="0.22"/>
      </filter>
    </defs>
  `;

  // Furniture items rendered per room type
  const renderRoomFurniture = (r) => {
    const { x, y, w, h, c } = r;

    // --- Garage with Realistic Cars ---
    if (c === 'garage') {
      const isDouble = r.cars !== 1 && w > 110;
      const renderCar = (cx, cy, cw, ch, carColor, glassColor) => `
        <g filter="url(#furnitureShadow)" transform="translate(${cx}, ${cy})">
          <!-- Parking Bay Markings -->
          <rect x="-2" y="-2" width="${cw + 4}" height="${ch + 4}" fill="none" stroke="#ffffff" stroke-width="1.2" stroke-dasharray="6 4" opacity="0.8"/>
          <!-- Car Body -->
          <rect x="2" y="2" width="${cw - 4}" height="${ch - 4}" rx="9" fill="${carColor}"/>
          <!-- Cabin / Roof -->
          <rect x="${cw * 0.15}" y="${ch * 0.22}" width="${cw * 0.70}" height="${ch * 0.52}" rx="5" fill="#1b2434"/>
          <!-- Front Windshield -->
          <path d="M${cw * 0.18} ${ch * 0.26} L${cw * 0.82} ${ch * 0.26} L${cw * 0.74} ${ch * 0.38} L${cw * 0.26} ${ch * 0.38} Z" fill="${glassColor}"/>
          <!-- Rear Window -->
          <path d="M${cw * 0.24} ${ch * 0.64} L${cw * 0.76} ${ch * 0.64} L${cw * 0.80} ${ch * 0.72} L${cw * 0.20} ${ch * 0.72} Z" fill="${glassColor}"/>
          <!-- Side Windows -->
          <rect x="${cw * 0.16}" y="${ch * 0.40}" width="3" height="${ch * 0.22}" rx="1" fill="${glassColor}"/>
          <rect x="${cw * 0.84 - 3}" y="${ch * 0.40}" width="3" height="${ch * 0.22}" rx="1" fill="${glassColor}"/>
          <!-- Headlights & Taillights -->
          <rect x="5" y="3" width="7" height="3" rx="1" fill="#fff5b8"/>
          <rect x="${cw - 12}" y="3" width="7" height="3" rx="1" fill="#fff5b8"/>
          <rect x="5" y="${ch - 6}" width="7" height="3" rx="1" fill="#e03131"/>
          <rect x="${cw - 12}" y="${ch - 6}" width="7" height="3" rx="1" fill="#e03131"/>
        </g>
      `;

      if (isDouble) {
        const carW = (w - 24) / 2;
        const carH = h - 28;
        return `
          ${renderCar(x + 7, y + 14, carW, carH, '#202938', '#5b8fb9')}
          ${renderCar(x + carW + 17, y + 14, carW, carH, '#fdfefe', '#87b7db')}
        `;
      } else {
        const carW = Math.min(65, w - 24);
        const carH = h - 28;
        return renderCar(x + (w - carW) / 2, y + 14, carW, carH, '#202938', '#5b8fb9');
      }
    }

    // --- Living Room with L-Sectional Sofa & Coffee Table ---
    if (c === 'living') {
      const rugW = w * 0.75, rugH = h * 0.68;
      const rugX = x + (w - rugW) / 2, rugY = y + (h - rugH) / 2 + 10;
      return `
        <g filter="url(#furnitureShadow)">
          <!-- Area Rug -->
          <rect x="${rugX}" y="${rugY}" width="${rugW}" height="${rugH}" rx="4" fill="#ebe4d8" stroke="#d5ccbe" stroke-width="1"/>
          <!-- L-Sectional Sofa -->
          <path d="M${rugX + 12} ${rugY + 12} h${rugW * 0.65} v${26} h-${rugW * 0.40} v${rugH * 0.55} h-${26} Z" fill="#46546b" rx="4"/>
          <!-- Sofa Cushions Line -->
          <line x1="${rugX + 12}" y1="${rugY + 36}" x2="${rugX + 12 + rugW * 0.65}" y2="${rugY + 36}" stroke="#343f52" stroke-width="1.2"/>
          <line x1="${rugX + 38}" y1="${rugY + 36}" x2="${rugX + 38}" y2="${rugY + 12 + rugH * 0.55 + 26}" stroke="#343f52" stroke-width="1.2"/>
          <!-- Accent Throw Pillows -->
          <rect x="${rugX + 16}" y="${rugY + 14}" width="9" height="9" rx="2" fill="#d99b43" transform="rotate(-12 ${rugX + 20} ${rugY + 18})"/>
          <rect x="${rugX + rugW * 0.65}" y="${rugY + 14}" width="9" height="9" rx="2" fill="#528cb8" transform="rotate(10 ${rugX + rugW * 0.65} ${rugY + 18})"/>
          <!-- Glass Coffee Table -->
          <rect x="${rugX + 48}" y="${rugY + 44}" width="${rugW * 0.38}" height="${rugH * 0.28}" rx="4" fill="#bcd7eb" opacity="0.85" stroke="#7aaac7" stroke-width="1.2"/>
          <rect x="${rugX + 54}" y="${rugY + 50}" width="10" height="7" rx="1" fill="#ffffff" opacity="0.9"/>
          <!-- TV Console Unit on Top Wall -->
          <rect x="${x + w * 0.25}" y="${y + 5}" width="${w * 0.50}" height="10" rx="2" fill="#302a24"/>
          <rect x="${x + w * 0.30}" y="${y + 6}" width="${w * 0.40}" height="3" fill="#121820"/>
          <!-- Lounge Armchair -->
          <rect x="${rugX + rugW - 24}" y="${rugY + 44}" width="20" height="24" rx="4" fill="#c49354"/>
          <!-- Indoor Potted Plant (Monstera) -->
          <circle cx="${x + 18}" cy="${y + h - 18}" r="9" fill="#e8ded1" stroke="#a39684" stroke-width="1.2"/>
          <circle cx="${x + 18}" cy="${y + h - 18}" r="7" fill="#438a5e"/>
          <circle cx="${x + 15}" cy="${y + h - 20}" r="4" fill="#5cb37d"/>
          <circle cx="${x + 21}" cy="${y + h - 16}" r="3.5" fill="#5cb37d"/>
        </g>
      `;
    }

    // --- Dining Room with Table & 6 Chairs ---
    if (c === 'dining') {
      const tabW = w * 0.58, tabH = h * 0.45;
      const tabX = x + (w - tabW) / 2, tabY = y + (h - tabH) / 2;
      return `
        <g filter="url(#furnitureShadow)">
          <!-- Dining Rug -->
          <rect x="${tabX - 14}" y="${tabY - 14}" width="${tabW + 28}" height="${tabH + 28}" rx="4" fill="#faf6ed" stroke="#ded5c4" stroke-width="1"/>
          <!-- Dining Table -->
          <rect x="${tabX}" y="${tabY}" width="${tabW}" height="${tabH}" rx="3" fill="#544337" stroke="#362920" stroke-width="1"/>
          <!-- Table Runner & Centerpiece -->
          <rect x="${tabX + tabW * 0.2}" y="${tabY + 2}" width="${tabW * 0.6}" height="${tabH - 4}" fill="#f2ede4" rx="1"/>
          <circle cx="${tabX + tabW / 2}" cy="${tabY + tabH / 2}" r="5" fill="#d97d55"/>
          <!-- Top Chairs -->
          <rect x="${tabX + tabW * 0.15}" y="${tabY - 11}" width="${tabW * 0.28}" height="9" rx="2" fill="#8c7868"/>
          <rect x="${tabX + tabW * 0.57}" y="${tabY - 11}" width="${tabW * 0.28}" height="9" rx="2" fill="#8c7868"/>
          <!-- Bottom Chairs -->
          <rect x="${tabX + tabW * 0.15}" y="${tabY + tabH + 2}" width="${tabW * 0.28}" height="9" rx="2" fill="#8c7868"/>
          <rect x="${tabX + tabW * 0.57}" y="${tabY + tabH + 2}" width="${tabW * 0.28}" height="9" rx="2" fill="#8c7868"/>
          <!-- Side Chairs -->
          <rect x="${tabX - 10}" y="${tabY + tabH * 0.25}" width="8" height="${tabH * 0.50}" rx="2" fill="#8c7868"/>
          <rect x="${tabX + tabW + 2}" y="${tabY + tabH * 0.25}" width="8" height="${tabH * 0.50}" rx="2" fill="#8c7868"/>
        </g>
      `;
    }

    // --- Kitchen with Island, Counters, Sink & Stove ---
    if (c === 'kitchen') {
      return `
        <g filter="url(#furnitureShadow)">
          <!-- Main Perimeter Countertop L-shape -->
          <path d="M${x + 5} ${y + 5} h${w - 10} v${28} h-${w - 42} v${h - 40} h-${28} Z" fill="#ffffff" stroke="#caced4" stroke-width="1.2"/>
          <!-- Dual Sink with Faucet -->
          <rect x="${x + 36}" y="${y + 9}" width="28" height="18" rx="2" fill="#9dbcd4" stroke="#688ca8" stroke-width="1"/>
          <line x1="${x + 50}" y1="${y + 9}" x2="${x + 50}" y2="${y + 27}" stroke="#688ca8" stroke-width="1"/>
          <circle cx="${x + 50}" cy="${y + 8}" r="2" fill="#4d5966"/>
          <!-- 4-Burner Induction Cooktop -->
          <rect x="${x + w - 54}" y="${y + 9}" width="28" height="18" rx="2" fill="#212529"/>
          <circle cx="${x + w - 46}" cy="${y + 14}" r="3.5" fill="#df4732"/>
          <circle cx="${x + w - 34}" cy="${y + 14}" r="3.5" fill="#df4732"/>
          <circle cx="${x + w - 46}" cy="${y + 22}" r="3" fill="#df4732"/>
          <circle cx="${x + w - 34}" cy="${y + 22}" r="3" fill="#df4732"/>
          <!-- Kitchen Island with Waterfall Marble Edge -->
          <rect x="${x + 38}" y="${y + 50}" width="${Math.max(30, w - 60)}" height="${h * 0.36}" rx="3" fill="#ffffff" stroke="#b0b8c2" stroke-width="1.2"/>
          <!-- Barstools -->
          <circle cx="${x + 52}" cy="${y + 50 + h * 0.36 + 8}" r="5.5" fill="#4f463f" stroke="#c2b6a8" stroke-width="1"/>
          <circle cx="${x + 38 + (w - 60) / 2}" cy="${y + 50 + h * 0.36 + 8}" r="5.5" fill="#4f463f" stroke="#c2b6a8" stroke-width="1"/>
          <circle cx="${x + w - 38}" cy="${y + 50 + h * 0.36 + 8}" r="5.5" fill="#4f463f" stroke="#c2b6a8" stroke-width="1"/>
          <!-- Stainless Steel French Door Refrigerator -->
          <rect x="${x + 6}" y="${y + h - 34}" width="26" height="28" rx="2" fill="#abb5c2" stroke="#68778a" stroke-width="1.2"/>
          <line x1="${x + 19}" y1="${y + h - 34}" x2="${x + 19}" y2="${y + h - 6}" stroke="#526175" stroke-width="1"/>
        </g>
      `;
    }

    // --- Bedroom with King Bed, Pillows, Duvet & Wardrobe ---
    if (c === 'bed') {
      const bedW = Math.min(65, w * 0.52), bedH = Math.min(78, h * 0.62);
      const bedX = x + (w - bedW) / 2, bedY = y + 15;
      return `
        <g filter="url(#furnitureShadow)">
          <!-- Bed Headboard -->
          <rect x="${bedX - 4}" y="${bedY - 6}" width="${bedW + 8}" height="7" rx="2" fill="#524338"/>
          <!-- Bed Frame / Mattress -->
          <rect x="${bedX}" y="${bedY}" width="${bedW}" height="${bedH}" rx="4" fill="#fafbfc" stroke="#cdd5df" stroke-width="1.2"/>
          <!-- Bedspread / Duvet -->
          <rect x="${bedX + 2}" y="${bedY + bedH * 0.32}" width="${bedW - 4}" height="${bedH * 0.64}" rx="3" fill="#607699"/>
          <path d="M${bedX + 2} ${bedY + bedH * 0.32} Q${bedX + bedW / 2} ${bedY + bedH * 0.38} ${bedX + bedW - 2} ${bedY + bedH * 0.32}" fill="none" stroke="#485c7d" stroke-width="1.5"/>
          <!-- 2 Pillows -->
          <rect x="${bedX + 4}" y="${bedY + 4}" width="${bedW * 0.40}" height="14" rx="3" fill="#ffffff" stroke="#c8d2df" stroke-width="1"/>
          <rect x="${bedX + bedW * 0.54}" y="${bedY + 4}" width="${bedW * 0.40}" height="14" rx="3" fill="#ffffff" stroke="#c8d2df" stroke-width="1"/>
          <!-- Nightstands with Lamps -->
          <rect x="${bedX - 16}" y="${bedY}" width="12" height="14" rx="2" fill="#69574a"/>
          <circle cx="${bedX - 10}" cy="${bedY + 7}" r="4" fill="#ffec99" stroke="#dfa32b" stroke-width="1"/>
          <rect x="${bedX + bedW + 4}" y="${bedY}" width="12" height="14" rx="2" fill="#69574a"/>
          <circle cx="${bedX + bedW + 10}" cy="${bedY + 7}" r="4" fill="#ffec99" stroke="#dfa32b" stroke-width="1"/>
          <!-- Sliding Wardrobe Closet -->
          <rect x="${x + 6}" y="${y + h - 18}" width="${w - 12}" height="12" rx="2" fill="#d9d2c5" stroke="#7a7061" stroke-width="1"/>
          <line x1="${x + w * 0.5}" y1="${y + h - 18}" x2="${x + w * 0.5}" y2="${y + h - 6}" stroke="#7a7061" stroke-width="1"/>
        </g>
      `;
    }

    // --- Bathrooms with Tub / Walk-in Shower, Vanity & Toilet ---
    if (c === 'bath') {
      return `
        <g filter="url(#furnitureShadow)">
          <!-- Glass Walk-in Shower Enclosure -->
          <rect x="${x + 5}" y="${y + 5}" width="28" height="28" rx="2" fill="#d5e8f5" stroke="#77a6c9" stroke-width="1.2"/>
          <circle cx="${x + 19}" cy="${y + 19}" r="3" fill="#5283a8"/>
          <!-- Floating Vanity Counter with Sink -->
          <rect x="${x + w - 32}" y="${y + 6}" width="26" height="16" rx="2" fill="#ffffff" stroke="#aeb7c2" stroke-width="1.2"/>
          <ellipse cx="${x + w - 19}" cy="${y + 14}" rx="8" ry="5" fill="#ebf2f7" stroke="#7a9cb5" stroke-width="1"/>
          <circle cx="${x + w - 19}" cy="${y + 10}" r="1.5" fill="#3b4b59"/>
          <!-- Porcelain Toilet -->
          <rect x="${x + 8}" y="${y + h - 24}" width="14" height="6" rx="1" fill="#ffffff" stroke="#b0b8c2" stroke-width="1"/>
          <ellipse cx="${x + 15}" cy="${y + h - 12}" rx="7" ry="9" fill="#ffffff" stroke="#b0b8c2" stroke-width="1.2"/>
        </g>
      `;
    }

    // --- Staircase with Steps & Railing ---
    if (c === 'stairs') {
      const steps = 9;
      const stepH = (h - 14) / steps;
      return `
        <g>
          <rect x="${x + 5}" y="${y + 5}" width="${w - 10}" height="${h - 10}" fill="#ede6db" stroke="#877c6e" stroke-width="1"/>
          ${Array.from({ length: steps }, (_, i) => `
            <line x1="${x + 5}" y1="${y + 7 + i * stepH}" x2="${x + w - 5}" y2="${y + 7 + i * stepH}" stroke="#6e6254" stroke-width="1.3"/>
          `).join('')}
          <line x1="${x + 10}" y1="${y + 7}" x2="${x + 10}" y2="${y + h - 7}" stroke="#423a31" stroke-width="2"/>
          <!-- UP Direction Arrow -->
          <path d="M${x + w / 2} ${y + h - 14} L${x + w / 2} ${y + 16} M${x + w / 2 - 4} ${y + 22} L${x + w / 2} ${y + 16} L${x + w / 2 + 4} ${y + 22}" fill="none" stroke="#2b241c" stroke-width="1.6"/>
          <text x="${x + w / 2}" y="${y + h - 18}" font-family="Outfit" font-size="8" font-weight="700" fill="#2b241c" text-anchor="middle">UP</text>
        </g>
      `;
    }

    // --- Home Office / Study ---
    if (c === 'office') {
      return `
        <g filter="url(#furnitureShadow)">
          <!-- Executive Desk -->
          <rect x="${x + 12}" y="${y + 12}" width="${w * 0.55}" height="24" rx="3" fill="#4d3e33" stroke="#33271e" stroke-width="1"/>
          <!-- Laptop -->
          <rect x="${x + 24}" y="${y + 17}" width="16" height="12" rx="1" fill="#a4b3c4"/>
          <!-- Ergonomic Office Chair -->
          <circle cx="${x + 32}" cy="${y + 44}" r="8" fill="#283547" stroke="#161f2c" stroke-width="1"/>
          <!-- Full-height Bookcase on Right Wall -->
          <rect x="${x + w - 20}" y="${y + 8}" width="14" height="${h - 16}" rx="2" fill="#695646" stroke="#423429" stroke-width="1"/>
        </g>
      `;
    }

    return '';
  };

  const getFloorFill = (c) => {
    if (c === 'garage') return 'url(#garageFloor)';
    if (c === 'kitchen' || c === 'bath') return 'url(#marbleFloor)';
    if (c === 'outdoor') return 'url(#grassPattern)';
    if (c === 'dining' || c === 'living' || c === 'bed' || c === 'office') return 'url(#woodFloor)';
    return 'url(#tileFloor)';
  };

  const roomSvg = rooms.map(r => {
    const floorFill = getFloorFill(r.c);
    const compact = r.w < 95 || r.h < 75;
    const labelY = r.y + (compact ? r.h / 2 + 3 : 18);
    const sizeStr = `${Math.max(8, Math.round(r.w / 16))}' × ${Math.max(7, Math.round(r.h / 15))}'`;

    return `
      <g class="room-group" data-room="${r.n}" data-dim="${sizeStr}">
        <!-- Room Floor Slab -->
        <rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${floorFill}"/>
        <!-- Architectural Furniture Layer -->
        ${renderRoomFurniture(r)}
        <!-- Room Perimeter Walls (Thick Cutaway style) -->
        <rect class="room-outline" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="none"/>
        <!-- Room Label & Dimensions Badge -->
        <g>
          <rect x="${r.x + r.w / 2 - 50}" y="${labelY - 11}" width="100" height="15" rx="3" fill="#ffffff" opacity="0.9"/>
          <text class="room-name" x="${r.x + r.w / 2}" y="${labelY}" style="font-size:${compact ? 8 : 9}px">${r.n}</text>
          ${compact ? '' : `<text class="room-size" x="${r.x + r.w / 2}" y="${labelY + 13}">${sizeStr}</text>`}
        </g>
      </g>
    `;
  }).join('');

  return `
    <svg class="generated-plan furnished-plan" viewBox="0 0 700 420" role="img" aria-label="Detailed Architectural 2D Furnished Floor Plan">
      ${defs}
      <!-- Exterior Landscaping Grass Border -->
      <rect width="700" height="420" fill="url(#grassPattern)"/>
      <rect x="20" y="45" width="660" height="350" rx="8" fill="#e2e8f0" stroke="#b0bec5" stroke-width="2"/>
      <!-- House Floor Base -->
      <rect class="plan-bg" x="25" y="50" width="650" height="340" rx="4" filter="url(#wallShadow)"/>
      <!-- Rooms & Furniture -->
      ${roomSvg}
      <!-- Header Banner & Compass -->
      <g transform="translate(30, 28)">
        <text font-family="Outfit" font-size="12" font-weight="700" fill="#1b2434">FURNISHED 2D ARCHITECTURAL PLAN</text>
        <text x="0" y="14" font-family="'DM Sans'" font-size="9" font-weight="600" fill="#64748b">ORIENTATION: ${state.formPayload?.entrance || 'NORTH-FACING'} · VARIATION #${String(seed).slice(-3)}</text>
      </g>
      <g transform="translate(640, 24)">
        <circle cx="12" cy="12" r="14" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.2"/>
        <path d="M12 4 L16 14 L12 11 L8 14 Z" fill="#2563eb"/>
        <path d="M12 20 L16 14 L12 11 L8 14 Z" fill="#94a3b8"/>
        <text x="12" y="2" font-family="Outfit" font-size="7" font-weight="800" fill="#2563eb" text-anchor="middle">N</text>
      </g>
    </svg>
  `;
}

// -------------------------------------------------------------
// Pencil Sketch Architectural Blueprint Plan (SVG)
// -------------------------------------------------------------
function renderPencilSvg(rooms, seed) {
  const roomSvg = rooms.map(r => {
    const sizeStr = `${Math.max(8, Math.round(r.w / 16))}' × ${Math.max(7, Math.round(r.h / 15))}'`;
    return `
      <g>
        <rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="#fcfaf4" stroke="#2c2824" stroke-width="4"/>
        <rect x="${r.x + 3}" y="${r.y + 3}" width="${r.w - 6}" height="${r.h - 6}" fill="none" stroke="#7d7465" stroke-width="1"/>
        <text class="room-label" x="${r.x + r.w / 2}" y="${r.y + r.h / 2 - 4}" style="font-size:10px">${r.n}</text>
        <text class="dim-text" x="${r.x + r.w / 2}" y="${r.y + r.h / 2 + 13}">${sizeStr}</text>
        <line class="dim-line" x1="${r.x + 8}" y1="${r.y + r.h - 10}" x2="${r.x + r.w - 8}" y2="${r.y + r.h - 10}"/>
      </g>
    `;
  }).join('');

  return `
    <svg class="generated-plan pencil-plan" viewBox="0 0 700 420" role="img" aria-label="Pencil Architectural Floor Plan">
      <rect width="700" height="420" class="plan-bg"/>
      <g class="blueprint-grid">
        ${Array.from({ length: 35 }, (_, i) => `<line x1="${i * 20}" y1="0" x2="${i * 20}" y2="420"/>`).join('')}
        ${Array.from({ length: 21 }, (_, i) => `<line x1="0" y1="${i * 20}" x2="700" y2="${i * 20}"/>`).join('')}
      </g>
      <rect x="25" y="50" width="650" height="340" fill="none" stroke="#1f1b18" stroke-width="6"/>
      ${roomSvg}
      <text x="35" y="32" font-family="Outfit" font-size="12" font-weight="700" fill="#2c2824">PENCIL ARCHITECTURAL CONCEPT · VARIATION #${String(seed).slice(-3)}</text>
      <text x="645" y="32" font-family="Outfit" font-size="10" font-weight="700" fill="#2c2824">N ↑</text>
    </svg>
  `;
}

// -------------------------------------------------------------
// Interactive 3D Cutaway Floor Plan Engine (Three.js WebGL)
// Matches Reference Images 1 & 2
// -------------------------------------------------------------
let threeApp = {
  renderer: null,
  scene: null,
  camera: null,
  controls: null,
  animId: null,
  roomMeshes: [],
  dirLight: null,
  hemiLight: null,
  pointLights: [],
  textures: null
};

function createProceduralTextures() {
  const createWood = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#dfd3c3';
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = '#c5b6a1';
    ctx.lineWidth = 2;
    for (let y = 0; y <= 256; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y);
      ctx.stroke();
    }
    for (let y = 0; y < 256; y += 32) {
      for (let x = (y % 64 === 0 ? 0 : 64); x <= 256; x += 128) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + 32);
        ctx.stroke();
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    return tex;
  };

  const createTile = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#e8ecf0';
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(2, 2, 124, 124);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6, 6);
    return tex;
  };

  const createMarble = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f4f6f8';
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = '#d3dbe3';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 40);
    ctx.bezierCurveTo(80, 120, 160, 20, 256, 180);
    ctx.moveTo(30, 256);
    ctx.bezierCurveTo(120, 180, 200, 240, 256, 80);
    ctx.stroke();
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 3);
    return tex;
  };

  const createGarage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#cfd5dc';
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.setLineDash([12, 8]);
    ctx.strokeRect(20, 20, 216, 216);
    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  };

  const createGrass = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#7ba86d';
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = '#6e9860';
    for (let i = 0; i < 40; i++) {
      ctx.fillRect(Math.random() * 120, Math.random() * 120, 4, 4);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(8, 8);
    return tex;
  };

  return {
    wood: createWood(),
    tile: createTile(),
    marble: createMarble(),
    garage: createGarage(),
    grass: createGrass()
  };
}

function initThreeScene(container, rooms) {
  if (threeApp.animId) cancelAnimationFrame(threeApp.animId);
  threeApp.roomMeshes = [];
  threeApp.pointLights = [];

  const width = container.clientWidth || 800;
  const height = container.clientHeight || 520;

  // Scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(state.lightingMode === 'day' ? 0xedf2f7 : 0x141a24);
  threeApp.scene = scene;

  // Camera
  const aspect = width / height;
  const camera = new THREE.PerspectiveCamera(40, aspect, 1, 2000);
  threeApp.camera = camera;
  applyCameraPreset(state.cameraView || 'iso');

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = state.lightingMode === 'day' ? 1.05 : 0.85;

  container.innerHTML = '';
  const canvasWrap = document.createElement('div');
  canvasWrap.className = 'three-canvas-wrap';
  canvasWrap.appendChild(renderer.domElement);
  container.appendChild(canvasWrap);
  threeApp.renderer = renderer;

  // Orbit Controls
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.maxPolarAngle = Math.PI / 2.05; // Do not go below ground
  controls.minDistance = 80;
  controls.maxDistance = 650;
  controls.target.set(0, 0, 0);
  threeApp.controls = controls;

  // Textures
  if (!threeApp.textures) threeApp.textures = createProceduralTextures();

  // Lighting
  const hemiLight = new THREE.HemisphereLight(
    state.lightingMode === 'day' ? 0xffffff : 0x3d4b66,
    state.lightingMode === 'day' ? 0xa0b0c0 : 0x1a2130,
    state.lightingMode === 'day' ? 0.75 : 0.35
  );
  scene.add(hemiLight);
  threeApp.hemiLight = hemiLight;

  const dirLight = new THREE.DirectionalLight(
    state.lightingMode === 'day' ? 0xfffaed : 0xffa052,
    state.lightingMode === 'day' ? 1.1 : 0.6
  );
  dirLight.position.set(180, 280, 160);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 50;
  dirLight.shadow.camera.far = 800;
  dirLight.shadow.camera.left = -250;
  dirLight.shadow.camera.right = 250;
  dirLight.shadow.camera.top = 250;
  dirLight.shadow.camera.bottom = -250;
  dirLight.shadow.bias = -0.0005;
  scene.add(dirLight);
  threeApp.dirLight = dirLight;

  // Ground Pedestal
  const grassMat = new THREE.MeshStandardMaterial({ map: threeApp.textures.grass, roughness: 0.9 });
  const groundGeo = new THREE.BoxGeometry(460, 6, 320);
  const groundMesh = new THREE.Mesh(groundGeo, grassMat);
  groundMesh.position.set(0, -3, 0);
  groundMesh.receiveShadow = true;
  scene.add(groundMesh);

  // Pavement border around house foundation
  const baseMat = new THREE.MeshStandardMaterial({ color: 0xe5e7eb, roughness: 0.7 });
  const baseGeo = new THREE.BoxGeometry(410, 4, 270);
  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  baseMesh.position.set(0, 1, 0);
  baseMesh.receiveShadow = true;
  scene.add(baseMesh);

  // Coordinate mapper from SVG 700x420 -> Three.js -190..190 X, -120..120 Z
  const mapCoord = (r) => {
    const cx = (r.x + r.w / 2 - 350) * 0.54;
    const cz = (r.y + r.h / 2 - 210) * 0.54;
    const rw = r.w * 0.54;
    const rz = r.h * 0.54;
    return { cx, cz, rw, rz };
  };

  // Build Cutaway 3D Rooms
  rooms.forEach(r => {
    const { cx, cz, rw, rz } = mapCoord(r);
    const roomGroup = new THREE.Group();
    roomGroup.position.set(cx, 3, cz);

    // Floor Slab
    let floorMat;
    if (r.c === 'garage') floorMat = new THREE.MeshStandardMaterial({ map: threeApp.textures.garage, roughness: 0.7 });
    else if (r.c === 'kitchen' || r.c === 'bath') floorMat = new THREE.MeshStandardMaterial({ map: threeApp.textures.marble, roughness: 0.3 });
    else if (r.c === 'outdoor') floorMat = new THREE.MeshStandardMaterial({ map: threeApp.textures.grass, roughness: 0.8 });
    else floorMat = new THREE.MeshStandardMaterial({ map: threeApp.textures.wood, roughness: 0.5 });

    const floorGeo = new THREE.BoxGeometry(rw - 1, 1.5, rz - 1);
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.receiveShadow = true;
    floorMesh.userData = { roomName: r.n, category: r.c };
    roomGroup.add(floorMesh);
    threeApp.roomMeshes.push(floorMesh);

    // 3D Cutaway Walls (height 14 units, thickness 2.5 units with dark crown capping)
    const wallHeight = 15;
    const wallThick = 2.4;
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.85 });
    const capMat = new THREE.MeshStandardMaterial({ color: 0x2b323c, roughness: 0.5 });

    const addWallSegment = (wx, wz, ww, wd) => {
      const wallGeo = new THREE.BoxGeometry(ww, wallHeight, wd);
      const wall = new THREE.Mesh(wallGeo, wallMat);
      wall.position.set(wx, wallHeight / 2, wz);
      wall.castShadow = true;
      wall.receiveShadow = true;
      roomGroup.add(wall);

      // Dark Wall Cap on top (matching reference images)
      const capGeo = new THREE.BoxGeometry(ww + 0.3, 0.8, wd + 0.3);
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.set(wx, wallHeight + 0.4, wz);
      roomGroup.add(cap);
    };

    // North Wall
    addWallSegment(0, -rz / 2, rw, wallThick);
    // South Wall
    addWallSegment(0, rz / 2, rw, wallThick);
    // West Wall
    addWallSegment(-rw / 2, 0, wallThick, rz);
    // East Wall
    addWallSegment(rw / 2, 0, wallThick, rz);

    // Add 3D Furniture to room
    build3DFurniture(roomGroup, r, rw, rz);

    // Warm Interior Accent Point Lights
    if (r.c === 'living' || r.c === 'bed' || r.c === 'kitchen') {
      const pl = new THREE.PointLight(0xffb74d, state.lightingMode === 'day' ? 0.8 : 1.8, 85);
      pl.position.set(0, 12, 0);
      roomGroup.add(pl);
      threeApp.pointLights.push(pl);
    }

    scene.add(roomGroup);
  });

  // Animation Loop
  const animate = () => {
    threeApp.animId = requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  };
  animate();

  // Raycasting / Hover Tooltip for Room Dimensions
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const tooltip = $('#roomTooltip');

  renderer.domElement.onmousemove = (event) => {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(threeApp.roomMeshes);

    if (intersects.length > 0 && tooltip) {
      const hit = intersects[0].object;
      tooltip.style.display = 'block';
      tooltip.style.left = `${event.clientX - rect.left}px`;
      tooltip.style.top = `${event.clientY - rect.top}px`;
      tooltip.innerHTML = `<b>${hit.userData.roomName || 'Room Space'}</b><span>Click to inspect room layout</span>`;
    } else if (tooltip) {
      tooltip.style.display = 'none';
    }
  };

  renderer.domElement.onmouseleave = () => {
    if (tooltip) tooltip.style.display = 'none';
  };
}

// -------------------------------------------------------------
// 3D Furniture Meshes Builder
// -------------------------------------------------------------
function build3DFurniture(group, r, rw, rz) {
  // Common Materials
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x544336, roughness: 0.6 });
  const fabricDarkMat = new THREE.MeshStandardMaterial({ color: 0x3a485c, roughness: 0.8 });
  const fabricLightMat = new THREE.MeshStandardMaterial({ color: 0xd9e2ec, roughness: 0.9 });
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x9ec5e8, transmission: 0.8, roughness: 0.1, transparent: true, opacity: 0.7 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0xabb8c6, metalness: 0.8, roughness: 0.2 });

  // Helper box maker
  const box = (w, h, d, mat, px, py, pz, rx = 0, ry = 0) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(px, py + h / 2, pz);
    if (rx || ry) mesh.rotation.set(rx, ry, 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };

  // --- Garage with Cars ---
  if (r.c === 'garage') {
    const build3DCar = (px, pz, bodyColor, glassColor) => {
      const carGroup = new THREE.Group();
      carGroup.position.set(px, 1, pz);

      const bodyMat = new THREE.MeshStandardMaterial({ color: bodyColor, metalness: 0.6, roughness: 0.25 });
      const cGlassMat = new THREE.MeshStandardMaterial({ color: glassColor, roughness: 0.1 });
      const tireMat = new THREE.MeshStandardMaterial({ color: 0x1f242b, roughness: 0.8 });

      // Lower Chassis
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(18, 5, 34), bodyMat);
      chassis.position.y = 3.5;
      chassis.castShadow = true;
      carGroup.add(chassis);

      // Cabin / Roof
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(15, 4.5, 18), cGlassMat);
      cabin.position.set(0, 7.5, -2);
      cabin.castShadow = true;
      carGroup.add(cabin);

      // 4 Wheels
      const wheelGeo = new THREE.CylinderGeometry(2.5, 2.5, 2, 16);
      wheelGeo.rotateZ(Math.PI / 2);
      [[-9.2, 2.5, 10], [9.2, 2.5, 10], [-9.2, 2.5, -10], [9.2, 2.5, -10]].forEach(([wx, wy, wz]) => {
        const wMesh = new THREE.Mesh(wheelGeo, tireMat);
        wMesh.position.set(wx, wy, wz);
        carGroup.add(wMesh);
      });

      group.add(carGroup);
    };

    if (rw > 50) {
      build3DCar(-rw * 0.24, 0, 0x1c2430, 0x6495ed); // Charcoal Metallic Sedan
      build3DCar(rw * 0.24, 0, 0xf0f4f8, 0x7eb3d9);  // White Pearl SUV
    } else {
      build3DCar(0, 0, 0x1c2430, 0x6495ed);
    }
    return;
  }

  // --- Living Room (L-Sofa, Coffee Table, Rug, TV Console, Plant) ---
  if (r.c === 'living') {
    // Area Rug
    box(rw * 0.75, 0.4, rz * 0.70, new THREE.MeshStandardMaterial({ color: 0xe2d9cb, roughness: 0.95 }), 0, 0, 4);

    // L-Sectional Sofa
    const sofaH = 4.5;
    box(rw * 0.50, sofaH, 12, fabricDarkMat, -rw * 0.08, 0, -rz * 0.15);
    box(12, sofaH, rz * 0.38, fabricDarkMat, -rw * 0.08 - rw * 0.25 + 6, 0, 0);
    // Pillows
    box(5, 3, 5, new THREE.MeshStandardMaterial({ color: 0xd99b43 }), -rw * 0.22, sofaH, -rz * 0.15, 0, 0.2);
    box(5, 3, 5, new THREE.MeshStandardMaterial({ color: 0x5a94b8 }), rw * 0.12, sofaH, -rz * 0.15, 0, -0.2);

    // Coffee Table
    box(rw * 0.30, 0.6, rz * 0.26, glassMat, 0, 3, 2);
    box(rw * 0.30 - 2, 2.8, rz * 0.26 - 2, woodMat, 0, 0, 2);

    // TV Console Wall Unit
    box(rw * 0.48, 4, 4, woodMat, 0, 0, -rz / 2 + 3);
    box(rw * 0.40, 8, 1, new THREE.MeshStandardMaterial({ color: 0x11161d, roughness: 0.2 }), 0, 4.5, -rz / 2 + 2);

    // Modern Lounge Accent Chair
    box(10, 4, 10, new THREE.MeshStandardMaterial({ color: 0xc49354 }), rw * 0.25, 0, 6, 0, -0.4);

    // Potted Green Plant
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(3, 2.5, 5, 16), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    pot.position.set(-rw / 2 + 6, 2.5, rz / 2 - 6);
    group.add(pot);
    const foliage = new THREE.Mesh(new THREE.DodecahedronGeometry(5), new THREE.MeshStandardMaterial({ color: 0x3b8054, roughness: 0.9 }));
    foliage.position.set(-rw / 2 + 6, 8, rz / 2 - 6);
    group.add(foliage);
    return;
  }

  // --- Dining Room (Table + 6 Chairs) ---
  if (r.c === 'dining') {
    const tabW = rw * 0.65, tabD = rz * 0.50;
    box(tabW, 1.2, tabD, woodMat, 0, 5.5, 0);
    // Table Legs
    box(2, 5.5, 2, woodMat, -tabW / 2 + 2, 0, -tabD / 2 + 2);
    box(2, 5.5, 2, woodMat, tabW / 2 - 2, 0, -tabD / 2 + 2);
    box(2, 5.5, 2, woodMat, -tabW / 2 + 2, 0, tabD / 2 - 2);
    box(2, 5.5, 2, woodMat, tabW / 2 - 2, 0, tabD / 2 - 2);

    // Chairs
    [-tabW * 0.28, 0, tabW * 0.28].forEach(cx => {
      box(5, 3.5, 5, fabricLightMat, cx, 0, -tabD / 2 - 4);
      box(5, 5, 1.5, woodMat, cx, 3.5, -tabD / 2 - 6);
      box(5, 3.5, 5, fabricLightMat, cx, 0, tabD / 2 + 4);
      box(5, 5, 1.5, woodMat, cx, 3.5, tabD / 2 + 6);
    });
    return;
  }

  // --- Kitchen (Island, Barstools, Counters, Sink, Fridge) ---
  if (r.c === 'kitchen') {
    box(rw - 6, 6.5, 8, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 }), 0, 0, -rz / 2 + 5);
    box(8, 6.5, rz - 12, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 }), -rw / 2 + 5, 0, 0);

    const islW = rw * 0.55, islD = rz * 0.35;
    box(islW, 7, islD, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 }), 4, 0, 4);

    [-islW * 0.3, 0, islW * 0.3].forEach(bx => {
      const stool = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 5.5, 16), new THREE.MeshStandardMaterial({ color: 0x3d332a }));
      stool.position.set(4 + bx, 2.75, 4 + islD / 2 + 5);
      group.add(stool);
    });

    box(10, 13, 9, metalMat, rw / 2 - 7, 0, -rz / 2 + 6);
    return;
  }

  // --- Bedrooms (King Platform Bed, Pillows, Duvet, Nightstands, Wardrobe) ---
  if (r.c === 'bed') {
    const bedW = Math.min(32, rw * 0.55), bedD = Math.min(38, rz * 0.65);
    box(bedW + 4, 9, 2.5, woodMat, 0, 0, -rz / 2 + 4);
    box(bedW, 4.5, bedD, new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 }), 0, 0, -rz / 2 + 4 + bedD / 2);
    box(bedW - 1, 1.5, bedD * 0.65, new THREE.MeshStandardMaterial({ color: 0x5b759e, roughness: 0.8 }), 0, 4.5, -rz / 2 + 4 + bedD * 0.65);
    box(bedW * 0.42, 2, 7, new THREE.MeshStandardMaterial({ color: 0xffffff }), -bedW * 0.24, 4.8, -rz / 2 + 8);
    box(bedW * 0.42, 2, 7, new THREE.MeshStandardMaterial({ color: 0xffffff }), bedW * 0.24, 4.8, -rz / 2 + 8);

    [-bedW / 2 - 4, bedW / 2 + 4].forEach(nx => {
      box(6, 4, 6, woodMat, nx, 0, -rz / 2 + 6);
      const lamp = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 2.5, 3.5, 12), new THREE.MeshStandardMaterial({ color: 0xffe699, emissive: 0xffe699, emissiveIntensity: 0.4 }));
      lamp.position.set(nx, 5.5, -rz / 2 + 6);
      group.add(lamp);
    });

    box(rw - 8, 12, 6, new THREE.MeshStandardMaterial({ color: 0xd5cebf }), 0, 0, rz / 2 - 5);
    return;
  }

  // --- Bathrooms (Shower, Vanity, Toilet) ---
  if (r.c === 'bath') {
    const showerMat = new THREE.MeshPhysicalMaterial({ color: 0x90c2e7, transmission: 0.85, transparent: true, opacity: 0.6 });
    box(14, 12, 14, showerMat, -rw / 2 + 9, 0, -rz / 2 + 9);
    box(16, 5, 7, new THREE.MeshStandardMaterial({ color: 0xffffff }), rw / 2 - 10, 0, -rz / 2 + 5);
    box(14, 8, 0.5, new THREE.MeshStandardMaterial({ color: 0xb0c4de, metalness: 0.9, roughness: 0.1 }), rw / 2 - 10, 5.5, -rz / 2 + 2);
    box(6, 4.5, 9, new THREE.MeshStandardMaterial({ color: 0xffffff }), -rw / 2 + 6, 0, rz / 2 - 7);
    box(6, 7, 4, new THREE.MeshStandardMaterial({ color: 0xffffff }), -rw / 2 + 6, 0, rz / 2 - 3);
    return;
  }

  // --- Staircase ---
  if (r.c === 'stairs') {
    const steps = 8;
    const stepH = 1.3, stepD = (rz - 6) / steps;
    for (let i = 0; i < steps; i++) {
      box(rw - 6, (i + 1) * stepH, stepD, woodMat, 0, 0, -rz / 2 + 4 + i * stepD + stepD / 2);
    }
    box(1.2, 11, rz - 6, metalMat, rw / 2 - 4, 0, 0);
    return;
  }

  // --- Home Office / Study ---
  if (r.c === 'office') {
    box(rw * 0.60, 5, 12, woodMat, 0, 0, -rz / 2 + 8);
    box(8, 0.8, 6, metalMat, 0, 5.2, -rz / 2 + 8);
    box(8, 5, 0.4, new THREE.MeshStandardMaterial({ color: 0x111111 }), 0, 5.5, -rz / 2 + 5.5);
    box(7, 6, 7, new THREE.MeshStandardMaterial({ color: 0x222a36 }), 0, 0, -rz / 2 + 18);
    box(8, 12, rz - 8, woodMat, rw / 2 - 5, 0, 0);
    return;
  }
}

// -------------------------------------------------------------
// Camera View Presets Handler
// -------------------------------------------------------------
function applyCameraPreset(view) {
  state.cameraView = view;
  if (!threeApp.camera || !threeApp.controls) return;

  const target = new THREE.Vector3(0, 0, 0);
  threeApp.controls.target.copy(target);

  if (view === 'iso') {
    threeApp.camera.position.set(220, 240, 260);
  } else if (view === 'top') {
    threeApp.camera.position.set(0, 360, 2);
  } else if (view === 'front') {
    threeApp.camera.position.set(0, 110, 280);
  } else if (view === 'side') {
    threeApp.camera.position.set(320, 160, 0);
  }

  threeApp.controls.update();

  document.querySelectorAll('#cameraControls button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });
}

function toggleLighting() {
  state.lightingMode = state.lightingMode === 'day' ? 'evening' : 'day';
  const btn = $('#toggleLighting');
  if (btn) btn.innerHTML = state.lightingMode === 'day' ? '☀ Daylight' : '🌙 Warm Evening';

  if (threeApp.scene) {
    threeApp.scene.background = new THREE.Color(state.lightingMode === 'day' ? 0xedf2f7 : 0x141a24);
  }
  if (threeApp.hemiLight) {
    threeApp.hemiLight.color.setHex(state.lightingMode === 'day' ? 0xffffff : 0x3d4b66);
    threeApp.hemiLight.groundColor.setHex(state.lightingMode === 'day' ? 0xa0b0c0 : 0x1a2130);
    threeApp.hemiLight.intensity = state.lightingMode === 'day' ? 0.75 : 0.35;
  }
  if (threeApp.dirLight) {
    threeApp.dirLight.color.setHex(state.lightingMode === 'day' ? 0xfffaed : 0xffa052);
    threeApp.dirLight.intensity = state.lightingMode === 'day' ? 1.1 : 0.6;
  }
  if (threeApp.renderer) {
    threeApp.renderer.toneMappingExposure = state.lightingMode === 'day' ? 1.05 : 0.85;
  }
  threeApp.pointLights.forEach(pl => {
    pl.intensity = state.lightingMode === 'day' ? 0.8 : 1.8;
  });
}

// -------------------------------------------------------------
// Floor Selector Renderer
// -------------------------------------------------------------
function renderFloorSelector() {
  const holder = $('#floorSelector');
  if (!holder) return;
  const propType = state.propertyType || state.formPayload?.propertyType || 'Home + Rental';
  const floors = Math.max(1, Number(state.formPayload?.floors || 2));
  const hasTerrace = floors > 1;
  const count = floors + Number(hasTerrace);

  const getFloorLabel = (floor) => {
    if (floor === floors && hasTerrace) return 'ROOF TERRACE & UTILITY';
    if (propType === 'Home + Rental') {
      if (floor === 0) return 'GROUND FLOOR (OWNER HOUSE)';
      if (floor === 1) return '1ST FLOOR (RENTAL HOUSES)';
      if (floor === 2) return '2ND FLOOR (RENTAL HOUSES)';
      return `FLOOR ${floor} (RENTAL HOUSES)`;
    }
    if (propType === 'Rental Homes') {
      if (floor === 0) return 'GROUND FLOOR (RENTAL & PARKING)';
      if (floor === 1) return '1ST FLOOR (RENTAL FLATS)';
      if (floor === 2) return '2ND FLOOR (RENTAL FLATS)';
      return `FLOOR ${floor} (RENTAL FLATS)`;
    }
    if (floor === 0) return 'GROUND FLOOR';
    if (floor === 1) return 'FIRST FLOOR';
    if (floor === 2) return 'SECOND FLOOR';
    return `FLOOR ${floor}`;
  };

  holder.innerHTML = Array.from({ length: count }, (_, floor) => `
    <button class="${floor === state.selectedFloor ? 'active' : ''}" data-floor="${floor}">
      ${getFloorLabel(floor)}
    </button>
  `).join('');

  holder.querySelectorAll('[data-floor]').forEach(button => {
    button.onclick = () => {
      state.selectedFloor = Number(button.dataset.floor);
      renderFloorPlan(state.result?.seed || 2026);
    };
  });
}

// -------------------------------------------------------------
// Main Floor Plan Dispatcher
// -------------------------------------------------------------
function renderFloorPlan(seed) {
  renderFloorSelector();
  const rooms = planRooms(seed);
  const container = $('#floorPlan');
  if (!container) return;

  const hint3d = $('.hint-3d');
  const hint2d = $('.hint-2d');
  const planBadge = $('#planBadge');
  const cameraControls = $('#cameraControls');
  const toggleLightBtn = $('#toggleLighting');
  const resetBtn = $('#resetCamera');

  // --- 3D FLOOR PLAN MODE ---
  if (state.planStyle === '3d') {
    container.classList.add('three-active');
    if (hint3d) hint3d.style.display = 'inline';
    if (hint2d) hint2d.style.display = 'none';
    if (planBadge) planBadge.textContent = '3D ISOMETRIC CUTAWAY';
    if (cameraControls) cameraControls.style.display = 'flex';
    if (toggleLightBtn) toggleLightBtn.style.display = 'inline-flex';
    if (resetBtn) resetBtn.style.display = 'inline-flex';

    if (window.THREE && window.THREE.OrbitControls) {
      initThreeScene(container, rooms);
    } else {
      container.innerHTML = renderFurnishedSvg(rooms, seed);
    }
    return;
  }

  // Stop active 3D loop
  if (threeApp.animId) cancelAnimationFrame(threeApp.animId);
  container.classList.remove('three-active');

  // --- FURNISHED 2D PLAN MODE ---
  if (state.planStyle === 'furnished') {
    if (hint3d) hint3d.style.display = 'none';
    if (hint2d) hint2d.style.display = 'inline';
    if (planBadge) planBadge.textContent = 'FURNISHED 2D PLAN';
    if (cameraControls) cameraControls.style.display = 'none';
    if (toggleLightBtn) toggleLightBtn.style.display = 'none';
    if (resetBtn) resetBtn.style.display = 'none';

    container.innerHTML = renderFurnishedSvg(rooms, seed);
    return;
  }

  // --- PENCIL SKETCH BLUEPRINT MODE ---
  if (state.planStyle === 'sketch') {
    if (hint3d) hint3d.style.display = 'none';
    if (hint2d) hint2d.style.display = 'inline';
    if (planBadge) planBadge.textContent = 'PENCIL SKETCH';
    if (cameraControls) cameraControls.style.display = 'none';
    if (toggleLightBtn) toggleLightBtn.style.display = 'none';
    if (resetBtn) resetBtn.style.display = 'none';

    container.innerHTML = renderPencilSvg(rooms, seed);
  }
}

// -------------------------------------------------------------
// History & Storage
// -------------------------------------------------------------
function persistConcept(record) {
  const concepts = JSON.parse(localStorage.getItem(storageKey) || '[]');
  concepts.unshift(record);
  localStorage.setItem(storageKey, JSON.stringify(concepts.slice(0, 15)));
}

function historyPreview(seed) {
  const blocks = [['#e6edf7', '#f8e8cf', '#ebe5f4'], ['#e9f1e2', '#dceef1', '#f8f0ca'], ['#ebe5f4', '#e6edf7', '#dce8dd']][seed % 3];
  return `<div class="history-preview"><div class="mini-plan"><i style="background:${blocks[0]}"></i><i style="background:${blocks[1]}"></i><i style="background:${blocks[2]}"></i><i style="background:${blocks[0]}"></i></div></div>`;
}

function renderHistory() {
  const list = $('#historyList');
  if (!list) return;
  const concepts = JSON.parse(localStorage.getItem(storageKey) || '[]');
  list.innerHTML = concepts.length
    ? concepts.map((concept, index) => `
        <button class="history-item" data-history-index="${index}">
          ${historyPreview(concept.seed)}
          <div>
            <b>${concept.result.style}</b>
            <small>${concept.payload.propertyType} · ${Number(concept.result.builtUp || concept.payload.landSize).toLocaleString()} sq ft · variation ${String(concept.seed).slice(-3)}</small>
            <strong>2D layout + 3D cutaway ready</strong>
          </div>
          <em>Open concept →</em>
        </button>
      `).join('')
    : '<p class="empty-history">Your generated concepts will appear here after you create your first design.</p>';

  document.querySelectorAll('[data-history-index]').forEach(button => {
    button.onclick = () => {
      const concept = concepts[Number(button.dataset.historyIndex)];
      applyConcept(concept.result, concept.payload, false);
      show('model');
      toast('Previous concept reopened.');
    };
  });
}

function applyConcept(result, payload, store = true) {
  state.result = result;
  state.formPayload = payload;
  state.propertyType = payload.propertyType || state.propertyType;
  state.selectedFloor = 0;

  if ($('#designTitle')) $('#designTitle').textContent = result.style;
  if ($('#areaMetric')) {
    const area = Number(result.builtUp || payload.landSize || 2400);
    $('#areaMetric').textContent = `${area.toLocaleString()} sq ft`;
  }
  if ($('#scoreMetric')) $('#scoreMetric').textContent = result.score;
  if ($('#ideaSummary')) $('#ideaSummary').textContent = payload.ideas?.trim() || `${payload.propertyType || 'Modern'} living`;

  renderFloorPlan(result.seed);
  if (store) {
    persistConcept({ seed: result.seed, result, payload, generatedAt: new Date().toISOString() });
    renderHistory();
  }
}

async function generateConcept(payload) {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error('Generation failed');
  applyConcept(await response.json(), payload);
}

// -------------------------------------------------------------
// Event Listeners
// -------------------------------------------------------------
document.querySelectorAll('[data-go]').forEach(btn => (btn.onclick = () => show(btn.dataset.go)));
document.querySelectorAll('[data-back]').forEach(btn => {
  btn.onclick = () => {
    if (state.history.length > 1) {
      state.history.pop();
      show(state.history.at(-1), false);
    } else show('welcome', false);
  };
});

document.querySelectorAll('#propertyType button').forEach(button => {
  button.onclick = () => {
    document.querySelectorAll('#propertyType button').forEach(b => b.classList.remove('chosen'));
    button.classList.add('chosen');
    state.propertyType = button.dataset.value;
    document.querySelectorAll('[data-type-panel]').forEach(panel => {
      panel.classList.toggle('active', panel.dataset.typePanel === state.propertyType);
    });
  };
});

document.querySelectorAll('.qty').forEach(button => {
  button.onclick = () => {
    const room = button.dataset.room;
    state[room] = Math.max(1, state[room] + Number(button.dataset.change));
    $('#' + room + 'Count').textContent = state[room];
  };
});

// Mode switch tabs: Pencil, Furnished 2D, 3D
document.querySelectorAll('.mode-switch button').forEach(button => {
  button.onclick = () => {
    state.planStyle = button.dataset.mode;
    document.querySelectorAll('.mode-switch button').forEach(b => b.classList.toggle('active', b === button));
    renderFloorPlan(state.result?.seed || 2026);
  };
});

// Camera controls
document.querySelectorAll('#cameraControls button').forEach(button => {
  button.onclick = () => applyCameraPreset(button.dataset.view);
});

if ($('#toggleLighting')) $('#toggleLighting').onclick = toggleLighting;
if ($('#resetCamera')) $('#resetCamera').onclick = () => applyCameraPreset('iso');

$('#designForm').onsubmit = async (event) => {
  event.preventDefault();
  const button = $('.generate');
  button.disabled = true;
  button.textContent = 'Creating your concept…';
  const values = Object.fromEntries(new FormData(event.currentTarget).entries());
  const payload = {
    ...values,
    propertyType: state.propertyType,
    bedrooms: state.bed,
    bathrooms: state.bath,
    layoutCycle: 0,
    features: [...event.currentTarget.querySelectorAll('input[type="checkbox"]:checked')].map(input => input.name),
    ideas: $('#designIdeas').value
  };
  try {
    await generateConcept(payload);
    show('model');
    toast(`Generated concept for ${state.propertyType}.`);
  } catch {
    toast('Could not generate. Please try again.');
  } finally {
    button.disabled = false;
    button.innerHTML = 'Create my design <span>→</span>';
  }
};

$('#regenerate').onclick = async () => {
  if (!state.formPayload) return;
  const button = $('#regenerate');
  button.disabled = true;
  button.textContent = 'Generating variation…';
  state.formPayload.layoutCycle = (Number(state.formPayload.layoutCycle || 0) + 1) % 4;
  try {
    await generateConcept(state.formPayload);
    toast(`Generated variation ${state.formPayload.layoutCycle + 1}: ${state.result?.style || 'New Layout'}`);
  } catch {
    toast('Could not generate. Please try again.');
  } finally {
    button.disabled = false;
    button.innerHTML = '↻ Regenerate';
  }
};

$('#openHistory').onclick = () => {
  renderHistory();
  show('history');
};

$('#saveDesign').onclick = async () => {
  const data = { ...state, title: $('#designTitle').textContent, ideas: $('#designIdeas').value };
  try {
    await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    toast('Concept saved to your local library.');
  } catch {
    toast('Could not save your concept.');
  }
};

window.addEventListener('resize', () => {
  if (state.planStyle === '3d' && threeApp.renderer && threeApp.camera) {
    const container = $('#floorPlan');
    if (container) {
      const width = container.clientWidth;
      const height = container.clientHeight;
      threeApp.camera.aspect = width / height;
      threeApp.camera.updateProjectionMatrix();
      threeApp.renderer.setSize(width, height);
    }
  }
});

// Initial boot
renderFloorPlan(2026);
renderHistory();
