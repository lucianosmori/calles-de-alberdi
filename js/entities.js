// =============================================================================
// Calles de Alberdi — js/entities.js
//
// Factory functions and update helpers for every entity type.
// These functions are called from inside Kaplay scenes (game.js) and rely on
// Kaplay globals (add, rect, pos, color, z, lifespan, rand, choose, …).
//
// Design rule: entity helpers receive game-state side-effects via callbacks so
// this file stays decoupled from game.js's closure variables.
// =============================================================================


// =============================================================================
// BACKGROUND DRAWING
// =============================================================================

/**
 * Draw the full static background for a level using placeholder coloured rects.
 * TODO: Replace each block with a loadSprite/drawSprite parallax layer.
 * @param {object} lvl — level data object from LEVELS[]
 */
function drawLevelBackground(lvl) {
  const levelW = lvl.levelWidth || SCREEN_W;

  // -- Colour helpers --
  const dk = (c, a) => [Math.max(0,c[0]-a), Math.max(0,c[1]-a), Math.max(0,c[2]-a)];
  const lt = (c, a) => [Math.min(255,c[0]+a), Math.min(255,c[1]+a), Math.min(255,c[2]+a)];

  // ── Sky gradient (4 bands for depth) ──────────────────────────────────────
  const skyBands = 4;
  const bandH = Math.ceil(GROUND_TOP / skyBands);
  for (let i = 0; i < skyBands; i++) {
    const f = i / (skyBands - 1);
    add([rect(levelW + 200, bandH + 1), pos(-100, i * bandH),
         color(lvl.skyCol[0] + f * 12, lvl.skyCol[1] + f * 8, lvl.skyCol[2] + f * 15),
         z(-300)]);
  }

  // ── Distant skyline silhouettes (procedurally fill level width) ──────────
  {
    let sx = 25;
    while (sx < levelW) {
      const sw = 30 + Math.floor(Math.random() * 25);
      const sh = 35 + Math.floor(Math.random() * 40);
      add([rect(sw, sh), pos(sx, GROUND_TOP - sh - 145),
           color(...dk(lvl.skyCol, 6)), z(-299)]);
      add([rect(3, 3), pos(sx + sw / 2, GROUND_TOP - sh - 140),
           color(180, 170, 100), opacity(0.4), z(-298)]);
      sx += 80 + Math.floor(Math.random() * 60);
    }
  }

  // ── Block renderer dispatch ─────────────────────────────────────────────
  const blocks = lvl.blocks || lvl.stores || [];
  for (const b of blocks) {
    const btype = b.type || "store";
    if      (btype === "store")     _drawStore(b, dk, lt);
    else if (btype === "crosswalk") _drawCrosswalk(b, dk, lt, lvl);
    else if (btype === "lot")       _drawEmptyLot(b, dk, lt, lvl);
    else if (btype === "alley")     _drawAlley(b, dk, lt, lvl);
    else if (btype === "wall")      _drawWall(b, dk, lt, lvl);
    else if (btype === "park")      _drawPark(b, dk, lt, lvl);
    else if (btype === "special")   _drawSpecial(b, dk, lt, lvl);
  }

  // ── Sidewalk ──────────────────────────────────────────────────────────────
  add([rect(levelW, GROUND_BOTTOM - GROUND_TOP), pos(0, GROUND_TOP),
       color(...lvl.groundCol), z(-250)]);

  // Slab pattern (alternating shades)
  for (let sx = 0; sx < levelW; sx += 65) {
    const shade = (Math.floor(sx / 65) % 2 === 0) ? 4 : -3;
    const sc = shade > 0 ? lt(lvl.groundCol, shade) : dk(lvl.groundCol, -shade);
    add([rect(63, GROUND_BOTTOM - GROUND_TOP - 8), pos(sx + 1, GROUND_TOP + 4),
         color(...sc), z(-249)]);
  }

  // Slab seam lines (vertical)
  for (let cx = 65; cx < levelW; cx += 65) {
    add([rect(1, GROUND_BOTTOM - GROUND_TOP - 4), pos(cx, GROUND_TOP + 2),
         color(...dk(lvl.groundCol, 28)), z(-248)]);
  }

  // Horizontal seam
  add([rect(levelW, 1),
       pos(0, GROUND_TOP + Math.floor((GROUND_BOTTOM - GROUND_TOP) / 2)),
       color(...dk(lvl.groundCol, 18)), z(-248)]);

  // Rain puddles on sidewalk (replaces snow patches)
  const weather = lvl.weather || "rain";
  if (weather === "rain" || weather === "overcast") {
    const puddleCount = Math.ceil(PUDDLE_COUNT_PER_800 * levelW / 800);
    for (let i = 0; i < puddleCount; i++) {
      const pw = 18 + Math.random() * 30;
      const ph = 2 + Math.random() * 3;
      const px = Math.random() * (levelW - 50) + 5;
      const py = GROUND_TOP + 8 + Math.random() * (GROUND_BOTTOM - GROUND_TOP - 20);
      // Dark puddle
      add([rect(pw, ph), pos(px, py),
           color(80, 90, 110), opacity(0.18), z(-247)]);
      // Highlight on puddle
      add([rect(pw * 0.4, 1), pos(px + pw * 0.2, py),
           color(160, 180, 210), opacity(0.12), z(-246.5)]);
    }
  }

  // Curb
  add([rect(levelW, 5), pos(0, GROUND_BOTTOM - 5),
       color(...dk(lvl.groundCol, 35)), z(-246)]);
  add([rect(levelW, 2), pos(0, GROUND_BOTTOM - 1),
       color(25, 20, 15), z(-245)]);

  // ── Road ──────────────────────────────────────────────────────────────────
  add([rect(levelW, SCREEN_H - GROUND_BOTTOM), pos(0, GROUND_BOTTOM),
       color(42, 38, 32), z(-250)]);

  // Dashed centre line
  const roadMidY = GROUND_BOTTOM + Math.floor((SCREEN_H - GROUND_BOTTOM) / 2);
  for (let lx = 12; lx < levelW; lx += 44) {
    add([rect(22, 2), pos(lx, roadMidY),
         color(190, 170, 45), z(-248)]);
  }

  // ── Level name plate (with drop shadow) ───────────────────────────────────
  const vw = typeof VIEW_W !== "undefined" ? VIEW_W : SCREEN_W;
  const lvlText = `LVL ${lvl.id}  ${lvl.name.toUpperCase()}`;
  add([text(lvlText, { size: 10 }),
       pos(vw / 2 + 1, 8), anchor("top"), color(0, 0, 0), fixed(), z(599)]);
  add([text(lvlText, { size: 10 }),
       pos(vw / 2, 7), anchor("top"), color(210, 210, 220), fixed(), z(600)]);
}


// ── Block type renderers ──────────────────────────────────────────────────

