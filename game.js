// =============================================================================
// Calles de Alberdi — game.js
// Kaplay initialisation, scenes, wave/boss system, combat logic.
//
// Depends on (loaded before this file):
//   js/constants.js  — all tuning data & level definitions
//   js/entities.js   — factory functions, AI helpers, HUD draw
// =============================================================================

// ── Viewport: match screen aspect so game fills the entire display ─────────
// Mobile portrait → narrow viewport (~185 units of the 800-wide world).
// Desktop / mobile landscape → full 800-wide world visible.
// We use pointer:coarse to distinguish touch devices from desktop — a desktop
// browser with a tall window should NOT get portrait mode.
const _isMobile   = window.matchMedia("(pointer: coarse)").matches;
const _isPortrait = window.innerHeight > window.innerWidth;
const VIEW_W = (_isMobile && _isPortrait)
  ? Math.round(SCREEN_H * (window.innerWidth / window.innerHeight))
  : SCREEN_W;
const VIEW_H = SCREEN_H;   // always 400

kaplay({
  width:      VIEW_W,
  height:     VIEW_H,
  letterbox:  true,        // maintain aspect ratio — no bars since we matched it
  background: [18, 18, 28],
  pixelDensity: _isMobile ? window.devicePixelRatio : 1,
});

// ── Orientation / resize → reload so VIEW_W recalculates ───────────────────
// Kaplay can't change its internal resolution after init, so we reload when
// the aspect ratio flips (portrait ↔ landscape).  Game state is lost but
// this only happens on deliberate device rotation.
{
  const _initPortrait = _isPortrait;
  function _checkOrientation() {
    const nowPortrait = window.innerHeight > window.innerWidth;
    if (nowPortrait !== _initPortrait) location.reload();
  }
  window.addEventListener("orientationchange", () => setTimeout(_checkOrientation, 200));
  window.addEventListener("resize", _checkOrientation);
}


// =============================================================================
// ASSET LOADING STUBS
// Uncomment each block as you drop files into assets/.
// =============================================================================

// ── Sprite loading stubs ──────────────────────────────────────────────────────
// No sprites yet — all entities use colored rectangles as placeholders.
// TODO: Add hero_gaucho, hero_cordobesa, enemy_*, boss_*, npc_* sprites

// ── Music manager ─────────────────────────────────────────────────────────────
const Music = (() => {
  const tracks = {
    level: new Audio("assets/music_level.mp3"),
    boss:  new Audio("assets/music_boss.mp3"),
  };
  for (const t of Object.values(tracks)) { t.loop = true; t.volume = 0; }

  let current = null;
  let timers  = [];
  const VOLUME = 0.5, STEP = 0.04, INTERVAL = 25; // ~300ms fade

  function clearTimers() { timers.forEach(clearInterval); timers = []; }

  function fadeTo(key) {
    const next = tracks[key];
    if (current === next) return;
    clearTimers();
    // Fade out current
    if (current) {
      const prev = current;
      timers.push(setInterval(() => {
        prev.volume = Math.max(0, prev.volume - STEP);
        if (prev.volume <= 0) { prev.pause(); prev.currentTime = 0; }
      }, INTERVAL));
    }
    // Fade in next
    current = next;
    next.currentTime = 0;
    next.play().catch(() => {});
    timers.push(setInterval(() => {
      next.volume = Math.min(VOLUME, next.volume + STEP);
      if (next.volume >= VOLUME) clearTimers();
    }, INTERVAL));
  }

  function stop() {
    clearTimers();
    for (const t of Object.values(tracks)) { t.pause(); t.currentTime = 0; t.volume = 0; }
    current = null;
  }

  return { play: fadeTo, stop };
})();


// =============================================================================
// SCENE — TITLE
// =============================================================================

