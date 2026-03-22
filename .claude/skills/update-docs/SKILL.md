# Update Project Documentation

Sync all project documentation files (CLAUDE.md, MEMORY.md, and memory files) with the actual current state of the codebase.

## When to use
Run this after a work session where sprites were added, features implemented, bugs fixed, or any significant changes made.

## Steps

### Step 1: Audit current state
Scan the codebase to determine the actual current state:

1. **Sprites**: List all files in `assets/` matching `*.png`. Cross-reference with `loadSprite()` calls in `game.js` and `sprite:` entries in `js/constants.js` to determine which are integrated vs just files.
2. **Entity defs**: Read `js/constants.js` for all enemy, NPC, boss, and pickup definitions. Note which have `sprite:` keys.
3. **Features**: Read `game.js` and `js/entities.js` for implemented features (pets, traffic, combos, etc.).
4. **Levels**: Check `LEVELS` array in constants.js for level configs, wave compositions, store layouts.

### Step 2: Update CLAUDE.md
Edit the project root `CLAUDE.md`:

1. **"What's Done"** section — add any newly completed items, remove items that are listed as done but aren't actually done.
2. **"What's Missing / TODO"** section — remove items that are now done (mark with ~~strikethrough~~ then remove). Update remaining counts (e.g. "4 enemy sprites" → "2 enemy sprites" if 2 were added).
3. **"Sprites (Critical)"** subsection — update the specific lists of missing vs completed sprites.
4. **Do NOT change** the Project Structure, Architecture, Key Conventions, or Player Controls sections unless they are factually wrong.

### Step 3: Update MEMORY.md index
Edit the memory index at the user's memory path. Ensure all memory files are listed and descriptions are current. Remove entries for memory files that no longer exist.

### Step 4: Update memory files
Update individual memory files (especially `project_next_session.md` and any state-tracking memories):

1. Mark completed work items as done with dates.
2. Update "Current State" sections to reflect reality.
3. Update sprite inventory lists.
4. Remove stale/outdated information.

### Step 5: Report
Output a brief summary of what was updated and any discrepancies found (e.g. sprite file exists but isn't loaded in game.js).

## Important
- Only update documentation to match reality — do NOT change code.
- Be conservative: if unsure whether something is done, leave it as TODO.
- Use today's date when marking items as done.
- Keep CLAUDE.md concise — it's read by AI on every conversation start.
