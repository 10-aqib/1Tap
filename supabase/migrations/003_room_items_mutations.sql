-- Add UPDATE and DELETE policies for public.room_items

CREATE POLICY "Anyone can update items" ON public.room_items FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.rooms
    WHERE id = room_items.room_id
    AND status = 'active'
    AND expires_at > NOW()
  )
);

CREATE POLICY "Anyone can delete items" ON public.room_items FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.rooms
    WHERE id = room_items.room_id
    AND status = 'active'
    AND expires_at > NOW()
  )
);
