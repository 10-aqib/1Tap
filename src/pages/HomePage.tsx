import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../components/common/Layout'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useRoom } from '../hooks/useRoom'
import { useToast } from '../components/ui/ToastProvider'
import { ArrowRight, Share2, Smartphone, Zap } from 'lucide-react'

export function HomePage() {
  const [joinCode, setJoinCode] = useState('')
  const [expiry, setExpiry] = useState<number>(30)
  const { createRoom, joinRoomByCode, loading } = useRoom()
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleCreate = async () => {
    const room = await createRoom(expiry)
    if (room) {
      toast('Room created successfully', 'success')
      navigate(`/room/${room.id}`)
    } else {
      toast('Failed to create room. Try again.', 'error')
    }
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (joinCode.length !== 6 || !/^\d+$/.test(joinCode)) {
      toast('Please enter a valid 6-digit code', 'error')
      return
    }

    const room = await joinRoomByCode(joinCode)
    if (room) {
      navigate(`/room/${room.id}`)
    } else {
      toast('Room not found or expired', 'error')
    }
  }

  return (
    <Layout>
      <div className="flex-1 flex flex-col items-center justify-center py-12 md:py-24">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            <span>Instant cross-device sharing</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 dark:text-white mb-6">
            Move anything between your devices. <span className="text-indigo-600 dark:text-indigo-400">Instantly.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
            Create a temporary room and share text, links, and files with any device. No accounts required.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-6 w-full max-w-4xl">
          {/* Create Room Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center transition-all hover:shadow-md">
            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6">
              <Share2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Create a Room</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6 flex-1">
              Start a new secure sharing session.
            </p>
            
            <div className="w-full flex flex-col gap-4">
              <div className="flex items-center justify-between px-1">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Room expires in:</span>
                <select 
                  className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer"
                  value={expiry}
                  onChange={(e) => setExpiry(Number(e.target.value))}
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={1440}>24 hours</option>
                </select>
              </div>
              <Button 
                onClick={handleCreate} 
                isLoading={loading} 
                size="lg" 
                className="w-full"
              >
                Create Room
              </Button>
            </div>
          </div>

          {/* Join Room Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center transition-all hover:shadow-md">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6">
              <Smartphone className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Join a Room</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6 flex-1">
              Enter a 6-digit code to connect.
            </p>
            
            <form onSubmit={handleJoin} className="w-full flex flex-col gap-4">
              <Input
                type="text"
                placeholder="Enter 6-digit code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="text-center text-2xl tracking-[0.2em] font-mono h-14"
                maxLength={6}
                inputMode="numeric"
              />
              <Button 
                type="submit" 
                variant="secondary" 
                size="lg" 
                className="w-full"
                disabled={joinCode.length !== 6 || loading}
              >
                Join Room
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </form>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-24 w-full max-w-4xl">
          <h3 className="text-center text-lg font-semibold text-slate-400 mb-8 uppercase tracking-wider">How it works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold mb-4">1</div>
              <h4 className="font-semibold mb-2">Create a Room</h4>
              <p className="text-sm text-slate-500">Get a secure code and link instantly.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold mb-4">2</div>
              <h4 className="font-semibold mb-2">Scan or Enter Code</h4>
              <p className="text-sm text-slate-500">Open DropShare on any other device.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold mb-4">3</div>
              <h4 className="font-semibold mb-2">Share Instantly</h4>
              <p className="text-sm text-slate-500">Text, links, and files sync in real-time.</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
