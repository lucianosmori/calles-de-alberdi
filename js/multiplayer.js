// =============================================================================
// Calles de Alberdi — js/multiplayer.js
// Supabase leaderboard + multiplayer stubs
// =============================================================================

// ── Supabase client ─────────────────────────────────────────────────────────
// Set these env vars in Vercel or replace with your project values.
// The CDN script (loaded in index.html) exposes window.supabase.
const SUPABASE_URL  = ""; // e.g. "https://xxx.supabase.co"
const SUPABASE_ANON = ""; // e.g. "eyJ..."

let _sb = null;

function getSupabase() {
  if (_sb) return _sb;
  if (!SUPABASE_URL || !SUPABASE_ANON) return null;
  if (typeof window.supabase === "undefined") return null;
  _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
  return _sb;
}

// ── Leaderboard ─────────────────────────────────────────────────────────────
// Table schema (create in Supabase SQL editor):
//
//   create table leaderboard (
//     id         bigint generated always as identity primary key,
//     player     text not null default 'GAUCHO',
//     score      int not null,
//     level      int not null default 1,
//     created_at timestamptz not null default now()
//   );
//
//   -- Enable Row Level Security but allow anonymous inserts/reads
//   alter table leaderboard enable row level security;
//   create policy "Anyone can read leaderboard"  on leaderboard for select using (true);
//   create policy "Anyone can insert scores"     on leaderboard for insert with check (true);

/**
 * Submit a score to the leaderboard.
 * @param {string} player — player name (e.g. "GAUCHO")
 * @param {number} score  — final score
 * @param {number} level  — last level reached (1-4)
 * @returns {Promise<boolean>} true if saved
 */
async function submitScore(player, score, level) {
  const sb = getSupabase();
  if (!sb) {
    console.warn("[Leaderboard] Supabase not configured — score not saved");
    return false;
  }
  const { error } = await sb
    .from("leaderboard")
    .insert({ player, score, level });
  if (error) {
    console.error("[Leaderboard] Insert failed:", error.message);
    return false;
  }
  return true;
}

/**
 * Fetch the top N scores from the leaderboard.
 * @param {number} limit — how many scores (default 10)
 * @returns {Promise<Array<{player:string, score:number, level:number}>>}
 */
async function fetchLeaderboard(limit = 10) {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("leaderboard")
    .select("player, score, level, created_at")
    .order("score", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("[Leaderboard] Fetch failed:", error.message);
    return [];
  }
  return data || [];
}


// ── QR Code Lobby (stub) ────────────────────────────────────────────────────
// Future: host creates a game room, generates a QR code URL with room ID.
// Guest scans QR → joins via Supabase Realtime channel.
// Both players see the same level, synced via presence + broadcast.
//
// Supabase Realtime pattern:
//   const channel = sb.channel(`room:${roomId}`);
//   channel.on("presence", { event: "sync" }, () => { ... });
//   channel.on("broadcast", { event: "player_state" }, (payload) => { ... });
//   channel.subscribe();
//
// Not yet implemented — single-player MVP first.
