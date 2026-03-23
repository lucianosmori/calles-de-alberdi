#!/usr/bin/env python3
"""
Calles de Alberdi — Programmatic Sprite Sheet Generator
Generates all 18 sprite sheets using PIL (no external APIs).

Usage: python scripts/generate_sprites.py
Output: assets/hero_*.png, assets/enemy_*.png, assets/boss_*.png,
        assets/npc_*.png, assets/pickup_*.png
"""

import os
import math
from PIL import Image, ImageDraw

# ── Output directory ────────────────────────────────────────────────────────
ASSETS_DIR = os.path.join(os.path.dirname(__file__), "..", "assets")

# ── Grid specs per entity type ──────────────────────────────────────────────
PLAYER_GRID = (12, 6, 116, 126)  # cols, rows, cell_w, cell_h
ENEMY_GRID  = (8, 4, 116, 126)
BOSS_GRID   = (10, 5, 116, 126)
NPC_GRID    = (4, 1, 116, 126)
PICKUP_GRID = (4, 1, 48, 48)


# ============================================================================
# COLOUR HELPERS
# ============================================================================

def darken(col, amt):
    return tuple(max(0, c - amt) for c in col)

def lighten(col, amt):
    return tuple(min(255, c + amt) for c in col)

def skin_tone(base_col):
    """Derive a plausible skin tone from the character's main color."""
    return (210, 175, 140)  # warm neutral skin


# ============================================================================
# DRAWING PRIMITIVES — small pixel-art body parts
# ============================================================================

