# assets/

Drop all game assets into this folder. Reference them in `game.js` via relative
paths like `"assets/player.png"`.

---

## Sprites

All sprites should be PNG, pixel art style.
Recommended base size: **16×16** or **32×32** grid per frame.
Character sprites currently occupy a **28×48 px** placeholder rect in-game —
size your sheets to match or adjust the `rect()` calls in `game.js`.

| File | Description | Frames (suggested) |
|------|-------------|-------------------|
| `player.png` | Luciano — idle, walk, punch, kick, hurt | 8×5 sheet |
| `enemy_thug.png` | Basic street thug — walk, attack, hurt, dead | 6×4 sheet |
| `enemy_roller.png` | Roller-blader variant (TODO) | 6×4 sheet |
| `enemy_boss.png` | Area boss (TODO) | 8×6 sheet |
| `bg_timhortons.png` | Tim Hortons storefront background | single image |
| `bg_dollarama.png` | Dollarama storefront background | single image |
| `bg_indian_restaurant.png` | Curry Palace background | single image |
| `bg_dep.png` | Depanneur / corner store background | single image |
| `bg_laundromat.png` | Laundromat background | single image |
| `npc_turbaned.png` | Background pedestrian — turban | 4-frame walk cycle |
| `npc_pride.png` | Background pedestrian — pride outfit | 4-frame walk cycle |
| `npc_regular.png` | Generic background pedestrian | 4-frame walk cycle |
| `fx_punch.png` | Punch impact effect | 3–4 frames |
| `fx_kick.png` | Kick impact effect | 3–4 frames |

---

## Audio

| File | Description |
|------|-------------|
| `sfx_punch.wav` | Punch hit sound |
| `sfx_kick.wav` | Kick hit sound |
| `sfx_hurt.wav` | Player hurt sound |
| `sfx_enemy_hit.wav` | Enemy taking damage |
| `music_street.mp3` | Main street theme (looping) |

---

## Loading assets in game.js

Uncomment and fill in the `loadSprite` / `loadSound` calls near the top of
`game.js`.  The stubs are already written — you just need the files to exist.

```js
loadSprite("player", "assets/player.png", {
  sliceX: 8, sliceY: 5,
  anims: {
    idle:  { from: 0,  to: 0,  loop: true  },
    walk:  { from: 8,  to: 15, loop: true  },
    punch: { from: 16, to: 18, loop: false },
    kick:  { from: 19, to: 22, loop: false },
    hurt:  { from: 23, to: 23, loop: false },
  },
});
```

Then in the `add([...])` call, swap `rect(28, 48)` + `color(...)` for
`sprite("player")` and call `player.play("idle")` on state transitions.
