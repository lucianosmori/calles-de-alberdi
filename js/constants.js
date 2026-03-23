// =============================================================================
// Calles de Alberdi — js/constants.js
// All tuning values, level definitions, and entity stat tables.
// Edit numbers here; never scatter magic values through game logic.
// =============================================================================

// ── Canvas / layout ───────────────────────────────────────────────────────────
const SCREEN_W = 800;
const SCREEN_H = 400;

// Belt-scroll ground band.  Characters are confined to this vertical strip.
const GROUND_TOP    = 260;
const GROUND_BOTTOM = 365;

// ── Belt-scroll camera ──────────────────────────────────────────────────────
const SECTION_W          = 800;   // px — width of one scrolling section
const CAM_DEAD_ZONE_X    = 0.15;  // fraction of VIEW_W — tight zone keeps player centered
const CAM_DEAD_ZONE_Y    = 0.30;  // fraction of ground band height — vertical dead zone
const CAM_LERP_X         = 0.12;  // horizontal smoothing — snappy follow
const CAM_LERP_Y         = 0.04;  // vertical smoothing (subtle)
const CAM_VERT_RANGE     = 20;    // max px camera shifts vertically
const GO_ARROW_BLINK_HZ  = 3.5;   // "GO >>>" indicator flash speed
const SECTION_WALL_MARGIN = 20;   // px inset from section edge for invisible wall

// ── Dialogue system ───────────────────────────────────────────────────────────
const DIALOGUE_CHARS_PER_SEC   = 30;   // typewriter speed (characters/sec)
const DIALOGUE_FAST_MULTIPLIER = 3;    // speed when holding advance key
const DIALOGUE_BOX_H           = 80;   // px — height of dialogue overlay
const DIALOGUE_BOX_MARGIN      = 8;    // px — padding inside box
const DIALOGUE_PORTRAIT_SIZE   = 56;   // px — portrait square (Phase B)
const DIALOGUE_AUTO_ADVANCE    = 4;    // seconds — total time per line (from start, not end of typewriter)
const DIALOGUE_AUTO_ADVANCE_1  = 3;    // seconds — single-line dialogue

// ── Weather ─────────────────────────────────────────────────────────────────
const RAIN_ANGLE          = 0.18;  // radians — slight diagonal slant
const RAIN_SPEED          = 600;   // px/sec — fall speed
const RAIN_DENSITY        = 40;    // particles on screen at once (per VIEW_W)
const PUDDLE_COUNT_PER_800 = 5;    // rain puddles per 800px of sidewalk

// ── Player tuning ─────────────────────────────────────────────────────────────
const PLAYER_SPEED    = 185;   // px / sec
const PLAYER_MAX_HP   = 100;
const ATTACK_DURATION = 0.22;  // sec — movement locked while attacking
const HURT_IFRAMES    = 0.45;  // sec — invincibility after being hit
const KNOCKBACK       = 22;    // px — applied to enemy on hit
const SPECIAL_HP_COST = 20;    // HP spent on special move
const SPECIAL_RADIUS  = 115;   // px — area-of-effect radius
const SPECIAL_DAMAGE  = 35;
const SPECIAL_COOLDOWN = 5;    // sec

// ── Respawn (multiplayer) ────────────────────────────────────────────────────
const MP_LIVES             = 6;    // lives per player in 2P/bot modes (0 = no respawn in 1P)
const RESPAWN_DELAY        = 3;    // seconds before respawn
const RESPAWN_IFRAMES      = 2;    // seconds of invincibility after respawn

// Attack configs: range (depth reach), width (lateral tolerance), damage, flash colour
const ATTACKS = {
  punch:   { range: 68,  width: 32, damage: 12, fxColor: [255, 230, 80]  },
  kick:    { range: 90,  width: 42, damage: 22, fxColor: [255, 130, 40]  },
};

// ── Bot companion AI ────────────────────────────────────────────────────────
const BOT_MOVE_SPEED      = 160;   // px/sec — slightly slower than player (185)
const BOT_ATTACK_RANGE    = 55;    // px — distance to start attacking
const BOT_ATTACK_COOLDOWN = 0.7;   // sec — minimum between attacks
const BOT_FOLLOW_DIST     = 50;    // px — how close bot follows P1 when idle

