-- =============================================================================
-- Calles de Alberdi — Initial Supabase Migration
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- =============================================================================

-- ── 1. Leaderboard ──────────────────────────────────────────────────────────

create table leaderboard (
  id         bigint generated always as identity primary key,
  player     text not null default 'GAUCHO',
  score      int not null,
  level      int not null default 1,
  created_at timestamptz not null default now()
);

-- Index for the "top scores" query (ORDER BY score DESC LIMIT N)
create index idx_leaderboard_score on leaderboard (score desc);

-- RLS: anyone can read and insert, nobody can update or delete
alter table leaderboard enable row level security;

create policy "Anyone can read leaderboard"
  on leaderboard for select
  using (true);

create policy "Anyone can insert scores"
  on leaderboard for insert
  with check (true);


-- ── 2. Game Rooms (multiplayer) ─────────────────────────────────────────────

create table game_rooms (
  room_id    text primary key,             -- 4-char code e.g. "AB12"
  host_id    uuid not null,                -- anon auth user id of host
  guest_id   uuid,                         -- null until a guest joins
  status     text not null default 'waiting', -- waiting | playing | finished
  created_at timestamptz not null default now()
);

-- Index for rate-limit lookups: "rooms created by this user in last hour"
create index idx_game_rooms_host_created
  on game_rooms (host_id, created_at desc);

-- Index for finding open rooms by room code
create index idx_game_rooms_status
  on game_rooms (status) where status = 'waiting';

-- RLS policies
alter table game_rooms enable row level security;

-- Anyone (anonymous) can read rooms (needed to join by code)
create policy "Anyone can read rooms"
  on game_rooms for select
  using (true);

-- Only authenticated users can create rooms (anonymous auth still counts)
create policy "Authenticated users can create rooms"
  on game_rooms for insert
  with check (auth.uid() is not null);

-- Only the host can update their own room (e.g. set status to 'playing')
create policy "Host can update own room"
  on game_rooms for update
  using (auth.uid() = host_id);

-- Guests can join (update guest_id) if they are authenticated and room is waiting
-- This is handled via a function below for safety, but the RLS allows it:
create policy "Guest can join waiting room"
  on game_rooms for update
  using (
    status = 'waiting'
    and guest_id is null
    and auth.uid() is not null
  );

-- Only the host can delete/clean up their rooms
create policy "Host can delete own room"
  on game_rooms for delete
  using (auth.uid() = host_id);


-- ── 3. Rate Limiting — max 3 rooms per hour per user ────────────────────────

-- Function that checks how many rooms a user created in the last hour.
-- Called by a trigger BEFORE INSERT on game_rooms.
create or replace function check_room_rate_limit()
returns trigger as $$
declare
  recent_count int;
begin
  select count(*) into recent_count
  from game_rooms
  where host_id = new.host_id
    and created_at > now() - interval '1 hour';

  if recent_count >= 3 then
    raise exception 'Rate limit exceeded: max 3 rooms per hour'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$ language plpgsql security definer;

create trigger trg_room_rate_limit
  before insert on game_rooms
  for each row
  execute function check_room_rate_limit();


-- ── 4. Join Room Helper Function ────────────────────────────────────────────
-- Safely assigns the guest to a room (atomic, avoids race conditions)

create or replace function join_room(p_room_id text)
returns json as $$
declare
  room game_rooms;
begin
  -- Lock the row to prevent two guests joining simultaneously
  select * into room
  from game_rooms
  where room_id = p_room_id
  for update;

  if room is null then
    return json_build_object('error', 'Room not found');
  end if;

  if room.status != 'waiting' then
    return json_build_object('error', 'Room is not accepting players');
  end if;

  if room.guest_id is not null then
    return json_build_object('error', 'Room is full');
  end if;

  if room.host_id = auth.uid() then
    return json_build_object('error', 'Cannot join your own room');
  end if;

  update game_rooms
  set guest_id = auth.uid(),
      status = 'playing'
  where room_id = p_room_id;

  return json_build_object('ok', true, 'room_id', p_room_id);
end;
$$ language plpgsql security definer;


-- ── 5. Cleanup: auto-expire stale rooms ─────────────────────────────────────
-- Optional: run as a cron job via pg_cron or call manually.
-- Marks rooms older than 30 minutes that are still "waiting" as "finished".

create or replace function cleanup_stale_rooms()
returns void as $$
begin
  update game_rooms
  set status = 'finished'
  where status = 'waiting'
    and created_at < now() - interval '30 minutes';
end;
$$ language plpgsql security definer;


-- ── 6. Enable Realtime for game_rooms ───────────────────────────────────────
-- NOTE: This enables Postgres Changes (row-level updates) on the table.
-- Broadcast and Presence are client-side only and don't need DB config.
-- You ALSO need to enable Realtime in the Dashboard (see README).

alter publication supabase_realtime add table game_rooms;
