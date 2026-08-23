// DropShare Edge Function: Cleanup Expired Rooms
// Marks expired rooms, deletes associated items and storage files.
// Scheduled via pg_cron.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Verify this is an authorized call (cron or service role)
  const authHeader = req.headers.get('authorization')
  const expectedCron = Deno.env.get('CRON_SECRET')
  const isCron = expectedCron && authHeader === `Bearer ${expectedCron}`
  const isServiceRole = authHeader === `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`

  if (!isCron && !isServiceRole) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Find expired active rooms
    const { data: expiredRooms, error: roomsError } = await supabase
      .from('rooms')
      .select('id')
      .eq('status', 'active')
      .lt('expires_at', new Date().toISOString())

    if (roomsError) throw roomsError

    const roomIds = (expiredRooms ?? []).map(r => r.id)
    let deletedItems = 0
    let deletedFiles = 0

    for (const roomId of roomIds) {
      // Get items for storage cleanup
      const { data: items } = await supabase
        .from('room_items')
        .select('metadata')
        .eq('room_id', roomId)
        .eq('type', 'file')

      // Delete storage files
      if (items && items.length > 0) {
        const paths: string[] = []
        for (const item of items) {
          const meta = item.metadata as { storage_path?: string } | null
          if (meta?.storage_path) paths.push(meta.storage_path)
        }
        if (paths.length > 0) {
          const { error: storageError } = await supabase.storage.from('rooms').remove(paths)
          if (!storageError) deletedFiles += paths.length
        }
      }

      // Delete room items (cascade handles it, but explicit for clarity)
      const { count, error: itemsError } = await supabase
        .from('room_items')
        .delete()
        .eq('room_id', roomId)
        .select('*', { count: 'exact' })

      if (!itemsError && count) deletedItems += count

      // Mark room as deleted
      await supabase
        .from('rooms')
        .update({ status: 'deleted' })
        .eq('id', roomId)
    }

    return new Response(
      JSON.stringify({
        success: true,
        roomsProcessed: roomIds.length,
        itemsDeleted: deletedItems,
        filesDeleted: deletedFiles,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Cleanup failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})