// ── Scoring ─────────────────────────────────────────────────────────────────
const SCORE_ENEMY_KILL = 100;
const SCORE_BOSS_KILL  = 500;
const SCORE_LEVEL_CLEAR = 1000;
const SCORE_COMBO_MULTIPLIER = 1.5;  // applied after 3+ hits in 2 seconds
const COMBO_WINDOW     = 2.0;       // seconds to chain hits for combo

// ── Player character roster ───────────────────────────────────────────────────
const PLAYER_CONFIGS = [
  {
    name:    "GAUCHO",
    col:     [200, 180, 140],   // earthy tan
    hurtCol: [255, 80,  80 ],
    sprite: "hero_gaucho",
    keys: { up:"w", down:"s", left:"a", right:"d", punch:"z", kick:"x", special:"q" },
    startX: 120,
  },
  {
    name:    "CORDOBESA",
    col:     [180, 100, 160],
    hurtCol: [255, 200, 60 ],
    sprite: "hero_cordobesa",
    keys: { up:"i", down:"k", left:"j", right:"l", punch:"u", kick:"o", special:"p" },
    startX: 175,
  },
];

// ── Level definitions ─────────────────────────────────────────────────────────
// Each level has:
//   levelWidth — total px width (default SCREEN_W for backwards compat)
//   sections   — array of { startX, endX } defining scrolling sections
//   blocks     — streetscape elements: stores, crosswalks, lots, alleys, etc.
//                (falls back to `stores` for backwards compat, all treated as type:"store")
//   weather    — "rain" (default), "clear", "overcast"
//   npcTypes   — pool of NPC archetypes to spawn in background
//   waves      — array of wave definitions; each wave = array of {type, count}
//                one wave per section — boss spawns in last section after its wave
//   boss       — { type, name, count? }
//   pickups    — types available in this level
//   bossIntro  — banner text when the boss spawns
//   skyCol     — [r,g,b] sky colour
//   groundCol  — [r,g,b] sidewalk surface colour
const LEVELS = [
  // ── Level 1 — Calle Colón ────────────────────────────────────────────────
  {
    id: 1, name: "Calle Colón", subtitle: "La Comisaría",
    skyCol: [85, 130, 200], groundCol: [195, 185, 170],
    weather: "rain",
    levelWidth: 2400,
    sections: [
      { startX: 0,    endX: 800  },
      { startX: 800,  endX: 1600 },
      { startX: 1600, endX: 2400 },
    ],
    blocks: [
      // ── Section 1 (0–800): Comisaría block ──
      { type: "store", label: "KIOSCO", x: 0, w: 140, h: 175,
        col: [120, 90, 50], signCol: [180, 140, 60],
        signTextCol: [255, 255, 255], awningCol: [100, 75, 35] },
      { type: "store", label: "PANADERÍA", x: 148, w: 155, h: 185,
        col: [170, 130, 70], signCol: [200, 160, 80],
        signTextCol: [60, 30, 10], awningCol: [140, 105, 50] },
      { type: "store", label: "COMISARÍA CENTRAL", x: 311, w: 210, h: 210,
        col: [160, 155, 145], signCol: [50, 60, 100],
        signTextCol: [255, 255, 255], awningCol: [80, 85, 100],
        isPoliceStation: true },
      { type: "store", label: "FERRETERÍA", x: 529, w: 135, h: 168,
        col: [90, 70, 55], signCol: [60, 45, 30],
        signTextCol: [255, 220, 140], awningCol: [70, 50, 35] },
      { type: "store", label: "ALMACÉN", x: 672, w: 128, h: 155,
        col: [100, 120, 80], signCol: [70, 90, 50],
        signTextCol: [255, 255, 230], awningCol: [60, 80, 40] },

      // ── Section 2 (800–1600): Residential block ──
      { type: "crosswalk", x: 800, w: 55 },
      { type: "store", label: "FARMACIA", x: 863, w: 145, h: 175,
        col: [45, 130, 75], signCol: [30, 110, 55],
        signTextCol: [255, 255, 255], awningCol: [35, 100, 50] },
      { type: "store", label: "PELUQUERÍA", x: 1016, w: 130, h: 168,
        col: [180, 120, 160], signCol: [160, 90, 140],
        signTextCol: [255, 255, 255], awningCol: [140, 80, 120] },
      { type: "lot", x: 1154, w: 90, h: 150 },
      { type: "store", label: "DIETÉTICA", x: 1252, w: 135, h: 172,
        col: [140, 170, 100], signCol: [110, 140, 70],
        signTextCol: [255, 255, 240], awningCol: [100, 130, 60] },
      { type: "alley", x: 1395, w: 35 },
      { type: "store", label: "LOCUTORIO", x: 1438, w: 155, h: 165,
        col: [80, 90, 130], signCol: [60, 70, 110],
        signTextCol: [255, 255, 255], awningCol: [50, 60, 100] },

      // ── Section 3 (1600–2400): Commercial block ──
      { type: "crosswalk", x: 1600, w: 55 },
      { type: "store", label: "LIBRERÍA", x: 1663, w: 140, h: 170,
        col: [100, 80, 65], signCol: [80, 60, 45],
        signTextCol: [255, 230, 200], awningCol: [70, 50, 35] },
      { type: "wall", x: 1811, w: 75, h: 180, col: [140, 130, 120], mural: true },
      { type: "store", label: "ROTISERÍA", x: 1894, w: 150, h: 175,
        col: [160, 100, 50], signCol: [140, 80, 30],
        signTextCol: [255, 240, 180], awningCol: [120, 70, 25] },
      { type: "special", x: 2052, w: 65, h: 120, specialType: "bus_stop" },
      { type: "store", label: "BAR EL CORDOBÉS", x: 2125, w: 155, h: 180,
        col: [100, 60, 40], signCol: [80, 45, 25],
        signTextCol: [255, 200, 100], awningCol: [70, 40, 20] },
      { type: "store", label: "VERDULERÍA", x: 2288, w: 112, h: 160,
        col: [60, 130, 50], signCol: [40, 100, 30],
        signTextCol: [255, 255, 200], awningCol: [45, 95, 30] },
    ],
    npcTypes: ["belgrano_fan", "feminist", "peronist", "trapito"],
    waves: [
      [{ type:"punguista",  count:3 }],
      [{ type:"punguista",  count:2 }, { type:"patotero",  count:1 }],
      [{ type:"punguista",  count:2 }, { type:"patotero",  count:1 }, { type:"naranjita", count:1 }],
    ],
    boss:      { type:"comisario",    name:"El Comisario" },
    pickups:   ["empanada", "mate", "fernet"],
    bossIntro: "¡EL COMISARIO bloquea la salida de la Comisaría!",
    introDialogue: [
      { speaker: "Gaucho", text: "Calle Colón... la comisaría está al fondo.", col: [200, 180, 140], voice: "npc_mid" },
      { speaker: "Vecina", text: "¡Cuidado, pibe! Los punguistas andan por acá.", col: [180, 140, 160], voice: "npc_high" },
    ],
    bossDialogue: [
      { speaker: "El Comisario", text: "¡Acá mando yo, pendejo!", col: [40, 50, 80], isBoss: true, voice: "boss_low" },
      { speaker: "El Comisario", text: "¡A la comisaría vas a ir!", col: [40, 50, 80], isBoss: true, voice: "boss_low" },
      { speaker: "El Comisario", text: "¡Respetá la autoridad!", col: [40, 50, 80], isBoss: true, voice: "boss_low" },
    ],
  },

  // ── Level 2 — Barrio Alberdi ──────────────────────────────────────────────
  {
    id: 2, name: "Barrio Alberdi", subtitle: "El Barrio",
    skyCol: [70, 100, 160], groundCol: [185, 178, 165],
    weather: "overcast",
    levelWidth: 2400,
    sections: [
      { startX: 0,    endX: 800  },
      { startX: 800,  endX: 1600 },
      { startX: 1600, endX: 2400 },
    ],
    blocks: [
      // ── Section 1 (0–800): Corner stores ──
      { type: "store", label: "ALMACÉN DON PEPE", x: 0, w: 160, h: 180,
        col: [130, 100, 60], signCol: [160, 120, 40],
        signTextCol: [255, 255, 255], awningCol: [110, 80, 35] },
      { type: "store", label: "CARNICERÍA", x: 168, w: 148, h: 170,
        col: [160, 50, 40], signCol: [180, 30, 20],
        signTextCol: [255, 255, 255], awningCol: [130, 35, 25] },
      { type: "alley", x: 324, w: 30 },
      { type: "store", label: "PANADERÍA LA ABUELA", x: 362, w: 155, h: 175,
        col: [170, 130, 70], signCol: [200, 160, 80],
        signTextCol: [60, 30, 10], awningCol: [140, 105, 50] },
      { type: "store", label: "KIOSCO", x: 525, w: 130, h: 160,
        col: [120, 90, 50], signCol: [180, 140, 60],
        signTextCol: [255, 255, 255], awningCol: [100, 75, 35] },
      { type: "store", label: "TALLER MOTOS", x: 663, w: 137, h: 165,
        col: [110, 100, 90], signCol: [90, 80, 70],
        signTextCol: [255, 220, 140], awningCol: [80, 70, 60] },

      // ── Section 2 (800–1600): Football block ──
      { type: "crosswalk", x: 800, w: 55 },
      { type: "store", label: "CANCHA BELGRANO", x: 863, w: 260, h: 200,
        col: [50, 120, 180], signCol: [30, 90, 160],
        signTextCol: [255, 255, 255], awningCol: [40, 100, 150] },
      { type: "store", label: "KIOSCO EL PIRATA", x: 1131, w: 130, h: 160,
        col: [120, 95, 55], signCol: [180, 150, 70],
        signTextCol: [255, 255, 255], awningCol: [100, 80, 40] },
      { type: "lot", x: 1269, w: 110, h: 150 },
      { type: "wall", x: 1387, w: 80, h: 170, col: [130, 120, 100], mural: true },
      { type: "store", label: "FERRETERÍA", x: 1475, w: 125, h: 168,
        col: [90, 70, 55], signCol: [60, 45, 30],
        signTextCol: [255, 220, 140], awningCol: [70, 50, 35] },

      // ── Section 3 (1600–2400): Residential block ──
      { type: "crosswalk", x: 1600, w: 55 },
      { type: "store", label: "BAR LOS AMIGOS", x: 1663, w: 150, h: 170,
        col: [100, 60, 40], signCol: [80, 45, 25],
        signTextCol: [255, 200, 100], awningCol: [70, 40, 20] },
      { type: "store", label: "VERDULERÍA", x: 1821, w: 130, h: 155,
        col: [60, 130, 50], signCol: [40, 100, 30],
        signTextCol: [255, 255, 200], awningCol: [45, 95, 30] },
      { type: "alley", x: 1959, w: 30 },
      { type: "store", label: "TALLER MECÁNICO", x: 1997, w: 155, h: 175,
        col: [100, 95, 85], signCol: [70, 65, 55],
        signTextCol: [255, 240, 180], awningCol: [60, 55, 45] },
      { type: "store", label: "PELUQUERÍA", x: 2160, w: 130, h: 165,
        col: [180, 120, 160], signCol: [160, 90, 140],
        signTextCol: [255, 255, 255], awningCol: [140, 80, 120] },
      { type: "store", label: "DESPENSA", x: 2298, w: 102, h: 155,
        col: [140, 120, 80], signCol: [120, 100, 60],
        signTextCol: [255, 255, 230], awningCol: [100, 85, 50] },
    ],
    npcTypes: ["belgrano_fan", "peronist", "vecina"],
    waves: [
      [{ type:"punguista",  count:2 }, { type:"patotero", count:1 }],
      [{ type:"naranjita",  count:2 }, { type:"patotero", count:2 }],
      [{ type:"punguista",  count:2 }, { type:"patotero", count:2 }, { type:"naranjita", count:1 }],
    ],
    boss:      { type:"barra_brava",   name:"El Barra Brava" },
    pickups:   ["empanada", "mate", "choripan"],
    bossIntro: "¡EL BARRA BRAVA baja de la tribuna!",
    introDialogue: [
      { speaker: "Gaucho", text: "Barrio Alberdi... acá se pone bravo.", col: [200, 180, 140], voice: "npc_mid" },
      { speaker: "Trapito", text: "¡Te lo cuido, jefe! ...por unas monedas.", col: [140, 130, 80], voice: "npc_mid" },
    ],
    bossDialogue: [
      { speaker: "El Barra Brava", text: "¡Belgrano no pierde, hermano!", col: [50, 120, 180], isBoss: true, voice: "boss_mid" },
      { speaker: "El Barra Brava", text: "¡Te rompo todo, gil!", col: [50, 120, 180], isBoss: true, voice: "boss_mid" },
      { speaker: "El Barra Brava", text: "¡Aguante la B, papá!", col: [50, 120, 180], isBoss: true, voice: "boss_mid" },
    ],
  },

  // ── Level 3 — La Cañada ──────────────────────────────────────────────────
  {
    id: 3, name: "La Cañada", subtitle: "El Paseo",
    skyCol: [95, 145, 210], groundCol: [200, 195, 180],
    weather: "rain",
    levelWidth: 3200,
    sections: [
      { startX: 0,    endX: 800  },
      { startX: 800,  endX: 1600 },
      { startX: 1600, endX: 2400 },
      { startX: 2400, endX: 3200 },
    ],
    blocks: [
      // ── Section 1 (0–800): Canal promenade start ──
      { type: "store", label: "HELADERÍA", x: 0, w: 150, h: 170,
        col: [200, 180, 220], signCol: [180, 140, 200],
        signTextCol: [255, 255, 255], awningCol: [160, 120, 180] },
      { type: "store", label: "CERVECERÍA", x: 158, w: 160, h: 185,
        col: [150, 110, 40], signCol: [170, 130, 30],
        signTextCol: [255, 240, 180], awningCol: [120, 90, 25] },
      { type: "park", x: 326, w: 190, h: 140 },
      { type: "store", label: "CAFÉ DEL PUENTE", x: 524, w: 145, h: 168,
        col: [130, 95, 60], signCol: [110, 75, 40],
        signTextCol: [255, 240, 200], awningCol: [95, 65, 35] },
      { type: "store", label: "ARTESANÍAS", x: 677, w: 123, h: 158,
        col: [140, 120, 90], signCol: [120, 100, 70],
        signTextCol: [255, 255, 230], awningCol: [100, 85, 55] },

      // ── Section 2 (800–1600): Cultural block ──
      { type: "crosswalk", x: 800, w: 55 },
      { type: "store", label: "LIBRERÍA", x: 863, w: 140, h: 165,
        col: [100, 80, 65], signCol: [80, 60, 45],
        signTextCol: [255, 230, 200], awningCol: [70, 50, 35] },
      { type: "wall", x: 1011, w: 90, h: 175, col: [120, 140, 130], mural: true },
      { type: "store", label: "CAFÉ LA CAÑADA", x: 1109, w: 160, h: 172,
        col: [120, 90, 55], signCol: [100, 70, 35],
        signTextCol: [255, 240, 190], awningCol: [85, 60, 30] },
      { type: "park", x: 1277, w: 160, h: 135 },
      { type: "store", label: "DIETÉTICA", x: 1445, w: 148, h: 162,
        col: [80, 150, 90], signCol: [60, 130, 70],
        signTextCol: [255, 255, 240], awningCol: [50, 115, 55] },

      // ── Section 3 (1600–2400): Residential stretch ──
      { type: "crosswalk", x: 1600, w: 55 },
      { type: "store", label: "FARMACIA", x: 1663, w: 145, h: 170,
        col: [40, 130, 70], signCol: [30, 110, 50],
        signTextCol: [255, 255, 255], awningCol: [25, 100, 45] },
      { type: "store", label: "ÓPTICA", x: 1816, w: 130, h: 165,
        col: [80, 110, 160], signCol: [60, 90, 140],
        signTextCol: [255, 255, 255], awningCol: [50, 80, 125] },
      { type: "lot", x: 1954, w: 100, h: 145 },
      { type: "store", label: "ROTISERÍA", x: 2062, w: 150, h: 170,
        col: [160, 100, 50], signCol: [140, 80, 30],
        signTextCol: [255, 240, 180], awningCol: [120, 70, 25] },
      { type: "store", label: "PELUQUERÍA", x: 2220, w: 130, h: 160,
        col: [170, 120, 155], signCol: [150, 95, 135],
        signTextCol: [255, 255, 255], awningCol: [130, 80, 115] },
      { type: "alley", x: 2358, w: 35 },

      // ── Section 4 (2400–3200): Park and waterfront ──
      { type: "crosswalk", x: 2400, w: 55 },
      { type: "park", x: 2463, w: 280, h: 145 },
      { type: "special", x: 2751, w: 65, h: 120, specialType: "bus_stop" },
      { type: "store", label: "KIOSCO", x: 2824, w: 120, h: 155,
        col: [110, 130, 100], signCol: [90, 110, 80],
        signTextCol: [255, 255, 240], awningCol: [75, 95, 65] },
      { type: "store", label: "PIZZERÍA", x: 2952, w: 140, h: 168,
        col: [160, 90, 45], signCol: [140, 70, 25],
        signTextCol: [255, 230, 170], awningCol: [120, 60, 20] },
      { type: "wall", x: 3100, w: 100, h: 160, col: [110, 135, 120] },
    ],
    npcTypes: ["feminist", "vecina", "peronist"],
    waves: [
      [{ type:"patotero",  count:3 }],
      [{ type:"patotero",  count:2 }, { type:"naranjita", count:2 }],
      [{ type:"punguista", count:2 }, { type:"patotero",  count:2 }, { type:"naranjita", count:1 }],
      [{ type:"punguista", count:2 }, { type:"patotero",  count:2 }, { type:"naranjita", count:2 }],
    ],
    boss:      { type:"puntero",   name:"El Puntero" },
    pickups:   ["empanada", "choripan", "fernet"],
    bossIntro: "¡EL PUNTERO corta el paso en La Cañada!",
    introDialogue: [
      { speaker: "Gaucho", text: "La Cañada... hermoso paseo, pero lleno de punteros.", col: [200, 180, 140], voice: "npc_mid" },
      { speaker: "Peronista", text: "¡Acá el pueblo manda, compañero!", col: [100, 140, 200], voice: "npc_mid" },
    ],
    bossDialogue: [
      { speaker: "El Puntero", text: "¡Yo te consigo laburo, votame!", col: [120, 80, 40], isBoss: true, voice: "boss_mid" },
      { speaker: "El Puntero", text: "¡La calle es mía, rajá de acá!", col: [120, 80, 40], isBoss: true, voice: "boss_mid" },
      { speaker: "El Puntero", text: "¡Votame o rajá!", col: [120, 80, 40], isBoss: true, voice: "boss_mid" },
    ],
  },

  // ── Level 4 — Centro ─────────────────────────────────────────────────────
  {
    id: 4, name: "Centro", subtitle: "La Final",
    skyCol: [55, 80, 140], groundCol: [210, 205, 195],
    weather: "rain",
    levelWidth: 3200,
    sections: [
      { startX: 0,    endX: 800  },
      { startX: 800,  endX: 1600 },
      { startX: 1600, endX: 2400 },
      { startX: 2400, endX: 3200 },
    ],
    blocks: [
      // ── Section 1 (0–800): Historic center ──
      { type: "store", label: "CATEDRAL", x: 0, w: 220, h: 220,
        col: [170, 160, 140], signCol: [140, 130, 110],
        signTextCol: [255, 255, 255], awningCol: [120, 110, 95] },
      { type: "store", label: "CABILDO", x: 228, w: 230, h: 210,
        col: [180, 170, 150], signCol: [150, 140, 120],
        signTextCol: [255, 240, 200], awningCol: [130, 120, 100] },
      { type: "alley", x: 466, w: 30 },
      { type: "store", label: "GALERÍA", x: 504, w: 160, h: 190,
        col: [120, 100, 80], signCol: [100, 80, 60],
        signTextCol: [255, 255, 240], awningCol: [85, 65, 45] },
      { type: "store", label: "RELOJERÍA", x: 672, w: 128, h: 180,
        col: [100, 95, 85], signCol: [80, 75, 65],
        signTextCol: [255, 240, 200], awningCol: [70, 65, 55] },

      // ── Section 2 (800–1600): Financial block ──
      { type: "crosswalk", x: 800, w: 55 },
      { type: "store", label: "BANCO", x: 863, w: 200, h: 200,
        col: [140, 140, 145], signCol: [60, 65, 80],
        signTextCol: [255, 255, 255], awningCol: [80, 80, 90] },
      { type: "store", label: "SHOPPING", x: 1071, w: 210, h: 195,
        col: [130, 125, 120], signCol: [100, 95, 90],
        signTextCol: [255, 255, 255], awningCol: [90, 85, 80] },
      { type: "wall", x: 1289, w: 75, h: 190, col: [150, 145, 140] },
      { type: "store", label: "JOYERÍA", x: 1372, w: 135, h: 185,
        col: [120, 110, 95], signCol: [170, 150, 80],
        signTextCol: [60, 40, 20], awningCol: [100, 90, 70] },
      { type: "store", label: "CONFITERÍA", x: 1515, w: 85, h: 175,
        col: [150, 130, 110], signCol: [130, 110, 90],
        signTextCol: [255, 255, 240], awningCol: [110, 95, 75] },

      // ── Section 3 (1600–2400): Judicial block ──
      { type: "crosswalk", x: 1600, w: 55 },
      { type: "store", label: "TRIBUNALES", x: 1663, w: 240, h: 215,
        col: [160, 155, 145], signCol: [70, 75, 90],
        signTextCol: [255, 255, 255], awningCol: [90, 90, 100] },
      { type: "alley", x: 1911, w: 30 },
      { type: "store", label: "TEATRO", x: 1949, w: 190, h: 200,
        col: [130, 50, 50], signCol: [160, 40, 40],
        signTextCol: [255, 230, 180], awningCol: [110, 35, 35] },
      { type: "lot", x: 2147, w: 100, h: 160 },
      { type: "store", label: "LIBRERÍA CÓRDOBA", x: 2255, w: 145, h: 185,
        col: [110, 90, 70], signCol: [90, 70, 50],
        signTextCol: [255, 240, 210], awningCol: [75, 55, 40] },

      // ── Section 4 (2400–3200): Government block — final boss ──
      { type: "crosswalk", x: 2400, w: 55 },
      { type: "park", x: 2463, w: 300, h: 150 },
      { type: "special", x: 2771, w: 65, h: 120, specialType: "bus_stop" },
      { type: "store", label: "MUNICIPALIDAD", x: 2844, w: 356, h: 220,
        col: [150, 145, 135], signCol: [60, 70, 100],
        signTextCol: [255, 255, 255], awningCol: [80, 85, 105] },
    ],
    npcTypes: ["belgrano_fan", "feminist", "peronist", "vecina"],
    waves: [
      [{ type:"patotero",  count:3 }, { type:"punguista", count:2 }],
      [{ type:"patotero",  count:2 }, { type:"naranjita",  count:2 }, { type:"punguista", count:2 }],
      [{ type:"patotero",  count:3 }, { type:"naranjita",  count:2 }, { type:"punguista", count:2 }],
      [{ type:"patotero",  count:3 }, { type:"naranjita",  count:3 }, { type:"punguista", count:2 }],
    ],
    boss:      { type:"intendente",   name:"El Intendente" },
    pickups:   ["empanada", "mate", "fernet", "choripan"],
    bossIntro: "¡EL INTENDENTE sale del Palacio Municipal!",
    introDialogue: [
      { speaker: "Gaucho", text: "Centro... el Palacio Municipal. La pelea final.", col: [200, 180, 140], voice: "npc_mid" },
      { speaker: "Feminista", text: "¡Ni una menos! ¡Dale duro al intendente!", col: [200, 80, 180], voice: "npc_high" },
    ],
    bossDialogue: [
      { speaker: "El Intendente", text: "¡Córdoba es mía, no me van a voltear!", col: [30, 30, 60], isBoss: true, voice: "boss_low" },
      { speaker: "El Intendente", text: "¡Soy intocable!", col: [30, 30, 60], isBoss: true, voice: "boss_low" },
      { speaker: "El Intendente", text: "¡Tengo todo el poder del municipio!", col: [30, 30, 60], isBoss: true, voice: "boss_low" },
    ],
  },
];

