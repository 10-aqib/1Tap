import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { RoomItem, DevicePresence } from '../types'

export const useRoomRealtime = (roomId: string | undefined, sessionId: string) => {
  const [items, setItems] = useState<RoomItem[]>([])
  const [devices, setDevices] = useState<DevicePresence[]>([])

  const fetchItems = useCallback(async () => {
    if (!roomId) return
    const { data, error } = await supabase
      .from('room_items')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching room items:', error)
    } else {
      setItems((data as RoomItem[]) || [])
    }
  }, [roomId])

  useEffect(() => {
    if (!roomId) return

    fetchItems()

    // Subscribe to database changes
    const channel = supabase.channel(`room_${roomId}`)

    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'room_items',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          setItems((current) => [...current, payload.new as RoomItem])
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'room_items',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          setItems((current) => current.filter(item => item.id !== payload.old.id))
        }
      )

    // Setup presence
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const activeDevices: DevicePresence[] = []
        let deviceCount = 1

        Object.keys(state).forEach((key) => {
          const presences = state[key]
          presences.forEach((presence: any) => {
            activeDevices.push({
              id: presence.session_id,
              label: presence.session_id === sessionId ? 'You' : `Device ${deviceCount++}`,
              isYou: presence.session_id === sessionId
            })
          })
        })
        
        setDevices(activeDevices)
      })
      .on('presence', { event: 'join' }, () => {
        // Handled by sync
      })
      .on('presence', { event: 'leave' }, () => {
        // Handled by sync
      })

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          session_id: sessionId,
          online_at: new Date().toISOString()
        })
      }
    })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, sessionId, fetchItems])

  const sendItem = async (type: 'text' | 'link' | 'file', content: string, metadata: any = null) => {
    if (!roomId) return
    const { error } = await supabase
      .from('room_items')
      .insert({
        room_id: roomId,
        type,
        content,
        metadata,
        session_id: sessionId
      })

    if (error) {
      console.error('Error sending item:', error)
      throw error
    }
    
    // Update last_activity_at
    await supabase
      .from('rooms')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('id', roomId)
  }

  return {
    items,
    devices,
    sendItem
  }
}