scene("title", () => {
  setCamScale(1); setCamPos(VIEW_W / 2, VIEW_H / 2);  // reset from any game-scene camera

  // Initialize Supabase (async, non-blocking — logs status to console)
  initSupabase().then(sb => {
    if (sb) console.log("[Supabase] Connected");
  });

  const cx = VIEW_W / 2;   // horizontal centre of viewport

  // ── Level select state ──────────────────────────────────────────────────────
  let selectedLevel  = 0;
  let autoStartTimer = 7;

  // Background
  add([rect(VIEW_W, VIEW_H), pos(0, 0), color(10, 12, 22), fixed(), z(0)]);

  // Gradient bands (decorative — mimics a lit street from below)
  add([rect(VIEW_W, 80),  pos(0, VIEW_H - 80),  color(30, 20, 10),  fixed(), z(1)]);
  add([rect(VIEW_W, 40),  pos(0, VIEW_H - 40),  color(45, 30, 12),  fixed(), z(1)]);

  // Title
  add([text("CALLES DE ALBERDI", { size: 28, align: "center", width: VIEW_W - 40 }),
       pos(cx, 60), anchor("center"),
       color(255, 200, 50), fixed(), z(10)]);
  add([text("Barrio Cordobés", { size: 14, align: "center" }),
       pos(cx, 90), anchor("center"),
       color(160, 200, 220), fixed(), z(10)]);

  // ── Level list (drawn each frame) ─────────────────────────────────────────
  const listStartY = 148;
  const rowH       = 22;
  const levelObjs  = [];   // {cursor, label} text objects for each level

  LEVELS.forEach((lvl, i) => {
    const y = listStartY + i * rowH;

    const cursor = add([
      text("\u25b6", { size: 11 }),
      pos(cx - 90, y), anchor("center"),
      color(255, 215, 0), fixed(), z(10),
    ]);

    const label = add([
      text(`${i + 1}.  ${lvl.name}`, { size: 11, align: "left" }),
      pos(cx - 72, y), anchor("left"),
      color(220, 215, 200), fixed(), z(10),
    ]);

    // Invisible hit rect for touch/mouse tap
    const hitH = rowH - 2;
    const hitW = 200;
    const hitRect = add([
      rect(hitW, hitH),
      pos(cx - 100, y - hitH / 2), anchor("topleft"),
      area(),
      color(0, 0, 0), opacity(0.01), fixed(), z(9),
      { levelIdx: i },
    ]);
    hitRect.onClick(() => {
      selectedLevel  = i;
      autoStartTimer = 7;
    });

    levelObjs.push({ cursor, label });
  });

  // Controls prompt (flashing)
  const isMobile = window.matchMedia("(pointer: coarse)").matches;
  const promptMsg = isMobile
    ? "[ START ]  para jugar"
    : "[ ENTER ]  1 Jugador        [ TAB ]  2 Jugadores";
  const prompt = add([
    text(promptMsg, { size: 11, align: "center", width: VIEW_W - 20 }),
    pos(cx, listStartY + LEVELS.length * rowH + 16), anchor("center"),
    color(255, 245, 120), fixed(), z(10),
  ]);
  let flashT = 0;
  prompt.onUpdate(() => {
    flashT += dt();
    prompt.opacity = 0.5 + 0.5 * Math.sin(flashT * 3.5);
  });

  // Auto-start timer label (between prompt and leaderboard)
  const timerLabel = add([
    text("", { size: 9, align: "center" }),
    pos(cx, listStartY + LEVELS.length * rowH + 32), anchor("center"),
    color(160, 155, 130), fixed(), z(10),
  ]);

  // Controls legend (desktop only — mobile has gamepad)
  if (!isMobile) {
    const legendY = listStartY + LEVELS.length * rowH + 56;
    add([text("P1: WASD Move   Z Punch   X Kick   Q Special",
              { size: 8, align: "center" }),
         pos(cx, legendY), anchor("center"),
         color(130, 180, 130), fixed(), z(10)]);
    add([text("P2: IJKL Move   U Punch   O Kick   P Special",
              { size: 8, align: "center" }),
         pos(cx, legendY + 14), anchor("center"),
         color(130, 180, 220), fixed(), z(10)]);
  }

  // ── Leaderboard on title ──────────────────────────────────────────────────
  const lbY = isMobile
    ? listStartY + LEVELS.length * rowH + 52 + 14
    : listStartY + LEVELS.length * rowH + 78;
  const lbText = add([
    text("", { size: 9, align: "center", width: VIEW_W - 20 }),
    pos(cx, lbY), anchor("center"),
    color(140, 180, 140), fixed(), z(10),
  ]);
  fetchLeaderboard(5).then(entries => {
    if (entries.length === 0) return;
    const lines = entries.map((e, i) =>
      `${i + 1}. ${e.player} — ${e.score}`
    );
    lbText.text = "TOP SCORES\n" + lines.join("\n");
  });

  // Copyright / flavour
  add([text("\u00a9 Calles de Alberdi — Córdoba, Argentina",
            { size: 7, align: "center" }),
       pos(cx, VIEW_H - 18), anchor("center"),
       color(70, 70, 80), fixed(), z(10)]);

  // Rain on title screen
  initWeather("rain", 45);
  onUpdate(() => updateWeather());
  onDraw(() => drawWeather());

  // ── Update cursor visibility + timer each frame ────────────────────────────
  onUpdate(() => {
    // Refresh cursor and dimming each frame
    levelObjs.forEach(({ cursor, label }, i) => {
      const selected = i === selectedLevel;
      cursor.opacity = selected ? 1 : 0;
      // Mutate the existing Color object (Kaplay doesn't support direct reassignment)
      if (selected) { label.color.r = 255; label.color.g = 215; label.color.b = 0;   }
      else          { label.color.r = 140; label.color.g = 135; label.color.b = 120; }
    });

    // Auto-start countdown
    autoStartTimer -= dt();
    const secs = Math.max(0, Math.ceil(autoStartTimer));
    timerLabel.text = secs > 0 ? `Starting in ${secs}...` : "";
    if (autoStartTimer <= 0) {
      go("game", { numPlayers: 1, levelIdx: 0 });
    }
  });

  // ── Input ──────────────────────────────────────────────────────────────────
  const resetTimer = () => { autoStartTimer = 7; };

  const navUp   = () => { selectedLevel = Math.max(0, selectedLevel - 1);              resetTimer(); };
  const navDown = () => { selectedLevel = Math.min(LEVELS.length - 1, selectedLevel + 1); resetTimer(); };
  onKeyPress("arrowup",   navUp);
  onKeyPress("w",         navUp);
  onKeyPress("arrowdown", navDown);
  onKeyPress("s",         navDown);
  onKeyPress("enter", () => go("game", { numPlayers: 1, levelIdx: selectedLevel }));
  onKeyPress("tab",   () => go("game", { numPlayers: 2, levelIdx: selectedLevel }));
});


