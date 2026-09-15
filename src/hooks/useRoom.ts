import { useState, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { supabase } from '../lib/supabase'
import type { Room } from '../types'
import { generateJoinCode, generateWifiCode, getNetworkIdentifier } from '../lib/utils'
import { addMinutes } from 'date-fns'

// Store session ID in local storage
const getOrCreateSessionId = () => {
  let sessionId = localStorage.getItem('dropshare_session_id')
  if (!sessionId) {
    sessionId = uuidv4()
    localStorage.setItem('dropshare_session_id', sessionId)
  }
  return sessionId
}

export const useRoom = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const sessionId = getOrCreateSessionId()

  const createRoom = useCallback(async (expiryMinutes: number): Promise<Room | null> => {
    setLoading(true)
    setError(null)
    try {
      let code = generateJoinCode()
      let retries = 0
      let success = false
      let newRoom: Room | null = null

      while (!success && retries < 5) {
        const expiresAt = addMinutes(new Date(), expiryMinutes).toISOString()
        const { data, error } = await supabase
          .from('rooms')
          .insert({
            join_code: code,
            expires_at: expiresAt,
            status: 'active'
          })
          .select()
          .single()

        if (error) {
          if (error.code === '23505') { // Unique violation
            code = generateJoinCode()
            retries++
          } else {
            throw error
          }
        } else {
          newRoom = data as Room
          success = true
        }
      }

      if (!success) {
        throw new Error('Failed to generate a unique room code. Please try again.')
      }

      return newRoom
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating the room.')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const joinRoomByCode = useCallback(async (code: string): Promise<Room | null> => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('join_code', code)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Room not found or has expired.')
        }
        throw error
      }

      return data as Room
    } catch (err: any) {
      setError(err.message || 'An error occurred while joining the room.')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const getRoomById = useCallback(async (id: string): Promise<Room | null> => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        throw error
      }

      // Check expiry on client side as well for accurate state
      if (data.status === 'active' && new Date(data.expires_at) <= new Date()) {
        return { ...data, status: 'expired' } as Room
      }

      return data as Room
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching the room.')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const extendRoom = useCallback(async (id: string, additionalMinutes: number): Promise<boolean> => {
    setLoading(true)
    setError(null)
    try {
      // First get current room to see current expires_at
      const { data: currentRoom, error: fetchError } = await supabase
        .from('rooms')
        .select('expires_at')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      const newExpiresAt = addMinutes(new Date(currentRoom.expires_at), additionalMinutes).toISOString()

      const { error: updateError } = await supabase
        .from('rooms')
        .update({ expires_at: newExpiresAt })
        .eq('id', id)

      if (updateError) throw updateError
      
      return true
    } catch (err: any) {
      setError(err.message || 'An error occurred while extending the room.')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const getOrCreateSharedWifiRoom = useCallback(async (): Promise<Room | null> => {
    setLoading(true)
    setError(null)
    try {
      const { ip } = await getNetworkIdentifier()
      const wifiCode = generateWifiCode(ip)
      const expiresAt = addMinutes(new Date(), 1440).toISOString() // 24h active window

      // Try finding an existing room with this deterministic Wi-Fi code
      const { data: existingRoom, error: fetchErr } = await supabase
        .from('rooms')
        .select('*')
        .eq('join_code', wifiCode)
        .maybeSingle()

      if (existingRoom && !fetchErr) {
        // If expired or expiring soon, renew it
        if (existingRoom.status !== 'active' || new Date(existingRoom.expires_at) <= addMinutes(new Date(), 60)) {
          const { data: updatedRoom } = await supabase
            .from('rooms')
            .update({
              status: 'active',
              expires_at: expiresAt,
              last_activity_at: new Date().toISOString()
            })
            .eq('id', existingRoom.id)
            .select()
            .single()

          if (updatedRoom) {
            return { ...(updatedRoom as Room), room_type: 'shared' }
          }
        }
        return { ...(existingRoom as Room), room_type: 'shared' }
      }

      // If not found, insert new room
      const { data: createdRoom, error: insertErr } = await supabase
        .from('rooms')
        .insert({
          join_code: wifiCode,
          expires_at: expiresAt,
          status: 'active'
        })
        .select()
        .single()

      if (insertErr) {
        // Handle concurrent join on same Wi-Fi
        if (insertErr.code === '23505') {
          const { data: retryRoom } = await supabase
            .from('rooms')
            .select('*')
            .eq('join_code', wifiCode)
            .single()
          if (retryRoom) {
            return { ...(retryRoom as Room), room_type: 'shared' }
          }
        }
        throw insertErr
      }

      return { ...(createdRoom as Room), room_type: 'shared' }
    } catch (err: any) {
      setError(err.message || 'An error occurred while connecting to the shared room.')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    createRoom,
    joinRoomByCode,
    getRoomById,
    extendRoom,
    getOrCreateSharedWifiRoom,
    loading,
    error,
    sessionId
  }
}