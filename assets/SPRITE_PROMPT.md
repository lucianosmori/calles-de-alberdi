# Sprite Generation Prompt — Streets of Winter

Use this prompt template with **Gemini (Imagen 3 / Veo)** or similar image generators to produce sprite sheets compatible with the game engine (Kaplay.js).

---

## Base Style Prompt (prepend to ALL requests)

```
Pixel art sprite sheet for a 2D side-scrolling beat 'em up game.
Style: 16-bit retro pixel art, similar to Streets of Rage or Final Fight.
View: side-on profile view, character facing right.
Background: plain white. No grid lines, no dividers, no borders between frames.
No anti-aliasing, hard pixel edges only.
Winter clothing theme — characters wear coats, toques, scarves, boots.
Ottawa, Canada setting.
```

> **Post-generation:** Run `/remove-bg <file>` to replace the white background with transparency.

---

## CRITICAL: Dimension Rules

The sprite sheet MUST have dimensions that divide evenly by the grid size.
**Always specify exact pixel dimensions in the prompt.**

| Grid | Cell Size | Sheet Dimensions |
|------|-----------|-----------------|
| 12×6 | 116×126 | **1392×756** (heroes) |
| 8×4 | 116×126 | **928×504** (basic enemies) |
| 10×5 | 116×126 | **1160×630** (bosses) |
| 4×1 | 116×126 | **464×126** (NPCs — walk cycle only) |
| 4×1 | 48×48 | **192×48** (pickups/items) |
| 4×1 | 23×14 | **92×14** (pet: squirrel) |
| 4×1 | 24×16 | **96×16** (pet: cat) |
| 4×1 | 28×18 | **112×18** (pet: dog) |
| 4×1 | 26×16 | **104×16** (pet: raccoon) |
| 4×1 | 22×20 | **88×20** (pet: raven) |

---

## Hero Sprite Sheets (12 columns × 6 rows = 1392×756)

### Player 1 — Taxpayer (REFERENCE: already exists as hero_taxpayer.png)
```
Pixel art sprite sheet, 1392x756 pixels, 12 columns by 6 rows grid.
Each cell is 116x126 pixels. Plain white background. No grid lines or dividers between frames.
Character: stocky white male, mid-30s, brown winter coat, dark toque, work boots.
Annoyed office-worker-turned-fighter look. Slightly cartoonish proportions.

Row 1: Idle stance — 12 frames of subtle breathing/weight-shift animation, facing right.
Row 2: Walk cycle — 12 frames, full stride loop, trudging through snow.
Row 3: Punch — first 4 frames (cols 1-4): wind-up, extend, connect, recover. Then kick — next 4 frames (cols 5-8): leg raise, extend, hit, retract. Last 4 cols: empty/duplicate idle.
Row 4: Special attack — 12 frames of spinning ice-burst area attack, blue ice crystal VFX expanding outward.
Row 5: Hurt — 6 frames at cols 7-12: flinch, stagger back, recover. Cols 1-6 can be knockdown/getting-up frames.
Row 6: Additional poses (crouch, weapon hold, victory).
```

### Player 2 — Priya
```
Pixel art sprite sheet, 1392x756 pixels, 12 columns by 6 rows grid.
Each cell is 116x126 pixels. Plain white background. No grid lines or dividers between frames.
Character: South Asian woman, late 20s, green winter parka, long dark braid,
combat boots, confident fighter stance. Quick and agile build.

Same row layout as Player 1 (idle/walk/punch+kick/special/hurt/extras).
Special attack: green energy spin with maple leaf VFX.
```

---

## Enemy Sprite Sheets (8 columns × 4 rows = 928×504)

### Template prompt for enemies:
```
Pixel art sprite sheet, 928x504 pixels, 8 columns by 4 rows grid.
Each cell is 116x126 pixels. Plain white background. No grid lines or dividers between frames.
Character: [DESCRIPTION]. Menacing but slightly comical.

Row 1: Walk cycle — 8 frames, approaching from right side.
Row 2: Attack — 8 frames: taunt(2), wind-up(2), strike(2), recover(2).
Row 3: Hurt — 4 frames: flinch, stagger. Death — 4 frames: collapse, flatten.
Row 4: Idle/patrol — 8 frames of standing, looking around.
```