// =============================================================================
// SCENE — MAIN GAME
// =============================================================================

scene("game", ({ numPlayers = 1, levelIdx = 0, score: carriedScore = 0 }) => {

  const lvl = LEVELS[levelIdx];

  // ── Scene state ─────────────────────────────────────────────────────────────
  let players     = [];   // player game objects
  let enemies     = [];   // active enemy game objects
  let npcs        = [];   // background NPC game objects
  let pickups     = [];   // pickup game objects
  let waveIdx     = -1;   // current wave (incremented by advanceWave)
  let bossObjs    = [];   // boss game object(s) for current encounter
  let phase       = "wave"; // "wave" | "bossIntro" | "boss" | "levelClear"
  let pendingSpawns = 0;   // enemies scheduled but not yet spawned

  // ── Score & combo tracking ────────────────────────────────────────────────
  let score       = carriedScore;
  let comboCount  = 0;    // consecutive hits within COMBO_WINDOW
  let comboTimer  = 0;    // seconds remaining in current combo window

  // ── Section locking state ──────────────────────────────────────────────────
  const levelW        = lvl.levelWidth || SCREEN_W;
  const sections      = lvl.sections || [{ startX: 0, endX: levelW }];
  let currentSection  = 0;
  let sectionWallX    = sections[0].endX - SECTION_WALL_MARGIN;
  let sectionOpen     = false;
  let goArrowTimer    = 0;

  // Expose level width for entities.js (speech bubbles, NPC clamping)
  window._currentLevelWidth = levelW;

  // ── Dialogue system input ──────────────────────────────────────────────────
  initDialogueInput();

  // ── Build the scene ─────────────────────────────────────────────────────────
  Music.play("level");
  drawLevelBackground(lvl);
  initWeather(lvl.weather || "rain", 52);

  // Background NPCs (spread across the full level width)
  const npcCount = 5 + lvl.npcTypes.length * 2;
  for (let i = 0; i < npcCount; i++) {
    const type = choose(lvl.npcTypes);
    npcs.push(spawnNPC(type, rand(50, levelW - 50), rand(GROUND_TOP + 28, GROUND_BOTTOM - 8)));
  }

  // Initial pickups scattered across the level
  for (let i = 0; i < 3; i++) {
    const type = choose(lvl.pickups);
    pickups.push(spawnPickup(type, rand(80, levelW - 80), rand(GROUND_TOP + 40, GROUND_BOTTOM - 12)));
  }

  // Spawn player(s)
  for (let i = 0; i < numPlayers; i++) {
    const p = spawnPlayer(i);
    players.push(p);
    setupPlayerAttacks(p);   // registers onKeyPress handlers (defined below)
  }

  // Level intro dialogue, then kick off wave 1
  if (lvl.introDialogue && lvl.introDialogue.length > 0) {
    showDialogue(lvl.introDialogue, () => advanceWave());
  } else {
    advanceWave();
  }

  // ── Wave / boss system ──────────────────────────────────────────────────────

  function advanceWave() {
    waveIdx++;

    if (waveIdx < lvl.waves.length) {
      phase = "wave";
      showBanner(`WAVE  ${waveIdx + 1}`, 1.5);
      spawnWaveEnemies(lvl.waves[waveIdx]);
    } else {
      beginBossSequence();
    }
  }

  function spawnWaveEnemies(waveDef) {
    const section = sections[currentSection];
    let delay = 0.5;
    for (const group of waveDef) {
      for (let i = 0; i < group.count; i++) {
        pendingSpawns++;
        wait(delay, () => {
          pendingSpawns--;
          if (phase !== "wave") return;
          const y = rand(GROUND_TOP + 30, GROUND_BOTTOM - 10);
          const fromRight = Math.random() > 0.3;
          const x = fromRight
            ? section.endX + rand(20, 60)
            : section.startX - rand(20, 60);
          enemies.push(spawnEnemy(group.type, x, y));
        });
        delay += 0.65;
      }
    }
  }

  function beginBossSequence() {
    phase = "bossIntro";
    Music.play("boss");

    // Use dialogue if available, otherwise fall back to banner
    const dialogueLines = lvl.bossDialogue;
    const spawnBosses = () => {
      phase    = "boss";
      bossObjs = [];

      // Support both legacy { type, count } and new { types: [{type,name}, ...] }
      const bossList = lvl.boss.types
        ? lvl.boss.types
        : Array.from({ length: lvl.boss.count || 1 }, () => ({ type: lvl.boss.type }));

      bossList.forEach((b, i) => {
        const bossY = lerp(GROUND_TOP + 30, GROUND_BOTTOM - 10, (i + 1) / (bossList.length + 1));
        const bossSection = sections[currentSection];
        const boss  = spawnEnemy(b.type, bossSection.endX - 60 - i * 55, bossY);
        enemies.push(boss);
        bossObjs.push(boss);
      });
    };

    if (dialogueLines && dialogueLines.length > 0) {
      showDialogue(dialogueLines, spawnBosses);
    } else {
      showBanner(lvl.bossIntro, 2.5);
      wait(3, spawnBosses);
    }
  }

  function checkWaveCleared() {
    if (enemies.length > 0 || pendingSpawns > 0) return;

    if (phase === "wave") {
      // Section cleared — open the wall so player can walk forward
      sectionOpen = true;
      goArrowTimer = 0;
      showBanner("WAVE  CLEAR!", 1.2);
      // If this is the last section before boss, auto-advance after delay
      if (waveIdx >= lvl.waves.length - 1) {
        wait(0.8, () => beginBossSequence());
      }
      // Otherwise, player must walk into next section to trigger advanceWave

    } else if (phase === "boss") {
      phase = "levelClear";
      score += SCORE_LEVEL_CLEAR;
      showBanner(`${lvl.name.toUpperCase()}  CLEAR!  +${SCORE_LEVEL_CLEAR}`, 3);

      wait(4, () => {
        const next = levelIdx + 1;
        if (next < LEVELS.length) {
          Music.stop();
          go("game", { numPlayers, levelIdx: next, score });
        } else {
          Music.stop();
          const playerName = numPlayers === 2
            ? PLAYER_CONFIGS[0].name + " & " + PLAYER_CONFIGS[1].name
            : PLAYER_CONFIGS[0].name;
          go("victory", { numPlayers, score, playerName });
        }
      });
    }
  }


  // ── Player attack input ─────────────────────────────────────────────────────
  // Registered per player so P1 and P2 keys are independent.

  function setupPlayerAttacks(p) {
    const cfg = p.cfg;

    onKeyPress(cfg.keys.punch, () => {
      if (canAttack(p)) doAttack(p, "punch");
    });
    onKeyPress(cfg.keys.kick, () => {
      if (canAttack(p)) doAttack(p, "kick");
    });
    onKeyPress(cfg.keys.special, () => {
      if (canSpecial(p)) doSpecial(p);
    });
  }

  function canAttack(p)  { return p.attackTimer <= 0 && p.hurtTimer <= 0 && p.hp > 0; }
  function canSpecial(p) {
    return p.specialCooldown <= 0 && p.hurtTimer <= 0 && p.hp > SPECIAL_HP_COST;
  }

  function doAttack(p, type) {
    const atk    = ATTACKS[type];
    const damage = p.heldWeapon ? p.heldWeapon.damage : atk.damage;
    const range  = p.heldWeapon ? atk.range * 1.4     : atk.range;

    p.state       = type;
    p.attackTimer = ATTACK_DURATION;

    // Hit flash in front of player
    // TODO: Replace with attack-arc sprite / particle effect
    const fxX = p.pos.x + p.facing * (14 + range * 0.5);
    add([rect(22, 22), pos(fxX, p.pos.y - 30),
         anchor("center"), color(...atk.fxColor), opacity(1),
         z(p.pos.y + 10), lifespan(0.12)]);

    // TODO: play("sfx_punch") / play("sfx_kick")

    // Hit detection — snapshot the array so mid-loop kills are safe
    for (const e of [...enemies]) {
      if (e.state === "dead") continue;
      const horizDist = (e.pos.x - p.pos.x) * p.facing;  // positive = in front
      const vertDist  = Math.abs(e.pos.y - p.pos.y);
      if (horizDist > 0 && horizDist <= range && vertDist <= atk.width) {
        hitEnemy(p, e, damage);
      }
    }

    // Drain held weapon
    if (p.heldWeapon) {
      p.heldWeapon.uses--;
      if (p.heldWeapon.uses <= 0) {
        showSpeechBubble("¡Se rompió!", p);
        p.heldWeapon = null;
      }
    }
  }

  function doSpecial(p) {
    // Area-of-effect spin attack — costs HP, clears a radius
    p.hp              -= SPECIAL_HP_COST;
    p.specialCooldown  = SPECIAL_COOLDOWN;
    p.attackTimer      = 0.5;
    p.state            = "special";

    // Visual burst
    // TODO: Replace with spinning/radial sprite effect
    add([rect(SPECIAL_RADIUS * 2, SPECIAL_RADIUS * 2),
         pos(p.pos.x, p.pos.y), anchor("center"),
         color(255, 255, 140), opacity(0.35),
         z(p.pos.y + 20), lifespan(0.28)]);

    for (const e of [...enemies]) {
      if (e.state === "dead") continue;
      if (p.pos.dist(e.pos) <= SPECIAL_RADIUS) hitEnemy(p, e, SPECIAL_DAMAGE);
    }
  }


  // ── Damage helpers ──────────────────────────────────────────────────────────

  function hitEnemy(attacker, e, damage) {
    if (e.state === "dead") return;

    e.hp        = Math.max(0, e.hp - damage);
    e.hurtTimer = 0.3;
    e.state     = "hurt";

    // Knockback away from attacker
    if (attacker) {
      e.pos.x += attacker.facing * KNOCKBACK;
      const kb = getSectionBounds();
      e.pos.x  = clamp(e.pos.x, kb.left, kb.right);
    }

    // Combo tracking
    comboCount++;
    comboTimer = COMBO_WINDOW;

    spawnFloatText(`-${damage}`, e.pos.x, e.pos.y - 50, [255, 220, 50]);

    if (e.hp <= 0) killEnemy(e);
  }

  function killEnemy(e) {
    if (e.state === "dead") return;  // guard against double-kill in same frame
    e.state = "dead";

    // Score — apply combo multiplier when combo >= 3
    const basePts = e.def.isBoss ? SCORE_BOSS_KILL : SCORE_ENEMY_KILL;
    const multiplier = comboCount >= 3 ? SCORE_COMBO_MULTIPLIER : 1;
    const pts = Math.round(basePts * multiplier);
    score += pts;
    spawnFloatText(`+${pts}`, e.pos.x, e.pos.y - 68, [255, 255, 70]);

    // Chance to drop a health pickup
    if (!e.def.isBoss && Math.random() < 0.28) {
      const drop = choose(["empanada", "mate", "choripan"]);
      pickups.push(spawnPickup(drop, e.pos.x, e.pos.y));
    }

    if (e.def.sprite) {
      e.play("death");
      wait(0.5, () => {
        destroy(e);
        enemies = enemies.filter(x => x !== e);
        checkWaveCleared();
      });
    } else {
      e.color = rgb(255, 255, 255);   // death flash
      wait(0.14, () => {
        destroy(e);
        enemies = enemies.filter(x => x !== e);
        checkWaveCleared();
      });
    }
  }

  function hitPlayer(p, damage) {
    if (debugGodMode || p.hurtTimer > 0 || p.hp <= 0) return;

    p.hp        = Math.max(0, p.hp - damage);
    p.state     = "hurt";
    p.hurtTimer = HURT_IFRAMES;

    spawnFloatText(`-${damage}`, p.pos.x, p.pos.y - 58, [255, 80, 80]);

    // TODO: play("sfx_hurt")
  }


  // ── Debug cheats (remove before release) ────────────────────────────────────
  // }  = skip wave (kill all enemies)
  // -  = skip level
  // B  = skip straight to boss
  // G  = toggle god mode (invincible)
  // T  = toggle auto-walk right
  // Mobile: hold BACK + tap PUNCH = skip wave, hold BACK + tap KICK = skip level
  let debugGodMode  = false;
  let debugAutoWalk = false;

  function debugSkipWave() { pendingSpawns = 0; [...enemies].forEach(e => killEnemy(e)); }
  function debugSkipLevel() {
    const next = levelIdx + 1;
    if (next < LEVELS.length) go("game", { numPlayers, levelIdx: next });
  }
  function debugSkipToBoss() {
    // Set state BEFORE killing enemies (killEnemy triggers checkWaveCleared)
    pendingSpawns = 0;
    waveIdx = lvl.waves.length;  // past all waves so checkWaveCleared won't re-trigger
    currentSection = sections.length - 1;
    sectionWallX = sections[currentSection].endX - SECTION_WALL_MARGIN;
    sectionOpen = false;
    [...enemies].forEach(e => { e.hp = 0; destroy(e); });
    enemies.length = 0;
    // Move player to final section, snap camera, start boss
    players.forEach(p => { if (p.hp > 0) p.pos.x = sections[currentSection].startX + 100; });
    _camSnap = true;
    beginBossSequence();
  }

  onKeyPress("}", debugSkipWave);
  onKeyPress("-", debugSkipLevel);
  onKeyPress("b", () => { if (!isDialogueActive()) debugSkipToBoss(); });
  onKeyPress("g", () => { debugGodMode = !debugGodMode; console.log("[DEBUG] God mode", debugGodMode ? "ON" : "OFF"); });
  onKeyPress("t", () => { debugAutoWalk = !debugAutoWalk; console.log("[DEBUG] Auto-walk", debugAutoWalk ? "ON" : "OFF"); });
  onKeyPress("z", () => { if (isKeyDown("tab")) debugSkipWave(); });   // BACK+PUNCH
  onKeyPress("x", () => { if (isKeyDown("tab")) debugSkipLevel(); });  // BACK+KICK

  // Auto-walk: move player right automatically
  onUpdate(() => {
    if (!debugAutoWalk) return;
    const bounds = getSectionBounds();
    players.forEach(p => {
      if (p.hp <= 0) return;
      p.pos.x = Math.min(p.pos.x + PLAYER_SPEED * dt(), bounds.right);
      p.facing = 1;
    });
  });

  // ── Main update loops ───────────────────────────────────────────────────────

  // Combo timer decay
  onUpdate(() => {
    if (comboTimer > 0) {
      comboTimer -= dt();
      if (comboTimer <= 0) { comboCount = 0; comboTimer = 0; }
    }
  });

  // ── Section bounds computation (shared by all entity updates) ──────────
  function getSectionBounds() {
    const sec = sections[currentSection];
    const leftBound  = sec.startX + 20;
    // When section open, extend right bound into next section (if any)
    let rightBound;
    if (sectionOpen && currentSection < sections.length - 1) {
      rightBound = sections[currentSection + 1].endX - SECTION_WALL_MARGIN;
    } else {
      rightBound = sectionWallX;
    }
    return { left: leftBound, right: rightBound };
  }

  // ── Section transition detection ────────────────────────────────────────
  onUpdate(() => {
    if (!sectionOpen) return;
    if (currentSection >= sections.length - 1) return;  // already in last section
    const living = players.filter(p => p.hp > 0);
    const nextSectionStart = sections[currentSection + 1].startX;
    const anyInNextSection = living.some(p => p.pos.x > nextSectionStart + 20);
    if (anyInNextSection) {
      currentSection++;
      sectionOpen = false;
      sectionWallX = sections[currentSection].endX - SECTION_WALL_MARGIN;
      advanceWave();
    }
  });

  // ── Dialogue update ──────────────────────────────────────────────────────
  onUpdate(() => updateDialogue());

  // Player movement — allowed during dialogue (player can walk while reading)
  onUpdate(() => {
    const bounds = getSectionBounds();
    for (const p of players) {
      if (p.hp <= 0) continue;
      updatePlayerMovement(p, bounds);
    }
  });

  // Enemy AI — target the closest living player
  onUpdate(() => {
    if (isDialogueActive()) return;
    const livingPlayers = players.filter(p => p.hp > 0);
    const bounds = getSectionBounds();

    for (const e of [...enemies]) {
      if (e.state === "dead") continue;

      // Closest living player as target
      const target = livingPlayers.slice().sort(
        (a, b) => e.pos.dist(a.pos) - e.pos.dist(b.pos)
      )[0];
      if (!target) continue;

      updateEnemy(e, target, (dmg) => hitPlayer(target, dmg), bounds);
    }
  });

  // NPC AI (NPCs roam the full level, not locked to current section)
  onUpdate(() => {
    const npcBounds = { left: 20, right: levelW - 20 };
    for (const n of npcs) updateNPC(n, players, enemies, npcBounds);
  });

  // Pickup collection — walk over to grab
  onUpdate(() => {
    for (const p of players) {
      if (p.hp <= 0) continue;

      for (let i = pickups.length - 1; i >= 0; i--) {
        const pk = pickups[i];
        if (p.pos.dist(pk.pos) < 30) {
          collectPickup(p, pk);
          destroy(pk);
          pickups.splice(i, 1);
        }
      }
    }
  });

  function collectPickup(p, pk) {
    const def = pk.def;
    if (def.heal > 0) {
      p.hp = Math.min(p.maxHp, p.hp + def.heal);
      spawnFloatText(`+${def.heal} HP`, pk.pos.x, pk.pos.y - 40, [80, 255, 80]);
      // TODO: play("sfx_pickup")
    } else if (def.isWeapon) {
      p.heldWeapon = { type: pk.pickupType, uses: def.uses, damage: def.damage };
      showSpeechBubble(`${def.label} picked up!`, p, 1.5);
    }
  }

  // Pickup bobbing (visual)
  onUpdate(() => {
    for (const pk of pickups) {
      pk.bobTimer = (pk.bobTimer || 0) + dt() * 2.5;
      pk.pos.y   += Math.sin(pk.bobTimer) * 0.28;
    }
  });

  // Weather + HUD
  onUpdate(() => updateWeather());
  onDraw(() => {
    drawWeather();
    const cam = camPos();
    pushTransform();
    pushTranslate(-cam.x + VIEW_W / 2, -cam.y + VIEW_H / 2);
    drawHUD(players, waveIdx, lvl, enemies, bossObjs, phase, score, comboCount);
    drawDialogue();
    popTransform();
  });

  // Game-over check — all players dead
  onUpdate(() => {
    if (players.length > 0 && players.every(p => p.hp <= 0)) {
      const playerName = numPlayers === 2
        ? PLAYER_CONFIGS[0].name + " & " + PLAYER_CONFIGS[1].name
        : PLAYER_CONFIGS[0].name;
      wait(0.6, () => { Music.stop(); go("gameover", { numPlayers, levelIdx, score, playerName }); });
    }
  });

  // ── Camera: dead zone + vertical depth tracking ─────────────────────────
  let _camX = VIEW_W / 2;
  let _camY = VIEW_H / 2;
  let _camSnap = false;  // set true to snap camera instantly (debug teleport)

  onUpdate(() => {
    const living = players.filter(p => p.hp > 0);
    if (!living.length) return;

    const avgX = living.reduce((s, p) => s + p.pos.x, 0) / living.length;
    const avgY = living.reduce((s, p) => s + p.pos.y, 0) / living.length;

    // Dead zone — camera only moves when player exits the central zone
    const dzW = VIEW_W * CAM_DEAD_ZONE_X;
    let targetX = _camX;
    if (avgX < _camX - dzW / 2) targetX = avgX + dzW / 2;
    if (avgX > _camX + dzW / 2) targetX = avgX - dzW / 2;

    // Clamp so camera never shows outside the level
    const halfVW = VIEW_W / 2;
    targetX = clamp(targetX, halfVW, levelW - halfVW);

    // Vertical depth — subtle shift based on Y within the ground band
    const groundMid = (GROUND_TOP + GROUND_BOTTOM) / 2;
    const yOff = ((avgY - groundMid) / (GROUND_BOTTOM - GROUND_TOP)) * CAM_VERT_RANGE * 2;
    let targetY = VIEW_H / 2 + yOff;

    // Smooth lerp (or snap if flagged)
    if (_camSnap) { _camX = targetX; _camY = targetY; _camSnap = false; }
    else { _camX = lerp(_camX, targetX, CAM_LERP_X); _camY = lerp(_camY, targetY, CAM_LERP_Y); }
    setCamScale(1);
    setCamPos(_camX, _camY);
  });

  // ── "GO >>>" arcade indicator when section is cleared ──────────────────
  //  Cadillacs-and-Dinosaurs style: big bouncing arrow on right side of
  //  screen with "GO!" text, pulsing size, bold yellow/orange with outline.
  onUpdate(() => {
    if (sectionOpen) goArrowTimer += dt();
  });
  onDraw(() => {
    if (!sectionOpen || phase !== "wave") return;
    if (currentSection >= sections.length - 1) return;

    const cam2 = camPos();
    pushTransform();
    pushTranslate(-cam2.x + VIEW_W / 2, -cam2.y + VIEW_H / 2);

    const t = goArrowTimer;
    const vw = typeof VIEW_W !== "undefined" ? VIEW_W : SCREEN_W;
    const vh = typeof VIEW_H !== "undefined" ? VIEW_H : SCREEN_H;

    // Bounce: sine-wave vertical bob (8px amplitude)
    const bounceY = Math.sin(t * 3.2) * 8;
    // Pulse: scale oscillates between 0.85 and 1.15
    const pulse = 1.0 + 0.15 * Math.sin(t * 4.5);
    // Alpha: gentle throb so it never fully disappears
    const alpha = 0.7 + 0.3 * Math.sin(t * GO_ARROW_BLINK_HZ * Math.PI * 2);

    // Position: right side of screen, vertically centred
    const cx = vw - 55;
    const cy = vh / 2 - 10 + bounceY;

    // Arrow dimensions (before pulse)
    const arrowW  = 44 * pulse;   // width of the triangle part
    const arrowH  = 52 * pulse;   // full height
    const shaftW  = 26 * pulse;   // rectangle shaft width
    const shaftH  = 24 * pulse;   // rectangle shaft height
    const halfH   = arrowH / 2;

    // ── Outline (dark border) — draw everything shifted by 2px in each dir ──
    const outlineOff = 2;
    const outlineCol = rgb(80, 40, 0);
    for (const ox of [-outlineOff, 0, outlineOff]) {
      for (const oy of [-outlineOff, 0, outlineOff]) {
        if (ox === 0 && oy === 0) continue;
        // Shaft outline
        drawRect({
          pos: vec2(cx - shaftW + ox, cy - shaftH / 2 + oy),
          width: shaftW, height: shaftH,
          color: outlineCol, opacity: alpha,
        });
        // Arrowhead outline (stacked rects to approximate triangle)
        const baseX = cx + ox;
        for (let i = 0; i < 6; i++) {
          const frac = i / 5;
          const rx = baseX + arrowW * frac;
          const rh = arrowH * (1 - frac);
          drawRect({
            pos: vec2(rx, cy - rh / 2 + oy),
            width: arrowW / 5 + 2, height: rh,
            color: outlineCol, opacity: alpha,
          });
        }
      }
    }

    // ── Main arrow fill ─────────────────────────────────────────────────────
    const fillCol = rgb(255, 210, 30);   // bright arcade yellow

    // Shaft (rectangle part)
    drawRect({
      pos: vec2(cx - shaftW, cy - shaftH / 2),
      width: shaftW, height: shaftH,
      color: fillCol, opacity: alpha,
    });

    // Arrowhead — approximated with stacked vertical rects (tapers to point)
    for (let i = 0; i < 6; i++) {
      const frac = i / 5;
      const rx = cx + arrowW * frac;
      const rh = arrowH * (1 - frac);
      // Gradient from yellow to orange toward tip
      const r = Math.round(255);
      const g = Math.round(210 - 60 * frac);
      const b = Math.round(30 - 10 * frac);
      drawRect({
        pos: vec2(rx, cy - rh / 2),
        width: arrowW / 5 + 2, height: rh,
        color: rgb(r, g, b), opacity: alpha,
      });
    }

    // ── Inner highlight stripe (gives depth) ────────────────────────────────
    drawRect({
      pos: vec2(cx - shaftW + 3, cy - shaftH / 2 + 3),
      width: shaftW - 4, height: 5,
      color: rgb(255, 245, 160), opacity: alpha * 0.6,
    });

    // ── "GO!" text above the arrow ──────────────────────────────────────────
    const textSize = Math.round(22 * pulse);
    // Text outline
    for (const ox of [-1, 0, 1]) {
      for (const oy of [-1, 0, 1]) {
        if (ox === 0 && oy === 0) continue;
        drawText({
          text: "GO!",
          pos: vec2(cx - 4 + ox, cy - halfH - 10 + oy),
          size: textSize,
          color: rgb(80, 40, 0),
          opacity: alpha,
          anchor: "center",
        });
      }
    }
    // Text fill
    drawText({
      text: "GO!",
      pos: vec2(cx - 4, cy - halfH - 10),
      size: textSize,
      color: rgb(255, 230, 60),
      opacity: alpha,
      anchor: "center",
    });

    popTransform();
  });


  // ── Utility ─────────────────────────────────────────────────────────────────

  function showBanner(msg, duration) {
    add([text(msg, { size: 28, align: "center", width: VIEW_W - 20 }),
         pos(VIEW_W / 2, VIEW_H / 2 - 25 - VIEW_H * 0.3), anchor("center"),
         color(255, 215, 60), opacity(1), fixed(), z(500),
         lifespan(duration, { fade: 0.4 })]);
  }

}); // end scene("game")