function _drawStore(s, dk, lt) {
  const wt = GROUND_TOP - (s.h || 170);
  const sc  = s.signCol     || [200, 40, 40];
  const stc = s.signTextCol || [255, 255, 255];
  const ac  = s.awningCol   || dk(s.col, 10);

  // Wall
  add([rect(s.w - 2, s.h), pos(s.x + 1, wt), color(...s.col), z(-290)]);
  // Roof ledge
  add([rect(s.w + 2, 5), pos(s.x - 1, wt - 3), color(...dk(s.col, 35)), z(-289)]);
  // Wet roof edge (rain streak)
  add([rect(s.w - 4, 3), pos(s.x + 2, wt - 2), color(...dk(s.col, 18)), opacity(0.3), z(-288)]);
  // Rain drip streaks from roof
  let ic = s.x + 14;
  while (ic < s.x + s.w - 10) {
    const dripH = 2 + Math.floor(Math.random() * 4);
    add([rect(1, dripH), pos(ic, wt), color(120, 140, 170), opacity(0.25), z(-287)]);
    ic += 16 + Math.floor(Math.random() * 20);
  }

  // Layout
  const gfFrac = 0.35;
  const signH = 26;
  const awnH = 9;
  const signY = wt + Math.floor(s.h * (1 - gfFrac)) - signH;

  // Wall panel lines
  for (let ly = wt + 18; ly < signY - 4; ly += 20) {
    add([rect(s.w - 6, 1), pos(s.x + 3, ly), color(...dk(s.col, 16)), z(-285)]);
  }

  // Windows
  const winStyle = s.windowStyle || "random";
  const winW = 16, winH = 18, winGapX = 8, winGapY = 8;
  const winAreaTop = wt + 10;
  const winAreaBot = signY - 6;
  const numCols = Math.max(1, Math.floor((s.w - 22 + winGapX) / (winW + winGapX)));
  const totalWinW = numCols * winW + (numCols - 1) * winGapX;
  const winOffX = s.x + Math.floor((s.w - totalWinW) / 2);

  for (let wy = winAreaTop; wy + winH <= winAreaBot; wy += winH + winGapY) {
    for (let c = 0; c < numCols; c++) {
      const wx = winOffX + c * (winW + winGapX);
      // Frame
      add([rect(winW + 4, winH + 4), pos(wx - 2, wy - 2), color(...dk(s.col, 28)), z(-280)]);
      if (winStyle === "none") continue;
      if (winStyle === "shuttered") {
        // Closed shutters
        add([rect(winW, winH), pos(wx, wy), color(...dk(s.col, 8)), z(-278)]);
        add([rect(1, winH), pos(wx + winW / 2, wy), color(...dk(s.col, 22)), z(-276)]);
      } else if (winStyle === "broken" && Math.random() < 0.3) {
        // Broken window — dark
        add([rect(winW, winH), pos(wx, wy), color(40, 40, 50), z(-278)]);
      } else {
        // Glass pane
        add([rect(winW, winH), pos(wx, wy), color(120, 155, 195), z(-278)]);
        // Reflection highlight
        add([rect(3, winH - 4), pos(wx + 2, wy + 2), color(165, 200, 232), z(-276)]);
        // Warm interior glow
        add([rect(winW - 4, 6), pos(wx + 2, wy + winH - 8),
             color(200, 180, 120), opacity(0.35), z(-275)]);
      }
    }
  }

  // Sign band
  add([rect(s.w - 4, signH), pos(s.x + 2, signY), color(...sc), z(-270)]);
  add([rect(s.w - 4, 2), pos(s.x + 2, signY - 2), color(...lt(sc, 65)), z(-269)]);
  add([rect(s.w - 4, 2), pos(s.x + 2, signY + signH), color(...lt(sc, 45)), z(-269)]);
  add([rect(2, signH + 4), pos(s.x, signY - 2), color(...lt(sc, 50)), z(-269)]);
  add([rect(2, signH + 4), pos(s.x + s.w - 2, signY - 2), color(...lt(sc, 50)), z(-269)]);
  const fontSize = Math.min(14, Math.floor((s.w - 16) / (s.label || "").length * 1.6));
  const textX = s.x + 8;
  const textY = signY + Math.floor((signH - fontSize) / 2);
  add([text(s.label || "", { size: fontSize }), pos(textX + 1, textY + 1), color(0, 0, 0), z(-266)]);
  add([text(s.label || "", { size: fontSize }), pos(textX, textY), color(...stc), z(-265)]);

  // Awning
  const awnY = signY + signH + 3;
  add([rect(s.w - 6, awnH), pos(s.x + 3, awnY), color(...ac), z(-260)]);
  for (let sx = s.x + 3; sx < s.x + s.w - 6; sx += 12) {
    add([rect(6, awnH), pos(sx, awnY), color(...lt(ac, 28)), z(-259)]);
  }
  add([rect(s.w - 6, 3), pos(s.x + 3, awnY + awnH), color(0, 0, 0), opacity(0.12), z(-258)]);

  // Ground floor
  const gfTop = awnY + awnH + 3;
  const gfH = GROUND_TOP - gfTop;
  if (gfH > 6) {
    add([rect(s.w - 4, gfH), pos(s.x + 2, gfTop), color(...lt(s.col, 15)), z(-255)]);
    const doorW = 14;
    const doorX = s.x + Math.floor(s.w / 2) - doorW / 2;
    const sfWinW = Math.min(30, Math.floor((s.w - doorW - 28) / 2));
    if (sfWinW > 8) {
      add([rect(sfWinW + 2, gfH - 2), pos(s.x + 7, gfTop + 1), color(...dk(s.col, 20)), z(-254)]);
      add([rect(sfWinW, gfH - 4), pos(s.x + 8, gfTop + 2), color(155, 185, 145), z(-253)]);
      add([rect(sfWinW - 4, gfH - 8), pos(s.x + 10, gfTop + 4), color(215, 205, 165), z(-252)]);
    }
    add([rect(doorW + 2, gfH - 2), pos(doorX - 1, gfTop + 1), color(...dk(s.col, 30)), z(-254)]);
    add([rect(doorW, gfH - 4), pos(doorX, gfTop + 2), color(...dk(s.col, 18)), z(-253)]);
    add([rect(2, 3), pos(doorX + doorW - 4, gfTop + Math.floor(gfH / 2)), color(210, 190, 110), z(-252)]);
    if (sfWinW > 8) {
      const rwx = s.x + s.w - sfWinW - 9;
      add([rect(sfWinW + 2, gfH - 2), pos(rwx, gfTop + 1), color(...dk(s.col, 20)), z(-254)]);
      add([rect(sfWinW, gfH - 4), pos(rwx + 1, gfTop + 2), color(155, 185, 145), z(-253)]);
      add([rect(sfWinW - 4, gfH - 8), pos(rwx + 3, gfTop + 4), color(215, 205, 165), z(-252)]);
    }
  }
}

function _drawCrosswalk(b, dk, lt, lvl) {
  // White zebra stripes on the sidewalk — no building above
  const stripeW = 8;
  const gap = 6;
  const bandH = GROUND_BOTTOM - GROUND_TOP;
  for (let sx = b.x + 4; sx < b.x + b.w - stripeW; sx += stripeW + gap) {
    add([rect(stripeW, bandH - 8), pos(sx, GROUND_TOP + 4),
         color(235, 235, 230), opacity(0.55), z(-247)]);
  }
}

