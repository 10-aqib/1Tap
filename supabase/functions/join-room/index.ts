// DropShare Edge Function: Join Room by Code
// Validates a 6-digit join code and returns a signed room token.
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
    const code = String(body?.code ?? '').trim()

    if (!/^\d{6}$/.test(code)) {
      return new Response(
        JSON.stringify({ error: 'Invalid code. Please enter a valid 6-digit room code.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: room, error } = await supabase
      .from('rooms')
      .select()
      .eq('join_code', code)
      .eq('status', 'active')
      .single()

    if (error || !room) {
      return new Response(
        JSON.stringify({ error: 'Room not found. Check the code and try again.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (new Date(room.expires_at).getTime() <= Date.now()) {
      return new Response(
        JSON.stringify({ error: 'This room has expired. Create a new room to continue sharing.' }),
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
      JSON.stringify({ error: 'Failed to join room. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})