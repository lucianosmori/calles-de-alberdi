// =============================================================================
// Calles de Alberdi — js/multiplayer.js
// Supabase leaderboard + multiplayer stubs
// =============================================================================

// ── Supabase client ─────────────────────────────────────────────────────────
// Config is resolved in this priority order:
//   1. window.__SUPABASE_URL / window.__SUPABASE_ANON  (set by env-config.js for local dev)
//   2. Fetched from /api/config  (Vercel serverless function, reads env vars)
//   3. Hard-coded fallback below  (replace for quick testing only)
// The CDN script (loaded in index.html) exposes window.supabase.

let _supabaseUrl  = window.__SUPABASE_URL  || "";
let _supabaseAnon = window.__SUPABASE_ANON || "";
let _sb = null;
let _configFetched = false;

/**
 * Fetch config from Vercel serverless endpoint.
 * Called once; silently falls back if endpoint doesn't exist (local dev).
 */
async function _fetchConfig() {
  if (_configFetched) return;
  _configFetched = true;
  // Skip fetch if we already have values from window globals
  if (_supabaseUrl && _supabaseAnon) return;
  try {
    const res = await fetch("/api/config");
    if (res.ok) {
      const cfg = await res.json();
      _supabaseUrl  = cfg.supabaseUrl  || _supabaseUrl;
      _supabaseAnon = cfg.supabaseAnon || _supabaseAnon;
    }
  } catch (_) {
    // /api/config not available (local dev without env-config.js) — that's fine
  }
}

/**
 * Get (or create) the Supabase client singleton.
 * Returns null if Supabase isn't configured yet.
 */
function getSupabase() {
  if (_sb) return _sb;
  if (!_supabaseUrl || !_supabaseAnon) return null;
  if (typeof window.supabase === "undefined") return null;
  _sb = window.supabase.createClient(_supabaseUrl, _supabaseAnon);
  return _sb;
}

/**
 * Initialize Supabase: fetch config, create client, sign in anonymously.
 * Call this once at game startup. Safe to call multiple times.
 * @returns {Promise<object|null>} The Supabase client, or null if not configured.
 */
async function initSupabase() {
  await _fetchConfig();
  const sb = getSupabase();
  if (!sb) {
    console.warn("[Supabase] Not configured — multiplayer and leaderboard disabled");
    return null;
  }
  // Sign in anonymously so we get a user UUID for room creation / RLS
  const { data: { session } } = await sb.auth.getSession();
  if (!session) {
    const { error } = await sb.auth.signInAnonymously();
    if (error) {
      console.error("[Supabase] Anonymous sign-in failed:", error.message);
    }
  }
  return sb;
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


// ── Multiplayer Room Management ─────────────────────────────────────────────

/**
 * Generate a random 4-character room code (uppercase letters + digits).
 */
function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/1/O/0 to avoid confusion
  let code = "";
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

/**
 * Create a new game room. The current user becomes the host.
 * @returns {Promise<{roomId: string}|{error: string}>}
 */
async function createRoom() {
  const sb = getSupabase();
  if (!sb) return { error: "Supabase not configured" };

  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const roomId = generateRoomCode();
  const { error } = await sb
    .from("game_rooms")
    .insert({ room_id: roomId, host_id: user.id });

  if (error) {
    // Rate limit or duplicate code
    console.error("[Room] Create failed:", error.message);
    return { error: error.message };
  }
  return { roomId };
}

/**
 * Join an existing room by code. Uses the DB function for atomic locking.
 * @param {string} roomId — 4-char room code
 * @returns {Promise<{ok: boolean}|{error: string}>}
 */
async function joinRoom(roomId) {
  const sb = getSupabase();
  if (!sb) return { error: "Supabase not configured" };

  const { data, error } = await sb.rpc("join_room", { p_room_id: roomId.toUpperCase() });

  if (error) {
    console.error("[Room] Join failed:", error.message);
    return { error: error.message };
  }
  if (data && data.error) {
    return { error: data.error };
  }
  return { ok: true };
}

/**
 * Subscribe to a room's Realtime channel for multiplayer sync.
 * Returns the channel object for sending/receiving game state.
 * @param {string} roomId
 * @param {object} callbacks — { onPresenceSync, onPlayerState, onStatus }
 * @returns {object|null} The Supabase Realtime channel
 */
function subscribeToRoom(roomId, callbacks = {}) {
  const sb = getSupabase();
  if (!sb) return null;

  const channel = sb.channel(`room:${roomId}`, {
    config: { presence: { key: roomId } },
  });

  if (callbacks.onPresenceSync) {
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      callbacks.onPresenceSync(state);
    });
  }

  if (callbacks.onPlayerState) {
    channel.on("broadcast", { event: "player_state" }, (payload) => {
      callbacks.onPlayerState(payload.payload);
    });
  }

  channel.subscribe((status) => {
    if (callbacks.onStatus) callbacks.onStatus(status);
  });

  return channel;
}

/**
 * Get the join URL for a room (for QR code generation).
 * @param {string} roomId
 * @returns {string}
 */
function getRoomUrl(roomId) {
  const base = window.location.origin + window.location.pathname;
  return `${base}?room=${roomId}`;
}
