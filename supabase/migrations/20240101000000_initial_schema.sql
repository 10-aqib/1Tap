-- Enable pgcrypto for UUIDs if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Rooms Table
CREATE TABLE public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    join_code VARCHAR(6) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'deleted'))
);

CREATE INDEX idx_rooms_join_code ON public.rooms(join_code);
CREATE INDEX idx_rooms_expires_at ON public.rooms(expires_at);

-- Room Items Table
CREATE TABLE public.room_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    type VARCHAR NOT NULL CHECK (type IN ('text', 'link', 'file')),
    content TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    session_id UUID NOT NULL
);

CREATE INDEX idx_room_items_room_id ON public.room_items(room_id);

-- Enable RLS
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_items ENABLE ROW LEVEL SECURITY;

-- Policies for rooms
CREATE POLICY "Anyone can create a room" ON public.rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view a room" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Anyone can update a room" ON public.rooms FOR UPDATE USING (true);

-- Policies for room_items
CREATE POLICY "Anyone can insert items" ON public.room_items FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.rooms
    WHERE id = room_items.room_id
    AND status = 'active'
    AND expires_at > NOW()
  )
);

CREATE POLICY "Anyone can view items" ON public.room_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.rooms
    WHERE id = room_items.room_id
    AND status = 'active'
    AND expires_at > NOW()
  )
);

-- Enable Realtime for room_items
alter publication supabase_realtime add table public.room_items;

-- Storage
-- Insert bucket (requires postgres role or bypass RLS)
INSERT INTO storage.buckets (id, name, public) VALUES ('room_files', 'room_files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- We assume the storage path will be `[room_id]/[file_id]`
CREATE POLICY "Anyone can upload files to active rooms" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'room_files' AND
  EXISTS (
    SELECT 1 FROM public.rooms
    WHERE id::text = (string_to_array(name, '/'))[1]
    AND status = 'active'
    AND expires_at > NOW()
  )
);

CREATE POLICY "Anyone can view files in active rooms" ON storage.objects FOR SELECT USING (
  bucket_id = 'room_files' AND
  EXISTS (
    SELECT 1 FROM public.rooms
    WHERE id::text = (string_to_array(name, '/'))[1]
    AND status = 'active'
    AND expires_at > NOW()
  )
);

CREATE POLICY "Anyone can delete files in active rooms" ON storage.objects FOR DELETE USING (
  bucket_id = 'room_files' AND
  EXISTS (
    SELECT 1 FROM public.rooms
    WHERE id::text = (string_to_array(name, '/'))[1]
  )
);

-- Cleanup function to mark rooms as expired and delete old items
CREATE OR REPLACE FUNCTION public.cleanup_expired_rooms()
RETURNS void AS $$
BEGIN
  -- Mark rooms as expired
  UPDATE public.rooms
  SET status = 'expired'
  WHERE expires_at <= NOW() AND status = 'active';

  -- We'll delete room_items for expired rooms to save DB space
  DELETE FROM public.room_items
  WHERE room_id IN (
    SELECT id FROM public.rooms WHERE status = 'expired' OR status = 'deleted'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
