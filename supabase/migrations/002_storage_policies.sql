-- DropShare Storage Setup
-- Run this in the Supabase SQL editor or via `supabase db push`.

-- Private bucket for room-scoped files
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('rooms', 'rooms', false, 104857600)  -- 100 MB limit
ON CONFLICT (id) DO NOTHING;

-- Storage policies: only allow access to files within the authenticated room path
-- Path format: rooms/{room-id}/{file-id}/{filename}

CREATE OR REPLACE FUNCTION dropshare_storage_room_id(p_path TEXT)
RETURNS UUID AS $$
DECLARE
  v_match TEXT[];
BEGIN
  v_match := regexp_matches(p_path, '^rooms/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/', 'i');
  IF v_match IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN v_match[1]::UUID;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- SELECT policy: require valid signed token for the room
DROP POLICY IF EXISTS rooms_storage_select ON storage.objects;
CREATE POLICY rooms_storage_select ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'rooms'
    AND dropshare_room_token_valid(dropshare_storage_room_id(name))
  );

-- INSERT policy: require valid signed token for the room
DROP POLICY IF EXISTS rooms_storage_insert ON storage.objects;
CREATE POLICY rooms_storage_insert ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'rooms'
    AND dropshare_room_token_valid(dropshare_storage_room_id(name))
  );

-- DELETE policy: require valid signed token for the room
DROP POLICY IF EXISTS rooms_storage_delete ON storage.objects;
CREATE POLICY rooms_storage_delete ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'rooms'
    AND dropshare_room_token_valid(dropshare_storage_room_id(name))
  );

-- Enable RLS on storage.objects if not already
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;