function _drawEmptyLot(b, dk, lt, lvl) {
  const h = b.h || 150;
  const wt = GROUND_TOP - h;
  // Background (dirt/rubble)
  add([rect(b.w, h), pos(b.x, wt), color(110, 100, 85), z(-290)]);
  // Chain-link fence top rail
  add([rect(b.w, 3), pos(b.x, wt), color(140, 140, 140), z(-286)]);
  // Fence posts
  for (let fx = b.x + 10; fx < b.x + b.w; fx += 25) {
    add([rect(2, h), pos(fx, wt), color(130, 130, 130), z(-287)]);
  }
  // Diamond pattern (simplified as X lines)
  for (let fy = wt + 12; fy < GROUND_TOP - 10; fy += 14) {
    add([rect(b.w - 4, 1), pos(b.x + 2, fy), color(145, 145, 145), opacity(0.3), z(-285)]);
  }
  // Weed tufts at base
  for (let wx = b.x + 8; wx < b.x + b.w - 8; wx += 15 + Math.floor(Math.random() * 10)) {
    const wh = 4 + Math.floor(Math.random() * 6);
    add([rect(3, wh), pos(wx, GROUND_TOP - wh), color(60, 100, 40), z(-284)]);
  }
}

function _drawAlley(b, dk, lt, lvl) {
  const h = 180;
  const wt = GROUND_TOP - h;
  // Dark gap
  add([rect(b.w, h), pos(b.x, wt), color(20, 18, 15), z(-292)]);
  // Dumpster
  const dw = Math.min(b.w - 4, 18);
  add([rect(dw, 14), pos(b.x + (b.w - dw) / 2, GROUND_TOP - 14),
       color(50, 70, 50), z(-283)]);
}

function _drawWall(b, dk, lt, lvl) {
  const h = b.h || 180;
  const wt = GROUND_TOP - h;
  const wc = b.col || [140, 130, 120];
  add([rect(b.w, h), pos(b.x, wt), color(...wc), z(-290)]);
  // Roof ledge
  add([rect(b.w + 2, 4), pos(b.x - 1, wt - 2), color(...dk(wc, 30)), z(-289)]);
  if (b.mural) {
    // Graffiti patches — random coloured rects
    for (let i = 0; i < 3; i++) {
      const gx = b.x + 5 + Math.random() * (b.w - 30);
      const gy = wt + 20 + Math.random() * (h - 60);
      const gw = 15 + Math.random() * 20;
      const gh = 10 + Math.random() * 15;
      const gc = [
        80 + Math.floor(Math.random() * 175),
        50 + Math.floor(Math.random() * 175),
        80 + Math.floor(Math.random() * 175),
      ];
      add([rect(gw, gh), pos(gx, gy), color(...gc), opacity(0.6), z(-288)]);
    }
  }
}

function _drawPark(b, dk, lt, lvl) {
  const h = 100;
  const wt = GROUND_TOP - h;
  // Grass area
  add([rect(b.w, h), pos(b.x, wt), color(55, 110, 50), z(-291)]);
  // Tree trunk
  const treeX = b.x + b.w / 2;
  add([rect(6, 35), pos(treeX - 3, wt + 15), color(90, 60, 30), z(-288)]);
  // Tree canopy
  add([rect(30, 22), pos(treeX - 15, wt + 2), color(40, 95, 35), z(-287)]);
  add([rect(22, 16), pos(treeX - 11, wt - 6), color(50, 105, 40), z(-286)]);
  // Bench
  if (b.w > 50) {
    const benchX = b.x + b.w * 0.7;
    add([rect(20, 3), pos(benchX, GROUND_TOP - 18), color(100, 70, 40), z(-284)]);
    add([rect(2, 12), pos(benchX, GROUND_TOP - 16), color(80, 55, 30), z(-285)]);
    add([rect(2, 12), pos(benchX + 18, GROUND_TOP - 16), color(80, 55, 30), z(-285)]);
  }
}

function _drawSpecial(b, dk, lt, lvl) {
  const st = b.specialType || "bus_stop";
  const h = b.h || 120;
  const wt = GROUND_TOP - h;

  if (st === "bus_stop") {
    // Shelter roof
    add([rect(b.w - 4, 4), pos(b.x + 2, wt + 10), color(80, 85, 95), z(-288)]);
    // Pole
    add([rect(3, h - 12), pos(b.x + 6, wt + 14), color(100, 100, 100), z(-289)]);
    add([rect(3, h - 12), pos(b.x + b.w - 9, wt + 14), color(100, 100, 100), z(-289)]);
    // Sign
    add([rect(14, 18), pos(b.x + b.w / 2 - 7, wt + 18), color(40, 80, 160), z(-287)]);
    add([text("BUS", { size: 6 }), pos(b.x + b.w / 2 - 5, wt + 22), color(255, 255, 255), z(-286)]);
    // Glass panel (back wall)
    add([rect(b.w - 14, h - 20), pos(b.x + 7, wt + 14), color(140, 170, 200), opacity(0.2), z(-290)]);
  } else if (st === "monument") {
    // Stone plinth + obelisk
    add([rect(b.w * 0.6, 20), pos(b.x + b.w * 0.2, GROUND_TOP - 20), color(160, 155, 145), z(-288)]);
    add([rect(b.w * 0.3, h - 20), pos(b.x + b.w * 0.35, wt), color(150, 145, 135), z(-287)]);
  } else if (st === "fountain") {
    // Basin
    add([rect(b.w - 10, 16), pos(b.x + 5, GROUND_TOP - 16), color(130, 140, 150), z(-288)]);
    // Centre column
    add([rect(6, h * 0.5), pos(b.x + b.w / 2 - 3, wt + h * 0.3), color(140, 140, 140), z(-287)]);
    // Water
    add([rect(b.w - 16, 10), pos(b.x + 8, GROUND_TOP - 14), color(100, 140, 180), opacity(0.35), z(-286)]);
  }
}


// =============================================================================
// WEATHER PARTICLE SYSTEM
// =============================================================================

let _weatherParticles = [];
let _weatherType = "rain";  // "rain", "clear", "overcast", "sunset", "night"

/**
 * Initialise the weather particle pool.  Call once at scene start.
 * @param {string} type  — "rain", "clear", or "overcast"
 * @param {number} count — number of particles (default uses RAIN_DENSITY)
 */
function initWeather(type = "rain", count) {
  _weatherType = type;
  _weatherParticles = [];
  if (type === "clear") return;  // no particles for clear weather

  const sw = typeof VIEW_W !== "undefined" ? VIEW_W : SCREEN_W;
  const sh = typeof VIEW_H !== "undefined" ? VIEW_H : SCREEN_H;

  if (type === "night") {
    // Twinkling stars — static positions
    const starCount = count || 40;
    for (let i = 0; i < starCount; i++) {
      _weatherParticles.push({
        x:     rand(0, sw),
        y:     rand(0, sh * 0.55),  // stars only in upper sky
        speed: 0,
        len:   rand(1, 2),
        alpha: rand(0.3, 0.8),
        phase: rand(0, Math.PI * 2),  // desync twinkle
      });
    }
    return;
  }

  if (type === "sunset") {
    // Floating dust/leaf motes
    const moteCount = count || 30;
    for (let i = 0; i < moteCount; i++) {
      _weatherParticles.push({
        x:     rand(0, sw),
        y:     rand(0, sh),
        speed: rand(40, 80),
        len:   rand(2, 4),    // mote size
        alpha: rand(0.15, 0.3),
        drift: rand(-20, 20), // horizontal drift speed
      });
    }
    return;
  }

  // Rain / overcast — default
  const density = count || RAIN_DENSITY;
  for (let i = 0; i < density; i++) {
    _weatherParticles.push({
      x:     rand(0, sw),
      y:     rand(0, sh),
      speed: rand(RAIN_SPEED * 0.7, RAIN_SPEED * 1.2),
      len:   rand(4, 10),       // raindrop streak length
      alpha: rand(0.12, 0.35),
    });
  }
}

