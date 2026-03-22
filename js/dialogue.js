// =============================================================================
// Calles de Alberdi — js/dialogue.js
// Undertale-style dialogue system (Phases A-C)
//   A: typewriter text box
//   B: character portraits with boss jitter
//   C: per-character voice beeps (Web Audio oscillator)
// =============================================================================

// ── Dialogue state (module-level) ────────────────────────────────────────────
let _dlgActive    = false;
let _dlgLines     = [];      // array of { speaker, text, col, isBoss, portraitCol }
let _dlgLineIdx   = 0;
let _dlgCharIdx   = 0;       // how many chars revealed so far
let _dlgDone      = false;   // true when current line fully revealed
let _dlgOnComplete = null;   // callback when all lines finished
let _dlgFastHeld  = false;   // player holding advance key
let _dlgAdvancePressed = false;
let _dlgSlideIn   = 0;       // 0→1 animation for box entrance

// ── Voice state ──────────────────────────────────────────────────────────────
let _voiceCtx     = null;    // AudioContext (created on first use)
let _voiceLastIdx = -1;      // last char index that triggered a beep

// Voice presets — base frequency + variance for each character type
const VOICE_PRESETS = {
  boss_low:    { freq: 110, variance: 20,  wave: "sawtooth", dur: 0.06 },
  boss_mid:    { freq: 150, variance: 30,  wave: "square",   dur: 0.05 },
  npc_high:    { freq: 320, variance: 40,  wave: "square",   dur: 0.04 },
  npc_mid:     { freq: 240, variance: 30,  wave: "triangle", dur: 0.05 },
  default:     { freq: 200, variance: 25,  wave: "square",   dur: 0.045 },
};

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Start a dialogue sequence.
 * @param {Array<{speaker:string, text:string, col?:number[], isBoss?:boolean, portraitCol?:number[], voice?:string}>} lines
 * @param {Function} onComplete — called when all lines dismissed
 */
function showDialogue(lines, onComplete) {
  if (!lines || lines.length === 0) {
    if (onComplete) onComplete();
    return;
  }
  _dlgActive     = true;
  _dlgLines      = lines;
  _dlgLineIdx    = 0;
  _dlgCharIdx    = 0;
  _dlgDone       = false;
  _dlgOnComplete = onComplete || null;
  _dlgSlideIn    = 0;
  _voiceLastIdx  = -1;
}

/** True while dialogue is on screen — use to suppress gameplay input. */
function isDialogueActive() {
  return _dlgActive;
}

// ── Input wiring (call once per scene) ───────────────────────────────────────

function initDialogueInput() {
  const advanceKeys = ["enter", "z", "u"];
  advanceKeys.forEach(k => {
    onKeyPress(k, () => { if (_dlgActive) _dlgAdvancePressed = true; });
  });
  advanceKeys.forEach(k => {
    onKeyDown(k, () => { _dlgFastHeld = true; });
    onKeyRelease(k, () => { _dlgFastHeld = false; });
  });

  const canvas = document.querySelector("canvas");
  if (canvas) {
    canvas.addEventListener("pointerdown", () => {
      if (_dlgActive) _dlgAdvancePressed = true;
    });
  }
}

// ── Voice beep (Web Audio oscillator) ────────────────────────────────────────

function _playVoiceBeep(preset) {
  try {
    if (!_voiceCtx) _voiceCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (_voiceCtx.state === "suspended") _voiceCtx.resume();

    const v = VOICE_PRESETS[preset] || VOICE_PRESETS.default;
    const osc  = _voiceCtx.createOscillator();
    const gain = _voiceCtx.createGain();

    osc.type = v.wave;
    osc.frequency.value = v.freq + (Math.random() - 0.5) * v.variance * 2;
    gain.gain.value = 0.08;
    gain.gain.exponentialRampToValueAtTime(0.001, _voiceCtx.currentTime + v.dur);

    osc.connect(gain);
    gain.connect(_voiceCtx.destination);
    osc.start();
    osc.stop(_voiceCtx.currentTime + v.dur);
  } catch (e) {
    // Audio not available — silent fallback
  }
}

// ── Update (call in onUpdate) ────────────────────────────────────────────────

function updateDialogue() {
  if (!_dlgActive) return;

  // Slide-in animation
  if (_dlgSlideIn < 1) {
    _dlgSlideIn = Math.min(1, _dlgSlideIn + dt() * 6);
  }

  const line = _dlgLines[_dlgLineIdx];
  if (!line) return;

  if (!_dlgDone) {
    const speed = _dlgFastHeld
      ? DIALOGUE_CHARS_PER_SEC * DIALOGUE_FAST_MULTIPLIER
      : DIALOGUE_CHARS_PER_SEC;
    const prevIdx = Math.floor(_dlgCharIdx);
    _dlgCharIdx += speed * dt();

    if (_dlgCharIdx >= line.text.length) {
      _dlgCharIdx = line.text.length;
      _dlgDone = true;
    }

    // Voice beep — one per new visible character (skip spaces/punctuation)
    const curIdx = Math.floor(_dlgCharIdx);
    if (curIdx > _voiceLastIdx) {
      const ch = line.text[curIdx - 1];
      if (ch && ch !== " " && ch !== "." && ch !== "," && ch !== "!" && ch !== "¡" && ch !== "¿") {
        // Beep every 2nd character to avoid machine-gun sound
        if (curIdx % 2 === 0) {
          const voice = line.voice || (line.isBoss ? "boss_low" : "default");
          _playVoiceBeep(voice);
        }
      }
      _voiceLastIdx = curIdx;
    }
  }

  // Handle advance input
  if (_dlgAdvancePressed) {
    _dlgAdvancePressed = false;

    if (!_dlgDone) {
      _dlgCharIdx = line.text.length;
      _dlgDone = true;
    } else {
      _dlgLineIdx++;
      _voiceLastIdx = -1;
      if (_dlgLineIdx >= _dlgLines.length) {
        _dlgActive = false;
        if (_dlgOnComplete) _dlgOnComplete();
      } else {
        _dlgCharIdx = 0;
        _dlgDone = false;
      }
    }
  }
}

