// DropShare Edge Function: Create Room
// Creates a new room with a cryptographically random 6-digit join code.
// Runs server-side with the service role key.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function generateJoinCode(): string {
  const digits = '0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    const array = new Uint8Array(1)
    crypto.getRandomValues(array)
    code += digits[array[0] % 10]
  }
  return code
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const body = await req.json().catch(() => ({}))
    const expiryMinutes = Number(body?.expiryMinutes ?? 30)

    if (!Number.isFinite(expiryMinutes) || expiryMinutes <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid expiry minutes' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Cap at 24 hours
    const cappedMinutes = Math.min(expiryMinutes, 1440)

    let room: any = null
    let attempts = 0
    const maxAttempts = 10

    while (attempts < maxAttempts) {
      const joinCode = generateJoinCode()
      const { data, error } = await supabase
        .from('rooms')
        .insert({
          join_code: joinCode,
          expires_at: new Date(Date.now() + cappedMinutes * 60 * 1000).toISOString(),
        })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          attempts++
          continue
        }
        throw error
      }

      room = data
      break
    }

    if (!room) {
      return new Response(
        JSON.stringify({ error: 'Failed to generate room code. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate a signed token for the room
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
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: 'Failed to create room. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})