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

// Attack configs: range (depth reach), width (lateral tolerance), damage, flash colour
const ATTACKS = {
  punch:   { range: 68,  width: 32, damage: 12, fxColor: [255, 230, 80]  },
  kick:    { range: 90,  width: 42, damage: 22, fxColor: [255, 130, 40]  },
};

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
    // TODO: sprite: "hero_gaucho"
    keys: { up:"w", down:"s", left:"a", right:"d", punch:"z", kick:"x", special:"q" },
    startX: 120,
  },
  {
    name:    "CORDOBESA",
    col:     [180, 100, 160],
    hurtCol: [255, 200, 60 ],
    // TODO: sprite: "hero_cordobesa"  (Player 2 — future)
    keys: { up:"i", down:"k", left:"j", right:"l", punch:"u", kick:"o", special:"p" },
    startX: 175,
  },
];

// ── Level definitions ─────────────────────────────────────────────────────────
// Each level has:
//   stores     — placeholder storefronts rendered as coloured rects + sign text
//   npcTypes   — pool of NPC archetypes to spawn in background
//   waves      — array of wave definitions; each wave = array of {type, count}
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
    policeStation: true,  // special background: Comisaría Central at Colón y Santa Fe
    stores: [
      { label: "KIOSCO", x: 0, w: 140, h: 175,
        col: [120, 90, 50], signCol: [180, 140, 60],
        signTextCol: [255, 255, 255], awningCol: [100, 75, 35] },
      { label: "PANADERÍA", x: 148, w: 155, h: 185,
        col: [170, 130, 70], signCol: [200, 160, 80],
        signTextCol: [60, 30, 10], awningCol: [140, 105, 50] },
      { label: "COMISARÍA CENTRAL", x: 311, w: 210, h: 210,
        col: [160, 155, 145], signCol: [50, 60, 100],
        signTextCol: [255, 255, 255], awningCol: [80, 85, 100],
        isPoliceStation: true },
      { label: "FERRETERÍA", x: 529, w: 135, h: 168,
        col: [90, 70, 55], signCol: [60, 45, 30],
        signTextCol: [255, 220, 140], awningCol: [70, 50, 35] },
      { label: "ALMACÉN", x: 672, w: 128, h: 155,
        col: [100, 120, 80], signCol: [70, 90, 50],
        signTextCol: [255, 255, 230], awningCol: [60, 80, 40] },
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
  },

  // ── Level 2 — Placeholder ────────────────────────────────────────────────
  {
    id: 2, name: "Barrio Alberdi", subtitle: "El Barrio",
    skyCol: [70, 100, 160], groundCol: [185, 178, 165],
    stores: [
      { label: "ALMACÉN DON PEPE", x: 0, w: 160, h: 180,
        col: [130, 100, 60], signCol: [160, 120, 40],
        signTextCol: [255, 255, 255], awningCol: [110, 80, 35] },
      { label: "CARNICERÍA", x: 168, w: 148, h: 170,
        col: [160, 50, 40], signCol: [180, 30, 20],
        signTextCol: [255, 255, 255], awningCol: [130, 35, 25] },
      { label: "CANCHA BELGRANO", x: 324, w: 200, h: 195,
        col: [50, 120, 180], signCol: [30, 90, 160],
        signTextCol: [255, 255, 255], awningCol: [40, 100, 150] },
      { label: "VERDULERÍA", x: 532, w: 130, h: 155,
        col: [60, 130, 50], signCol: [40, 100, 30],
        signTextCol: [255, 255, 200], awningCol: [45, 95, 30] },
      { label: "BAR LOS AMIGOS", x: 670, w: 130, h: 165,
        col: [100, 60, 40], signCol: [80, 45, 25],
        signTextCol: [255, 200, 100], awningCol: [70, 40, 20] },
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
  },

  // ── Level 3 — Placeholder ────────────────────────────────────────────────
  {
    id: 3, name: "La Cañada", subtitle: "El Paseo",
    skyCol: [95, 145, 210], groundCol: [200, 195, 180],
    stores: [
      { label: "HELADERÍA", x: 0, w: 150, h: 170,
        col: [200, 180, 220], signCol: [180, 140, 200],
        signTextCol: [255, 255, 255], awningCol: [160, 120, 180] },
      { label: "CERVECERÍA", x: 158, w: 160, h: 185,
        col: [150, 110, 40], signCol: [170, 130, 30],
        signTextCol: [255, 240, 180], awningCol: [120, 90, 25] },
      { label: "PARQUE", x: 326, w: 180, h: 140,
        col: [60, 110, 55], signCol: [45, 85, 40],
        signTextCol: [255, 255, 240], awningCol: [50, 90, 45] },
      { label: "LIBRERÍA", x: 514, w: 140, h: 160,
        col: [100, 80, 65], signCol: [80, 60, 45],
        signTextCol: [255, 230, 200], awningCol: [70, 50, 35] },
      { label: "FARMACIA", x: 662, w: 138, h: 165,
        col: [40, 130, 70], signCol: [30, 110, 50],
        signTextCol: [255, 255, 255], awningCol: [25, 100, 45] },
    ],
    npcTypes: ["feminist", "vecina", "peronist"],
    waves: [
      [{ type:"patotero",  count:3 }],
      [{ type:"patotero",  count:2 }, { type:"naranjita", count:2 }],
      [{ type:"punguista", count:2 }, { type:"patotero",  count:2 }, { type:"naranjita", count:2 }],
    ],
    boss:      { type:"puntero",   name:"El Puntero" },
    pickups:   ["empanada", "choripan", "fernet"],
    bossIntro: "¡EL PUNTERO corta el paso en La Cañada!",
  },

  // ── Level 4 — Placeholder ────────────────────────────────────────────────
  {
    id: 4, name: "Centro", subtitle: "La Final",
    skyCol: [55, 80, 140], groundCol: [210, 205, 195],
    stores: [
      { label: "CATEDRAL", x: 0, w: 180, h: 210,
        col: [170, 160, 140], signCol: [140, 130, 110],
        signTextCol: [255, 255, 255], awningCol: [120, 110, 95] },
      { label: "CABILDO", x: 188, w: 200, h: 200,
        col: [180, 170, 150], signCol: [150, 140, 120],
        signTextCol: [255, 240, 200], awningCol: [130, 120, 100] },
      { label: "GALERÍA", x: 396, w: 160, h: 180,
        col: [120, 100, 80], signCol: [100, 80, 60],
        signTextCol: [255, 255, 240], awningCol: [85, 65, 45] },
      { label: "MUNICIPALIDAD", x: 564, w: 236, h: 215,
        col: [150, 145, 135], signCol: [60, 70, 100],
        signTextCol: [255, 255, 255], awningCol: [80, 85, 105] },
    ],
    npcTypes: ["belgrano_fan", "feminist", "peronist", "vecina"],
    waves: [
      [{ type:"patotero",  count:3 }, { type:"punguista", count:2 }],
      [{ type:"patotero",  count:2 }, { type:"naranjita",  count:2 }, { type:"punguista", count:2 }],
      [{ type:"patotero",  count:3 }, { type:"naranjita",  count:3 }, { type:"punguista", count:2 }],
    ],
    boss:      { type:"intendente",   name:"El Intendente" },
    pickups:   ["empanada", "mate", "fernet", "choripan"],
    bossIntro: "¡EL INTENDENTE sale del Palacio Municipal!",
  },
];

