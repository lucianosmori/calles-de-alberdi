# Calles de Alberdi

2D side-scrolling beat 'em up set in Barrio Alberdi, Córdoba, Argentina. Web-based (HTML5/JS), mobile-responsive, using Kaplay.js engine.

## Project Structure

```
index.html          — Entry point, canvas, virtual gamepad (touch controls)
game.js             — Scenes (title/game/gameover/victory), combat, wave system
js/constants.js     — All tuning values, level defs, enemy/NPC/pickup stats
js/entities.js      — Factory functions (player, enemy, NPC, pickup), AI, HUD, snow
js/multiplayer.js   — Multiplayer & leaderboard stubs (Supabase — TODO)
assets/             — Sprites, sounds (none yet — all placeholder rects)
tests/              — Playwright E2E tests
package.json        — Dev deps: @playwright/test, serve
playwright.config.js — Test runner config
```

**Load order:** index.html → Kaplay CDN → constants.js → entities.js → multiplayer.js → game.js
**No build step** — static site, deployed directly to GitHub Pages.

## Architecture

### Scene Flow
```
title → game → gameover → retry/title
                └→ victory → replay/title
```

### Entity System
- **Players** (1-2): WASD/IJKL movement, Z/X/Q or U/O/P attacks. Spawned via `spawnPlayer(idx)`.
- **Enemies** (3 types + 4 bosses): AI targets nearest player, pathfinds, attacks in range. Spawned via `spawnEnemy(type, x, y)`.
- **NPCs** (5 archetypes): Wander, flee danger, react to fights with speech bubbles.
- **Pickups** (2 health + 1 weapon + 1 dual): Dropped by enemies (28% chance) or pre-spawned.

### Levels (4 total)
1. **Calle Colón** — "La Comisaría" — Police station at Colón y Santa Fe. NPCs: belgrano_fan, feminist, peronist, trapito. Boss: El Comisario.
2. **Barrio Alberdi** — "El Barrio" — Placeholder. Boss: El Barra Brava.
3. **La Cañada** — "El Paseo" — Placeholder. Boss: El Puntero.
4. **Centro** — "La Final" — Placeholder. Boss: El Intendente.

Each level: 3 enemy waves → boss fight → next level.

### Enemy Types
- **Punguista** — street thief, fast, low HP
- **Patotero** — gang brawler, slow, high HP
- **Naranjita** — informal parking guard, medium speed, low damage

### NPC Archetypes
- **belgrano_fan** — Club Belgrano supporter
- **feminist** — activist ("¡Ni una menos!")
- **peronist** — Peronist party supporter
- **trapito** — street car guard ("¡Te lo cuido, jefe!")
- **vecina** — neighbourhood resident

### Combat
- Punch (68px range, 12 dmg), Kick (90px range, 22 dmg), Special (115px AoE, 35 dmg, costs 20 HP)
- Weapons boost damage/range, break after N uses
- Hit → 0.3s enemy stun, 22px knockback; Player hurt → 0.45s iframes

### Pickups
- **Empanada** — heals 20 HP
- **Mate** — heals 15 HP
- **Choripán** — heals 25 HP
- **Fernet** — weapon: 22 dmg, 3 uses

## Key Conventions

- **No magic numbers** — all tuning in `js/constants.js`
- **Factory pattern** — entities created via `spawn*()` functions in `js/entities.js`
- **Placeholder rects** — all entities use `rect()` + `color()` (no sprites yet)
- **Canvas-dispatched events** — mobile gamepad fires synthetic KeyboardEvents on the canvas element
- **Spanish UI** — all player-facing text in Spanish (Argentine dialect)

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
- Player movement, combat, weapons, special attacks
- Enemy AI (pathfinding, attacking, taunting in Spanish)
- NPC system (wandering, fleeing, reacting with speech bubbles)
- Pickup system (health items, weapons with durability)
- HUD (HP bars, wave counter, boss HP, controls legend)
- Snow particle system
- Mobile virtual gamepad with landscape lock
- Level select with auto-start timer
- Mobile fullscreen layout with camera follow
- All UI text in Spanish
- Supabase + QR code CDN loaded (multiplayer prep)

## What's Missing / TODO

### Sprites (All)
- No sprites exist yet — everything uses colored rectangles
- Need: player sprites, 3 enemy types, 4 bosses, 5 NPC types, 4 pickups

### Level 1 Background
- Comisaría Central at corner of Colón y Santa Fe, Córdoba
- Police station building as main storefront feature

### Levels 2-4
- Placeholder names and storefronts — design TBD

### Audio
- No sound effects or music

### Features
- Multiplayer via QR code (Supabase integration)
- Online leaderboard
- Combo system
- Character select
- Responsive layout fix (desktop vs mobile)
