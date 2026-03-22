# Remove White Background from Sprite Sheet

Remove the white (or near-white) background from a sprite sheet PNG, replacing it with full transparency.

## Usage
`/remove-bg <file_path> [threshold]`

- `file_path` — path to the PNG file (e.g. `assets/bottle.png`)
- `threshold` (optional) — max distance from white to consider "background" (default: 30). Higher values catch off-white/light grey pixels too.

## How it works

1. Read the image and convert to RGBA
2. Flood-fill from all four corners to find the contiguous white background region
3. Set all background pixels to fully transparent (alpha = 0)
4. Also catch any near-white pixels (within threshold) that are NOT part of the character content — uses connected-component flood fill from edges so internal white pixels (e.g. eyes, highlights) are preserved
5. Save over the original file
6. Report pixel counts: total, removed, remaining

## Implementation

Run this Python script via Bash:

```python
from PIL import Image
from collections import deque

filepath = "FILEPATH"
threshold = THRESHOLD

img = Image.open(filepath).convert('RGBA')
w, h = img.size
pixels = img.load()

def is_white(p, thresh):
    return p[0] >= (255 - thresh) and p[1] >= (255 - thresh) and p[2] >= (255 - thresh) and p[3] > 0

visited = set()
queue = deque()

for x in range(w):
    if is_white(pixels[x, 0], threshold):
        queue.append((x, 0))
    if is_white(pixels[x, h-1], threshold):
        queue.append((x, h-1))
for y in range(h):
    if is_white(pixels[0, y], threshold):
        queue.append((0, y))
    if is_white(pixels[w-1, y], threshold):
        queue.append((w-1, y))

removed = 0
while queue:
    x, y = queue.popleft()
    if (x, y) in visited:
        continue
    if x < 0 or x >= w or y < 0 or y >= h:
        continue
    if not is_white(pixels[x, y], threshold):
        continue
    visited.add((x, y))
    pixels[x, y] = (0, 0, 0, 0)
    removed += 1
    for dx, dy in [(-1,0),(1,0),(0,-1),(0,1)]:
        nx, ny = x+dx, y+dy
        if 0 <= nx < w and 0 <= ny < h and (nx,ny) not in visited:
            queue.append((nx, ny))

img.save(filepath)
print(f"Done: {filepath}")
print(f"  Total pixels: {w*h}")
print(f"  Removed (background): {removed}")
print(f"  Remaining (content): {w*h - removed}")
```

Replace `FILEPATH` and `THRESHOLD` with the parsed arguments before running.

## Important notes
- Uses flood-fill from edges, NOT a global white-replace — this preserves white pixels inside the character (eyes, teeth, highlights, snow effects)
- For sprite sheets with grid lines between frames, those lines will also be removed since they connect to the edge background
- Default threshold of 30 catches slight off-white from JPEG compression or Gemini's background variations
- Always visually inspect the result after running (read the file to check)