### Enemy descriptions to insert into [DESCRIPTION]:

**GRUNT** (w:26, h:46, color: muted red)
```
Generic Ottawa street thug, average build, red hoodie under grey parka,
baseball cap backwards, sneakers. Basic brawler stance.
```

**SLIDER / Agile** (w:24, h:44, color: purple-ish)
```
Fast punk on rollerblades, lean build, purple-black jacket, mohawk,
kneepads. Crouched skating stance, moves low and fast.
```

**HEAVY** (w:34, h:50, color: dark brown-red)
```
Large burly brawler, beer gut, plaid lumber jacket, thick beard,
construction boots. Lumberjack-bouncer hybrid. Wide imposing stance.
```

**WHIPLASH / Stripper** (w:22, h:46, color: hot pink)
```
Tall flashy fighter, long coat with fur trim, high heeled boots,
dramatic poses. Uses long-range whip-like scarf attacks. Lean and agile.
```

**ADDICT / Crackhead** (w:22, h:42, color: olive-brown)
```
Scrawny twitchy figure, oversized dirty jacket, tuque pulled low,
erratic movements. Small and unpredictable. Hunched posture.
```

**KICKER** (w:24, h:46, color: steel blue)
```
Athletic fighter in winter athletic gear, track pants, puffy vest,
running shoes. Martial arts-influenced kicks. Balanced fighting stance.
```

---

## Boss Sprite Sheets (10 columns × 5 rows = 1160×630)

### Template prompt for bosses:
```
Pixel art sprite sheet, 1160x630 pixels, 10 columns by 5 rows grid.
Each cell is 116x126 pixels. Plain white background. No grid lines or dividers between frames.
Character: [DESCRIPTION]. Imposing, larger than regular enemies.
Clearly a boss character — more detailed, more intimidating.

Row 1: Idle/taunt — 10 frames, menacing presence, taunting gestures.
Row 2: Walk — 10 frames, heavy deliberate stride.
Row 3: Attack combo — 10 frames: charge(3), heavy strike(4), recover(3).
Row 4: Special attack — 10 frames with VFX (unique per boss).
Row 5: Hurt(5 frames) + Death(5 frames): dramatic defeat sequence.
```

### Boss descriptions:

**BIG EARL — Level 1 Boss** (w:40, h:56)
```
Massive bouncer type, bald head, thick neck, black leather vest over
flannel, steel-toed boots, brass knuckles. Bank Street enforcer.
Towering over other characters. Slams fists for attacks.
```

**THE DUO — Level 2 Boss** (w:30, h:52, spawns ×2)
```
Twin nightclub fighters, matching outfits — one in red, one in blue.
Flashy club-wear under winter coats, coordinated attack poses.
ByWard Market bouncers. Acrobatic dual attacks.
```

**TRASH KING — Level 2 Co-Boss / raccoon_thrower** (w:32, h:52)
```
Burly Ottawa homeless man outside ByWard Market at night. Filthy parka,
toque pulled down low, fingerless gloves, ragged boots. Permanent scowl.
Carries a squirming raccoon under each arm; more raccoons cling to his
shoulders and peek from his coat pockets.

Row 1: Idle/taunt — 10 frames, shifts weight, one raccoon climbs up his arm.
Row 2: Walk — 10 frames, lumbering side-on stride, raccoons bob on shoulders.
Row 3: Attack — 10 frames: winds up (3), hurls raccoon overhand (4), watches it fly (3).
Row 4: Special — 10 frames: grabs TWO raccoons and launches them like shotgun blast, VFX rings.
Row 5: Hurt (5 frames, staggers) + Death (5 frames, collapses, raccoons scatter off screen).
```

**CHAIN DADDY — Level 3 Boss** (w:42, h:54)
```
Dock worker with heavy chain weapon, thick winter overalls, wool cap,
massive forearms. Swings chain overhead. Rideau Canal barge enforcer.
Ice and chain VFX on special attack.
```

**THE CHEF — Level 4 Boss** (w:36, h:52)
```
Intimidating food truck owner, chef's hat, stained apron over parka,
wielding a massive ladle/cleaver. Curry Street kingpin.
Fire/spice VFX on special attack (orange-red particles).
```

