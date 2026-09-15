import { useEffect, useState, useCallback, useRef } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { RoomItem, DevicePresence } from '../types'

export const useRoomRealtime = (roomId: string | undefined, sessionId: string) => {
  const [items, setItems] = useState<RoomItem[]>([])
  const [devices, setDevices] = useState<DevicePresence[]>([])
  const channelRef = useRef<RealtimeChannel | null>(null)

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
    let isSubscribed = true

    // Initial load
    const loadItems = async () => {
      const { data, error } = await supabase
        .from('room_items')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })

      if (!error && isSubscribed) {
        setItems((data as RoomItem[]) || [])
      }
    }
    loadItems()

    // Subscribe to room channel for real-time Postgres changes and instant broadcast events
    const channel = supabase.channel(`room_${roomId}`)
    channelRef.current = channel

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
          setItems((current) => {
            const newItem = payload.new as RoomItem
            if (current.some(item => item.id === newItem.id)) {
              return current
            }
            return [...current, newItem]
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'room_items'
        },
        (payload) => {
          const deletedId = payload.old?.id
          if (deletedId) {
            setItems((current) => current.filter(item => item.id !== deletedId))
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'room_items',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          setItems((current) => current.map(item => item.id === payload.new.id ? payload.new as RoomItem : item))
        }
      )
      // Instant peer broadcast listeners for zero-latency UI updates
      .on('broadcast', { event: 'item_deleted' }, (payload) => {
        const deletedId = payload?.payload?.id
        if (deletedId) {
          setItems((current) => current.filter(item => item.id !== deletedId))
        }
      })
      .on('broadcast', { event: 'room_cleared' }, (payload) => {
        const clearSession = payload?.payload?.sessionId
        if (clearSession) {
          setItems((current) => current.filter(item => item.session_id !== clearSession))
        }
      })

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

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          session_id: sessionId,
          online_at: new Date().toISOString()
        })
      }
    })

    return () => {
      isSubscribed = false
      channelRef.current = null
      supabase.removeChannel(channel)
    }
  }, [roomId, sessionId])

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

  const updateItem = async (id: string, newContent: string) => {
    if (!roomId) return
    const { error } = await supabase
      .from('room_items')
      .update({ content: newContent })
      .eq('id', id)
      .eq('session_id', sessionId)
    
    if (error) {
      console.error('Error updating item:', error)
      throw error
    }
  }

  const deleteItem = async (id: string) => {
    if (!roomId) return

    // Find the item to check if it's a file
    const targetItem = items.find(item => item.id === id)

    // 1. Optimistic removal locally
    setItems((current) => current.filter(item => item.id !== id))

    // 2. Instant broadcast to all connected peer devices in this room
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'item_deleted',
        payload: { id }
      }).catch(() => {
        // Broadcast error ignored
      })
    }

    // 3. If file, delete from Supabase storage as well
    if (targetItem?.type === 'file' && targetItem.metadata?.storage_path) {
      supabase.storage
        .from('room_files')
        .remove([targetItem.metadata.storage_path])
        .catch((storageErr) => {
          console.warn('Could not delete storage file:', storageErr)
        })
    }

    // 4. Delete record from database
    const { error } = await supabase
      .from('room_items')
      .delete()
      .eq('id', id)
      
    if (error) {
      console.error('Error deleting item:', error)
      fetchItems() // revert on error
      throw error
    }
  }

  const clearAllItems = async () => {
    if (!roomId) return
    
    // Optimistic clear
    setItems((current) => current.filter(item => item.session_id !== sessionId))

    // Broadcast clear to peers
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'room_cleared',
        payload: { sessionId }
      }).catch(() => {})
    }
    
    const { error } = await supabase
      .from('room_items')
      .delete()
      .eq('room_id', roomId)
      .eq('session_id', sessionId)
      
    if (error) {
      console.error('Error clearing items:', error)
      fetchItems() // revert on error
      throw error
    }
  }

  return {
    items,
    devices,
    sendItem,
    updateItem,
    deleteItem,
    clearAllItems
  }
}