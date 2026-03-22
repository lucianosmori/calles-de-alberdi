# Sprite & Asset Management

## Sprite Sheet Requirements (Kaplay.js)

**Critical rule:** The sprite sheet dimensions MUST be exactly divisible by sliceX/sliceY. Non-integer frame sizes cause visible tearing (frames bleed into adjacent cells).

```
✅ 1392px / 12 cols = 116px per frame (exact)
❌ 1394px / 12 cols = 116.17px per frame (TEARING)
```

### Before adding a new sprite sheet:
1. Check dimensions: `python -c "from PIL import Image; img = Image.open('file.png'); print(img.size)"`
2. Verify clean division: `width % sliceX == 0` and `height % sliceY == 0`
3. If not clean, **repack** the sheet (see repack procedure below)

## Current Sprites

### hero_taxpayer.png (Player 1)
- **Dimensions:** 1392×756 (repacked from original 1394×755)
- **Grid:** 12 columns × 6 rows = 72 frames, each 116×126px
- **Row layout:**
  - Row 0 (frames 0-11): Idle poses
  - Row 1 (frames 12-23): Walk cycle (12 frames)
  - Row 2 (frames 24-35): Punch (cols 0-3, wider poses) + Kick (cols 4-7)
  - Row 3 (frames 36-47): Special / Audit Slam with ice effects
  - Row 4 (frames 48-59): Hurt/death — first 5 cells have overlapping content from original, clean individual frames at cols 6-11
  - Row 5 (frames 60-71): Additional animation frames (unused currently)
- **Animation config in game.js:**
  ```js
  sliceX: 12, sliceY: 6,
  anims: {
    idle:    { from: 0,  to: 0  },  // single frame
    walk:    { from: 12, to: 23 },  // 12-frame cycle
    punch:   { from: 24, to: 27 },  // 4 frames
    kick:    { from: 28, to: 31 },  // 4 frames
    special: { from: 36, to: 47 },  // 12 frames
    hurt:    { from: 54, to: 59 },  // 6 frames (row 4, cols 6-11)
  }
  ```

### grunt_art.png (Enemy: Grunt)
- **Dimensions:** 1408×768 (clean, no repack needed)
- **Grid:** 8 columns × 4 rows = 32 frames, each 176×192px
- **Row layout (verified via per-frame bounding box analysis):**
  - Row 0 (frames 0-7): Walk cycle — all standing, ~87px wide content
  - Row 1 (frames 8-15): Attack — standing, arms extend (frames widen 96→135px)
  - Row 2 (frames 16-23): Hurt (cols 0-4, standing) + Death (cols 5-7, LYING ~156px wide)
  - Row 3 (frames 24-31): Idle/patrol — all standing, ~80px wide
- **Animation config in game.js:**
  ```js
  sliceX: 8, sliceY: 4,
  anims: {
    walk:   { from: 0,  to: 7  },  // row 0
    attack: { from: 8,  to: 15 },  // row 1
    hurt:   { from: 16, to: 20 },  // row 2, standing only
    death:  { from: 21, to: 23 },  // row 2, collapse/lying
    idle:   { from: 24, to: 31 },  // row 3
  }
  ```
- **Important lesson:** Don't guess row contents from visual inspection. Use the Python bounding-box analysis script to classify frames as STANDING vs LYING (width > height × 1.3 = lying). Row order in AI-generated sheets often doesn't match intuitive expectations.