// =============================================================================
// SCENE — GAME OVER
// =============================================================================

scene("gameover", ({ numPlayers = 1, levelIdx = 0, score = 0, playerName = "GAUCHO" }) => {
  setCamScale(1); setCamPos(VIEW_W / 2, VIEW_H / 2);

  const lvl = LEVELS[levelIdx];
  const cx = VIEW_W / 2;
  const isMobile = window.matchMedia("(pointer: coarse)").matches;

  // Submit score to leaderboard
  submitScore(playerName, score, levelIdx + 1);

  // Dark overlay
  add([rect(VIEW_W, VIEW_H), pos(0, 0), color(0, 0, 0), opacity(0.82), fixed(), z(998)]);

  const msg = isMobile
    ? `FIN DEL JUEGO\n\nCaíste en  ${lvl.name}\nPuntaje: ${score}\n\nTocá START para reintentar`
    : `FIN DEL JUEGO\n\nCaíste en  ${lvl.name}\nPuntaje: ${score}\n\n[ ENTER ]  Reintentar\n[ TAB ]  Menú Principal`;
  add([text(msg, { size: 21, align: "center", width: VIEW_W - 20 }),
       pos(cx, VIEW_H / 2), anchor("center"),
       color(255, 70, 70), fixed(), z(999)]);

  initWeather("rain", 30);
  onUpdate(() => updateWeather());
  onDraw(() => drawWeather());

  onKeyPress("enter", () => go("game", { numPlayers, levelIdx }));
  onKeyPress("tab",   () => go("title"));
});


