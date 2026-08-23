-- DropShare Supabase Migration: Schema and Security
-- Run this in the Supabase SQL editor or via `supabase db push`.

BEGIN;

-- ---------------------------------------------------------------------------
-- Custom types
-- ---------------------------------------------------------------------------

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'room_status') THEN
    CREATE TYPE room_status AS ENUM ('active', 'expired', 'deleted');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'item_type') THEN
    CREATE TYPE item_type AS ENUM ('text', 'link', 'file');
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  join_code VARCHAR(6) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status room_status NOT NULL DEFAULT 'active'
);

-- Enforce expiry > creation time
ALTER TABLE rooms
  ADD CONSTRAINT rooms_expires_after_created CHECK (expires_at > created_at);

-- Enforce join_code is exactly 6 digits
ALTER TABLE rooms
  ADD CONSTRAINT rooms_join_code_digits CHECK (join_code ~ '^[0-9]{6}$');

CREATE INDEX IF NOT EXISTS rooms_join_code_idx ON rooms (join_code);
CREATE INDEX IF NOT EXISTS rooms_expires_at_idx ON rooms (expires_at);
CREATE INDEX IF NOT EXISTS rooms_status_idx ON rooms (status);
CREATE INDEX IF NOT EXISTS rooms_last_activity_idx ON rooms (last_activity_at);

CREATE TABLE IF NOT EXISTS room_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms (id) ON DELETE CASCADE,
  type item_type NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  session_id UUID NOT NULL
);

-- Restrict content length per item type
ALTER TABLE room_items
  ADD CONSTRAINT room_items_content_length CHECK (length(content) <= 10000);

CREATE INDEX IF NOT EXISTS room_items_room_id_idx ON room_items (room_id);
CREATE INDEX IF NOT EXISTS room_items_type_idx ON room_items (type);
CREATE INDEX IF NOT EXISTS room_items_created_idx ON room_items (created_at DESC);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_items ENABLE ROW LEVEL SECURITY;

-- Helper: validate a signed room token claim
CREATE OR REPLACE FUNCTION dropshare_room_token_valid(p_room_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_token_claims JSONB;
BEGIN
  v_token_claims := current_setting('request.jwt.claims', true);
  IF v_token_claims IS NULL OR v_token_claims = '' THEN
    RETURN FALSE;
  END IF;
  RETURN (v_token_claims->>'room_id') = p_room_id::text
    AND (v_token_claims->>'exp')::bigint > EXTRACT(EPOCH FROM now());
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Rooms: only accessible with a valid signed token for that room
DROP POLICY IF EXISTS rooms_select ON rooms;
CREATE POLICY rooms_select ON rooms
  FOR SELECT
  USING (
    dropshare_room_token_valid(id)
    AND status = 'active'
  );

-- Room items: only accessible with a valid signed token for that room
DROP POLICY IF EXISTS room_items_select ON room_items;
CREATE POLICY room_items_select ON room_items
  FOR SELECT
  USING (dropshare_room_token_valid(room_id));

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------

ALTER TABLE room_items REPLICA IDENTITY FULL;
ALTER TABLE rooms REPLICA IDENTITY FULL;

-- Publication for realtime updates
DROP PUBLICATION IF EXISTS dropshare_realtime;
CREATE PUBLICATION dropshare_realtime FOR TABLE room_items, rooms;

-- ---------------------------------------------------------------------------
-- Cleanup function for expired rooms
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION dropshare_cleanup_expired_rooms()
RETURNS TABLE(expired_room_ids UUID[]) AS $$
BEGIN
  UPDATE rooms
  SET status = 'expired'
  WHERE status = 'active' AND expires_at <= now()
  RETURNING id INTO expired_room_ids;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;