// ── Enemy stat table ──────────────────────────────────────────────────────────
const ENEMY_DEFS = {
  punguista: {
    label:"PUNGUISTA",   col:[160, 100, 80],  w:26, h:46,
    hp:45,  speed:62,  damage:8,  attackRange:38, attackCooldown:1.3,
    taunts:["¡Dame la billetera!", "¡Afanamos tranqui!", "¡Rajá de acá!"],
    sprite:"enemy_punguista", spriteH:126,
  },
  patotero: {
    label:"PATOTERO",   col:[140, 70, 50],  w:30, h:48,
    hp:70,  speed:45,  damage:14, attackRange:42, attackCooldown:1.6,
    taunts:["¡Te vamo' a fajar!", "¡Vení pa'ca!", "¡Sacá chapa!"],
    sprite:"enemy_patotero", spriteH:126,
  },
  naranjita: {
    label:"NARANJITA",  col:[255, 160, 50], w:24, h:44,
    hp:35,  speed:70,  damage:6,  attackRange:36, attackCooldown:1.0,
    taunts:["¡Te cuido el auto, loco!", "¡Son cien pe' nomá!", "¡Dame la moneda!"],
    sprite:"enemy_naranjita", spriteH:126,
  },

  // ── Boss variants ──────────────────────────────────────────────────────────
  comisario: {
    label:"EL COMISARIO", col:[40, 50, 80], w:38, h:62,
    hp:220, speed:35, damage:18, attackRange:50, attackCooldown:1.8, isBoss:true,
    taunts:["¡Acá mando yo!", "¡A la comisaría vas a ir!", "¡Respetá la autoridad!"],
    sprite:"boss_comisario", spriteH:126,
  },
  barra_brava: {
    label:"BARRA BRAVA", col:[50, 120, 180], w:36, h:58,
    hp:200, speed:50, damage:16, attackRange:48, attackCooldown:1.4, isBoss:true,
    taunts:["¡Belgrano no pierde!", "¡Aguante la B!", "¡Te rompo todo!"],
    sprite:"boss_barra_brava", spriteH:126,
  },
  puntero: {
    label:"EL PUNTERO", col:[120, 80, 40], w:34, h:54,
    hp:240, speed:40, damage:15, attackRange:52, attackCooldown:1.6, isBoss:true,
    taunts:["¡Yo te consigo laburo!", "¡Votame o rajá!", "¡La calle es mía!"],
    sprite:"boss_puntero", spriteH:126,
  },
  intendente: {
    label:"EL INTENDENTE", col:[30, 30, 60], w:42, h:64,
    hp:300, speed:30, damage:20, attackRange:56, attackCooldown:2.0, isBoss:true,
    taunts:["¡Córdoba es mía!", "¡No me van a voltear!", "¡Soy intocable!"],
    sprite:"boss_intendente", spriteH:126,
  },
};