### heavy_boss_art.png (Boss: Big Earl)
- **Dimensions:** 2560×880 (repacked & COM-centered from Gemini's original 1408×752)
- **Grid:** 8 columns × 4 rows = 32 frames, each 320×220px
- **Original content:** 176×188px per frame, but character filled 100% of frame and body position shifted wildly (x=31 to x=140) between frames. Repacked with transparent padding and center-of-mass alignment so character stays visually stable during animation.
- **Row layout:**
  - Row 0 (frames 0-7): Punch/slam attack (standing, y-offset 8-17px from top)
  - Row 1 (frames 8-15): Walk cycle (full height, y=0)
  - Row 2 (frames 16-23): Ground slam with blue VFX (full height, y=0) — used as attack anim
  - Row 3 (frames 24-27): Hurt/stagger (standing)
  - Row 3 (frames 28-31): Death (standing — no collapse animation exists)
- **Animation config in game.js:**
  ```js
  sliceX: 8, sliceY: 4,
  anims: {
    walk:   { from: 8,  to: 15 },  // row 1
    idle:   { from: 8,  to: 15 },  // reuse walk
    attack: { from: 16, to: 23 },  // row 2 (ground slam, no y-offset)
    hurt:   { from: 24, to: 27 },  // row 3 cols 0-3
    death:  { from: 28, to: 31 },  // row 3 cols 4-7
  }
  ```
- **Scaling:** `spriteH:220` in def, `h:72`. Uses uniform `scale(h/spriteH)`.
- **Status: STILL BROKEN** — COM-centering repack was attempted but the sprite still displays like an unaligned carousel/movie strip. The Gemini-generated art has fundamentally inconsistent character poses across frames (body proportions, limb positions, and content distribution vary too much). **This sprite likely needs to be regenerated** with a stricter prompt or manually edited frame-by-frame.
- **Key lesson:** Gemini-generated boss had character body shifting 100+ pixels between frames. COM-centering repack helped but wasn't sufficient — the underlying art quality/consistency is the root problem.

## AI Sprite QA Pipeline (Gemini/Imagen)

**Gemini often produces sprite sheets with issues that can't be fixed by code alone. Always run this pipeline before integrating a new sprite:**

### Step 1: Dimension Check
```python
from PIL import Image
img = Image.open('sheet.png').convert('RGBA')
w, h = img.size
cols, rows = 8, 4  # adjust per sheet
print(f'{w}x{h}, frame {w//cols}x{h//rows}')
print(f'Clean: {w % cols == 0} (w), {h % rows == 0} (h)')
```
If not clean → **repack** (see procedure below).

### Step 2: Frame Content Analysis
Run the bounding box analysis script (below) to check:
- **Row contents**: Which rows are walk/attack/hurt/death? Don't guess.
- **Standing vs Lying**: Use `width > height * 1.3` to classify.
- **Content fill ratio**: Content should fill ~50-60% of frame width. If >90%, the character will look squat/wide — needs padding repack.
- **Y-offset consistency**: If content y-offset varies >5px between rows, attack/walk transitions will cause visual jumping.

### Step 3: Body Position Stability (Critical!)
Check that the character's center of mass (COM) is consistent across frames:
```python
from PIL import Image
img = Image.open('sheet.png').convert('RGBA')
w, h = img.size
cols, rows = 8, 4
fw, fh = w // cols, h // rows
for r in range(rows):
    coms = []
    for c in range(cols):
        cell = img.crop((c*fw, r*fh, (c+1)*fw, (r+1)*fh))
        pixels = list(cell.getdata())
        total = 0; wx = 0
        for i, p in enumerate(pixels):
            if p[3] > 10:
                total += 1; wx += i % fw
        if total > 50: coms.append(wx / total)
    if coms:
        spread = max(coms) - min(coms)
        print(f'Row {r}: COM range={spread:.0f}px ({"OK" if spread < 15 else "NEEDS COM REPACK"})')
```
If COM spread > 15px → character will visibly jump/teleport horizontally during animation. **COM-center repack required.**

### Step 4: COM-Centering Repack
When character position is unstable across frames:
```python
from PIL import Image
img = Image.open('sheet.png').convert('RGBA')
cols, rows = 8, 4
fw, fh = img.size[0]//cols, img.size[1]//rows
NEW_FW, NEW_FH = fw + 144, fh + 32  # add padding (adjust as needed)
new_img = Image.new('RGBA', (NEW_FW*cols, NEW_FH*rows), (0,0,0,0))
target_cx = NEW_FW // 2
for r in range(rows):
    for c in range(cols):
        cell = img.crop((c*fw, r*fh, (c+1)*fw, (r+1)*fh))
        pixels = list(cell.getdata())
        total = 0; wx = 0
        for i, p in enumerate(pixels):
            if p[3] > 10: total += 1; wx += i % fw
        if total < 50: continue
        com_x = wx / total
        nx = c * NEW_FW + int(target_cx - com_x)
        ny = r * NEW_FH + (NEW_FH - fh)  # feet at bottom
        new_img.paste(cell, (nx, ny))
new_img.save('sheet_fixed.png')
```

### Decision Tree: Fix Asset vs Fix Code
- **Dimensions wrong** → Repack asset (padding + clean division)
- **Row order unexpected** → Remap animation frame ranges in code
- **Content fills >90% of frame** → Repack asset with padding
- **COM spread >15px between frames** → COM-center repack asset
- **No death collapse frames** → Regenerate sprite or accept standing death
- **Y-offset varies between rows** → Use rows with consistent y=0 for attack anim
- **Character too similar to another entity** → Regenerate sprite with different description

**Rule of thumb:** If the problem is in the pixel data, fix the asset. Don't endlessly tweak code to compensate for bad sprites.

## Sprite Sheet Repack Procedure

When sprite sheets have non-uniform frame spacing or non-divisible dimensions:

1. **Analyze the grid** — find actual frame boundaries using transparency gaps:
   ```python
   from PIL import Image
   img = Image.open('sheet.png').convert('RGBA')
   # Check average alpha per column/row to find gaps
   ```

2. **Identify cell boundaries** — midpoints of transparent gaps between frames

3. **Extract and repack** — crop each cell from original positions, paste into uniform grid:
   ```python
   CELL_W = target_width // num_cols  # must be integer
   CELL_H = target_height // num_rows
   new_img = Image.new('RGBA', (num_cols * CELL_W, num_rows * CELL_H), (0,0,0,0))
   # paste each extracted cell at uniform positions
   ```

4. **Verify** the output dimensions divide cleanly

## Sprite Frame Analysis Script

Use this to verify row contents of AI-generated sprite sheets before mapping animations:

```python
from PIL import Image
img = Image.open('sheet.png').convert('RGBA')
w, h = img.size
cols, rows = 8, 4  # adjust per sheet
fw, fh = w // cols, h // rows
for r in range(rows):
    for c in range(cols):
        cell = img.crop((c*fw, r*fh, (c+1)*fw, (r+1)*fh))
        pixels = list(cell.getdata())
        vis = [(i%fw, i//fw) for i,p in enumerate(pixels) if p[3]>10]
        if len(vis) < 50: print(f'Frame {r*cols+c} (r{r}c{c}): EMPTY'); continue
        xs, ys = zip(*vis)
        cw, ch = max(xs)-min(xs)+1, max(ys)-min(ys)+1
        orient = 'LYING' if cw > ch*1.3 else 'STANDING'
        print(f'Frame {r*cols+c} (r{r}c{c}): {cw}x{ch} [{orient}]')
```

## Planned Sprites (TODO)

### Enemies (suggested 8×4 grids)
| Sprite | Type | Status |
|--------|------|--------|
| grunt_art.png | grunt | DONE |
| enemy_agile.png | agile/slider | TODO, fast low HP |
| enemy_heavy.png | heavy | Slow, tanky |
| enemy_stripper.png | stripper/whiplash | Long range |
| enemy_crackhead.png | crackhead/addict | Erratic, fast cooldown |
| enemy_kicker.png | kicker | Mid-range kick attacks |

### Bosses (suggested 10×5 grids — more frames for complex attacks)
| Sprite | Type | Level |
|--------|------|-------|
| heavy_boss_art.png | heavy_boss / Big Earl | Bank Street | BROKEN — needs regen |
| boss_stripper.png | stripper_boss / The Duo (×2) | ByWard Market |
| boss_chain.png | heavy_chain / Chain Daddy | Rideau Canal |
| boss_druglord.png | drug_lord / The Chef | Curry Street |
| boss_syndicate.png | syndicate_boss / The Overlord | Parliament Hill |

### NPCs (suggested 4×1 — simple walk cycle)
turban, lgbtq, hijab, african, quebecois, ukrainian, palestinian

### Pet NPCs (4×1 — walk cycle only, tiny frames)

Sub-type of NPC. Smaller scale than human NPCs, animal walk cycles only (no react/attack/speech states). Marked `isPet: true` in `NPC_DEFS`. Raccoons appear heavily on ByWard Market level.

**In-engine scaling:** same formula as human NPCs — `def.h / (def.spriteH || 126)`. Set `spriteH` equal to the frame height below so scale resolves correctly at game size.
Example: raccoon `spriteH: 16` → scale = 16/126 ≈ 0.127 (very small, correct).

| Animal   | File                | Frame W | Frame H | Sheet total | spriteH |
|----------|---------------------|---------|---------|-------------|---------|
| squirrel | npc_squirrel.png    | 23px    | 14px    | 92 × 14px   | 14      |
| cat      | npc_cat.png         | 24px    | 16px    | 96 × 16px   | 16      |
| dog      | npc_dog.png         | 28px    | 18px    | 112 × 18px  | 18      |
| raccoon  | npc_raccoon.png     | 26px    | 16px    | 104 × 16px  | 16      |
| raven    | npc_raven.png       | 22px    | 20px    | 88 × 20px   | 20      |

**Style notes:**
- Pixel art, top-down 2.5D side view, consistent with human NPC sheets but much smaller
- Raccoon: dark-ringed tail prominent, hunched scavenger pose, grey/black/white palette
- Raven: black feathered, **hopping gait on the ground** (not flying), Ottawa winter setting
- All pets face right in source sheet; engine flips via `flipX` for left-facing
- No outlines heavier than 1px at this scale

**Planned NPC_DEFS sketch (js/constants.js):**
```js
// Pets — sub-type of NPC, no speech bubbles (phrases: []), isPet: true
squirrel: { col:[150,140,120], accentCol:[120,100, 70], w:10, h:12, speed:60, phrases:[], spriteH:14, sprite:"npc_squirrel", isPet:true },
cat:      { col:[160,140,110], accentCol:[200,160,100], w:12, h:14, speed:48, phrases:[], spriteH:16, sprite:"npc_cat",      isPet:true },
dog:      { col:[180,150,100], accentCol:[220,190,140], w:14, h:16, speed:42, phrases:[], spriteH:18, sprite:"npc_dog",      isPet:true },
raccoon:  { col:[120,120,120], accentCol:[ 40, 40, 40], w:12, h:14, speed:40, phrases:[], spriteH:16, sprite:"npc_raccoon",  isPet:true },
raven:    { col:[ 40, 40, 50], accentCol:[ 80, 80,100], w:11, h:16, speed:38, phrases:[], spriteH:20, sprite:"npc_raven",    isPet:true },
```

### Backgrounds (single images, 800×260px upper area)
bg_bankstreet, bg_byward, bg_canal, bg_currystreet, bg_parliament
(Note: GROUND_TOP is now 260, not 195)

### Effects
fx_punch.png, fx_kick.png (3-4 frame impact animations)

## Generating New Sprites

See [SPRITE_PROMPT.md](SPRITE_PROMPT.md) for ready-to-use prompts for Gemini/Imagen.
Covers all entity types with exact dimensions, style guide, and post-generation checklist.

## Audio (all TODO)
- sfx_punch.wav, sfx_kick.wav, sfx_hurt.wav, sfx_pickup.wav
- sfx_enemy_hit.wav, sfx_enemy_die.wav
- music_street.mp3 (main loop), music_boss.mp3