/** Advance weather physics.  Call in onUpdate(). */
function updateWeather() {
  if (_weatherType === "clear" || _weatherType === "night" || _weatherParticles.length === 0) return;
  const sw = typeof VIEW_W !== "undefined" ? VIEW_W : SCREEN_W;
  const sh = typeof VIEW_H !== "undefined" ? VIEW_H : SCREEN_H;

  if (_weatherType === "sunset") {
    for (const p of _weatherParticles) {
      p.y += p.speed * dt();
      p.x += (p.drift || 0) * dt();
      if (p.y > sh + 4) { p.y = -p.len; p.x = rand(0, sw); }
      if (p.x > sw + 4) { p.x = -4; }
      if (p.x < -4)     { p.x = sw + 2; }
    }
    return;
  }

  // Rain / overcast
  for (const p of _weatherParticles) {
    p.y += p.speed * dt();
    p.x += Math.tan(RAIN_ANGLE) * p.speed * dt();  // diagonal slant
    if (p.y > sh + 4) { p.y = -p.len; p.x = rand(0, sw); }
    if (p.x > sw + 4) { p.x = -4; }
  }
}

/** Render weather particles.  Call in onDraw(). */
function drawWeather() {
  if (_weatherType === "clear" || _weatherParticles.length === 0) return;

  if (_weatherType === "night") {
    for (const p of _weatherParticles) {
      const twinkle = 0.4 + 0.6 * Math.sin(time() * 2 + p.phase);
      drawRect({
        pos:     vec2(p.x, p.y),
        width:   p.len,
        height:  p.len,
        color:   rgb(200, 210, 255),
        opacity: p.alpha * twinkle,
      });
    }
    return;
  }

  if (_weatherType === "sunset") {
    for (const p of _weatherParticles) {
      drawRect({
        pos:     vec2(p.x, p.y),
        width:   p.len + 1,
        height:  p.len,
        color:   rgb(220, 170, 80),
        opacity: p.alpha,
      });
    }
    return;
  }

  // Rain / overcast
  for (const p of _weatherParticles) {
    drawRect({
      pos:     vec2(p.x, p.y),
      width:   1,
      height:  p.len,
      color:   rgb(160, 180, 210),
      opacity: p.alpha,
    });
  }
}


// =============================================================================
// SPEECH BUBBLE
// =============================================================================

/**
 * Spawn a temporary speech bubble above a character.
 * @param {string} msg       — text to display
 * @param {number} srcX/srcY — world position of the speaker's feet
 * @param {number} duration  — seconds before it fades (default 2.2)
 */
// Track active bubbles so new ones can avoid overlapping them
const _activeBubbles = [];
// Player refs for bubble proximity fade (populated by spawnPlayer)
const _playerRefs = [];

function showSpeechBubble(msg, entityOrX, yOrDuration, maybeDuration) {
  const W  = Math.min(msg.length * 6 + 16, 140);
  const BUBBLE_H = 26; // background 19 + nub 7

  // Detect: entity-tracking mode vs static (x, y) mode
  const entity = (typeof entityOrX === "object" && entityOrX !== null) ? entityOrX : null;
  let lastX = entity ? entity.pos.x : entityOrX;
  let lastY = entity ? entity.pos.y : yOrDuration;
  const duration = entity
    ? (typeof yOrDuration === "number" ? yOrDuration : 2.2)
    : (typeof maybeDuration === "number" ? maybeDuration : 2.2);

  // Is this a player's own bubble? (player bubbles never fade from proximity)
  const isPlayerBubble = entity && entity.pidx !== undefined;

  // Register this bubble for overlap tracking
  const bubble = { x: lastX, y: lastY - 72, w: W, h: BUBBLE_H, offset: 0 };
  _activeBubbles.push(bubble);
  setTimeout(() => {
    const idx = _activeBubbles.indexOf(bubble);
    if (idx >= 0) _activeBubbles.splice(idx, 1);
  }, duration * 1000);

  function getBubblePos() {
    if (entity && entity.exists()) {
      lastX = entity.pos.x;
      lastY = entity.pos.y;
    }
    const lvlW = window._currentLevelWidth || SCREEN_W;
    const bx = clamp(lastX - W / 2, 4, lvlW - W - 4);
    let by = lastY - 72;

    // Push bubble up if it overlaps any other active bubble
    let nudged = true;
    let attempts = 0;
    while (nudged && attempts < 4) {
      nudged = false;
      for (const other of _activeBubbles) {
        if (other === bubble) continue;
        const obx = clamp(other.x - other.w / 2, 4, SCREEN_W - other.w - 4);
        const oby = other.y + other.offset;
        // Check horizontal overlap
        if (bx < obx + other.w && bx + W > obx) {
          // Check vertical overlap
          if (by < oby + BUBBLE_H && by + BUBBLE_H > oby) {
            by = oby - BUBBLE_H - 2; // stack above
            nudged = true;
          }
        }
      }
      attempts++;
    }
    by = Math.max(2, by); // don't go off screen top
    bubble.x = lastX;
    bubble.y = lastY - 72;
    bubble.offset = by - (lastY - 72);

    return { bx, by, nubX: clamp(lastX - 3, bx + 4, bx + W - 10) };
  }

  const bp = getBubblePos();

  // Proximity fade: non-player bubbles fade when a player walks near
  function proximityOpacity() {
    if (isPlayerBubble) return 1;
    let minDist = 999;
    for (const pl of _playerRefs) {
      if (!pl.exists || !pl.exists() || pl.hp <= 0) continue;
      const dx = Math.abs(lastX - pl.pos.x);
      const dy = Math.abs(lastY - pl.pos.y);
      minDist = Math.min(minDist, dx + dy);
    }
    // Fade from 1.0 at 80px to 0.15 at 30px
    if (minDist > 80) return 1;
    if (minDist < 30) return 0.15;
    return 0.15 + (minDist - 30) / 50 * 0.85;
  }

  // Bubble background
  add([rect(W, 19), pos(bp.bx, bp.by),
       color(250, 248, 230), opacity(1), z(800), lifespan(duration, { fade: 0.45 }),
       { update() { const q = getBubblePos(); this.pos.x = q.bx; this.pos.y = q.by;
                     this.opacity = Math.min(this.opacity, proximityOpacity()); } }]);

  // Bubble text
  add([text(msg, { size: 8 }), pos(bp.bx + 4, bp.by + 4),
       color(30, 30, 30), opacity(1), z(801), lifespan(duration, { fade: 0.45 }),
       { update() { const q = getBubblePos(); this.pos.x = q.bx + 4; this.pos.y = q.by + 4;
                     this.opacity = Math.min(this.opacity, proximityOpacity()); } }]);

  // Pointer nub below the bubble
  add([rect(7, 7), pos(bp.nubX, bp.by + 17),
       color(250, 248, 230), opacity(1), z(800), lifespan(duration, { fade: 0.45 }),
       { update() { const q = getBubblePos(); this.pos.x = q.nubX; this.pos.y = q.by + 17;
                     this.opacity = Math.min(this.opacity, proximityOpacity()); } }]);
}