**THE OVERLORD — Level 5 Final Boss** (w:44, h:60)
```
Shadowy political figure in long dark overcoat, scarf covering lower face,
glowing eyes, top hat or fur ushanka. Parliament Hill mastermind.
Largest sprite. Dark energy / shadow VFX on special attack.
```

---

## NPC Sprite Sheets (4 columns × 1 row = 464×126)

### Template:
```
Pixel art sprite sheet, 464x126 pixels, 4 columns by 1 row.
Each cell is 116x126 pixels. Plain white background. No grid lines or dividers between frames.
Character: [DESCRIPTION]. Peaceful civilian, non-combatant.
4-frame walk cycle: left foot forward, neutral, right foot forward, neutral.
Bundled up for Ottawa winter. Friendly, non-threatening appearance.
```

### NPC descriptions:

**TURBAN** — `Sikh man, orange/saffron turban, brown winter coat, warm smile.`
**LGBTQ** — `Person in rainbow scarf and pink winter jacket, pride pins, cheerful.`
**HIJAB** — `Woman in blue hijab and long winter coat, modest warm clothing.`
**AFRICAN** — `Man in colorful patterned winter jacket, kufi cap, warm tones.`
**QUEBECOIS** — `Stocky person in Canadiens hockey jersey under open parka, tuque with fleur-de-lis.`
**UKRAINIAN** — `Person in embroidered vyshyvanka-patterned coat, blue and yellow accents.`
**PALESTINIAN** — `Person in keffiyeh scarf, olive winter jacket, determined expression.`

---

## Pet NPC Sprite Sheets (tiny — 4 columns × 1 row, animal-specific dimensions)

Pets are a sub-type of friendly NPC — small animals that wander the streets. Walk cycle only (4 frames). See `assets/CLAUDE.md` for exact per-animal frame dimensions.

### Base style note (prepend to all pet prompts):
```
Pixel art sprite sheet for a 2D side-scrolling beat 'em up game.
Style: 16-bit retro pixel art. Side-on profile view, animal facing right.
Background: plain white. No grid lines or dividers between frames. No anti-aliasing, hard pixel edges.
Ottawa, Canada winter setting — snow on the ground implied by context.
4-frame walk cycle: stride out, mid-step, stride back, mid-step.
ALL frames face RIGHT. Engine flips horizontally for left-facing.
```

### Squirrel — npc_squirrel.png (92×14px, 4 frames of 23×14)
```
Pixel art sprite sheet, 92x14 pixels, 4 columns by 1 row. Each cell 23x14. Plain white background. No grid lines or dividers between frames.
Grey squirrel, bushy tail arched over back, scurrying side-on walk cycle, winter fur.
4 frames showing quick bounding stride. Tiny creature, max ~10px body height.
```

### Cat — npc_cat.png (96×16px, 4 frames of 24×16)
```
Pixel art sprite sheet, 96x16 pixels, 4 columns by 1 row. Each cell 24x16. Plain white background. No grid lines or dividers between frames.
Stray tabby or grey alley cat, cautious prowling walk cycle, side-on view.
Winter street cat — a little scruffy. Tail up or low-slung. 4 frames.
```

### Dog — npc_dog.png (112×18px, 4 frames of 28×18)
```
Pixel art sprite sheet, 112x18 pixels, 4 columns by 1 row. Each cell 28x18. Plain white background. No grid lines or dividers between frames.
Medium-sized mutt, scruffy Ottawa street dog, trotting walk cycle, side-on view.
Floppy ears, mixed breed look, tail wagging slightly. 4 frames.
```

### Raccoon — npc_raccoon.png (104×16px, 4 frames of 26×16)
```
Pixel art sprite sheet, 104x16 pixels, 4 columns by 1 row. Each cell 26x16. Plain white background. No grid lines or dividers between frames.
Urban raccoon, grey body, black mask markings, ringed tail prominent, hunched scavenger walk.
Side-on view, 4-frame walk cycle. Ottawa winter setting.
This raccoon just escaped a McDonald's incident — slightly frantic energy in the pose.
```