def draw_head(draw, cx, top, w, h, skin, hat_col=None, hat_style="none"):
    """Draw head + optional hat. cx = center x, top = top of head."""
    # Head oval
    draw.ellipse([cx - w//2, top, cx + w//2, top + h], fill=skin, outline=darken(skin, 40))

    # Eyes (2 dark pixels)
    ey = top + h * 2 // 5
    draw.rectangle([cx - 3, ey, cx - 1, ey + 2], fill=(30, 30, 30))
    draw.rectangle([cx + 1, ey, cx + 3, ey + 2], fill=(30, 30, 30))

    # Hat
    if hat_col and hat_style == "beret":
        draw.ellipse([cx - w//2 - 2, top - 4, cx + w//2 + 2, top + 5], fill=hat_col)
    elif hat_col and hat_style == "cap":
        draw.rectangle([cx - w//2 - 1, top - 3, cx + w//2 + 3, top + 3], fill=hat_col)
        draw.rectangle([cx + w//2 - 1, top - 1, cx + w//2 + 6, top + 3], fill=hat_col)  # brim
    elif hat_col and hat_style == "peaked":
        # Police/military peaked cap
        draw.rectangle([cx - w//2 - 2, top - 5, cx + w//2 + 2, top + 2], fill=hat_col)
        draw.rectangle([cx - w//2 - 4, top, cx + w//2 + 4, top + 3], fill=darken(hat_col, 20))  # brim
        # Badge
        draw.rectangle([cx - 2, top - 3, cx + 2, top], fill=(220, 200, 60))
    elif hat_col and hat_style == "wide":
        # Wide-brim hat (puntero/gaucho formal)
        draw.ellipse([cx - w//2 - 5, top - 6, cx + w//2 + 5, top + 2], fill=hat_col)
        draw.rectangle([cx - w//2 - 7, top - 1, cx + w//2 + 7, top + 2], fill=hat_col)  # brim


def draw_torso(draw, cx, top, w, h, col, detail=None):
    """Draw torso rectangle. detail can be 'poncho', 'tie', 'badge', 'scarf', 'vest'."""
    draw.rectangle([cx - w//2, top, cx + w//2, top + h], fill=col, outline=darken(col, 30))

    if detail == "poncho":
        # Triangle poncho overlay
        pts = [(cx, top - 2), (cx - w//2 - 4, top + h//2 + 4), (cx + w//2 + 4, top + h//2 + 4)]
        draw.polygon(pts, fill=lighten(col, 30))
        # Stripe
        draw.line([(cx - w//2 - 2, top + h//3), (cx + w//2 + 2, top + h//3)], fill=darken(col, 20), width=2)
    elif detail == "tie":
        draw.line([(cx, top + 2), (cx, top + h - 2)], fill=(180, 40, 40), width=2)
    elif detail == "badge":
        draw.rectangle([cx - 3, top + 4, cx + 3, top + 9], fill=(220, 200, 60))
    elif detail == "scarf":
        draw.rectangle([cx - w//2, top + 2, cx + w//2, top + 8], fill=(255, 255, 255))
    elif detail == "vest":
        draw.rectangle([cx - w//2 + 2, top, cx + w//2 - 2, top + h], fill=lighten(col, 20), outline=darken(col, 10))
    elif detail == "stripes":
        for sy in range(top + 3, top + h - 3, 6):
            draw.line([(cx - w//2 + 2, sy), (cx + w//2 - 2, sy)], fill=(255, 255, 255), width=1)


def draw_arm(draw, sx, sy, length, angle_deg, thickness, col):
    """Draw an arm as a thick line from (sx, sy) at given angle."""
    angle = math.radians(angle_deg)
    ex = sx + int(length * math.cos(angle))
    ey = sy + int(length * math.sin(angle))
    draw.line([(sx, sy), (ex, ey)], fill=col, width=thickness)
    # Fist
    draw.ellipse([ex - 2, ey - 2, ex + 2, ey + 2], fill=skin_tone(col))


def draw_legs(draw, cx, top, leg_len, col, stance="together", shoe_col=None):
    """Draw two legs. stance: together, stride_left, stride_right, wide, stagger, collapse, raise_front, extend_front."""
    shoe = shoe_col or darken(col, 50)
    lw = 4  # leg width

    if stance == "together":
        lx, rx = cx - 3, cx + 3
        draw.rectangle([lx - lw//2, top, lx + lw//2, top + leg_len], fill=col)
        draw.rectangle([rx - lw//2, top, rx + lw//2, top + leg_len], fill=col)
        draw.rectangle([lx - lw//2 - 1, top + leg_len - 3, lx + lw//2 + 1, top + leg_len], fill=shoe)
        draw.rectangle([rx - lw//2 - 1, top + leg_len - 3, rx + lw//2 + 1, top + leg_len], fill=shoe)
    elif stance == "stride_left":
        # Left leg forward, right back
        draw.rectangle([cx - 7 - lw//2, top, cx - 7 + lw//2, top + leg_len], fill=col)
        draw.rectangle([cx + 5 - lw//2, top, cx + 5 + lw//2, top + leg_len - 3], fill=col)
        draw.rectangle([cx - 7 - lw//2 - 1, top + leg_len - 3, cx - 7 + lw//2 + 1, top + leg_len], fill=shoe)
        draw.rectangle([cx + 5 - lw//2 - 1, top + leg_len - 6, cx + 5 + lw//2 + 1, top + leg_len - 3], fill=shoe)
    elif stance == "stride_right":
        draw.rectangle([cx + 7 - lw//2, top, cx + 7 + lw//2, top + leg_len], fill=col)
        draw.rectangle([cx - 5 - lw//2, top, cx - 5 + lw//2, top + leg_len - 3], fill=col)
        draw.rectangle([cx + 7 - lw//2 - 1, top + leg_len - 3, cx + 7 + lw//2 + 1, top + leg_len], fill=shoe)
        draw.rectangle([cx - 5 - lw//2 - 1, top + leg_len - 6, cx - 5 + lw//2 + 1, top + leg_len - 3], fill=shoe)
    elif stance == "wide":
        draw.rectangle([cx - 8 - lw//2, top, cx - 8 + lw//2, top + leg_len], fill=col)
        draw.rectangle([cx + 8 - lw//2, top, cx + 8 + lw//2, top + leg_len], fill=col)
        draw.rectangle([cx - 8 - lw//2 - 1, top + leg_len - 3, cx - 8 + lw//2 + 1, top + leg_len], fill=shoe)
        draw.rectangle([cx + 8 - lw//2 - 1, top + leg_len - 3, cx + 8 + lw//2 + 1, top + leg_len], fill=shoe)
    elif stance == "stagger":
        draw.rectangle([cx - 6 - lw//2, top, cx - 6 + lw//2, top + leg_len], fill=col)
        draw.rectangle([cx + 2 - lw//2, top + 3, cx + 2 + lw//2, top + leg_len], fill=col)
        draw.rectangle([cx - 6 - lw//2 - 1, top + leg_len - 3, cx - 6 + lw//2 + 1, top + leg_len], fill=shoe)
        draw.rectangle([cx + 2 - lw//2 - 1, top + leg_len - 3, cx + 2 + lw//2 + 1, top + leg_len], fill=shoe)
    elif stance == "collapse":
        # Lying on ground — draw horizontal legs
        draw.rectangle([cx - 14, top + leg_len - 6, cx + 14, top + leg_len - 2], fill=col)
        draw.rectangle([cx + 12, top + leg_len - 6, cx + 16, top + leg_len - 2], fill=shoe)
    elif stance == "raise_front":
        # Left leg planted, right leg raising for kick
        draw.rectangle([cx - 4 - lw//2, top, cx - 4 + lw//2, top + leg_len], fill=col)
        # Raised leg (angled up-right)
        draw.line([(cx + 4, top + 4), (cx + 14, top - 6)], fill=col, width=lw)
        draw.rectangle([cx - 4 - lw//2 - 1, top + leg_len - 3, cx - 4 + lw//2 + 1, top + leg_len], fill=shoe)
        draw.rectangle([cx + 12, top - 8, cx + 17, top - 5], fill=shoe)
    elif stance == "extend_front":
        # Kick fully extended
        draw.rectangle([cx - 5 - lw//2, top, cx - 5 + lw//2, top + leg_len], fill=col)
        draw.line([(cx + 2, top + 2), (cx + 20, top - 2)], fill=col, width=lw)
        draw.rectangle([cx - 5 - lw//2 - 1, top + leg_len - 3, cx - 5 + lw//2 + 1, top + leg_len], fill=shoe)
        draw.rectangle([cx + 18, top - 5, cx + 23, top], fill=shoe)


# ============================================================================
# FULL CHARACTER DRAWING — compose body parts into a pose
# ============================================================================

def draw_character(draw, cx, bottom, char_h, pose, cfg):
    """
    Draw a complete character at (cx, bottom) with feet at bottom.
    char_h = total character height in pixels.
    cfg = dict with: col, skin, hat_col, hat_style, torso_detail, leg_col, shoe_col, arm_thickness, body_scale
    """
    col = cfg["col"]
    skin = cfg.get("skin", skin_tone(col))
    hat_col = cfg.get("hat_col")
    hat_style = cfg.get("hat_style", "none")
    torso_detail = cfg.get("torso_detail")
    leg_col = cfg.get("leg_col", darken(col, 30))
    shoe_col = cfg.get("shoe_col", (60, 40, 30))
    arm_thick = cfg.get("arm_thickness", 3)
    bs = cfg.get("body_scale", 1.0)

    # Proportions (relative to char_h)
    head_h = int(14 * bs)
    head_w = int(12 * bs)
    torso_h = int(18 * bs)
    torso_w = int(16 * bs)
    leg_len = int(16 * bs)
    arm_len = int(14 * bs)

    # Apply lean
    lean = pose.get("lean", 0)
    cx += lean

    # Vertical positions (bottom-up)
    legs_top = bottom - leg_len
    torso_top = legs_top - torso_h
    head_top = torso_top - head_h

    # Draw order: legs, torso, arms, head (back to front)
    draw_legs(draw, cx, legs_top, leg_len, leg_col,
              stance=pose.get("legs", "together"), shoe_col=shoe_col)
    draw_torso(draw, cx, torso_top, torso_w, torso_h, col, detail=torso_detail)
    draw_head(draw, cx, head_top, head_w, head_h, skin,
              hat_col=hat_col, hat_style=hat_style)

    # Arms
    arm_mode = pose.get("arms", "down")
    shoulder_y = torso_top + 3
    l_shoulder = cx - torso_w // 2
    r_shoulder = cx + torso_w // 2

    if arm_mode == "down":
        draw_arm(draw, l_shoulder, shoulder_y, arm_len, 80, arm_thick, col)
        draw_arm(draw, r_shoulder, shoulder_y, arm_len, 100, arm_thick, col)
    elif arm_mode == "swing_back":
        draw_arm(draw, l_shoulder, shoulder_y, arm_len, 120, arm_thick, col)
        draw_arm(draw, r_shoulder, shoulder_y, arm_len, 60, arm_thick, col)
    elif arm_mode == "swing_fwd":
        draw_arm(draw, l_shoulder, shoulder_y, arm_len, 60, arm_thick, col)
        draw_arm(draw, r_shoulder, shoulder_y, arm_len, 120, arm_thick, col)
    elif arm_mode == "wind_back":
        draw_arm(draw, l_shoulder, shoulder_y, arm_len, 140, arm_thick, col)
        draw_arm(draw, r_shoulder, shoulder_y, arm_len, 160, arm_thick, col)
    elif arm_mode == "extend_fwd":
        draw_arm(draw, l_shoulder, shoulder_y, arm_len, 80, arm_thick, col)
        draw_arm(draw, r_shoulder, shoulder_y, int(arm_len * 1.4), 10, arm_thick + 1, col)
    elif arm_mode == "guard":
        draw_arm(draw, l_shoulder, shoulder_y, arm_len * 2 // 3, -30, arm_thick, col)
        draw_arm(draw, r_shoulder, shoulder_y, arm_len * 2 // 3, -10, arm_thick, col)
    elif arm_mode == "flinch":
        draw_arm(draw, l_shoulder, shoulder_y, arm_len, 130, arm_thick, col)
        draw_arm(draw, r_shoulder, shoulder_y, arm_len, 50, arm_thick, col)
    elif arm_mode == "spread":
        draw_arm(draw, l_shoulder, shoulder_y, arm_len, 170, arm_thick, col)
        draw_arm(draw, r_shoulder, shoulder_y, arm_len, 10, arm_thick, col)


# ============================================================================
# POSE SEQUENCES — frame-by-frame definitions for each animation row
# ============================================================================

POSE_IDLE = [
    {"arms": "down", "legs": "together", "lean": 0},
    {"arms": "down", "legs": "together", "lean": 0},  # subtle breathing could be added
]

POSE_WALK = [
    {"arms": "swing_back", "legs": "stride_left",  "lean": 1},
    {"arms": "down",       "legs": "together",     "lean": 0},
    {"arms": "swing_fwd",  "legs": "stride_right", "lean": -1},
    {"arms": "down",       "legs": "together",     "lean": 0},
]

POSE_PUNCH = [
    {"arms": "wind_back",   "legs": "wide",     "lean": -2},
    {"arms": "extend_fwd",  "legs": "wide",     "lean": 3},
    {"arms": "extend_fwd",  "legs": "wide",     "lean": 2},
    {"arms": "down",        "legs": "together",  "lean": 0},
]

POSE_KICK = [
    {"arms": "guard", "legs": "raise_front",   "lean": -1},
    {"arms": "guard", "legs": "extend_front",  "lean": 3},
    {"arms": "guard", "legs": "extend_front",  "lean": 2},
    {"arms": "guard", "legs": "together",      "lean": 0},
]

POSE_SPECIAL = [
    {"arms": "spread", "legs": "wide",     "lean": 0},
    {"arms": "guard",  "legs": "wide",     "lean": 0},
    {"arms": "spread", "legs": "wide",     "lean": 0},
    {"arms": "down",   "legs": "together", "lean": 0},
]

POSE_HURT = [
    {"arms": "flinch", "legs": "stagger", "lean": -4},
    {"arms": "flinch", "legs": "stagger", "lean": -3},
    {"arms": "flinch", "legs": "stagger", "lean": -2},
    {"arms": "down",   "legs": "together","lean": 0},
]

POSE_DEATH = [
    {"arms": "flinch",  "legs": "stagger",  "lean": -5},
    {"arms": "spread",  "legs": "stagger",  "lean": -8},
    {"arms": "spread",  "legs": "collapse", "lean": 0},
    {"arms": "spread",  "legs": "collapse", "lean": 0},
]

POSE_ATTACK = POSE_PUNCH  # enemies reuse punch as their attack


def tile_poses(poses, count):
    """Repeat/tile a pose list to fill `count` frames."""
    if len(poses) == 0:
        return [{"arms": "down", "legs": "together", "lean": 0}] * count
    return [poses[i % len(poses)] for i in range(count)]


# ============================================================================
# SHEET GENERATORS
# ============================================================================

def create_sheet(cols, rows, cell_w, cell_h):
    """Create a blank RGBA sheet."""
    return Image.new("RGBA", (cols * cell_w, rows * cell_h), (0, 0, 0, 0))


def fill_row(img, draw, row, cols, cell_w, cell_h, poses, char_h, cfg):
    """Draw a row of character frames."""
    pose_list = tile_poses(poses, cols)
    for c in range(cols):
        cx = c * cell_w + cell_w // 2
        bottom = row * cell_h + cell_h - 8  # 8px margin from cell bottom
        draw_character(draw, cx, bottom, char_h, pose_list[c], cfg)


def generate_player_sheet(name, cfg):
    """12 cols × 6 rows: idle, walk, punch+kick, special, hurt, death."""
    cols, rows, cw, ch = PLAYER_GRID
    img = create_sheet(cols, rows, cw, ch)
    draw = ImageDraw.Draw(img)
    h = cfg.get("char_h", 52)

    fill_row(img, draw, 0, cols, cw, ch, POSE_IDLE, h, cfg)        # Row 0: idle
    fill_row(img, draw, 1, cols, cw, ch, POSE_WALK, h, cfg)        # Row 1: walk
    # Row 2: punch (cols 0-3) + kick (cols 4-7) + idle fill
    punch_poses = tile_poses(POSE_PUNCH, 4)
    kick_poses  = tile_poses(POSE_KICK, 4)
    idle_poses  = tile_poses(POSE_IDLE, 4)
    row2 = punch_poses + kick_poses + idle_poses
    for c, pose in enumerate(row2):
        cx = c * cw + cw // 2
        bottom = 2 * ch + ch - 8
        draw_character(draw, cx, bottom, h, pose, cfg)
    fill_row(img, draw, 3, cols, cw, ch, POSE_SPECIAL, h, cfg)     # Row 3: special
    fill_row(img, draw, 4, cols, cw, ch, POSE_HURT, h, cfg)        # Row 4: hurt
    fill_row(img, draw, 5, cols, cw, ch, POSE_DEATH, h, cfg)       # Row 5: death

    path = os.path.join(ASSETS_DIR, f"{name}.png")
    img.save(path)
    print(f"  OK {name}.png ({img.size[0]}x{img.size[1]})")


def generate_enemy_sheet(name, cfg):
    """8 cols × 4 rows: walk, attack, hurt+death, idle."""
    cols, rows, cw, ch = ENEMY_GRID
    img = create_sheet(cols, rows, cw, ch)
    draw = ImageDraw.Draw(img)
    h = cfg.get("char_h", 48)

    fill_row(img, draw, 0, cols, cw, ch, POSE_WALK, h, cfg)     # Row 0: walk
    fill_row(img, draw, 1, cols, cw, ch, POSE_ATTACK, h, cfg)   # Row 1: attack
    # Row 2: hurt (cols 0-3) + death (cols 4-7)
    hurt_poses  = tile_poses(POSE_HURT, 4)
    death_poses = tile_poses(POSE_DEATH, 4)
    row2 = hurt_poses + death_poses
    for c, pose in enumerate(row2):
        cx = c * cw + cw // 2
        bottom = 2 * ch + ch - 8
        draw_character(draw, cx, bottom, h, pose, cfg)
    fill_row(img, draw, 3, cols, cw, ch, POSE_IDLE, h, cfg)     # Row 3: idle

    path = os.path.join(ASSETS_DIR, f"{name}.png")
    img.save(path)
    print(f"  OK {name}.png ({img.size[0]}x{img.size[1]})")


def generate_boss_sheet(name, cfg):
    """10 cols × 5 rows: idle, walk, attack, special, hurt+death."""
    cols, rows, cw, ch = BOSS_GRID
    img = create_sheet(cols, rows, cw, ch)
    draw = ImageDraw.Draw(img)
    h = cfg.get("char_h", 60)

    fill_row(img, draw, 0, cols, cw, ch, POSE_IDLE, h, cfg)      # Row 0: idle
    fill_row(img, draw, 1, cols, cw, ch, POSE_WALK, h, cfg)      # Row 1: walk
    fill_row(img, draw, 2, cols, cw, ch, POSE_ATTACK, h, cfg)    # Row 2: attack
    fill_row(img, draw, 3, cols, cw, ch, POSE_SPECIAL, h, cfg)   # Row 3: special
    # Row 4: hurt (cols 0-4) + death (cols 5-9)
    hurt_poses  = tile_poses(POSE_HURT, 5)
    death_poses = tile_poses(POSE_DEATH, 5)
    row4 = hurt_poses + death_poses
    for c, pose in enumerate(row4):
        cx = c * cw + cw // 2
        bottom = 4 * ch + ch - 8
        draw_character(draw, cx, bottom, h, pose, cfg)

    path = os.path.join(ASSETS_DIR, f"{name}.png")
    img.save(path)
    print(f"  OK {name}.png ({img.size[0]}x{img.size[1]})")


def generate_npc_sheet(name, cfg):
    """4 cols × 1 row: walk cycle."""
    cols, rows, cw, ch = NPC_GRID
    img = create_sheet(cols, rows, cw, ch)
    draw = ImageDraw.Draw(img)
    h = cfg.get("char_h", 44)

    fill_row(img, draw, 0, cols, cw, ch, POSE_WALK, h, cfg)

    path = os.path.join(ASSETS_DIR, f"{name}.png")
    img.save(path)
    print(f"  OK {name}.png ({img.size[0]}x{img.size[1]})")


# ============================================================================
# PICKUP DRAWING — simple food/item shapes
# ============================================================================

def draw_empanada(draw, cx, cy, size):
    """Golden half-moon empanada."""
    r = size // 2
    draw.pieslice([cx - r, cy - r//2, cx + r, cy + r + r//2], 180, 360, fill=(220, 170, 80), outline=(160, 120, 40))
    # Crimped edge
    for i in range(-r + 3, r, 4):
        draw.ellipse([cx + i - 1, cy - r//4 - 1, cx + i + 1, cy - r//4 + 1], fill=(180, 130, 50))


def draw_mate(draw, cx, cy, size):
    """Green mate gourd with bombilla."""
    r = size // 3
    # Gourd
    draw.ellipse([cx - r, cy - r + 2, cx + r, cy + r + 2], fill=(80, 140, 60), outline=(50, 100, 35))
    # Metal rim
    draw.rectangle([cx - r + 2, cy - r + 1, cx + r - 2, cy - r + 4], fill=(180, 180, 170))
    # Bombilla (straw)
    draw.line([(cx + 2, cy - r + 3), (cx + r + 4, cy - r - 6)], fill=(190, 185, 170), width=2)


def draw_fernet(draw, cx, cy, size):
    """Dark bottle shape."""
    bw = size // 4
    bh = size // 2 + 2
    # Body
    draw.rectangle([cx - bw, cy - bh//2 + 3, cx + bw, cy + bh//2], fill=(50, 30, 20), outline=(30, 15, 10))
    # Neck
    draw.rectangle([cx - bw//2, cy - bh//2 - 2, cx + bw//2, cy - bh//2 + 4], fill=(50, 30, 20))
    # Label
    draw.rectangle([cx - bw + 2, cy - 2, cx + bw - 2, cy + 5], fill=(200, 180, 60))
    # Cap
    draw.rectangle([cx - bw//2 + 1, cy - bh//2 - 4, cx + bw//2 - 1, cy - bh//2 - 1], fill=(160, 40, 40))


def draw_choripan(draw, cx, cy, size):
    """Elongated bread with chorizo filling."""
    bw = size // 2 + 2
    bh = size // 5
    # Bread
    draw.ellipse([cx - bw, cy - bh, cx + bw, cy + bh], fill=(210, 180, 120), outline=(170, 140, 80))
    # Filling (chorizo)
    draw.ellipse([cx - bw + 4, cy - bh//2, cx + bw - 4, cy + bh//2], fill=(160, 70, 40))
    # Chimichurri dots
    for dx in range(-bw + 8, bw - 4, 5):
        draw.ellipse([cx + dx, cy - 1, cx + dx + 2, cy + 1], fill=(60, 130, 40))


def generate_pickup_sheet(name, draw_func, cfg):
    """4 cols × 1 row: 4 frames with subtle sparkle animation."""
    cols, rows, cw, ch = PICKUP_GRID
    img = create_sheet(cols, rows, cw, ch)
    draw = ImageDraw.Draw(img)

    for c in range(cols):
        cx = c * cw + cw // 2
        cy = ch // 2 + 2
        draw_func(draw, cx, cy, cw - 8)

        # Sparkle variation per frame
        if c > 0:
            sparkle_offsets = [(-8, -8), (8, -6), (-6, 8), (7, 7)]
            for i in range(c):
                sx = cx + sparkle_offsets[i][0]
                sy = cy + sparkle_offsets[i][1]
                draw.rectangle([sx, sy, sx + 1, sy + 1], fill=(255, 255, 200))

    path = os.path.join(ASSETS_DIR, f"{name}.png")
    img.save(path)
    print(f"  OK {name}.png ({img.size[0]}x{img.size[1]})")


# ============================================================================
# CHARACTER CONFIGS — colours, features, proportions for each entity
# ============================================================================

PLAYER_CFGS = {
    "hero_gaucho": {
        "col": (200, 180, 140),
        "hat_col": (80, 60, 40),
        "hat_style": "beret",
        "torso_detail": "poncho",
        "leg_col": (100, 80, 60),
        "shoe_col": (80, 50, 30),
        "char_h": 52,
        "body_scale": 1.0,
    },
    "hero_cordobesa": {
        "col": (180, 100, 160),
        "hat_col": None,
        "hat_style": "none",
        "torso_detail": None,
        "leg_col": (100, 60, 100),
        "shoe_col": (140, 60, 120),
        "char_h": 50,
        "body_scale": 0.95,
    },
}

ENEMY_CFGS = {
    "enemy_punguista": {
        "col": (160, 100, 80),
        "hat_col": (100, 70, 50),
        "hat_style": "cap",
        "torso_detail": None,
        "leg_col": (80, 60, 50),
        "shoe_col": (60, 40, 30),
        "char_h": 46,
        "body_scale": 0.9,
    },
    "enemy_patotero": {
        "col": (140, 70, 50),
        "hat_col": None,
        "hat_style": "none",
        "torso_detail": None,
        "leg_col": (70, 50, 40),
        "shoe_col": (50, 30, 20),
        "char_h": 50,
        "body_scale": 1.05,
    },
    "enemy_naranjita": {
        "col": (255, 160, 50),
        "hat_col": (200, 120, 30),
        "hat_style": "cap",
        "torso_detail": "vest",
        "leg_col": (100, 80, 50),
        "shoe_col": (80, 60, 40),
        "char_h": 44,
        "body_scale": 0.85,
    },
}

BOSS_CFGS = {
    "boss_comisario": {
        "col": (40, 50, 80),
        "hat_col": (30, 40, 70),
        "hat_style": "peaked",
        "torso_detail": "badge",
        "leg_col": (30, 35, 60),
        "shoe_col": (20, 20, 30),
        "char_h": 62,
        "body_scale": 1.2,
    },
    "boss_barra_brava": {
        "col": (50, 120, 180),
        "hat_col": None,
        "hat_style": "none",
        "torso_detail": "scarf",
        "leg_col": (40, 60, 100),
        "shoe_col": (60, 60, 60),
        "char_h": 58,
        "body_scale": 1.1,
    },
    "boss_puntero": {
        "col": (120, 80, 40),
        "hat_col": (100, 70, 35),
        "hat_style": "wide",
        "torso_detail": None,
        "leg_col": (80, 55, 30),
        "shoe_col": (50, 35, 20),
        "char_h": 56,
        "body_scale": 1.05,
    },
    "boss_intendente": {
        "col": (30, 30, 60),
        "hat_col": None,
        "hat_style": "none",
        "torso_detail": "tie",
        "leg_col": (25, 25, 50),
        "shoe_col": (15, 15, 25),
        "char_h": 66,
        "body_scale": 1.3,
    },
}

NPC_CFGS = {
    "npc_belgrano_fan": {
        "col": (50, 140, 200),
        "hat_col": None,
        "hat_style": "none",
        "torso_detail": "stripes",
        "leg_col": (40, 60, 100),
        "shoe_col": (60, 60, 60),
        "char_h": 44,
        "body_scale": 0.85,
    },
    "npc_feminist": {
        "col": (140, 50, 140),
        "hat_col": None,
        "hat_style": "none",
        "torso_detail": "scarf",
        "leg_col": (80, 40, 80),
        "shoe_col": (60, 30, 60),
        "char_h": 44,
        "body_scale": 0.85,
    },
    "npc_peronist": {
        "col": (100, 140, 200),
        "hat_col": None,
        "hat_style": "none",
        "torso_detail": None,
        "leg_col": (70, 90, 130),
        "shoe_col": (50, 50, 50),
        "char_h": 44,
        "body_scale": 0.9,
    },
    "npc_trapito": {
        "col": (200, 140, 60),
        "hat_col": (180, 120, 40),
        "hat_style": "cap",
        "torso_detail": "vest",
        "leg_col": (100, 80, 40),
        "shoe_col": (70, 50, 30),
        "char_h": 42,
        "body_scale": 0.85,
    },
    "npc_vecina": {
        "col": (180, 160, 140),
        "hat_col": None,
        "hat_style": "none",
        "torso_detail": None,
        "leg_col": (120, 100, 80),
        "shoe_col": (80, 60, 50),
        "char_h": 42,
        "body_scale": 0.85,
    },
}


# ============================================================================
# MAIN — generate everything
# ============================================================================

def main():
    os.makedirs(ASSETS_DIR, exist_ok=True)

    print("Generating player sprites...")
    for name, cfg in PLAYER_CFGS.items():
        generate_player_sheet(name, cfg)

    print("Generating enemy sprites...")
    for name, cfg in ENEMY_CFGS.items():
        generate_enemy_sheet(name, cfg)

    print("Generating boss sprites...")
    for name, cfg in BOSS_CFGS.items():
        generate_boss_sheet(name, cfg)

    print("Generating NPC sprites...")
    for name, cfg in NPC_CFGS.items():
        generate_npc_sheet(name, cfg)

    print("Generating pickup sprites...")
    pickups = {
        "pickup_empanada": draw_empanada,
        "pickup_mate":     draw_mate,
        "pickup_fernet":   draw_fernet,
        "pickup_choripan": draw_choripan,
    }
    for name, draw_func in pickups.items():
        generate_pickup_sheet(name, draw_func, {})

    print(f"\nDone! {len(PLAYER_CFGS) + len(ENEMY_CFGS) + len(BOSS_CFGS) + len(NPC_CFGS) + len(pickups)} sprites generated in {ASSETS_DIR}")


if __name__ == "__main__":
    main()
