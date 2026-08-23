// DropShare Edge Function: Create Upload Intent
// Generates a signed upload URL for a file in the room's storage path.
// Runs server-side with the service role key.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const ALLOWED_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'tiff',
  'pdf', 'txt', 'md', 'csv', 'json', 'xml', 'yaml', 'yml', 'log', 'rtf',
  'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  'zip', 'rar', '7z', 'tar', 'gz',
  'js', 'ts', 'jsx', 'tsx', 'py', 'java', 'c', 'cpp', 'h', 'hpp',
  'cs', 'go', 'rs', 'rb', 'php', 'swift', 'kt', 'kts', 'scala',
  'html', 'css', 'scss', 'sass', 'less', 'styl',
  'sql', 'sh', 'bash', 'zsh', 'fish',
  'env', 'ini', 'toml', 'cfg', 'conf',
])

const BLOCKED_EXTENSIONS = new Set([
  'exe', 'bat', 'cmd', 'msi', 'com', 'scr', 'pif', 'vbs', 'vbe',
  'js', 'jse', 'wsf', 'wsh', 'msc', 'cpl', 'inf', 'reg',
  'dll', 'sys', 'drv', 'efi', 'bin', 'deb', 'rpm', 'pkg',
  'app', 'apk', 'ipa', 'dmg', 'iso', 'img',
])

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const roomId = String(body?.roomId ?? '').trim()
    const fileName = String(body?.fileName ?? '').trim()
    const fileSize = Number(body?.fileSize ?? 0)
    const mimeType = String(body?.mimeType ?? 'application/octet-stream')

    if (!roomId) {
      return new Response(
        JSON.stringify({ error: 'Room ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(roomId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid room' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!fileName) {
      return new Response(
        JSON.stringify({ error: 'File name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const maxSize = 100 * 1024 * 1024
    if (!Number.isFinite(fileSize) || fileSize <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid file size' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    if (fileSize > maxSize) {
      return new Response(
        JSON.stringify({ error: 'This file exceeds the 100 MB limit.' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
    if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
      return new Response(
        JSON.stringify({ error: 'This file type is not supported.' }),
        { status: 415, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (BLOCKED_EXTENSIONS.has(ext)) {
      return new Response(
        JSON.stringify({ error: 'This file type is not allowed.' }),
        { status: 415, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Verify room exists and is active
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select()
      .eq('id', roomId)
      .eq('status', 'active')
      .single()

    if (roomError || !room) {
      return new Response(
        JSON.stringify({ error: 'Room not found or expired' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (new Date(room.expires_at).getTime() <= Date.now()) {
      return new Response(
        JSON.stringify({ error: 'This room has expired.' }),
        { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const fileId = crypto.randomUUID()
    const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `rooms/${roomId}/${fileId}/${safeFileName}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('rooms')
      .createSignedUploadUrl(storagePath, 3600, {
        contentType: mimeType,
      })

    if (uploadError || !uploadData) {
      return new Response(
        JSON.stringify({ error: 'Failed to create upload URL' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        storagePath,
        uploadUrl: uploadData.signedUrl,
        fileId,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Failed to create upload intent' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})