/** Spawn a floating damage / score number that rises and fades. */
function spawnFloatText(msg, x, y, col) {
  add([text(msg, { size: 11 }),
       pos(x + rand(-10, 10), y),
       color(...col),
       opacity(1),
       z(820),
       lifespan(0.75, { fade: 0.3 }),
       // Drift upward each frame via a tiny onUpdate scoped to this object
       {
         update() { this.pos.y -= 40 * dt(); },
       }]);
}


// =============================================================================
// PLAYER FACTORY
// =============================================================================

/**
 * Spawn a player character.
 * @param {number} idx — 0 = P1 (Gaucho), 1 = P2 (Cordobesa)
 * @returns {KAPLAYObj} player game object
 */
function spawnPlayer(idx) {
  const cfg = PLAYER_CONFIGS[idx];
  const startY = lerp(GROUND_TOP + 24, GROUND_BOTTOM, 0.5 + idx * 0.12);

  const useSprite = !!cfg.sprite;
  const p = add([
    useSprite ? sprite(cfg.sprite) : rect(28, 48),
    useSprite ? scale(48 / 126) : scale(1),
    pos(cfg.startX, startY),
    anchor("bot"),           // pos = feet centre; correct for depth sorting
    useSprite ? color(255, 255, 255) : color(...cfg.col),
    z(300),
    {
      cfg,
      pidx:           idx,
      hp:             PLAYER_MAX_HP,
      maxHp:          PLAYER_MAX_HP,
      state:          "idle",   // idle | walk | punch | kick | special | hurt
      _lastState:     null,     // used to detect state changes for play()
      attackTimer:    0,        // > 0 while in attack state
      hurtTimer:      0,        // > 0 during invincibility frames
      specialCooldown:0,
      facing:         1,        // 1 = right, −1 = left
      heldWeapon:     null,     // { type, uses, damage } or null
      lives:          0,        // set by game scene (MP_LIVES in multiplayer, 0 in single)
      respawnTimer:   0,        // countdown until respawn (0 = not respawning)
    },
  ]);
  if (useSprite) p.play("idle");
  _playerRefs.push(p);
  return p;
}

/**
 * Update player movement each frame.  Attack & hurt-lock respected.
 * Call from onUpdate() in game scene.
 */
function updatePlayerMovement(p, bounds) {
  const cfg = p.cfg;

  p.attackTimer     = Math.max(0, p.attackTimer     - dt());
  p.hurtTimer       = Math.max(0, p.hurtTimer       - dt());
  p.specialCooldown = Math.max(0, p.specialCooldown - dt());

  // Colour tint: hurt = red flash, weapon held = weapon colour, normal = neutral/white
  if (p.hurtTimer > 0) {
    p.color = rgb(...cfg.hurtCol);
  } else if (p.heldWeapon) {
    const d = PICKUP_DEFS[p.heldWeapon.type];
    p.color = rgb(...d.col);   // TODO: show held item as a separate sprite layer
  } else {
    p.color = cfg.sprite ? rgb(255, 255, 255) : rgb(...cfg.col);
  }

  // Flip sprite to face movement direction
  if (cfg.sprite) p.flipX = (p.facing < 0);

  // Trigger animation on state change — must run before locked-return so that
  // states set externally (punch/kick/special/hurt) play immediately.
  if (cfg.sprite && p.state !== p._lastState) {
    p.play(p.state);
    p._lastState = p.state;
  }

  const locked = p.attackTimer > 0 || p.hurtTimer > 0;
  if (locked) { p.z = p.pos.y; return; }

  let dx = 0, dy = 0;
  if (isKeyDown(cfg.keys.left))  { dx--; p.facing = -1; }
  if (isKeyDown(cfg.keys.right)) { dx++; p.facing =  1; }
  if (isKeyDown(cfg.keys.up))    { dy--; }
  if (isKeyDown(cfg.keys.down))  { dy++; }

  if (dx !== 0 || dy !== 0) {
    const len = Math.sqrt(dx * dx + dy * dy);
    p.pos.x += (dx / len) * PLAYER_SPEED * dt();
    p.pos.y += (dy / len) * PLAYER_SPEED * dt();
    p.state = "walk";
  } else {
    p.state = "idle";
  }

  // Hard clamp to playfield (bounds from section state machine)
  const bLeft  = bounds ? bounds.left  : 20;
  const bRight = bounds ? bounds.right : SCREEN_W - 20;
  p.pos.x = clamp(p.pos.x, bLeft, bRight);
  const yBottom = (typeof isDialogueActive === "function" && isDialogueActive())
    ? GROUND_BOTTOM - 60 : GROUND_BOTTOM;
  p.pos.y = clamp(p.pos.y, GROUND_TOP + 24, yBottom);

  // Depth sort — z = feet y so characters lower on screen draw in front
  p.z = p.pos.y;
}


// =============================================================================
// REMOTE PLAYER (ONLINE 2P — HOST READS GUEST INPUT)
// =============================================================================

/**
 * Update P2 movement using network input from MP.guestInput (host side only).
 * Mirrors updatePlayerMovement() but reads from MP.guestInput instead of isKeyDown().
 */
function updateRemotePlayer(p, bounds) {
  const cfg = p.cfg;

  p.attackTimer     = Math.max(0, p.attackTimer     - dt());
  p.hurtTimer       = Math.max(0, p.hurtTimer       - dt());
  p.specialCooldown = Math.max(0, p.specialCooldown - dt());

  // Color tint
  if (p.hurtTimer > 0) {
    p.color = rgb(...cfg.hurtCol);
  } else {
    p.color = cfg.sprite ? rgb(255, 255, 255) : rgb(...cfg.col);
  }
  if (cfg.sprite) p.flipX = (p.facing < 0);
  if (cfg.sprite && p.state !== p._lastState) {
    p.play(p.state);
    p._lastState = p.state;
  }

  const locked = p.attackTimer > 0 || p.hurtTimer > 0;
  if (locked) { p.z = p.pos.y; return; }

  const inp = MP.guestInput;
  let dx = 0, dy = 0;
  if (inp.left)  { dx--; p.facing = -1; }
  if (inp.right) { dx++; p.facing =  1; }
  if (inp.up)    dy--;
  if (inp.down)  dy++;

  if (dx !== 0 || dy !== 0) {
    const len = Math.sqrt(dx * dx + dy * dy);
    p.pos.x += (dx / len) * PLAYER_SPEED * dt();
    p.pos.y += (dy / len) * PLAYER_SPEED * dt();
    p.state = "walk";
  } else {
    p.state = "idle";
  }

  const bLeft  = bounds ? bounds.left  : 20;
  const bRight = bounds ? bounds.right : SCREEN_W - 20;
  p.pos.x = clamp(p.pos.x, bLeft, bRight);
  p.pos.y = clamp(p.pos.y, GROUND_TOP + 24, GROUND_BOTTOM);
  p.z = p.pos.y;
}


// =============================================================================
// BOT COMPANION AI
// =============================================================================

