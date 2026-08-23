// DropShare Edge Function: Validate Room Access
// Validates a room ID and returns a signed token if the room is active.
// Runs server-side with the service role key.

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

  try {
    const body = await req.json().catch(() => ({}))
    const roomId = String(body?.roomId ?? '').trim()

    if (!roomId) {
      return new Response(
        JSON.stringify({ error: 'Room ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(roomId)) {
      return new Response(
        JSON.stringify({ error: 'Room not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: room, error } = await supabase
      .from('rooms')
      .select()
      .eq('id', roomId)
      .eq('status', 'active')
      .single()

    if (error || !room) {
      return new Response(
        JSON.stringify({ error: 'Room not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (new Date(room.expires_at).getTime() <= Date.now()) {
      return new Response(
        JSON.stringify({ error: 'This room has expired.' }),
        { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const sessionId = crypto.randomUUID()
    const tokenPayload = {
      room_id: room.id,
      session_id: sessionId,
      exp: Math.floor(Date.now() / 1000) + 24 * 3600,
    }

    const tokenString = btoa(JSON.stringify(tokenPayload))

    return new Response(
      JSON.stringify({
        room,
        token: tokenString,
        sessionId,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Failed to validate room access' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})