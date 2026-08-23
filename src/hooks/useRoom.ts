import { useState, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { supabase } from '../lib/supabase'
import type { Room } from '../types'
import { generateJoinCode } from '../lib/utils'
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

  return {
    createRoom,
    joinRoomByCode,
    getRoomById,
    loading,
    error,
    sessionId
  }
}