/**
 * AI brain for the bot companion (Player 2 controlled by computer).
 * Call each frame from onUpdate. The bot uses the same player object as a
 * human P2 — it just sets position and triggers attacks directly.
 *
 * @param {KAPLAYObj} bot — player game object with isBot=true
 * @param {Array} enemies — live enemy array from game scene
 * @param {Array} players — all players (bot finds P1 as players[0])
 * @param {object} bounds — { left, right } from getSectionBounds()
 * @param {Function} doAttack — attack function from game.js closure
 */
function updateBotPlayer(bot, enemies, players, bounds, doAttack) {
  if (!bot || !bot.exists() || bot.hp <= 0) return;

  // Tick timers (movement is handled here, not by keyboard input)
  bot.attackTimer     = Math.max(0, bot.attackTimer     - dt());
  bot.hurtTimer       = Math.max(0, bot.hurtTimer       - dt());
  bot.specialCooldown = Math.max(0, bot.specialCooldown - dt());
  if (bot.botAttackCD > 0) bot.botAttackCD -= dt();

  // Color tint (same as updatePlayerMovement)
  if (bot.hurtTimer > 0) {
    bot.color = rgb(...bot.cfg.hurtCol);
  } else {
    bot.color = bot.cfg.sprite ? rgb(255, 255, 255) : rgb(...bot.cfg.col);
  }
  if (bot.cfg.sprite) bot.flipX = (bot.facing < 0);
  if (bot.cfg.sprite && bot.state !== bot._lastState) {
    bot.play(bot.state);
    bot._lastState = bot.state;
  }

  // Locked during attack or hurt
  if (bot.attackTimer > 0 || bot.hurtTimer > 0) { bot.z = bot.pos.y; return; }

  // Find nearest living enemy
  const livingEnemies = enemies.filter(e => e.hp > 0 && e.state !== "dead");
  let target = null, bestDist = Infinity;

  for (const e of livingEnemies) {
    const d = bot.pos.dist(e.pos);
    if (d < bestDist) { bestDist = d; target = e; }
  }

  let dx = 0, dy = 0;

  if (target && bestDist <= 300) {
    // Chase enemy
    dx = target.pos.x - bot.pos.x;
    dy = target.pos.y - bot.pos.y;

    if (bestDist > BOT_ATTACK_RANGE) {
      // Move toward enemy
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      bot.pos.x += (dx / len) * BOT_MOVE_SPEED * dt();
      bot.pos.y += (dy / len) * BOT_MOVE_SPEED * 0.5 * dt();
      bot.state = "walk";
    } else {
      bot.state = "idle";
    }

    // Face enemy
    if (dx !== 0) bot.facing = dx > 0 ? 1 : -1;

    // Attack when in range
    if (bestDist <= BOT_ATTACK_RANGE && bot.botAttackCD <= 0 && bot.attackTimer <= 0) {
      const type = Math.random() < 0.6 ? "punch" : "kick";
      doAttack(bot, type);
      bot.botAttackCD = BOT_ATTACK_COOLDOWN + Math.random() * 0.3;
    }
  } else {
    // No nearby enemies — follow P1
    const p1 = players[0];
    if (p1 && p1.exists() && p1.hp > 0) {
      dx = p1.pos.x - bot.pos.x;
      dy = p1.pos.y - bot.pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > BOT_FOLLOW_DIST) {
        const len = dist || 1;
        bot.pos.x += (dx / len) * BOT_MOVE_SPEED * dt();
        bot.pos.y += (dy / len) * BOT_MOVE_SPEED * 0.5 * dt();
        bot.state = "walk";
      } else {
        bot.state = "idle";
      }
      if (dx !== 0) bot.facing = dx > 0 ? 1 : -1;
    } else {
      bot.state = "idle";
    }
  }

  // Hard clamp to playfield
  const bLeft  = bounds ? bounds.left  : 20;
  const bRight = bounds ? bounds.right : SCREEN_W - 20;
  bot.pos.x = clamp(bot.pos.x, bLeft, bRight);
  bot.pos.y = clamp(bot.pos.y, GROUND_TOP + 24, GROUND_BOTTOM);
  bot.z = bot.pos.y;
}


// =============================================================================
// ENEMY FACTORY & AI
// =============================================================================

/**
 * Spawn an enemy.
 * @param {string} type — key into ENEMY_DEFS
 * @param {number} x, y — spawn position (feet)
 * @returns {KAPLAYObj} enemy game object
 */
function spawnEnemy(type, x, y) {
  const def = ENEMY_DEFS[type];

  const useSprite = !!def.sprite;
  const e = add([
    useSprite ? sprite(def.sprite) : rect(def.w, def.h),
    useSprite ? scale(def.h / (def.spriteH || 192)) : scale(1),
    pos(x, y),
    anchor("bot"),
    useSprite ? color(255, 255, 255) : color(...def.col),
    z(300),
    {
      def,
      type,
      hp:            def.hp,
      maxHp:         def.hp,
      state:         "walk",   // walk | hurt | dead
      _lastState:    null,
      hurtTimer:     0,
      attackCooldown: rand(0.3, def.attackCooldown),  // stagger initial strikes
      tauntCooldown:  rand(4, 10),
      facing:        -1,
    },
  ]);
  if (useSprite) e.play("walk");
  return e;
}

/**
 * Run one frame of enemy AI.
 * @param {KAPLAYObj} e        — enemy game object
 * @param {KAPLAYObj} target   — current target player
 * @param {function}  onAttack — callback(damage) when enemy deals a hit
 */
function updateEnemy(e, target, onAttack, bounds) {
  e.hurtTimer      = Math.max(0, e.hurtTimer      - dt());
  e.attackCooldown = Math.max(0, e.attackCooldown - dt());
  e.tauntCooldown  = Math.max(0, e.tauntCooldown  - dt());

  // Colour flash when hurt
  const dc = e.def.col;
  if (e.def.sprite) {
    e.color = e.hurtTimer > 0 ? rgb(255, 120, 120) : rgb(255, 255, 255);
  } else {
    e.color = e.hurtTimer > 0
      ? rgb(Math.min(255, dc[0]+90), Math.min(255, dc[1]+90), Math.min(255, dc[2]+90))
      : rgb(...dc);
  }

  // Recover from hurt stun
  if (e.state === "hurt" && e.hurtTimer <= 0) e.state = "walk";

  // Still stunned — depth sort and bail
  if (e.state !== "walk") { e.z = e.pos.y; return; }

  // Taunt player (speech bubble) — skip if too close to target to avoid covering them
  if (e.tauntCooldown <= 0) {
    e.tauntCooldown = rand(6, 14);
    const distToTarget = target ? Math.abs(e.pos.x - target.pos.x) + Math.abs(e.pos.y - target.pos.y) : 999;
    if (distToTarget > 60) showSpeechBubble(choose(e.def.taunts), e);
  }

  // Vector toward target
  const dx   = target.pos.x - e.pos.x;
  const dy   = target.pos.y - e.pos.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  e.facing   = dx >= 0 ? 1 : -1;

  if (dist <= e.def.attackRange) {
    // Close enough — strike if cooldown ready
    if (e.attackCooldown <= 0) {
      e.attackCooldown = e.def.attackCooldown;

      onAttack(e.def.damage);
      // Tiny red flash on attack
      add([rect(14, 14), pos(e.pos.x + e.facing * 14, e.pos.y - 28),
           anchor("center"), color(255, 60, 60), opacity(1), z(e.pos.y + 5), lifespan(0.1)]);

      if (e.def.sprite) {
        e.play("attack");
        e._lastState = "attack";  // force walk to re-trigger after attack ends
      }
    }
  } else {
    // Walk toward target
    e.pos.x += (dx / dist) * e.def.speed * dt();
    e.pos.y += (dy / dist) * e.def.speed * dt();
    const eLeft  = bounds ? bounds.left  : 20;
    const eRight = bounds ? bounds.right : SCREEN_W - 20;
    e.pos.x  = clamp(e.pos.x, eLeft, eRight);
    e.pos.y  = clamp(e.pos.y, GROUND_TOP + 24, GROUND_BOTTOM);
  }

  // Sprite animation state & facing
  if (e.def.sprite) {
    if (e.state !== e._lastState) {
      if (e.state === "walk") e.play("walk");
      else if (e.state === "hurt") e.play("hurt");
      e._lastState = e.state;
    }
    e.flipX = e.facing < 0;  // sprite faces right by default, flip when facing left
  }

  e.z = e.pos.y;  // depth sort
}