// ── Draw (call in onDraw, inside screen-space transform) ─────────────────────

function drawDialogue() {
  if (!_dlgActive) return;

  const line = _dlgLines[_dlgLineIdx];
  if (!line) return;

  const boxH = DIALOGUE_BOX_H;
  const slideOffset = (1 - _dlgSlideIn) * boxH; // slides up from bottom
  const boxY = VIEW_H - boxH + slideOffset;
  const pad  = DIALOGUE_BOX_MARGIN;
  const ps   = DIALOGUE_PORTRAIT_SIZE;

  const accentCol = line.col ? rgb(line.col[0], line.col[1], line.col[2]) : rgb(255, 215, 60);
  const pCol = line.portraitCol || line.col || [120, 120, 120];

  // ── Boss tint overlay (subtle color wash behind everything) ──────────────
  if (line.isBoss) {
    drawRect({
      pos:    vec2(0, 0),
      width:  VIEW_W,
      height: VIEW_H,
      color:  rgb(pCol[0], pCol[1], pCol[2]),
      opacity: 0.06,
    });
  }

  // ── Dark box background ──────────────────────────────────────────────────
  drawRect({
    pos:    vec2(0, boxY),
    width:  VIEW_W,
    height: boxH,
    color:  rgb(10, 10, 18),
    opacity: 0.90,
  });

  // Top accent border
  drawRect({
    pos:    vec2(0, boxY),
    width:  VIEW_W,
    height: 2,
    color:  accentCol,
    opacity: 0.9,
  });

  // ── Portrait (left side) ─────────────────────────────────────────────────
  const portX = pad + 2;
  const portY = boxY + (boxH - ps) / 2;

  // Portrait background
  drawRect({
    pos:    vec2(portX, portY),
    width:  ps,
    height: ps,
    color:  rgb(pCol[0], pCol[1], pCol[2]),
    opacity: 0.85,
  });

  // Boss jitter — 1-2px random offset per frame
  const jx = line.isBoss ? (Math.random() - 0.5) * 3 : 0;
  const jy = line.isBoss ? (Math.random() - 0.5) * 3 : 0;

  // Portrait inner face (simplified placeholder: lighter rect for "face")
  drawRect({
    pos:    vec2(portX + 8 + jx, portY + 6 + jy),
    width:  ps - 16,
    height: ps - 20,
    color:  rgb(
      Math.min(255, pCol[0] + 60),
      Math.min(255, pCol[1] + 60),
      Math.min(255, pCol[2] + 60)
    ),
    opacity: 0.7,
  });

  // Portrait label (first letter of speaker name, big)
  const initial = (line.speaker || "?")[0].toUpperCase();
  drawText({
    text:   initial,
    pos:    vec2(portX + ps / 2 + jx, portY + ps / 2 + jy - 2),
    size:   24,
    anchor: "center",
    color:  rgb(255, 255, 255),
    opacity: 0.9,
  });

  // Portrait border
  drawRect({
    pos:    vec2(portX, portY),
    width:  ps,
    height: ps,
    color:  accentCol,
    opacity: 0.6,
    fill:   false,
    outline: { width: 2, color: accentCol },
  });

  // ── Text area (right of portrait) ────────────────────────────────────────
  const textX = portX + ps + pad + 4;
  const textW = VIEW_W - textX - pad - 4;

  // Speaker name
  drawText({
    text:   line.speaker || "",
    pos:    vec2(textX, boxY + pad),
    size:   11,
    color:  accentCol,
  });

  // Typewriter text
  const revealed = line.text.substring(0, Math.floor(_dlgCharIdx));
  drawText({
    text:   revealed,
    pos:    vec2(textX, boxY + pad + 16),
    size:   10,
    width:  textW,
    color:  rgb(230, 225, 210),
  });

  // Pulsing ▼ indicator when line is complete
  if (_dlgDone) {
    const alpha = 0.4 + 0.6 * Math.abs(Math.sin(time() * 3));
    drawText({
      text:    "\u25bc",
      pos:     vec2(VIEW_W - pad - 16, boxY + boxH - pad - 10),
      size:    12,
      color:   rgb(255, 245, 120),
      opacity: alpha,
    });
  }
}
