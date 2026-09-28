const $ = (selector) => document.querySelector(selector);
const state = {
  propertyType: 'Dream Home',
  bed: 2,
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
.pencil-plan .wall{fill:none;stroke:#2c2824;stroke-width:4.5;stroke-linecap:square}
.pencil-plan .wall-hatch{stroke:#787267;stroke-width:1}
.pencil-plan .room-label{font-family:'DM Sans',sans-serif;font-weight:700;fill:#2c2824;text-anchor:middle}
.pencil-plan .dim-text{font-family:'DM Sans',sans-serif;font-size:9px;fill:#6f695e;text-anchor:middle}
.pencil-plan .dim-line{stroke:#8c8475;stroke-width:1;stroke-dasharray:3 2}
.pencil-plan .door-swing{fill:none;stroke:#5c5549;stroke-width:1.4;stroke-dasharray:3 2}
.pencil-plan .door-leaf{stroke:#2c2824;stroke-width:2.2;stroke-linecap:round}
.pencil-plan .window-line{stroke:#2c2824;stroke-width:2.5;fill:#ffffff}
.pencil-plan .window-glass{stroke:#787267;stroke-width:1}

.furnished-plan .plan-bg{fill:#f4f6f9}
.furnished-plan .room-outline{stroke:#212529;stroke-width:4.5;stroke-linejoin:round}
.furnished-plan .room-name{font-family:Outfit,sans-serif;font-weight:700;fill:#1b2434;text-anchor:middle}
.furnished-plan .room-size{font-family:'DM Sans',sans-serif;font-size:9.5px;font-weight:600;fill:#5a687d;text-anchor:middle}
.furnished-plan .door-arc{fill:none;stroke:#64748b;stroke-width:1.4;stroke-dasharray:3 2}
.furnished-plan .door-leaf{stroke:#854d0e;stroke-width:3;stroke-linecap:round}
.furnished-plan .window-frame{stroke:#1e293b;stroke-width:2;fill:#93c5fd}
.furnished-plan .window-sill{stroke:#0f172a;stroke-width:3;stroke-linecap:round}
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
// Read Current Live Form Data
// -------------------------------------------------------------
function getFormData() {
  const form = $('#designForm');
  if (!form) {
    return {
      propertyType: state.propertyType || 'Dream Home',
      bedrooms: state.bed || 2,
      bathrooms: state.bath || 2,
      kitchens: '1 kitchen',
      parking: '2 cars',
      hasLiving: true,
      hasDining: true,
      hasPooja: true,
      hasUtility: false,
      hasOffice: true,
      hasPool: false,
      garden: 'Small garden',
      terrace: 'Both balcony & terrace',
      floors: 2,
      landSize: 2400,
      entrance: 'North-facing',
      style: 'Contemporary',
      layoutCycle: 0
    };
  }

  const formData = new FormData(form);
  const values = Object.fromEntries(formData.entries());
  return {
    propertyType: state.propertyType || values.propertyType || 'Dream Home',
    bedrooms: Number(state.bed || 2),
    bathrooms: Number(state.bath || 2),
    kitchens: values.kitchens || '1 kitchen',
    parking: values.parking || '2 cars',
    hasLiving: !!form.querySelector('input[name="livingRoom"]')?.checked,
    hasDining: !!form.querySelector('input[name="dining"]')?.checked,
    hasPooja: !!form.querySelector('input[name="poojaRoom"]')?.checked,
    hasUtility: !!form.querySelector('input[name="utilityRoom"]')?.checked,
    hasOffice: !!form.querySelector('input[name="homeOffice"]')?.checked,
    hasPool: !!form.querySelector('input[name="swimmingPool"]')?.checked,
    hasSmartHome: !!form.querySelector('input[name="smartHome"]')?.checked,
    hasSolar: !!form.querySelector('input[name="solarPanels"]')?.checked,
    hasLift: !!form.querySelector('input[name="lift"]')?.checked,
    hasElderFriendly: !!form.querySelector('input[name="elderFriendly"]')?.checked,
    garden: values.garden || 'Small garden',
    terrace: values.terrace || 'Both balcony & terrace',
    floors: Math.max(1, Number(values.floors || 2)),
    landSize: Number(values.landSize || 2400),
    entrance: values.entrance || 'North-facing',
    style: values.style || 'Contemporary',
    layoutCycle: Number(state.formPayload?.layoutCycle || 0),
    ideas: $('#designIdeas')?.value || ''
  };
}

// -------------------------------------------------------------
// Procedural Architectural Layout Generator
// Respects exact user-selected rooms, counts, and regeneration styles
// -------------------------------------------------------------
function planRooms(seed) {
  const data = state.formPayload || getFormData();
  const propType = state.propertyType || data.propertyType || 'Dream Home';
  const totalFloors = Math.max(1, Number(data.floors || 2));
  const hasTerrace = totalFloors > 1;
  const floor = Math.min(state.selectedFloor, totalFloors - 1 + Number(hasTerrace));
  const cycle = (Number(data.layoutCycle || 0)) % 4;
  const direction = String(data.entrance || 'North-facing').split('-')[0].toUpperCase();

  const parkingStr = String(data.parking || '2 cars');
  const carCount = parkingStr.startsWith('No') ? 0 : parkingStr.startsWith('1') ? 1 : 2;

  const totalBeds = Math.max(1, Number(data.bedrooms || 2));
  const totalBaths = Math.max(1, Number(data.bathrooms || 2));
  const kitchenCount = String(data.kitchens || '1').startsWith('2') ? 2 : String(data.kitchens || '1').startsWith('3') ? 3 : 1;

  const hasLiving = data.hasLiving !== false;
  const hasDining = data.hasDining !== false;
  const hasPooja = !!data.hasPooja;
  const hasOffice = !!data.hasOffice;
  const hasUtility = !!data.hasUtility;
  const hasPool = !!data.hasPool;

  // Helper room constructor with automatic doors and windows
  const make = (n, x, y, w, h, c, extra = {}) => {
    // Generate intelligent doors and windows based on room category and position
    const doors = extra.doors || [];
    const windows = extra.windows || [];

    if (!extra.doors) {
      // Default interior door placement
      if (c === 'living' || c === 'entry') {
        doors.push({ wall: 'bottom', offset: 0.5, width: 28, swing: 'in' });
      } else if (x < 300) {
        doors.push({ wall: 'right', offset: 0.5, width: 24, swing: 'in' });
      } else {
        doors.push({ wall: 'left', offset: 0.5, width: 24, swing: 'in' });
      }
    }

    if (!extra.windows) {
      // Exterior windows for rooms along canvas edges
      if (y <= 70) windows.push({ wall: 'top', offset: 0.5, width: Math.min(50, w * 0.45) });
      if (y + h >= 370) windows.push({ wall: 'bottom', offset: 0.5, width: Math.min(50, w * 0.45) });
      if (x <= 45) windows.push({ wall: 'left', offset: 0.5, width: Math.min(50, h * 0.45) });
      if (x + w >= 650) windows.push({ wall: 'right', offset: 0.5, width: Math.min(50, h * 0.45) });
    }

    return { n, x, y, w, h, c, doors, windows, ...extra };
  };

  // =========================================================================
  // 1. HOME + RENTAL (Owner Residence on Ground Floor, Rentals on Upper Floors)
  // =========================================================================
  if (propType === 'Home + Rental') {
    if (floor === 0) {
      const rooms = [];
      if (carCount > 0) {
        rooms.push(make(`OWNER ${carCount === 1 ? '1-CAR' : '2-CAR'} PORCH`, 25, 190, 160, 195, 'garage', { cars: carCount }));
      }
      rooms.push(make(`OWNER ${direction} FOYER`, 25, 55, 160, 125, 'entry'));
      if (hasLiving) rooms.push(make('OWNER GRAND LIVING', 195, 55, 260, 200, 'living'));
      if (hasDining) rooms.push(make('OWNER DINING AREA', 195, 265, 150, 120, 'dining'));
      rooms.push(make('OWNER GOURMET KITCHEN', 465, 55, 130, 150, 'kitchen'));
      rooms.push(make('OWNER MASTER SUITE', 465, 215, 130, 170, 'bed', { isMaster: true }));
      if (hasPooja || hasUtility) {
        rooms.push(make(hasPooja ? 'OWNER POOJA ROOM' : 'OWNER UTILITY', 355, 265, 100, 120, hasPooja ? 'pooja' : 'utility'));
      }
      rooms.push(make('TENANT EXTERNAL STAIRS', 605, 55, 75, 200, 'stairs'));
      rooms.push(make('TENANT METERS & UTILITY', 605, 265, 75, 120, 'entry'));
      return rooms;
    }
    if (floor === 1 || (floor > 1 && floor < totalFloors)) {
      return [
        make('TENANT STAIR LANDING', 295, 55, 100, 120, 'stairs'),
        make('COMMON UTILITY & METERS', 295, 185, 100, 200, 'entry'),
        make('RENTAL 1 LIVING ROOM', 25, 55, 160, 195, 'living'),
        make('RENTAL 1 KITCHENETTE', 25, 260, 160, 125, 'kitchen'),
        make('RENTAL 1 BEDROOM', 195, 55, 90, 195, 'bed'),
        make('RENTAL 1 BATHROOM', 195, 260, 90, 125, 'bath'),
        make('RENTAL 2 BEDROOM', 405, 55, 95, 195, 'bed'),
        make('RENTAL 2 BATHROOM', 405, 260, 95, 125, 'bath'),
        make('RENTAL 2 LIVING ROOM', 510, 55, 165, 195, 'living'),
        make('RENTAL 2 KITCHENETTE', 510, 260, 165, 125, 'kitchen')
      ];
    }
    // Roof Terrace
    return [
      make('OWNER PRIVATE ROOF TERRACE', 25, 55, 320, 330, 'outdoor'),
      make('STAIRCASE CABIN', 355, 270, 105, 115, 'stairs'),
      make('TENANT OVERHEAD WATER TANKS', 475, 55, 100, 190, 'entry'),
      make('OWNER & TENANT SOLAR DECK', 475, 255, 195, 130, 'outdoor')
    ];
  }

  // =========================================================================
  // 2. RENTAL HOMES (Full Rental Complex)
  // =========================================================================
  if (propType === 'Rental Homes') {
    if (floor === 0) {
      return [
        make('COVERED STILT PARKING', 25, 55, 260, 160, 'garage', { cars: 2 }),
        make('BIKE PARKING & METERS', 25, 225, 260, 160, 'garage', { cars: 1 }),
        make('CENTRAL STAIRCASE & LOBBY', 295, 55, 90, 330, 'stairs'),
        make('GROUND FLAT 1 LIVING', 395, 55, 140, 180, 'living'),
        make('GROUND FLAT 1 KITCHEN', 395, 245, 140, 140, 'kitchen'),
        make('GROUND FLAT 1 BEDROOM', 545, 55, 130, 180, 'bed'),
        make('GROUND FLAT 1 BATH', 545, 245, 130, 140, 'bath')
      ];
    }
    if (floor < totalFloors) {
      return [
        make('COMMON STAIR LANDING', 295, 55, 90, 130, 'stairs'),
        make('ELECTRICAL & WATER DUCT', 295, 195, 90, 190, 'entry'),
        make('RENTAL FLAT A LIVING', 25, 55, 165, 190, 'living'),
        make('RENTAL FLAT A KITCHEN', 25, 255, 165, 130, 'kitchen'),
        make('RENTAL FLAT A BEDROOM', 200, 55, 85, 190, 'bed'),
        make('RENTAL FLAT A BATH', 200, 255, 85, 130, 'bath'),
        make('RENTAL FLAT B BEDROOM', 395, 55, 95, 190, 'bed'),
        make('RENTAL FLAT B BATH', 395, 255, 95, 130, 'bath'),
        make('RENTAL FLAT B LIVING', 500, 55, 175, 190, 'living'),
        make('RENTAL FLAT B KITCHEN', 500, 255, 175, 130, 'kitchen')
      ];
    }
    return [
      make('COMMON ROOF TERRACE', 25, 55, 320, 330, 'outdoor'),
      make('STAIRCASE CABIN', 355, 270, 105, 115, 'stairs'),
      make('SOLAR POWER & TANKS', 475, 55, 200, 330, 'outdoor')
    ];
  }

  // =========================================================================
  // 3. DREAM HOME (Personal House)
  // Strictly renders ONLY the requested rooms & room counts across floors!
  // =========================================================================

  // Roof Terrace Floor
  if (floor === totalFloors && hasTerrace) {
    return [
      make('ROOF GARDEN & TURF', 35, 60, 310, 325, 'outdoor'),
      make('TERRACE PERGOLA LOUNGE', 355, 60, 205, 200, 'living'),
      make('STAIRCASE CABIN', 355, 270, 105, 115, 'stairs'),
      make('SOLAR & UTILITY DECK', 570, 60, 95, 325, 'outdoor')
    ];
  }

  // Determine rooms for Ground Floor vs First Floor
  if (totalFloors === 1 || floor === 0) {
    // --- GROUND FLOOR (or Single-Floor Home) ---
    // Ground Floor gets:
    // - Parking (if carCount > 0)
    // - Foyer / Entry
    // - Living Room (if hasLiving)
    // - Dining Area (if hasDining)
    // - Kitchen
    // - Pooja Room (if hasPooja)
    // - Home Office (if hasOffice and 1 floor)
    // - Utility (if hasUtility)
    // - Bedrooms:
    //   * If 1 floor: exactly totalBeds bedrooms!
    //   * If 2+ floors: 1 bedroom on GF, remaining on upper floor!
    // - Bathrooms:
    //   * If 1 floor: exactly totalBaths bathrooms!
    //   * If 2+ floors: 1 bathroom on GF, remaining on upper floor!
    // - Staircase (if totalFloors > 1)

    const gfBedsCount = totalFloors === 1 ? totalBeds : 1;
    const gfBathsCount = totalFloors === 1 ? totalBaths : 1;

    // Build room list dynamically according to variation style (cycle)
    if (cycle === 0) {
      // Variation 0: Courtyard Modern Style
      const list = [];
      const leftW = 165;
      let leftY = 60;

      // Left Column
      list.push(make(`${direction} ENTRY FOYER`, 35, leftY, leftW, 115, 'entry'));
      leftY += 125;
      if (carCount > 0) {
        list.push(make(carCount === 1 ? '1-CAR GARAGE' : 'DOUBLE GARAGE', 35, leftY, leftW, 385 - leftY, 'garage', { cars: carCount }));
      } else if (hasOffice) {
        list.push(make('HOME OFFICE / STUDY', 35, leftY, leftW, 385 - leftY, 'office'));
      } else if (hasPool) {
        list.push(make('SWIMMING POOL & DECK', 35, leftY, leftW, 385 - leftY, 'outdoor'));
      } else {
        list.push(make('FRONT VERANDAH & LAWN', 35, leftY, leftW, 385 - leftY, 'outdoor'));
      }

      // Center Column
      const centerW = 250;
      if (hasLiving) {
        list.push(make('GREAT LIVING ROOM', 210, 60, centerW, hasDining || totalFloors > 1 ? 205 : 325, 'living'));
      }
      if (hasDining && (totalFloors > 1 || hasPooja)) {
        list.push(make('DINING AREA', 210, 275, 145, 110, 'dining'));
        if (totalFloors > 1) {
          list.push(make('STAIRCASE', 365, 275, 95, 110, 'stairs'));
        } else if (hasPooja) {
          list.push(make('POOJA ROOM', 365, 275, 95, 110, 'pooja'));
        }
      } else if (hasDining) {
        list.push(make('DINING AREA', 210, 275, centerW, 110, 'dining'));
      } else if (totalFloors > 1) {
        list.push(make('STAIRCASE', 210, 275, centerW, 110, 'stairs'));
      }

      // Right Column: Kitchen, Bedrooms & Baths
      const rightW = 195;
      list.push(make('GOURMET KITCHEN', 470, 60, rightW, 145, 'kitchen'));

      // Add GF bedrooms
      if (gfBedsCount === 1) {
        list.push(make('GUEST BEDROOM', 470, 215, rightW, gfBathsCount > 0 ? 115 : 170, 'bed'));
      } else if (gfBedsCount === 2) {
        list.push(make('MASTER BEDROOM', 470, 215, rightW, 95, 'bed', { isMaster: true }));
        list.push(make('BEDROOM 2', 470, 315, rightW - 65, 70, 'bed'));
      } else {
        list.push(make('MASTER SUITE', 470, 215, rightW, 95, 'bed', { isMaster: true }));
        list.push(make(`BEDROOM (1 of ${gfBedsCount})`, 470, 315, rightW - 65, 70, 'bed'));
      }

      // Add GF bathrooms
      if (gfBathsCount === 1) {
        if (gfBedsCount === 1) list.push(make('GUEST BATH', 470, 335, rightW, 50, 'bath'));
        else list.push(make('BATHROOM 1', 470 + rightW - 60, 315, 60, 70, 'bath'));
      } else if (gfBathsCount >= 2) {
        list.push(make('BATHROOM 1', 470 + rightW - 60, 315, 60, 70, 'bath'));
      }

      return list;
    } else if (cycle === 1) {
      // Variation 1: Open-Concept L-Shaped Villa
      const list = [];
      if (carCount > 0) list.push(make('CARPORT & PORCH', 35, 55, 165, 150, 'garage', { cars: carCount }));
      else if (hasOffice) list.push(make('HOME OFFICE', 35, 55, 165, 150, 'office'));
      else list.push(make('FRONT GARDEN PATIO', 35, 55, 165, 150, 'outdoor'));

      if (hasOffice && carCount > 0) list.push(make('HOME OFFICE / STUDY', 35, 215, 165, 170, 'office'));
      else if (hasPooja) list.push(make('POOJA ROOM', 35, 215, 165, 170, 'pooja'));
      else list.push(make('OUTDOOR DECK', 35, 215, 165, 170, 'outdoor'));

      if (hasLiving) list.push(make('OPEN GREAT HALL', 210, 55, 275, 220, 'living'));
      list.push(make('CHEF PENINSULA KITCHEN', 210, 285, 155, 100, 'kitchen'));
      if (hasDining) list.push(make('DINING SPACE', 375, 285, 110, 100, 'dining'));
      else if (totalFloors > 1) list.push(make('STAIRCASE', 375, 285, 110, 100, 'stairs'));

      // Right Wing
      if (gfBedsCount === 1) {
        list.push(make('MASTER BEDROOM SUITE', 495, 55, 170, 200, 'bed', { isMaster: true }));
        list.push(make('MASTER ENSUITE BATH', 495, 265, 95, 120, 'bath'));
      } else {
        list.push(make('MASTER SUITE', 495, 55, 170, 120, 'bed', { isMaster: true }));
        list.push(make('BEDROOM 2', 495, 185, 170, 110, 'bed'));
        list.push(make('COMMON BATH', 495, 305, 95, 80, 'bath'));
      }
      if (totalFloors > 1 && hasDining) {
        list.push(make('STAIRCASE', 595, 265, 70, 120, 'stairs'));
      } else if (hasUtility) {
        list.push(make('UTILITY ROOM', 595, 265, 70, 120, 'utility'));
      }

      return list;
    } else if (cycle === 2) {
      // Variation 2: Symmetrical Center-Hall Estate
      const list = [];
      if (hasLiving) list.push(make('WEST FORMAL LIVING', 35, 55, 190, 215, 'living'));
      if (hasOffice) list.push(make('PRIVATE STUDY / OFFICE', 35, 280, 190, 105, 'office'));
      else if (carCount > 0) list.push(make('PARKING BAY', 35, 280, 190, 105, 'garage', { cars: carCount }));
      else list.push(make('LOUNGE CORNER', 35, 280, 190, 105, 'living'));

      list.push(make('GRAND CENTER FOYER', 235, 55, 190, 170, 'entry'));
      if (totalFloors > 1) list.push(make('CIRCULAR STAIRCASE', 235, 235, 190, 150, 'stairs'));
      else if (hasPooja) list.push(make('POOJA MANDIR', 235, 235, 190, 150, 'pooja'));
      else list.push(make('CENTRAL COURTYARD', 235, 235, 190, 150, 'outdoor'));

      if (hasDining) list.push(make('FORMAL DINING ROOM', 435, 55, 230, 140, 'dining'));
      else list.push(make('MORNING LOUNGE', 435, 55, 230, 140, 'living'));

      list.push(make('CHEF ISLAND KITCHEN', 435, 205, 140, 180, 'kitchen'));
      if (gfBedsCount >= 1) {
        list.push(make('GUEST BEDROOM', 585, 205, 80, 110, 'bed'));
      }
      if (gfBathsCount >= 1) {
        list.push(make('GUEST BATH', 585, 320, 80, 65, 'bath'));
      }

      return list;
    } else {
      // Variation 3: Dual-Wing Modern Pavilion Home
      const list = [];
      if (hasLiving) list.push(make('GRAND LIVING PAVILION', 35, 55, 215, 200, 'living'));
      if (hasPool) list.push(make('POOL & SUN DECK', 35, 265, 215, 120, 'outdoor'));
      else if (carCount > 0) list.push(make('COVERED CARPORT', 35, 265, 215, 120, 'garage', { cars: carCount }));
      else list.push(make('ALFRESCO OUTDOOR DECK', 35, 265, 215, 120, 'outdoor'));

      list.push(make('GLASS BREEZEWAY ENTRY', 260, 55, 140, 140, 'entry'));
      list.push(make('OPEN CHEF KITCHEN & DINING', 260, 205, 140, totalFloors > 1 ? 110 : 180, 'kitchen'));
      if (totalFloors > 1) list.push(make('STAIRCASE', 260, 320, 140, 65, 'stairs'));

      if (gfBedsCount === 1) {
        list.push(make('MASTER SUITE', 410, 55, 160, 190, 'bed', { isMaster: true }));
        list.push(make('MASTER LUXURY BATH', 580, 55, 85, 190, 'bath'));
        if (hasPooja) list.push(make('POOJA ROOM', 410, 255, 160, 130, 'pooja'));
        else if (hasOffice) list.push(make('HOME OFFICE', 410, 255, 160, 130, 'office'));
        else list.push(make('REAR PATIO', 410, 255, 160, 130, 'outdoor'));
        if (hasUtility) list.push(make('UTILITY', 580, 255, 85, 130, 'utility'));
      } else {
        list.push(make('MASTER SUITE', 410, 55, 160, 190, 'bed', { isMaster: true }));
        list.push(make('MASTER BATH', 580, 55, 85, 190, 'bath'));
        list.push(make('BEDROOM 2', 410, 255, 160, 130, 'bed'));
        list.push(make('BATHROOM 2', 580, 255, 85, 130, 'bath'));
      }

      return list;
    }
  }

  // --- FIRST FLOOR (when floors > 1) ---
  // First Floor gets:
  // - Remaining bedrooms: totalBeds - 1
  // - Remaining bathrooms: totalBaths - 1
  // - Staircase landing
  // - Upper Family Lounge / Balcony
  const ffBedsCount = Math.max(1, totalBeds - 1);
  const ffBathsCount = Math.max(1, totalBaths - 1);

  const list = [];
  list.push(make('MASTER BEDROOM SUITE', 35, 60, 240, 200, 'bed', { isMaster: true }));
  list.push(make('MASTER LUXURY BATH', 35, 270, 140, 115, 'bath'));
  list.push(make('PRIVATE BALCONY', 185, 270, 90, 115, 'outdoor'));

  list.push(make('UPPER FAMILY LOUNGE', 285, 60, 180, 190, 'living'));
  list.push(make('STAIRCASE DOWN', 285, 260, 95, 125, 'stairs'));

  // Remaining bedrooms on First Floor
  if (ffBedsCount === 1) {
    list.push(make('BEDROOM 2', 475, 60, 190, 155, 'bed'));
    list.push(make('EN-SUITE BATH 2', 475, 225, 95, 80, 'bath'));
    list.push(make('WALK-IN CLOSET', 570, 225, 95, 80, 'entry'));
    list.push(make('REAR BALCONY', 475, 315, 190, 70, 'outdoor'));
  } else if (ffBedsCount === 2) {
    list.push(make('BEDROOM 2', 475, 60, 190, 140, 'bed'));
    list.push(make('BEDROOM 3', 475, 210, 190, 120, 'bed'));
    list.push(make('BATHROOM 2', 475, 335, 190, 50, 'bath'));
  } else {
    list.push(make('BEDROOM 2', 475, 60, 190, 100, 'bed'));
    list.push(make('BEDROOM 3', 475, 165, 190, 100, 'bed'));
    list.push(make(`BEDROOM (4 of ${totalBeds})`, 475, 270, 190, 65, 'bed'));
    list.push(make('UPPER BATHROOM', 475, 340, 190, 45, 'bath'));
  }

  return list;
}

// -------------------------------------------------------------
// 2D High-Detail Furnished Architectural Plan (SVG)
// Includes real wooden doors with swing arcs and glass-pane windows for all rooms
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

  // Draw architectural doors on room perimeter
  const renderDoors = (r) => {
    if (!r.doors || !r.doors.length) return '';
    return r.doors.map(d => {
      const dw = d.width || 24;
      let dx = r.x, dy = r.y;
      let leafX1, leafY1, leafX2, leafY2;
      let arcPath;

      if (d.wall === 'top') {
        dx = r.x + r.w * (d.offset || 0.5) - dw / 2;
        dy = r.y;
        leafX1 = dx; leafY1 = dy; leafX2 = dx; leafY2 = dy + dw;
        arcPath = `M ${dx + dw} ${dy} A ${dw} ${dw} 0 0 1 ${dx} ${dy + dw}`;
      } else if (d.wall === 'bottom') {
        dx = r.x + r.w * (d.offset || 0.5) - dw / 2;
        dy = r.y + r.h;
        leafX1 = dx; leafY1 = dy; leafX2 = dx; leafY2 = dy - dw;
        arcPath = `M ${dx + dw} ${dy} A ${dw} ${dw} 0 0 0 ${dx} ${dy - dw}`;
      } else if (d.wall === 'left') {
        dx = r.x;
        dy = r.y + r.h * (d.offset || 0.5) - dw / 2;
        leafX1 = dx; leafY1 = dy; leafX2 = dx + dw; leafY2 = dy;
        arcPath = `M ${dx} ${dy + dw} A ${dw} ${dw} 0 0 0 ${dx + dw} ${dy}`;
      } else {
        // right wall
        dx = r.x + r.w;
        dy = r.y + r.h * (d.offset || 0.5) - dw / 2;
        leafX1 = dx; leafY1 = dy; leafX2 = dx - dw; leafY2 = dy;
        arcPath = `M ${dx} ${dy + dw} A ${dw} ${dw} 0 0 1 ${dx - dw} ${dy}`;
      }

      return `
        <g class="door-assembly">
          <!-- Door Wall Cutout Gap -->
          <line x1="${d.wall === 'left' || d.wall === 'right' ? dx : dx}" y1="${d.wall === 'top' || d.wall === 'bottom' ? dy : dy}" 
                x2="${d.wall === 'left' || d.wall === 'right' ? dx : dx + dw}" y2="${d.wall === 'top' || d.wall === 'bottom' ? dy : dy + dw}" 
                stroke="#f4f6f9" stroke-width="6"/>
          <!-- Door Swing Arc -->
          <path class="door-arc" d="${arcPath}"/>
          <!-- Solid Wooden Door Leaf -->
          <line class="door-leaf" x1="${leafX1}" y1="${leafY1}" x2="${leafX2}" y2="${leafY2}"/>
          <!-- Pivot Hinge Pin -->
          <circle cx="${leafX1}" cy="${leafY1}" r="2" fill="#1e293b"/>
        </g>
      `;
    }).join('');
  };

  // Draw architectural windows on room exterior walls
  const renderWindows = (r) => {
    if (!r.windows || !r.windows.length) return '';
    return r.windows.map(w => {
      const ww = w.width || 36;
      let wx = r.x, wy = r.y, wWidth = ww, wHeight = 4;
      let sillX1, sillY1, sillX2, sillY2;

      if (w.wall === 'top') {
        wx = r.x + r.w * (w.offset || 0.5) - ww / 2;
        wy = r.y - 2;
        wWidth = ww; wHeight = 4;
        sillX1 = wx - 3; sillY1 = wy; sillX2 = wx + ww + 3; sillY2 = wy;
      } else if (w.wall === 'bottom') {
        wx = r.x + r.w * (w.offset || 0.5) - ww / 2;
        wy = r.y + r.h - 2;
        wWidth = ww; wHeight = 4;
        sillX1 = wx - 3; sillY1 = wy + 4; sillX2 = wx + ww + 3; sillY2 = wy + 4;
      } else if (w.wall === 'left') {
        wx = r.x - 2;
        wy = r.y + r.h * (w.offset || 0.5) - ww / 2;
        wWidth = 4; wHeight = ww;
        sillX1 = wx; sillY1 = wy - 3; sillX2 = wx; sillY2 = wy + ww + 3;
      } else {
        // right wall
        wx = r.x + r.w - 2;
        wy = r.y + r.h * (w.offset || 0.5) - ww / 2;
        wWidth = 4; wHeight = ww;
        sillX1 = wx + 4; sillY1 = wy - 3; sillX2 = wx + 4; sillY2 = wy + ww + 3;
      }

      return `
        <g class="window-assembly">
          <!-- Outer Wall Sill -->
          <line class="window-sill" x1="${sillX1}" y1="${sillY1}" x2="${sillX2}" y2="${sillY2}"/>
          <!-- Glass Pane & Frame -->
          <rect class="window-frame" x="${wx}" y="${wy}" width="${wWidth}" height="${wHeight}" rx="1"/>
        </g>
      `;
    }).join('');
  };

  // Furniture items rendered per room type
  const renderRoomFurniture = (r) => {
    const { x, y, w, h, c } = r;

    // --- Garage with Realistic Cars ---
    if (c === 'garage') {
      const isDouble = r.cars !== 1 && w > 110;
      const renderCar = (cx, cy, cw, ch, carColor, glassColor) => `
        <g filter="url(#furnitureShadow)" transform="translate(${cx}, ${cy})">
          <rect x="-2" y="-2" width="${cw + 4}" height="${ch + 4}" fill="none" stroke="#ffffff" stroke-width="1.2" stroke-dasharray="6 4" opacity="0.8"/>
          <rect x="2" y="2" width="${cw - 4}" height="${ch - 4}" rx="9" fill="${carColor}"/>
          <rect x="${cw * 0.15}" y="${ch * 0.22}" width="${cw * 0.70}" height="${ch * 0.52}" rx="5" fill="#1b2434"/>
          <path d="M${cw * 0.18} ${ch * 0.26} L${cw * 0.82} ${ch * 0.26} L${cw * 0.74} ${ch * 0.38} L${cw * 0.26} ${ch * 0.38} Z" fill="${glassColor}"/>
          <path d="M${cw * 0.24} ${ch * 0.64} L${cw * 0.76} ${ch * 0.64} L${cw * 0.80} ${ch * 0.72} L${cw * 0.20} ${ch * 0.72} Z" fill="${glassColor}"/>
          <rect x="${cw * 0.16}" y="${ch * 0.40}" width="3" height="${ch * 0.22}" rx="1" fill="${glassColor}"/>
          <rect x="${cw * 0.84 - 3}" y="${ch * 0.40}" width="3" height="${ch * 0.22}" rx="1" fill="${glassColor}"/>
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

    // --- Living Room with L-Sectional Sofa, Coffee Table & Plant ---
    if (c === 'living') {
      const rugW = w * 0.75, rugH = h * 0.68;
      const rugX = x + (w - rugW) / 2, rugY = y + (h - rugH) / 2 + 10;
      return `
        <g filter="url(#furnitureShadow)">
          <rect x="${rugX}" y="${rugY}" width="${rugW}" height="${rugH}" rx="4" fill="#ebe4d8" stroke="#d5ccbe" stroke-width="1"/>
          <path d="M${rugX + 12} ${rugY + 12} h${rugW * 0.65} v${26} h-${rugW * 0.40} v${rugH * 0.55} h-${26} Z" fill="#46546b" rx="4"/>
          <line x1="${rugX + 12}" y1="${rugY + 36}" x2="${rugX + 12 + rugW * 0.65}" y2="${rugY + 36}" stroke="#343f52" stroke-width="1.2"/>
          <line x1="${rugX + 38}" y1="${rugY + 36}" x2="${rugX + 38}" y2="${rugY + 12 + rugH * 0.55 + 26}" stroke="#343f52" stroke-width="1.2"/>
          <rect x="${rugX + 16}" y="${rugY + 14}" width="9" height="9" rx="2" fill="#d99b43" transform="rotate(-12 ${rugX + 20} ${rugY + 18})"/>
          <rect x="${rugX + rugW * 0.65}" y="${rugY + 14}" width="9" height="9" rx="2" fill="#528cb8" transform="rotate(10 ${rugX + rugW * 0.65} ${rugY + 18})"/>
          <rect x="${rugX + 48}" y="${rugY + 44}" width="${rugW * 0.38}" height="${rugH * 0.28}" rx="4" fill="#bcd7eb" opacity="0.85" stroke="#7aaac7" stroke-width="1.2"/>
          <rect x="${x + w * 0.25}" y="${y + 5}" width="${w * 0.50}" height="10" rx="2" fill="#302a24"/>
          <circle cx="${x + 18}" cy="${y + h - 18}" r="9" fill="#e8ded1" stroke="#a39684" stroke-width="1.2"/>
          <circle cx="${x + 18}" cy="${y + h - 18}" r="7" fill="#438a5e"/>
        </g>
      `;
    }

    // --- Dining Room with Table & Chairs ---
    if (c === 'dining') {
      const tabW = w * 0.58, tabH = h * 0.45;
      const tabX = x + (w - tabW) / 2, tabY = y + (h - tabH) / 2;
      return `
        <g filter="url(#furnitureShadow)">
          <rect x="${tabX - 14}" y="${tabY - 14}" width="${tabW + 28}" height="${tabH + 28}" rx="4" fill="#faf6ed" stroke="#ded5c4" stroke-width="1"/>
          <rect x="${tabX}" y="${tabY}" width="${tabW}" height="${tabH}" rx="3" fill="#544337" stroke="#362920" stroke-width="1"/>
          <rect x="${tabX + tabW * 0.2}" y="${tabY + 2}" width="${tabW * 0.6}" height="${tabH - 4}" fill="#f2ede4" rx="1"/>
          <circle cx="${tabX + tabW / 2}" cy="${tabY + tabH / 2}" r="5" fill="#d97d55"/>
          <rect x="${tabX + tabW * 0.15}" y="${tabY - 11}" width="${tabW * 0.28}" height="9" rx="2" fill="#8c7868"/>
          <rect x="${tabX + tabW * 0.57}" y="${tabY - 11}" width="${tabW * 0.28}" height="9" rx="2" fill="#8c7868"/>
          <rect x="${tabX + tabW * 0.15}" y="${tabY + tabH + 2}" width="${tabW * 0.28}" height="9" rx="2" fill="#8c7868"/>
          <rect x="${tabX + tabW * 0.57}" y="${tabY + tabH + 2}" width="${tabW * 0.28}" height="9" rx="2" fill="#8c7868"/>
        </g>
      `;
    }

    // --- Kitchen with Island, Counters, Sink & Stove ---
    if (c === 'kitchen') {
      return `
        <g filter="url(#furnitureShadow)">
          <path d="M${x + 5} ${y + 5} h${w - 10} v${28} h-${w - 42} v${h - 40} h-${28} Z" fill="#ffffff" stroke="#caced4" stroke-width="1.2"/>
          <rect x="${x + 36}" y="${y + 9}" width="28" height="18" rx="2" fill="#9dbcd4" stroke="#688ca8" stroke-width="1"/>
          <line x1="${x + 50}" y1="${y + 9}" x2="${x + 50}" y2="${y + 27}" stroke="#688ca8" stroke-width="1"/>
          <circle cx="${x + 50}" cy="${y + 8}" r="2" fill="#4d5966"/>
          <rect x="${x + w - 54}" y="${y + 9}" width="28" height="18" rx="2" fill="#212529"/>
          <circle cx="${x + w - 46}" cy="${y + 14}" r="3.5" fill="#df4732"/>
          <circle cx="${x + w - 34}" cy="${y + 14}" r="3.5" fill="#df4732"/>
          <circle cx="${x + w - 46}" cy="${y + 22}" r="3" fill="#df4732"/>
          <circle cx="${x + w - 34}" cy="${y + 22}" r="3" fill="#df4732"/>
          <rect x="${x + 38}" y="${y + 50}" width="${Math.max(30, w - 60)}" height="${h * 0.36}" rx="3" fill="#ffffff" stroke="#b0b8c2" stroke-width="1.2"/>
          <rect x="${x + 6}" y="${y + h - 34}" width="26" height="28" rx="2" fill="#abb5c2" stroke="#68778a" stroke-width="1.2"/>
        </g>
      `;
    }

    // --- Bedroom with King Bed, Pillows, Nightstands & Wardrobe ---
    if (c === 'bed') {
      const bedW = Math.min(65, w * 0.52), bedH = Math.min(78, h * 0.62);
      const bedX = x + (w - bedW) / 2, bedY = y + 15;
      return `
        <g filter="url(#furnitureShadow)">
          <rect x="${bedX - 4}" y="${bedY - 6}" width="${bedW + 8}" height="7" rx="2" fill="#524338"/>
          <rect x="${bedX}" y="${bedY}" width="${bedW}" height="${bedH}" rx="4" fill="#fafbfc" stroke="#cdd5df" stroke-width="1.2"/>
          <rect x="${bedX + 2}" y="${bedY + bedH * 0.32}" width="${bedW - 4}" height="${bedH * 0.64}" rx="3" fill="#607699"/>
          <rect x="${bedX + 4}" y="${bedY + 4}" width="${bedW * 0.40}" height="14" rx="3" fill="#ffffff" stroke="#c8d2df" stroke-width="1"/>
          <rect x="${bedX + bedW * 0.54}" y="${bedY + 4}" width="${bedW * 0.40}" height="14" rx="3" fill="#ffffff" stroke="#c8d2df" stroke-width="1"/>
          <rect x="${bedX - 16}" y="${bedY}" width="12" height="14" rx="2" fill="#69574a"/>
          <circle cx="${bedX - 10}" cy="${bedY + 7}" r="4" fill="#ffec99" stroke="#dfa32b" stroke-width="1"/>
          <rect x="${bedX + bedW + 4}" y="${bedY}" width="12" height="14" rx="2" fill="#69574a"/>
          <circle cx="${bedX + bedW + 10}" cy="${bedY + 7}" r="4" fill="#ffec99" stroke="#dfa32b" stroke-width="1"/>
          <rect x="${x + 6}" y="${y + h - 18}" width="${w - 12}" height="12" rx="2" fill="#d9d2c5" stroke="#7a7061" stroke-width="1"/>
        </g>
      `;
    }

    // --- Bathrooms with Shower, Vanity & Toilet ---
    if (c === 'bath') {
      return `
        <g filter="url(#furnitureShadow)">
          <rect x="${x + 5}" y="${y + 5}" width="28" height="28" rx="2" fill="#d5e8f5" stroke="#77a6c9" stroke-width="1.2"/>
          <circle cx="${x + 19}" cy="${y + 19}" r="3" fill="#5283a8"/>
          <rect x="${x + w - 32}" y="${y + 6}" width="26" height="16" rx="2" fill="#ffffff" stroke="#aeb7c2" stroke-width="1.2"/>
          <ellipse cx="${x + w - 19}" cy="${y + 14}" rx="8" ry="5" fill="#ebf2f7" stroke="#7a9cb5" stroke-width="1"/>
          <rect x="${x + 8}" y="${y + h - 24}" width="14" height="6" rx="1" fill="#ffffff" stroke="#b0b8c2" stroke-width="1"/>
          <ellipse cx="${x + 15}" cy="${y + h - 12}" rx="7" ry="9" fill="#ffffff" stroke="#b0b8c2" stroke-width="1.2"/>
        </g>
      `;
    }

    // --- Pooja Room ---
    if (c === 'pooja') {
      return `
        <g filter="url(#furnitureShadow)">
          <rect x="${x + w * 0.2}" y="${y + 8}" width="${w * 0.6}" height="20" rx="3" fill="#854d0e" stroke="#451a03" stroke-width="1.2"/>
          <circle cx="${x + w / 2}" cy="${y + 18}" r="5" fill="#eab308"/>
          <circle cx="${x + w * 0.3}" cy="${y + 18}" r="3" fill="#ea580c"/>
          <circle cx="${x + w * 0.7}" cy="${y + 18}" r="3" fill="#ea580c"/>
          <rect x="${x + w * 0.25}" y="${y + h - 22}" width="${w * 0.5}" height="14" rx="2" fill="#fde047" opacity="0.8"/>
        </g>
      `;
    }

    // --- Home Office / Study ---
    if (c === 'office') {
      return `
        <g filter="url(#furnitureShadow)">
          <rect x="${x + 12}" y="${y + 12}" width="${w * 0.55}" height="24" rx="3" fill="#4d3e33" stroke="#33271e" stroke-width="1"/>
          <rect x="${x + 24}" y="${y + 17}" width="16" height="12" rx="1" fill="#a4b3c4"/>
          <circle cx="${x + 32}" cy="${y + 44}" r="8" fill="#283547" stroke="#161f2c" stroke-width="1"/>
          <rect x="${x + w - 20}" y="${y + 8}" width="14" height="${h - 16}" rx="2" fill="#695646" stroke="#423429" stroke-width="1"/>
        </g>
      `;
    }

    // --- Staircase ---
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
          <path d="M${x + w / 2} ${y + h - 14} L${x + w / 2} ${y + 16} M${x + w / 2 - 4} ${y + 22} L${x + w / 2} ${y + 16} L${x + w / 2 + 4} ${y + 22}" fill="none" stroke="#2b241c" stroke-width="1.6"/>
          <text x="${x + w / 2}" y="${y + h - 18}" font-family="Outfit" font-size="8" font-weight="700" fill="#2b241c" text-anchor="middle">UP</text>
        </g>
      `;
    }

    return '';
  };

  const getFloorFill = (c) => {
    if (c === 'garage') return 'url(#garageFloor)';
    if (c === 'kitchen' || c === 'bath' || c === 'pooja') return 'url(#marbleFloor)';
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
        <!-- Room Perimeter Walls -->
        <rect class="room-outline" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="none"/>
        <!-- Doors on Room Perimeter -->
        ${renderDoors(r)}
        <!-- Windows on Room Exterior -->
        ${renderWindows(r)}
        <!-- Room Label Badge -->
        <g>
          <rect x="${r.x + r.w / 2 - 50}" y="${labelY - 11}" width="100" height="15" rx="3" fill="#ffffff" opacity="0.92"/>
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
      <!-- Rooms, Furnishings, Doors & Windows -->
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
// Shows crisp architectural door swings and double-line window symbols
// -------------------------------------------------------------
function renderPencilSvg(rooms, seed) {
  const renderPencilDoors = (r) => {
    if (!r.doors || !r.doors.length) return '';
    return r.doors.map(d => {
      const dw = d.width || 24;
      let dx = r.x, dy = r.y;
      let leafX1, leafY1, leafX2, leafY2, arcPath;

      if (d.wall === 'top') {
        dx = r.x + r.w * (d.offset || 0.5) - dw / 2;
        dy = r.y;
        leafX1 = dx; leafY1 = dy; leafX2 = dx; leafY2 = dy + dw;
        arcPath = `M ${dx + dw} ${dy} A ${dw} ${dw} 0 0 1 ${dx} ${dy + dw}`;
      } else if (d.wall === 'bottom') {
        dx = r.x + r.w * (d.offset || 0.5) - dw / 2;
        dy = r.y + r.h;
        leafX1 = dx; leafY1 = dy; leafX2 = dx; leafY2 = dy - dw;
        arcPath = `M ${dx + dw} ${dy} A ${dw} ${dw} 0 0 0 ${dx} ${dy - dw}`;
      } else if (d.wall === 'left') {
        dx = r.x;
        dy = r.y + r.h * (d.offset || 0.5) - dw / 2;
        leafX1 = dx; leafY1 = dy; leafX2 = dx + dw; leafY2 = dy;
        arcPath = `M ${dx} ${dy + dw} A ${dw} ${dw} 0 0 0 ${dx + dw} ${dy}`;
      } else {
        dx = r.x + r.w;
        dy = r.y + r.h * (d.offset || 0.5) - dw / 2;
        leafX1 = dx; leafY1 = dy; leafX2 = dx - dw; leafY2 = dy;
        arcPath = `M ${dx} ${dy + dw} A ${dw} ${dw} 0 0 1 ${dx - dw} ${dy}`;
      }

      return `
        <g>
          <line x1="${d.wall === 'left' || d.wall === 'right' ? dx : dx}" y1="${d.wall === 'top' || d.wall === 'bottom' ? dy : dy}" 
                x2="${d.wall === 'left' || d.wall === 'right' ? dx : dx + dw}" y2="${d.wall === 'top' || d.wall === 'bottom' ? dy : dy + dw}" 
                stroke="#fbf9f4" stroke-width="6"/>
          <path class="door-swing" d="${arcPath}"/>
          <line class="door-leaf" x1="${leafX1}" y1="${leafY1}" x2="${leafX2}" y2="${leafY2}"/>
          <circle cx="${leafX1}" cy="${leafY1}" r="1.5" fill="#2c2824"/>
        </g>
      `;
    }).join('');
  };

  const renderPencilWindows = (r) => {
    if (!r.windows || !r.windows.length) return '';
    return r.windows.map(w => {
      const ww = w.width || 36;
      let wx = r.x, wy = r.y, wWidth = ww, wHeight = 4;

      if (w.wall === 'top') {
        wx = r.x + r.w * (w.offset || 0.5) - ww / 2;
        wy = r.y - 2;
        wWidth = ww; wHeight = 4;
      } else if (w.wall === 'bottom') {
        wx = r.x + r.w * (w.offset || 0.5) - ww / 2;
        wy = r.y + r.h - 2;
        wWidth = ww; wHeight = 4;
      } else if (w.wall === 'left') {
        wx = r.x - 2;
        wy = r.y + r.h * (w.offset || 0.5) - ww / 2;
        wWidth = 4; wHeight = ww;
      } else {
        wx = r.x + r.w - 2;
        wy = r.y + r.h * (w.offset || 0.5) - ww / 2;
        wWidth = 4; wHeight = ww;
      }

      return `
        <g>
          <rect class="window-line" x="${wx}" y="${wy}" width="${wWidth}" height="${wHeight}"/>
          <line class="window-glass" x1="${w.wall === 'left' || w.wall === 'right' ? wx + 2 : wx}" y1="${w.wall === 'top' || w.wall === 'bottom' ? wy + 2 : wy}"
                x2="${w.wall === 'left' || w.wall === 'right' ? wx + 2 : wx + wWidth}" y2="${w.wall === 'top' || w.wall === 'bottom' ? wy + 2 : wy + wHeight}"/>
        </g>
      `;
    }).join('');
  };

  const roomSvg = rooms.map(r => {
    const sizeStr = `${Math.max(8, Math.round(r.w / 16))}' × ${Math.max(7, Math.round(r.h / 15))}'`;
    return `
      <g>
        <rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="#fcfaf4" stroke="#2c2824" stroke-width="4"/>
        <rect x="${r.x + 3}" y="${r.y + 3}" width="${r.w - 6}" height="${r.h - 6}" fill="none" stroke="#7d7465" stroke-width="1"/>
        ${renderPencilDoors(r)}
        ${renderPencilWindows(r)}
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
// Includes realistic door openings and transparent 3D glass windows
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
  controls.maxPolarAngle = Math.PI / 2.05;
  controls.minDistance = 80;
  controls.maxDistance = 650;
  controls.target.set(0, 0, 0);
  threeApp.controls = controls;

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

  // Pavement base
  const baseMat = new THREE.MeshStandardMaterial({ color: 0xe5e7eb, roughness: 0.7 });
  const baseGeo = new THREE.BoxGeometry(410, 4, 270);
  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  baseMesh.position.set(0, 1, 0);
  baseMesh.receiveShadow = true;
  scene.add(baseMesh);

  // Coordinate mapper from SVG 700x420 -> Three.js
  const mapCoord = (r) => {
    const cx = (r.x + r.w / 2 - 350) * 0.54;
    const cz = (r.y + r.h / 2 - 210) * 0.54;
    const rw = r.w * 0.54;
    const rz = r.h * 0.54;
    return { cx, cz, rw, rz };
  };

  // Build Cutaway 3D Rooms with Real Doors and 3D Glass Windows
  rooms.forEach(r => {
    const { cx, cz, rw, rz } = mapCoord(r);
    const roomGroup = new THREE.Group();
    roomGroup.position.set(cx, 3, cz);

    // Floor Slab
    let floorMat;
    if (r.c === 'garage') floorMat = new THREE.MeshStandardMaterial({ map: threeApp.textures.garage, roughness: 0.7 });
    else if (r.c === 'kitchen' || r.c === 'bath' || r.c === 'pooja') floorMat = new THREE.MeshStandardMaterial({ map: threeApp.textures.marble, roughness: 0.3 });
    else if (r.c === 'outdoor') floorMat = new THREE.MeshStandardMaterial({ map: threeApp.textures.grass, roughness: 0.8 });
    else floorMat = new THREE.MeshStandardMaterial({ map: threeApp.textures.wood, roughness: 0.5 });

    const floorGeo = new THREE.BoxGeometry(rw - 0.6, 1.5, rz - 0.6);
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.receiveShadow = true;
    floorMesh.userData = { roomName: r.n, category: r.c };
    roomGroup.add(floorMesh);
    threeApp.roomMeshes.push(floorMesh);

    // Cutaway Walls (Height 14 units, with realistic door and window openings)
    const wallHeight = 14;
    const wallThick = 2.2;
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.85 });
    const capMat = new THREE.MeshStandardMaterial({ color: 0x2b323c, roughness: 0.5 });
    const glass3DMat = new THREE.MeshPhysicalMaterial({ color: 0x90c5f0, transmission: 0.85, transparent: true, opacity: 0.65, roughness: 0.1 });
    const windowFrameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3 });

    // Build intelligent wall with door gaps and windows
    const buildWallWithOpenings = (wallSide, length, wx, wz, isHorizontal) => {
      const hasDoor = (r.doors || []).some(d => d.wall === wallSide);
      const hasWin = (r.windows || []).some(w => w.wall === wallSide);

      if (hasDoor) {
        // Build 2 side posts leaving doorway gap in center
        const postLen = (length - 14) / 2;
        if (postLen > 2) {
          const wGeo1 = isHorizontal ? new THREE.BoxGeometry(postLen, wallHeight, wallThick) : new THREE.BoxGeometry(wallThick, wallHeight, postLen);
          const w1 = new THREE.Mesh(wGeo1, wallMat);
          w1.position.set(isHorizontal ? wx - length / 2 + postLen / 2 : wx, wallHeight / 2, isHorizontal ? wz : wz - length / 2 + postLen / 2);
          w1.castShadow = true;
          roomGroup.add(w1);

          const w2 = new THREE.Mesh(wGeo1, wallMat);
          w2.position.set(isHorizontal ? wx + length / 2 - postLen / 2 : wx, wallHeight / 2, isHorizontal ? wz : wz + length / 2 - postLen / 2);
          w2.castShadow = true;
          roomGroup.add(w2);

          // Top Header Beam (Lintel over door)
          const lintelGeo = isHorizontal ? new THREE.BoxGeometry(14, 3, wallThick) : new THREE.BoxGeometry(wallThick, 3, 14);
          const lintel = new THREE.Mesh(lintelGeo, wallMat);
          lintel.position.set(wx, wallHeight - 1.5, wz);
          roomGroup.add(lintel);
        }
      } else if (hasWin) {
        // Lower Sill Wall
        const sillGeo = isHorizontal ? new THREE.BoxGeometry(length, 4.5, wallThick) : new THREE.BoxGeometry(wallThick, 4.5, length);
        const sill = new THREE.Mesh(sillGeo, wallMat);
        sill.position.set(wx, 2.25, wz);
        sill.castShadow = true;
        roomGroup.add(sill);

        // Upper Lintel Wall
        const lintelGeo = isHorizontal ? new THREE.BoxGeometry(length, 3, wallThick) : new THREE.BoxGeometry(wallThick, 3, length);
        const lintel = new THREE.Mesh(lintelGeo, wallMat);
        lintel.position.set(wx, wallHeight - 1.5, wz);
        roomGroup.add(lintel);

        // 3D Glass Pane inside window opening
        const winSpan = length * 0.65;
        const glassGeo = isHorizontal ? new THREE.BoxGeometry(winSpan, 6.5, 0.6) : new THREE.BoxGeometry(0.6, 6.5, winSpan);
        const glassMesh = new THREE.Mesh(glassGeo, glass3DMat);
        glassMesh.position.set(wx, 7.75, wz);
        roomGroup.add(glassMesh);

        // Window Frame Sill
        const frameGeo = isHorizontal ? new THREE.BoxGeometry(winSpan + 2, 0.8, wallThick + 0.6) : new THREE.BoxGeometry(wallThick + 0.6, 0.8, winSpan + 2);
        const frameMesh = new THREE.Mesh(frameGeo, windowFrameMat);
        frameMesh.position.set(wx, 4.5, wz);
        roomGroup.add(frameMesh);
      } else {
        // Solid Wall Segment
        const wallGeo = isHorizontal ? new THREE.BoxGeometry(length, wallHeight, wallThick) : new THREE.BoxGeometry(wallThick, wallHeight, length);
        const wall = new THREE.Mesh(wallGeo, wallMat);
        wall.position.set(wx, wallHeight / 2, wz);
        wall.castShadow = true;
        wall.receiveShadow = true;
        roomGroup.add(wall);

        // Dark Top Wall Cap
        const capGeo = isHorizontal ? new THREE.BoxGeometry(length + 0.2, 0.6, wallThick + 0.2) : new THREE.BoxGeometry(wallThick + 0.2, 0.6, length + 0.2);
        const cap = new THREE.Mesh(capGeo, capMat);
        cap.position.set(wx, wallHeight + 0.3, wz);
        roomGroup.add(cap);
      }
    };

    // North Wall
    buildWallWithOpenings('top', rw, 0, -rz / 2, true);
    // South Wall
    buildWallWithOpenings('bottom', rw, 0, rz / 2, true);
    // West Wall
    buildWallWithOpenings('left', rz, -rw / 2, 0, false);
    // East Wall
    buildWallWithOpenings('right', rz, rw / 2, 0, false);

    // 3D Architectural Furniture
    build3DFurniture(roomGroup, r, rw, rz);

    // Interior Warm Lights
    if (r.c === 'living' || r.c === 'bed' || r.c === 'kitchen' || r.c === 'pooja') {
      const pl = new THREE.PointLight(0xffb74d, state.lightingMode === 'day' ? 0.8 : 1.8, 85);
      pl.position.set(0, 11, 0);
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

  // Raycasting Tooltip
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
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x544336, roughness: 0.6 });
  const fabricDarkMat = new THREE.MeshStandardMaterial({ color: 0x3a485c, roughness: 0.8 });
  const fabricLightMat = new THREE.MeshStandardMaterial({ color: 0xd9e2ec, roughness: 0.9 });
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x9ec5e8, transmission: 0.8, roughness: 0.1, transparent: true, opacity: 0.7 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0xabb8c6, metalness: 0.8, roughness: 0.2 });

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

      const chassis = new THREE.Mesh(new THREE.BoxGeometry(18, 5, 34), bodyMat);
      chassis.position.y = 3.5;
      chassis.castShadow = true;
      carGroup.add(chassis);

      const cabin = new THREE.Mesh(new THREE.BoxGeometry(15, 4.5, 18), cGlassMat);
      cabin.position.set(0, 7.5, -2);
      cabin.castShadow = true;
      carGroup.add(cabin);

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
      build3DCar(-rw * 0.24, 0, 0x1c2430, 0x6495ed);
      build3DCar(rw * 0.24, 0, 0xf0f4f8, 0x7eb3d9);
    } else {
      build3DCar(0, 0, 0x1c2430, 0x6495ed);
    }
    return;
  }

  // --- Living Room ---
  if (r.c === 'living') {
    box(rw * 0.75, 0.4, rz * 0.70, new THREE.MeshStandardMaterial({ color: 0xe2d9cb, roughness: 0.95 }), 0, 0, 4);
    const sofaH = 4.5;
    box(rw * 0.50, sofaH, 12, fabricDarkMat, -rw * 0.08, 0, -rz * 0.15);
    box(12, sofaH, rz * 0.38, fabricDarkMat, -rw * 0.08 - rw * 0.25 + 6, 0, 0);
    box(5, 3, 5, new THREE.MeshStandardMaterial({ color: 0xd99b43 }), -rw * 0.22, sofaH, -rz * 0.15, 0, 0.2);
    box(5, 3, 5, new THREE.MeshStandardMaterial({ color: 0x5a94b8 }), rw * 0.12, sofaH, -rz * 0.15, 0, -0.2);
    box(rw * 0.30, 0.6, rz * 0.26, glassMat, 0, 3, 2);
    box(rw * 0.30 - 2, 2.8, rz * 0.26 - 2, woodMat, 0, 0, 2);
    box(rw * 0.48, 4, 4, woodMat, 0, 0, -rz / 2 + 3);
    box(rw * 0.40, 8, 1, new THREE.MeshStandardMaterial({ color: 0x11161d, roughness: 0.2 }), 0, 4.5, -rz / 2 + 2);
    return;
  }

  // --- Dining Room ---
  if (r.c === 'dining') {
    const tabW = rw * 0.65, tabD = rz * 0.50;
    box(tabW, 1.2, tabD, woodMat, 0, 5.5, 0);
    box(2, 5.5, 2, woodMat, -tabW / 2 + 2, 0, -tabD / 2 + 2);
    box(2, 5.5, 2, woodMat, tabW / 2 - 2, 0, -tabD / 2 + 2);
    box(2, 5.5, 2, woodMat, -tabW / 2 + 2, 0, tabD / 2 - 2);
    box(2, 5.5, 2, woodMat, tabW / 2 - 2, 0, tabD / 2 - 2);
    [-tabW * 0.28, 0, tabW * 0.28].forEach(cx => {
      box(5, 3.5, 5, fabricLightMat, cx, 0, -tabD / 2 - 4);
      box(5, 3.5, 5, fabricLightMat, cx, 0, tabD / 2 + 4);
    });
    return;
  }

  // --- Kitchen ---
  if (r.c === 'kitchen') {
    box(rw - 6, 6.5, 8, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 }), 0, 0, -rz / 2 + 5);
    box(8, 6.5, rz - 12, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 }), -rw / 2 + 5, 0, 0);
    const islW = rw * 0.55, islD = rz * 0.35;
    box(islW, 7, islD, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 }), 4, 0, 4);
    box(10, 13, 9, metalMat, rw / 2 - 7, 0, -rz / 2 + 6);
    return;
  }

  // --- Bedrooms ---
  if (r.c === 'bed') {
    const bedW = Math.min(32, rw * 0.55), bedD = Math.min(38, rz * 0.65);
    box(bedW + 4, 9, 2.5, woodMat, 0, 0, -rz / 2 + 4);
    box(bedW, 4.5, bedD, new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 }), 0, 0, -rz / 2 + 4 + bedD / 2);
    box(bedW - 1, 1.5, bedD * 0.65, new THREE.MeshStandardMaterial({ color: 0x5b759e, roughness: 0.8 }), 0, 4.5, -rz / 2 + 4 + bedD * 0.65);
    [-bedW / 2 - 4, bedW / 2 + 4].forEach(nx => {
      box(6, 4, 6, woodMat, nx, 0, -rz / 2 + 6);
    });
    box(rw - 8, 12, 6, new THREE.MeshStandardMaterial({ color: 0xd5cebf }), 0, 0, rz / 2 - 5);
    return;
  }

  // --- Bathrooms ---
  if (r.c === 'bath') {
    const showerMat = new THREE.MeshPhysicalMaterial({ color: 0x90c2e7, transmission: 0.85, transparent: true, opacity: 0.6 });
    box(14, 12, 14, showerMat, -rw / 2 + 9, 0, -rz / 2 + 9);
    box(16, 5, 7, new THREE.MeshStandardMaterial({ color: 0xffffff }), rw / 2 - 10, 0, -rz / 2 + 5);
    box(6, 4.5, 9, new THREE.MeshStandardMaterial({ color: 0xffffff }), -rw / 2 + 6, 0, rz / 2 - 7);
    return;
  }

  // --- Pooja Room ---
  if (r.c === 'pooja') {
    box(rw * 0.6, 8, 8, new THREE.MeshStandardMaterial({ color: 0x854d0e }), 0, 0, -rz / 2 + 5);
    box(6, 4, 6, new THREE.MeshStandardMaterial({ color: 0xfde047 }), 0, 8, -rz / 2 + 5);
    return;
  }

  // --- Home Office ---
  if (r.c === 'office') {
    box(rw * 0.60, 5, 12, woodMat, 0, 0, -rz / 2 + 8);
    box(8, 0.8, 6, metalMat, 0, 5.2, -rz / 2 + 8);
    box(7, 6, 7, new THREE.MeshStandardMaterial({ color: 0x222a36 }), 0, 0, -rz / 2 + 18);
    box(8, 12, rz - 8, woodMat, rw / 2 - 5, 0, 0);
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
  const propType = state.propertyType || state.formPayload?.propertyType || 'Dream Home';
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
  const formData = new FormData(event.currentTarget);
  const values = Object.fromEntries(formData.entries());

  const payload = {
    ...values,
    propertyType: state.propertyType,
    bedrooms: Number(state.bed || 2),
    bathrooms: Number(state.bath || 2),
    kitchens: values.kitchens || '1 kitchen',
    parking: values.parking || '2 cars',
    hasLiving: !!event.currentTarget.querySelector('input[name="livingRoom"]')?.checked,
    hasDining: !!event.currentTarget.querySelector('input[name="dining"]')?.checked,
    hasPooja: !!event.currentTarget.querySelector('input[name="poojaRoom"]')?.checked,
    hasUtility: !!event.currentTarget.querySelector('input[name="utilityRoom"]')?.checked,
    hasOffice: !!event.currentTarget.querySelector('input[name="homeOffice"]')?.checked,
    hasPool: !!event.currentTarget.querySelector('input[name="swimmingPool"]')?.checked,
    hasSmartHome: !!event.currentTarget.querySelector('input[name="smartHome"]')?.checked,
    hasSolar: !!event.currentTarget.querySelector('input[name="solarPanels"]')?.checked,
    hasLift: !!event.currentTarget.querySelector('input[name="lift"]')?.checked,
    hasElderFriendly: !!event.currentTarget.querySelector('input[name="elderFriendly"]')?.checked,
    garden: values.garden || 'Small garden',
    terrace: values.terrace || 'Both balcony & terrace',
    floors: Math.max(1, Number(values.floors || 2)),
    landSize: Number(values.landSize || 2400),
    entrance: values.entrance || 'North-facing',
    style: values.style || 'Contemporary',
    layoutCycle: 0,
    features: [...event.currentTarget.querySelectorAll('input[type="checkbox"]:checked')].map(input => input.name),
    ideas: $('#designIdeas')?.value || ''
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
  if (!state.formPayload) state.formPayload = getFormData();
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
  const data = { ...state, title: $('#designTitle')?.textContent, ideas: $('#designIdeas')?.value };
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
