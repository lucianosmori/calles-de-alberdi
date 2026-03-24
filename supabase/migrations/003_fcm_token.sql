-- Add FCM token column to game_rooms for push notifications.
-- The host stores their Firebase Cloud Messaging token here when creating a room.
-- The /api/notify serverless function reads it to send a push when player 2 joins.
ALTER TABLE game_rooms ADD COLUMN IF NOT EXISTS host_fcm_token text;
