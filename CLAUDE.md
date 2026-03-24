# Calles de Alberdi

2D side-scrolling beat 'em up set in Barrio Alberdi, Córdoba, Argentina. Web-based (HTML5/JS), mobile-responsive, using Kaplay.js engine.

## Project Structure

```
index.html                  — Entry point, canvas, virtual gamepad (touch controls)
game.js                     — Scenes (title/game/gameover/victory), combat, wave/boss system, camera
js/constants.js             — All tuning values, level defs, enemy/NPC/pickup stats, dialogue content
js/entities.js              — Factory functions (player, enemy, NPC, pickup), AI, HUD, level backgrounds
js/dialogue.js              — Undertale-style dialogue system (typewriter, portraits, voice beeps)
js/multiplayer.js           — Supabase client, leaderboard, room functions, FCM token management
api/config.js               — Vercel serverless function (serves Supabase + Firebase public config)
api/qr.js                   — Vercel serverless function (generates QR code PNGs)
api/notify.js               — Vercel serverless function (sends FCM push notifications)
firebase-messaging-sw.js    — Service worker for background push notifications
manifest.webmanifest        — PWA manifest (required for Android push + home screen install)
vercel.json                 — Vercel config (static site, no build step, cache headers)
env-config.js               — Local dev Supabase config (gitignored)
assets/                     — Sprites, sounds (mostly placeholder), PWA icons
tests/                      — Playwright E2E tests
```

**Load order:** index.html → Kaplay CDN → constants.js → entities.js → dialogue.js → multiplayer.js → game.js

## Running Locally

```bash
npx serve -l 3000 .
```
Open http://localhost:3000. No build step needed.

## Deploying to Vercel

The site is live at **https://calles-de-alberdi.vercel.app**.

```bash
npx vercel --prod          # Deploy current directory to production
```

- `api/config.js` serves Supabase + Firebase public config (CommonJS `module.exports`)
- `api/qr.js` generates QR code PNGs server-side (uses `qrcode` npm package)
- `api/notify.js` sends FCM push notifications to room hosts (uses `firebase-admin`)
- Env vars set in Vercel dashboard (see "Push Notifications" section below)
- Client fetches `/api/config` in production, uses `env-config.js` globals in local dev
- Production branch is `main` (GitHub auto-deploy), `claude/**` branches also auto-deploy

## Architecture

### Scene Flow
```
title → game → gameover → retry/title
                └→ victory → replay/title
```

### Camera System
- Belt-scroll camera with dead zones, smooth lerp, vertical depth tracking
- Section locking: invisible walls drop when wave cleared, GO arrow indicator
- Screen-space HUD/dialogue via `pushTranslate(cam.x - VIEW_W/2, cam.y - VIEW_H/2)`

### Dialogue System (`js/dialogue.js`)
- Typewriter text, character portraits with boss jitter, Web Audio voice beeps
- Auto-advance: 4s timer (3s for single-line), player can tap to skip
- Hides mobile gamepad via `.dialogue-active` CSS class during dialogue
- 5 voice presets: boss_low, boss_mid, npc_high, npc_mid, default

### Entity System
- **Players** (1-2): WASD/IJKL movement, Z/X/Q or U/O/P attacks. `spawnPlayer(idx)`
- **Enemies** (3 types + 4 bosses): AI targets nearest player. `spawnEnemy(type, x, y)`
- **NPCs** (5 archetypes): Wander, flee, react with speech bubbles. `spawnNPC(type, x, y)`
- **Pickups**: Dropped by enemies (28%) or pre-spawned. `spawnPickup(type, x, y)`

### Levels (4 total)
1. **Calle Colón** — "La Comisaría" — 3 sections, 3 waves. Boss: El Comisario
2. **Barrio Alberdi** — "El Barrio" — 3 sections, 3 waves. Boss: El Barra Brava
3. **La Cañada** — "El Paseo" — 4 sections, 4 waves. Boss: El Puntero
4. **Centro** — "La Final" — 4 sections, 4 waves. Boss: El Intendente

Each level: N enemy waves → boss dialogue → boss fight → next level.

### Block Type System (level backgrounds)
7 types in `js/constants.js` blocks arrays: `store`, `crosswalk`, `lot`, `alley`, `wall`, `park`, `special`
Rendered by `drawLevelBackground()` in `js/entities.js`.

### Push Notifications (Firebase Cloud Messaging)