### Raven — npc_raven.png (88×20px, 4 frames of 22×20)
```
Pixel art sprite sheet, 88x20 pixels, 4 columns by 1 row. Each cell 22x20. Plain white background. No grid lines or dividers between frames.
Black raven or crow, hopping walk cycle — ground level only, NOT flying.
Glossy black feathers, side-on profile, 4 frames of hopping gait.
Ottawa winter setting, occasional head-bob between hops.
```

---

## Pickup / Item Sprites (4 columns × 1 row = 192×48)

```
Pixel art sprite sheet, 192x48 pixels, 4 items in a row.
Each cell is 48x48 pixels. Plain white background. No grid lines or dividers between frames.
Top-down-ish 3/4 view, clear silhouettes, bright colors so they
stand out on the ground. Ottawa/Canadian themed items.
```

### Generate in batches of 4:

**Batch 1 (health items):**
```
4 food pickup items on plain white background:
1. Glazed donut (Tim Hortons style, golden-brown)
2. Samosa (golden triangle, crispy)
3. Coffee cup (paper cup with lid, brown)
4. Fish (silvery, fresh catch)
```

**Batch 2 (weapons):**
```
4 weapon pickup items on plain white background:
1. Beer bottle (green glass)
2. Shopping cart (grey metal, small)
3. Spice cart (wooden with orange/red jars)
4. Fruit cart (wooden with colorful fruit)
```

**Batch 3 (weapons continued):**
```
4 weapon pickup items on plain white background:
1. Canadian flagpole (red flag, thin pole)
2. Ice skate (silver blade, white boot)
3. Small statue (bronze/grey, parliament style)
4. Hockey stick (wooden, classic Canadian)
```

---

## Background Images (800×195 pixels)

```
Pixel art background, 800x195 pixels. 16-bit retro style.
Winter scene, light snow, Ottawa Canada.
Row of storefronts viewed from across the street.
No characters, just buildings and environment.
Flat perspective, suitable for a side-scrolling game background.
```

### Per-level descriptions:

**Level 1 — Bank Street:**
```storefronts: Tim Hortons, Dollarama, pawn shop, laundromat, shawarma place. Gritty urban strip, neon signs, snow on awnings.```

**Level 2 — ByWard Market:**
```storefronts: Barefax nightclub (purple neon), McDonald's with golden arches (partially boarded up, lit inside — a sign reads "RIDEAU LOCATION CLOSED"), craft brewery, vintage shop, tattoo parlor. Nightlife district, flickering lights, wet snowy pavement. Overturned garbage bags near the McDonald's entrance. Raccoon silhouettes in the shadows.```

**Level 3 — Rideau Canal:**
```open frozen canal, skate shack, hot chocolate stand, distant Parliament silhouette, snow-covered trees. Bright winter day, ice surface.```

**Level 4 — Curry Street:**
```storefronts: Desi Kitchen, Spice World, Biryani House, Halal Meats, Sweet Shop. Warm glowing signs, spice-colored awnings, steam from kitchens.```

**Level 5 — Parliament Hill:**
```Parliament Centre Block with Peace Tower, East and West blocks flanking. Grand Gothic Revival architecture, snow on rooftops, Canadian flags. Dramatic evening sky.```

---

## Post-Generation Checklist

After generating any sprite sheet:

1. **Verify dimensions** — must match the exact pixel size specified
2. **Remove background** — run `/remove-bg <file>` to replace white background with transparency
3. **Check grid alignment** — `width % columns == 0` and `height % rows == 0`
4. **If dimensions are wrong** — repack using the procedure in `assets/CLAUDE.md`
5. **Test in-game** — load with correct `sliceX`/`sliceY`, verify no frame tearing
6. **Match art style** — compare against `hero_taxpayer.png` for consistent pixel density and proportions

## Iteration Tips

- If the generator produces inconsistent frame sizes, add: `"Each frame must be exactly 116x126 pixels. Use a visible grid overlay to ensure alignment."`
- If poses vary too much between frames, add: `"Consistent character proportions across all frames. Same head size, body width, and foot position in every cell."`
- If the style is too smooth/modern, add: `"Strict pixel art, no anti-aliasing, no gradients, limited color palette (max 16 colors per character)."`
- If characters face different directions, add: `"ALL frames must face RIGHT. The game engine handles horizontal flipping programmatically."`