// ── Enemy stat table ──────────────────────────────────────────────────────────
const ENEMY_DEFS = {
  punguista: {
    label:"PUNGUISTA",   col:[160, 100, 80],  w:26, h:46,
    hp:45,  speed:62,  damage:8,  attackRange:38, attackCooldown:1.3,
    taunts:["¡Dame la billetera!", "¡Afanamos tranqui!", "¡Rajá de acá!"],
    // TODO: sprite:"enemy_punguista"
  },
  patotero: {
    label:"PATOTERO",   col:[140, 70, 50],  w:30, h:48,
    hp:70,  speed:45,  damage:14, attackRange:42, attackCooldown:1.6,
    taunts:["¡Te vamo' a fajar!", "¡Vení pa'ca!", "¡Sacá chapa!"],
    // TODO: sprite:"enemy_patotero"
  },
  naranjita: {
    label:"NARANJITA",  col:[255, 160, 50], w:24, h:44,
    hp:35,  speed:70,  damage:6,  attackRange:36, attackCooldown:1.0,
    taunts:["¡Te cuido el auto, loco!", "¡Son cien pe' nomá!", "¡Dame la moneda!"],
    // TODO: sprite:"enemy_naranjita"
  },

  // ── Boss variants ──────────────────────────────────────────────────────────
  comisario: {
    label:"EL COMISARIO", col:[40, 50, 80], w:38, h:62,
    hp:220, speed:35, damage:18, attackRange:50, attackCooldown:1.8, isBoss:true,
    taunts:["¡Acá mando yo!", "¡A la comisaría vas a ir!", "¡Respetá la autoridad!"],
    // TODO: sprite:"boss_comisario"
  },
  barra_brava: {
    label:"BARRA BRAVA", col:[50, 120, 180], w:36, h:58,
    hp:200, speed:50, damage:16, attackRange:48, attackCooldown:1.4, isBoss:true,
    taunts:["¡Belgrano no pierde!", "¡Aguante la B!", "¡Te rompo todo!"],
    // TODO: sprite:"boss_barra_brava"
  },
  puntero: {
    label:"EL PUNTERO", col:[120, 80, 40], w:34, h:54,
    hp:240, speed:40, damage:15, attackRange:52, attackCooldown:1.6, isBoss:true,
    taunts:["¡Yo te consigo laburo!", "¡Votame o rajá!", "¡La calle es mía!"],
    // TODO: sprite:"boss_puntero"
  },
  intendente: {
    label:"EL INTENDENTE", col:[30, 30, 60], w:42, h:64,
    hp:300, speed:30, damage:20, attackRange:56, attackCooldown:2.0, isBoss:true,
    taunts:["¡Córdoba es mía!", "¡No me van a voltear!", "¡Soy intocable!"],
    // TODO: sprite:"boss_intendente"
  },
};

