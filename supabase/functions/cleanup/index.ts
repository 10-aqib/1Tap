import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    // Create a Supabase client with the Auth context of the logged in user.
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Mark rooms as expired if their expires_at is in the past
    const { data: expiredRooms, error: updateError } = await supabaseClient
      .from('rooms')
      .update({ status: 'expired' })
      .lte('expires_at', new Date().toISOString())
      .eq('status', 'active')
      .select('id')

    if (updateError) throw updateError

    // 2. Fetch all expired or deleted rooms to clean up their storage
    const { data: roomsToCleanup, error: selectError } = await supabaseClient
      .from('rooms')
      .select('id')
      .in('status', ['expired', 'deleted'])

    if (selectError) throw selectError

    let deletedFilesCount = 0;

    // 3. For each room, delete files from storage and room_items
    for (const room of roomsToCleanup) {
      // List files in the room's folder
      const { data: files, error: listError } = await supabaseClient
        .storage
        .from('room_files')
        .list(room.id)
      
      if (!listError && files && files.length > 0) {
        const filePaths = files.map(file => `${room.id}/${file.name}`)
        const { error: deleteStorageError } = await supabaseClient
          .storage
          .from('room_files')
          .remove(filePaths)
        
        if (!deleteStorageError) {
          deletedFilesCount += filePaths.length;
        }
      }

      // Delete items
      await supabaseClient
        .from('room_items')
        .delete()
        .eq('room_id', room.id)
    }

    return new Response(JSON.stringify({ 
      message: 'Cleanup successful', 
      expiredRoomsMarked: expiredRooms?.length || 0,
      filesDeleted: deletedFilesCount
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