Firebase project created as a **Web Application** in the Firebase Console.

**Flow:** Host creates room → browser requests notification permission → FCM token stored in `game_rooms.host_fcm_token` → guest joins → guest calls `/api/notify?room=CODE` → Vercel serverless function sends FCM push via Firebase Admin SDK → host's service worker shows notification.

**Vercel env vars (all required for push notifications):**

| Variable | Type | Source |
|----------|------|--------|
| `SUPABASE_URL` | Public | Supabase project settings |
| `SUPABASE_ANON` | Public | Supabase project settings |
| `FIREBASE_API_KEY` | Public | Firebase Console > Project Settings > General |
| `FIREBASE_PROJECT_ID` | Public | Firebase Console > Project Settings > General |
| `FIREBASE_MESSAGING_SENDER_ID` | Public | Firebase Console > Project Settings > General |
| `FIREBASE_APP_ID` | Public | Firebase Console > Project Settings > General |
| `FIREBASE_VAPID_KEY` | Public | Firebase Console > Cloud Messaging > Web Push certificates |
| `FIREBASE_CLIENT_EMAIL` | Secret | Firebase Console > Service accounts > Generate private key JSON |
| `FIREBASE_PRIVATE_KEY` | Secret | Firebase Console > Service accounts > Generate private key JSON |

**Caveats:**
- The service worker (`firebase-messaging-sw.js`) uses a **raw `push` event listener**, NOT Firebase SDK's `onBackgroundMessage`. The browser restarts service workers frequently, killing any postMessage-based state. Do not add Firebase SDK initialization to the SW.
- **Android requires PWA install** ("Add to Home Screen") for push notifications to work. Desktop Chrome works without this.
- FCM token request must be **awaited** before showing the QR overlay (race condition: guest could join before the token is stored in the database).
- Push notifications only appear when the host's tab/app is **not in focus** (backgrounded or minimized).
- The `notification` field in the FCM payload is what the browser displays. The `data` field is for the click handler.

## Key Conventions

- **No magic numbers** — all tuning in `js/constants.js`
- **Factory pattern** — entities created via `spawn*()` functions in `js/entities.js`
- **Placeholder rects** — most entities use `rect()` + `color()` (sprites in progress)
- **Canvas-dispatched events** — mobile gamepad fires synthetic KeyboardEvents on canvas
- **Spanish UI** — all player-facing text in Argentine Spanish dialect
- **No auto-servers** — don't start `npx serve` automatically; user runs it when needed

## Debug Mode

| Key | Action |
|-----|--------|
| `}` | Skip wave (kill all enemies) |
| `-` | Skip level |
| `B` | Skip to boss (guarded: won't fire during boss phase) |
| `G` | Toggle god mode |
| `T` | Toggle auto-walk right |

## Player Controls

| Action   | P1 (Keyboard) | P2 (Keyboard) | Mobile Gamepad |
|----------|---------------|---------------|----------------|
| Move     | WASD          | IJKL          | D-pad          |
| Punch    | Z             | U             | PUÑO button    |
| Kick     | X             | O             | PATADA button  |
| Special  | Q             | P             | ★ button       |
| Start    | Enter         | Enter         | START button   |

## What's Done

- Full game loop: title → 4 levels with waves/bosses → victory
- Belt-scroll camera with section locking and GO arrow
- Dialogue system (typewriter, portraits, voice beeps, auto-advance)
- Player movement, combat, weapons, special attacks
- Enemy AI, NPC system, pickup system
- HUD (HP bars, wave counter, boss HP, score, combo)
- Level 1 full block backgrounds, levels 2-4 block definitions
- Rain/overcast weather system
- Mobile virtual gamepad (hides during dialogue)
- Supabase backend (anon auth, rooms, leaderboard, RLS)
- Vercel deployment with serverless config endpoint
- Online 2P multiplayer (Supabase Realtime, host-authoritative)
- QR code room sharing (server-side generation via `/api/qr`)
- Push notifications when Player 2 joins (Firebase Cloud Messaging)
- Disconnect handling with dark overlay, countdown, and reconnect window
- Respawn system (6 lives per player in 2P/bot modes)
- Debug mode shortcuts

## TODO

- **Sprites** — generate via Pollinations MCP (player, enemies, bosses, NPCs, pickups)
- **Audio** — SFX and music (Web Audio or generated)
- **Polish** — combo system, character select, responsive tweaks
