---
name: sprite-qa
description: Run the AI Sprite QA Pipeline on a sprite sheet PNG. Checks dimensions, frame content, COM stability, and decides PASS/REPACK/REGEN. Use when a new sprite asset is added to assets/.
argument-hint: <filepath> [cols] [rows]
---

# Sprite QA Pipeline

Run the full QA pipeline on the sprite asset at `$ARGUMENTS`.

Parse arguments: first arg is the file path, optional second/third are cols/rows (default: infer from entity type — 4x1 for NPCs, 8x4 for enemies, 12x6 for heroes, 10x5 for bosses).

## Step 1: Visual Inspection
Read the image file to visually inspect the sprite sheet. Check for:
- Consistent character style across frames
- Correct facing direction (should face RIGHT)
- No obvious artifacts or misaligned frames

## Step 2: Dimension Check
Run Python with PIL:
```python
from PIL import Image
img = Image.open(FILEPATH).convert('RGBA')
w, h = img.size
cols, rows = COLS, ROWS
print(f'Dimensions: {w}x{h}')
print(f'Frame size: {w/cols:.2f}x{h/rows:.2f}')
print(f'Clean division: w%cols={w%cols}, h%rows={h%rows}')
```
- If dimensions don't divide cleanly → flag for REPACK
- Report expected vs actual dimensions

## Step 3: Frame Content Analysis
Run the bounding box analysis script from `assets/CLAUDE.md`:
- Classify each frame as STANDING or LYING (width > height * 1.3 = lying)
- Report content fill ratio (content width / frame width). If >90% → flag for padding repack
- Check y-offset consistency across frames

## Step 4: COM Stability Check
Check center-of-mass consistency per row:
```python
# For each row, compute COM x-position per frame
# If max(COM) - min(COM) > 15px → NEEDS COM REPACK
```
Report COM spread per row.

## Step 5: Verdict
Based on findings, output one of:
- **PASS** — Sprite is clean, dimensions divide evenly, COM stable. Ready for integration.
- **REPACK** — Dimensions wrong or content needs padding/resizing. Run the repack procedure (resize to target dimensions, COM-center if needed). Do the repack automatically and save over the original file, then re-verify.
- **REGEN** — Content is fundamentally broken (inconsistent character proportions, wrong style, missing frames). Sprite needs to be regenerated.

## Step 6: Integration Guidance (on PASS)
If the sprite passes, report:
- Exact `loadSprite()` config (sliceX, sliceY, anims with frame ranges)
- What to add to the entity def in `js/constants.js` (sprite key, optional spriteH)
- Any code changes needed in `js/entities.js`

Reference `assets/CLAUDE.md` for repack scripts and detailed procedures.