// =============================================================================
// NPC FACTORY & AI
// =============================================================================

/**
 * Spawn a passive background NPC.
 * @param {string} type — key into NPC_DEFS
 * @param {number} x, y — spawn position (feet)
 * @returns {KAPLAYObj} NPC game object
 */
function spawnNPC(type, x, y) {
  const def = NPC_DEFS[type];

  const useSprite = !!def.sprite;
  const n = add([
    useSprite ? sprite(def.sprite) : rect(def.w, def.h),
    useSprite ? scale(def.h / (def.spriteH || 126)) : scale(1),
    pos(x, y),
    anchor("bot"),
    useSprite ? color(255, 255, 255) : color(...def.col),
    z(290),   // NPCs slightly behind player/enemies by default
    {
      def,
      type,
      state:        "walk",   // walk | flee | react
      dir:          choose([-1, 0, 1]),
      walkTimer:    rand(1, 4),
      reactCooldown:rand(2, 6),
      facing:       1,
    },
  ]);
  if (useSprite) n.play("walk");
  return n;
}

/**
 * Spawn a pet NPC (small animal, no speech bubbles).
 * Thin wrapper around spawnNPC — behaviour differences handled via def.isPet.
 * @param {string} type — key into NPC_DEFS (must have isPet: true)
 * @param {number} x, y — spawn position (feet)
 * @returns {KAPLAYObj} pet game object
 */
function spawnPet(type, x, y) {
  return spawnNPC(type, x, y);
}

/**
 * Run one frame of NPC AI.  NPCs wander, react to nearby fights, and flee
 * from enemies that get too close.
 * @param {KAPLAYObj}   n       — NPC game object
 * @param {KAPLAYObj[]} players — all player objects
 * @param {KAPLAYObj[]} enemies — all enemy objects
 */
function updateNPC(n, players, enemies, bounds) {
  n.walkTimer      = Math.max(0, n.walkTimer      - dt());
  n.reactCooldown  = Math.max(0, n.reactCooldown  - dt());

  // Check if a brawl is happening nearby (player + enemy both within 200 px)
  const alivePlayers = players.filter(p => p.hp > 0);
  const aliveEnemies = enemies.filter(e => e.state !== "dead");
  const fightNearby  = alivePlayers.some(p => n.pos.dist(p.pos) < 200) &&
                       aliveEnemies.some(e => n.pos.dist(e.pos) < 200);

  // Flee if an enemy is dangerously close
  const dangerEnemy = aliveEnemies.find(e => n.pos.dist(e.pos) < 70);
  if (dangerEnemy) {
    n.state  = "flee";
    n.facing = n.pos.x < dangerEnemy.pos.x ? -1 : 1;
    n.pos.x += n.facing * n.def.speed * 1.9 * dt();
    const fleeLeft  = bounds ? bounds.left  : 20;
    const fleeRight = bounds ? bounds.right : (window._currentLevelWidth || SCREEN_W) - 20;
    n.pos.x = Math.max(fleeLeft, Math.min(fleeRight, n.pos.x));
  } else if (n.state === "flee") {
    n.state = "walk";
  }

  // React to a nearby fight with a speech bubble — skip for pets and if too close to a player
  if (!n.def.isPet && fightNearby && n.reactCooldown <= 0 && Math.random() < 0.25) {
    n.reactCooldown = rand(3.5, 8);
    const nearestPlayer = alivePlayers.reduce((closest, p) => {
      const d = Math.abs(n.pos.x - p.pos.x) + Math.abs(n.pos.y - p.pos.y);
      return d < closest.d ? { d, p } : closest;
    }, { d: 999, p: null });
    if (nearestPlayer.d > 60) {
      showSpeechBubble(choose(n.def.phrases), n);
    }
    n.state = "react";
    wait(1.2, () => { if (n.state === "react") n.state = "walk"; });
  }

  // Wandering
  if (n.state === "walk") {
    if (n.walkTimer <= 0) {
      n.dir       = choose([-1, 0, 1]);
      n.walkTimer = rand(1.5, 4.5);
    }
    if (n.dir !== 0) n.facing = n.dir;
    n.pos.x += n.dir * n.def.speed * dt();
    const nLeft  = bounds ? bounds.left  : 20;
    const nRight = bounds ? bounds.right : (window._currentLevelWidth || SCREEN_W) - 20;
    n.pos.x  = clamp(n.pos.x, nLeft, nRight);
  }

  // Sprite animation & facing
  if (n.def.sprite) {
    n.flipX = n.facing < 0;
    const moving = n.state === "walk" && n.dir !== 0 || n.state === "flee";
    if (moving && n.curAnim() !== "walk") n.play("walk");
  }

  // Keep NPC above dialogue box when dialogue is active
  const npcYBottom = (typeof isDialogueActive === "function" && isDialogueActive())
    ? GROUND_BOTTOM - 60 : GROUND_BOTTOM;
  n.pos.y = clamp(n.pos.y, GROUND_TOP + 24, npcYBottom);

  n.z = n.pos.y;  // depth sort
}


// =============================================================================
// PICKUP FACTORY
// =============================================================================

/**
 * Spawn a pickup item on the ground.
 * @param {string} type — key into PICKUP_DEFS
 * @param {number} x, y — spawn position (feet)
 * @returns {KAPLAYObj} pickup game object
 */
function spawnPickup(type, x, y) {
  const def = PICKUP_DEFS[type];

  const useSprite = !!def.sprite;
  const pk = add([
    useSprite ? sprite(def.sprite) : rect(def.w, def.h),
    useSprite ? scale(def.h / 48) : scale(1),
    pos(x, y),
    anchor("bot"),
    useSprite ? color(255, 255, 255) : color(...def.col),
    z(285),   // below characters
    {
      pickupType: type,
      def,
      bobTimer:   rand(0, Math.PI * 2),   // phase offset so not all bobs are in sync
    },
  ]);

  if (useSprite) pk.play("idle");

  // Tiny label above the pickup
  add([
    text(def.label, { size: 7 }),
    pos(x - def.w / 2, y - def.h - 14),
    color(255, 240, 180),
    opacity(1),
    z(286),
    lifespan(4, { fade: 0.5 }),   // fades away after 4s; pickup stays until collected
  ]);

  return pk;
}


// =============================================================================
// HUD  (called from onDraw() in game scene)
// =============================================================================

