# Calles de Alberdi

2D side-scrolling beat 'em up set in Barrio Alberdi, Cordoba, Argentina. Built with HTML5/JS using the [Kaplay.js](https://kaplayjs.com/) engine. Mobile-responsive with virtual gamepad.

**Live:** https://calles-de-alberdi.vercel.app

## Quick Start

```bash
npx serve -l 3000 .
```

Open http://localhost:3000. No build step needed.

## Game Modes

| Mode | Description |
|------|-------------|
| 1 Jugador | Solo play |
| 1P + Compañero IA | Solo with AI-controlled Player 2 |
| 2 Jugadores | Local co-op (P1: WASD+ZXQ, P2: IJKL+UOP) |

## Project Structure

```
index.html          — Entry point, canvas, virtual gamepad
game.js             — Scenes, combat, wave/boss system, camera
js/constants.js     — All tuning values, level defs, entity stats
js/entities.js      — Entity factories, AI, HUD, backgrounds
js/dialogue.js      — Undertale-style dialogue system
js/multiplayer.js   — Supabase client, leaderboard, rooms
api/config.js       — Vercel serverless function (Supabase creds)
scripts/            — Sprite generation (Python PIL)
assets/             — Sprites and sounds
```

**Load order:** index.html → Kaplay CDN → constants.js → entities.js → dialogue.js → multiplayer.js → game.js

## Deployment

The site auto-deploys to Vercel on every push to `main` or `claude/**` branches via GitHub Actions (`.github/workflows/deploy.yml`).

### Setup

1. Link the project to Vercel: `npx vercel`
2. Set env vars in Vercel dashboard: `SUPABASE_URL`, `SUPABASE_ANON`
3. Add `VERCEL_TOKEN` as a GitHub repository secret
4. Push to `main` or a `claude/*` branch — deploy triggers automatically

### Manual Deploy

```bash
npx vercel --prod
```

### Caching

JS and HTML are served with `Cache-Control: public, max-age=0, must-revalidate` so that new deploys are visible immediately. Chrome Android aggressively caches files — without `must-revalidate`, users would see stale code until the cache expired.

Static assets (sprites in `assets/`) use a 24-hour immutable cache since they change rarely.

These headers are configured in `vercel.json`.

## Sprite Generation

Sprites are generated programmatically using Python PIL:

```bash
python scripts/generate_sprites.py
```

This produces all 18 sprite sheets in `assets/`. No external APIs or payments required.

## Debug Mode

| Key | Action |
|-----|--------|
| `}` | Skip wave (kill all enemies) |
| `-` | Skip level |
| `B` | Skip to boss |
| `G` | Toggle god mode |
| `T` | Toggle auto-walk right |
