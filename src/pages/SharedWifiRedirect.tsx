import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRoom } from '../hooks/useRoom'
import { useToast } from '../contexts/ToastContext'
import { Wifi } from 'lucide-react'

export function SharedWifiRedirect() {
  const navigate = useNavigate()
  const { getOrCreateSharedWifiRoom } = useRoom()
  const { toast } = useToast()

  useEffect(() => {
    let active = true

    const connect = async () => {
      try {
        const room = await getOrCreateSharedWifiRoom()
        if (active) {
          if (room) {
            navigate(`/room/${room.id}?type=shared`, { replace: true })
          } else {
            toast('Unable to connect to shared Wi-Fi room', 'error')
            navigate('/', { replace: true })
          }
        }
      } catch {
        if (active) {
          toast('Network error connecting to shared space', 'error')
          navigate('/', { replace: true })
        }
      }
    }

    connect()

    return () => {
      active = false
    }
  }, [getOrCreateSharedWifiRoom, navigate, toast])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg text-text-primary">
      <div className="w-16 h-16 rounded-2xl bg-accent-50 dark:bg-accent-500/10 text-accent-600 dark:text-accent-400 flex items-center justify-center mb-4 relative">
        <Wifi className="w-8 h-8 animate-pulse" />
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
        </span>
      </div>
      <h2 className="text-xl font-bold mb-1">Connecting to Wi-Fi Space</h2>
      <p className="text-sm text-text-secondary">Joining shared local network room...</p>
    </div>
  )
}
