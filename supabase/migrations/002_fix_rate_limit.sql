-- =============================================================================
-- Calles de Alberdi — Migration 002: Fix rate limit + client-side cleanup
-- Run this in the Supabase SQL Editor AFTER 001_initial.sql
-- =============================================================================

-- ── 1. Fix rate limit: count only ACTIVE rooms (waiting/playing) ─────────────
-- Previously counted ALL rooms by created_at, so finished/abandoned rooms
-- permanently ate the user's quota. Now only active rooms count.

create or replace function check_room_rate_limit()
returns trigger as $$
declare
  recent_count int;
begin
  select count(*) into recent_count
  from game_rooms
  where host_id = new.host_id
    and created_at > now() - interval '1 hour'
    and status in ('waiting', 'playing');

  if recent_count >= 6 then
    raise exception 'Rate limit exceeded: max 6 active rooms per hour'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$ language plpgsql security definer;


-- ── 2. Per-user stale room cleanup (called by client before room creation) ───
-- Finishes the caller's own rooms that have been waiting/playing for >30 min.
-- No pg_cron needed — the client calls this RPC before creating a new room.

create or replace function cleanup_my_stale_rooms()
returns void as $$
begin
  update game_rooms
  set status = 'finished'
  where host_id = auth.uid()
    and status in ('waiting', 'playing')
    and created_at < now() - interval '30 minutes';
end;
$$ language plpgsql security definer;