// ── NPC archetypes ────────────────────────────────────────────────────────────
const NPC_DEFS = {
  belgrano_fan: {
    col:[50, 140, 200], accentCol:[255, 255, 255], w:22, h:44, speed:28,
    phrases:["¡Vamos Belgrano!", "¡Pirata hasta la muerte!", "¡Aguante la B!"],
    // TODO: sprite: "npc_belgrano_fan"
  },
  feminist: {
    col:[140, 50, 140], accentCol:[200, 80, 200], w:22, h:44, speed:25,
    phrases:["¡Ni una menos!", "¡Vivas nos queremos!", "¡El patriarcado se va a caer!"],
    // TODO: sprite: "npc_feminist"
  },
  peronist: {
    col:[100, 140, 200], accentCol:[255, 255, 255], w:24, h:44, speed:22,
    phrases:["¡Perón vuelve!", "¡Viva el General!", "¡La patria es el otro!"],
    // TODO: sprite: "npc_peronist"
  },
  trapito: {
    col:[200, 140, 60], accentCol:[255, 180, 80], w:22, h:44, speed:30,
    phrases:["¡Te lo cuido, jefe!", "¡Son doscientos!", "¡Dale, una monedita!"],
    // TODO: sprite: "npc_trapito"
  },
  vecina: {
    col:[180, 160, 140], accentCol:[220, 200, 180], w:22, h:44, speed:20,
    phrases:["¡Qué quilombo!", "¡Llamo a la policía!", "¡Estos pibes de ahora!"],
    // TODO: sprite: "npc_vecina"
  },
};

// ── Pickup table ──────────────────────────────────────────────────────────────
const PICKUP_DEFS = {
  empanada:   { col:[220, 170, 80],  label:"EMPANADA", heal:20, isWeapon:false, w:18, h:14 },
  mate:       { col:[80, 140, 60],   label:"MATE",     heal:15, isWeapon:false, w:16, h:20 },
  fernet:     { col:[50, 30, 20],    label:"FERNET",   heal:0,  isWeapon:true,  damage:22, uses:3, w:12, h:24 },
  choripan:   { col:[160, 100, 50],  label:"CHORIPÁN", heal:25, isWeapon:false, w:24, h:12 },
};