/**
 * Draw the full game HUD.  Coordinate space = screen (no camera transform
 * needed as long as camera hasn't been panned — add a fixed() wrapper when
 * camera scrolling is introduced).
 *
 * @param {KAPLAYObj[]} players  — all player objects
 * @param {number}      waveIdx  — current wave index (0-based)
 * @param {object}      lvl      — current level data
 * @param {KAPLAYObj[]} enemies  — all enemy objects
 * @param {KAPLAYObj[]} bossObjs — boss objects (may be empty)
 * @param {string}      phase    — "wave" | "bossIntro" | "boss" | "levelClear"
 */
function drawHUD(players, waveIdx, lvl, enemies, bossObjs, phase, score, comboCount) {
  score = score || 0;
  comboCount = comboCount || 0;
  // VIEW_W / VIEW_H are the viewport dimensions (may differ from SCREEN_W in portrait)
  const vw = typeof VIEW_W !== "undefined" ? VIEW_W : SCREEN_W;
  const vh = typeof VIEW_H !== "undefined" ? VIEW_H : SCREEN_H;

  // ── Per-player bars ──────────────────────────────────────────────────────
  const narrow = vw < 500;  // mobile / narrow viewport
  const barW = narrow ? Math.min(vw * 0.55, 200) : Math.min(200, vw - 20);
  const rowH = narrow ? 24 : 0;  // vertical stacking offset for narrow

  for (let i = 0; i < players.length; i++) {
    const p  = players[i];
    const bx = narrow ? 8 : (8 + i * (barW + 18));
    const by = narrow ? (14 + i * rowH) : 18;

    // Name
    drawText({ text: p.cfg.name, pos: vec2(bx, by), size: 8, color: rgb(...p.cfg.col) });
    // HP bar track
    drawRect({ pos: vec2(bx, by + 11), width: barW, height: 12, color: rgb(22, 22, 22) });
    // HP bar fill
    const ratio = Math.max(0, p.hp / p.maxHp);
    drawRect({ pos: vec2(bx, by + 11), width: barW * ratio, height: 12,
               color: p.hp < 25 ? rgb(210, 40, 40) : rgb(60, 195, 60) });
    // HP number
    drawText({ text: `${p.hp}`, pos: vec2(bx + 4, by + 12), size: 9, color: rgb(240, 240, 240) });

    // Lives (multiplayer only)
    if (p.lives > 0 || p.respawnTimer > 0) {
      drawText({ text: `x${p.lives}`, pos: vec2(bx + barW - 18, by + 12), size: 9, color: rgb(200, 200, 200) });
    }
    // Respawn countdown
    if (p.hp <= 0 && p.lives > 0 && p.respawnTimer > 0) {
      drawText({ text: `RESPAWN ${Math.ceil(p.respawnTimer)}`,
                 pos: vec2(bx + barW / 2, by + 12), size: 9, color: rgb(80, 255, 80), anchor: "center" });
    }

    // Held weapon (skip on narrow to save space)
    if (!narrow && p.heldWeapon) {
      const wdef = PICKUP_DEFS[p.heldWeapon.type];
      drawText({ text: `[${wdef.label} ×${p.heldWeapon.uses}]`,
                 pos: vec2(bx, by + 27), size: 8, color: rgb(255, 200, 60) });
    }

    // Special cooldown / ready indicator (skip on narrow)
    if (!narrow) {
      if (p.specialCooldown > 0) {
        drawText({ text: `SPL ${Math.ceil(p.specialCooldown)}s`,
                   pos: vec2(bx + barW - 52, by + 27), size: 8, color: rgb(160, 100, 200) });
      } else {
        drawText({ text: "SPL RDY",
                   pos: vec2(bx + barW - 52, by + 27), size: 8, color: rgb(210, 160, 255) });
      }
    }
  }

  // ── Score (top-right) ───────────────────────────────────────────────────
  drawText({ text: `${score}`, pos: vec2(vw - 8, 5),
             size: 11, color: rgb(255, 215, 60), align: "right" });

  // ── Wave or boss indicator ──────────────────────────────────────────────
  // On narrow screens: right-aligned below score. On wide: centered top.
  let infoY = 19;
  if (narrow) {
    if (phase === "wave") {
      drawText({ text: `WAVE ${waveIdx + 1}/${lvl.waves.length}`,
                 pos: vec2(vw - 8, infoY), size: 9, color: rgb(255, 215, 60), align: "right" });
      infoY += 13;
    } else if (phase === "bossIntro" || phase === "boss") {
      drawText({ text: "BOSS!",
                 pos: vec2(vw - 8, infoY), size: 11, color: rgb(255, 50, 50), align: "right" });
      infoY += 13;
    }
  } else {
    if (phase === "wave") {
      drawText({ text: `WAVE ${waveIdx + 1}/${lvl.waves.length}`,
                 pos: vec2(vw / 2 - 26, 5), size: 11, color: rgb(255, 215, 60) });
    } else if (phase === "bossIntro" || phase === "boss") {
      drawText({ text: "BOSS!",
                 pos: vec2(vw / 2 - 18, 5), size: 13, color: rgb(255, 50, 50) });
    }
  }

  // ── Combo indicator ───────────────────────────────────────────────────
  if (comboCount >= 3) {
    drawText({ text: `COMBO ×${comboCount}`, pos: vec2(vw - 8, infoY),
               size: 9, color: rgb(255, 140, 40), align: "right" });
    infoY += 13;
  }

  // ── Enemy count ───────────────────────────────────────────────────────
  const alive = enemies.filter(e => e.state !== "dead").length;
  drawText({ text: `×${alive}`, pos: vec2(vw - 30, infoY),
             size: 11, color: rgb(215, 85, 85) });

  // ── Boss HP bar (bottom of screen) ──────────────────────────────────────
  if (phase === "boss" && bossObjs.length > 0) {
    const bossBarW = Math.min(420, vw - 16);
    const bossBarX = (vw - bossBarW) / 2;
    const bossBarY = vh - 36;

    let totalHp = 0, totalMaxHp = 0;
    let bossLabel = "";
    for (const b of bossObjs) {
      if (b.state !== "dead") {
        totalHp    += b.hp;
        totalMaxHp += b.def.hp;
        bossLabel   = b.def.label;
      }
    }

    if (totalMaxHp > 0) {
      drawRect({ pos: vec2(bossBarX - 2, bossBarY - 2), width: bossBarW + 4, height: 18,
                 color: rgb(12, 12, 12) });
      drawRect({ pos: vec2(bossBarX, bossBarY), height: 14,
                 width: bossBarW * (totalHp / totalMaxHp), color: rgb(180, 25, 25) });
      drawText({ text: `${bossLabel}  ${totalHp}/${totalMaxHp}`,
                 pos: vec2(bossBarX + 5, bossBarY + 1), size: 10,
                 color: rgb(255, 195, 195) });
    }
  }

  // ── Controls legend (bottom, desktop only) ──────────────────────────────
  if (!window.matchMedia("(pointer: coarse)").matches) {
    drawText({
      text:  "J1 WASD  Z Puño  X Patada  Q Especial  |  J2 IJKL  U O P",
      pos:   vec2(vw / 2 - 200, vh - 18),
      size:  9,
      color: rgb(140, 140, 150),
    });
  }
}