// =============================================================================
// SCENE — VICTORY
// =============================================================================

scene("victory", ({ numPlayers = 1, score = 0, playerName = "GAUCHO" }) => {
  setCamScale(1); setCamPos(VIEW_W / 2, VIEW_H / 2);

  const cx = VIEW_W / 2;
  const isMobile = window.matchMedia("(pointer: coarse)").matches;

  // Submit score to leaderboard
  submitScore(playerName, score, LEVELS.length);

  add([rect(VIEW_W, VIEW_H), pos(0, 0), color(10, 20, 10), fixed(), z(0)]);

  add([text("¡ALBERDI\nLIBERADO!", { size: 38, align: "center" }),
       pos(cx, 70), anchor("center"),
       color(100, 255, 100), fixed(), z(10)]);

  add([text(`Puntaje Final: ${score}`, { size: 18, align: "center" }),
       pos(cx, 130), anchor("center"),
       color(255, 215, 60), fixed(), z(10)]);

  add([text("Peleaste por cada\ncalle del barrio.\n¡Alberdi te lo agradece, loco!",
            { size: 14, align: "center", width: VIEW_W - 20 }),
       pos(cx, 190), anchor("center"),
       color(180, 240, 180), fixed(), z(10)]);

  // Fetch and display leaderboard
  const lbLabel = add([
    text("Cargando ranking...", { size: 10, align: "center", width: VIEW_W - 20 }),
    pos(cx, 240), anchor("center"),
    color(160, 200, 160), fixed(), z(10),
  ]);
  fetchLeaderboard(5).then(entries => {
    if (entries.length === 0) {
      lbLabel.text = "";
      return;
    }
    const lines = entries.map((e, i) =>
      `${i + 1}. ${e.player} — ${e.score} (Nivel ${e.level})`
    );
    lbLabel.text = "RANKING\n" + lines.join("\n");
  });

  const replayMsg = isMobile
    ? "Tocá START para jugar de nuevo"
    : "[ ENTER ]  Jugar de Nuevo\n[ TAB ]  Menú Principal";
  add([text(replayMsg, { size: 12, align: "center", width: VIEW_W - 20 }),
       pos(cx, 320), anchor("center"),
       color(255, 245, 120), fixed(), z(10)]);

  // Celebratory heavy rain
  initWeather("rain", 90);
  onUpdate(() => updateWeather());
  onDraw(() => drawWeather());

  onKeyPress("enter", () => go("game", { numPlayers, levelIdx: 0 }));
  onKeyPress("tab",   () => go("title"));
});


// =============================================================================
// LAUNCH
// =============================================================================

go("title");