// ── NPC archetypes ────────────────────────────────────────────────────────────
const NPC_DEFS = {
  belgrano_fan: {
    col:[50, 140, 200], accentCol:[255, 255, 255], w:22, h:44, speed:28,
    phrases:["¡Vamos Belgrano!", "¡Pirata hasta la muerte!", "¡Aguante la B!"],
    sprite:"npc_belgrano_fan", spriteH:126,
  },
  feminist: {
    col:[140, 50, 140], accentCol:[200, 80, 200], w:22, h:44, speed:25,
    phrases:["¡Ni una menos!", "¡Vivas nos queremos!", "¡El patriarcado se va a caer!"],
    sprite:"npc_feminist", spriteH:126,
  },
  peronist: {
    col:[100, 140, 200], accentCol:[255, 255, 255], w:24, h:44, speed:22,
    phrases:["¡Perón vuelve!", "¡Viva el General!", "¡La patria es el otro!"],
    sprite:"npc_peronist", spriteH:126,
  },
  trapito: {
    col:[200, 140, 60], accentCol:[255, 180, 80], w:22, h:44, speed:30,
    phrases:["¡Te lo cuido, jefe!", "¡Son doscientos!", "¡Dale, una monedita!"],
    sprite:"npc_trapito", spriteH:126,
  },
  vecina: {
    col:[180, 160, 140], accentCol:[220, 200, 180], w:22, h:44, speed:20,
    phrases:["¡Qué quilombo!", "¡Llamo a la policía!", "¡Estos pibes de ahora!"],
    sprite:"npc_vecina", spriteH:126,
  },
};

// ── Pickup table ──────────────────────────────────────────────────────────────
const PICKUP_DEFS = {
  empanada:   { col:[220, 170, 80],  label:"EMPANADA", heal:20, isWeapon:false, w:18, h:14, sprite:"pickup_empanada" },
  mate:       { col:[80, 140, 60],   label:"MATE",     heal:15, isWeapon:false, w:16, h:20, sprite:"pickup_mate" },
  fernet:     { col:[50, 30, 20],    label:"FERNET",   heal:0,  isWeapon:true,  damage:22, uses:3, w:12, h:24, sprite:"pickup_fernet" },
  choripan:   { col:[160, 100, 50],  label:"CHORIPÁN", heal:25, isWeapon:false, w:24, h:12, sprite:"pickup_choripan" },
};
