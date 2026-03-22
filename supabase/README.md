# Supabase Setup — Calles de Alberdi

Step-by-step guide to configure Supabase for leaderboard and online 2P multiplayer.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in (GitHub login works).
2. Click **New Project**.
3. Choose your organization, name it `calles-de-alberdi`, pick a region close to Argentina (e.g. `South America (São Paulo)`), set a strong database password.
4. Wait for the project to finish provisioning (~2 minutes).

## 2. Enable Anonymous Auth

The game uses anonymous authentication so players get a UUID without signing up.

1. Go to **Authentication** > **Providers** in the Supabase dashboard.
2. Scroll down to **Anonymous Sign-Ins**.
3. Toggle it **ON** and click **Save**.

This lets the JS client call `supabase.auth.signInAnonymously()` to get a session.

## 3. Run the Migration SQL

1. Go to **SQL Editor** in the Supabase dashboard.
2. Click **New Query**.
3. Copy the entire contents of `supabase/migrations/001_initial.sql` and paste it in.
4. Click **Run** (or Ctrl+Enter).
5. You should see "Success. No rows returned" — that means all tables, policies, functions, and triggers were created.

### What it creates:
- `leaderboard` table with RLS (public read/insert)
- `game_rooms` table with RLS (host-only updates, rate limiting)
- Rate limit trigger: max 3 rooms per hour per user
- `join_room()` function: atomic guest join with row locking
- `cleanup_stale_rooms()` function: expire old waiting rooms
- Realtime publication for `game_rooms`

## 4. Enable Realtime for game_rooms

The migration adds `game_rooms` to the Realtime publication, but you also need to enable it in the dashboard:

1. Go to **Database** > **Replication** in the dashboard.
2. Under **supabase_realtime**, find the `game_rooms` table.
3. Make sure it is **enabled** (toggle on if not).

Note: The multiplayer system primarily uses Supabase Realtime **Broadcast** and **Presence** (which are client-side channel features and don't require DB replication). The DB publication is only needed if you want to listen to row changes (e.g., room status updates).

## 5. Get Your API Credentials

1. Go to **Settings** > **API** in the Supabase dashboard.
2. Copy these two values:
   - **Project URL** — looks like `https://abcdefghijkl.supabase.co`
   - **anon/public key** — a long JWT starting with `eyJ...`

You'll need these for the next step.

## 6. Configure the Game

### Option A: For Vercel deployment (recommended)

1. In your Vercel project, go to **Settings** > **Environment Variables**.
2. Add these two variables:
   - `SUPABASE_URL` = your Project URL
   - `SUPABASE_ANON` = your anon key
3. In `vercel.json`, the `/api/config` endpoint (a Vercel Serverless Function) serves these to the client at runtime.
4. Create the file `api/config.js` — see below.

### Option B: For local development

Create a file called `env-config.js` in the project root (it's gitignored):

```js
window.__SUPABASE_URL  = "https://abcdefghijkl.supabase.co";
window.__SUPABASE_ANON = "eyJ...your-anon-key...";
```

The game's `multiplayer.js` checks for these globals as a fallback.

### Option C: Direct replacement (quick testing)

Edit `js/multiplayer.js` directly and paste your values into the constants:
```js
const SUPABASE_URL  = "https://abcdefghijkl.supabase.co";
const SUPABASE_ANON = "eyJ...your-anon-key...";
```

**Warning:** Don't commit real keys to a public repo. The anon key is safe to expose (it's a public key designed for browser use), but keeping it in env vars is better practice.

## 7. Vercel Serverless Config Endpoint

Create `api/config.js` in the project root:

```js
export default function handler(req, res) {
  res.json({
    supabaseUrl:  process.env.SUPABASE_URL  || "",
    supabaseAnon: process.env.SUPABASE_ANON || "",
  });
}
```

This lets the static site fetch its config at runtime without baking keys into the source code. The `multiplayer.js` file fetches from `/api/config` on load.

## 8. Test It

### Leaderboard
Open the browser console and run:
```js
await submitScore("TEST", 999, 1);
const scores = await fetchLeaderboard();
console.log(scores);
```

### Multiplayer rooms
Check the `game_rooms` table in **Table Editor** after creating a room in-game.

## 9. Optional: Stale Room Cleanup

The `cleanup_stale_rooms()` function expires rooms older than 30 minutes. You can:

- **Manual:** Run `SELECT cleanup_stale_rooms();` in the SQL Editor occasionally.
- **Automatic (pg_cron):** If your Supabase plan supports it, enable the pg_cron extension and add:
  ```sql
  select cron.schedule('cleanup-rooms', '*/10 * * * *', 'select cleanup_stale_rooms()');
  ```
  This runs every 10 minutes.

## Security Notes

- The **anon key** is a public key — it's safe to use in browser code. It only has the permissions you grant via RLS policies.
- All table access is controlled by RLS. Even with the anon key, users can only do what the policies allow.
- The rate limit trigger prevents room spam (3 rooms/hour per anonymous user).
- The `join_room()` function uses `FOR UPDATE` row locking to prevent race conditions.
- Anonymous auth sessions expire after the Supabase default (configurable in dashboard under Auth > Settings).
