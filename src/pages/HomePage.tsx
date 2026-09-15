import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRoom } from '../hooks/useRoom'
import { useToast } from '../contexts/ToastContext'
import { Button } from '../components/ui/Button'
import { CodeInput } from '../components/ui/CodeInput'
import { triggerBackgroundPulse } from '../lib/events'
import { Moon, Sun, ArrowRight, Zap, Wifi, ShieldCheck, Lock, Sparkles } from 'lucide-react'

export function HomePage() {
  const navigate = useNavigate()
  const { createRoom, joinRoomByCode, getOrCreateSharedWifiRoom, loading } = useRoom()
  const { toast } = useToast()
  
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'))
  const [activeTab, setActiveTab] = useState<'shared' | 'private'>('shared')
  const [wifiConnecting, setWifiConnecting] = useState(false)

  const toggleTheme = () => {
    const root = document.documentElement
    if (isDark) {
      root.classList.remove('dark')
    } else {
      root.classList.add('dark')
    }
    setIsDark(!isDark)
  }

  // Option 1: Shared Room (Same Wi-Fi)
  const handleJoinSharedWifi = async () => {
    setWifiConnecting(true)
    try {
      triggerBackgroundPulse()
      const room = await getOrCreateSharedWifiRoom()
      if (room) {
        navigate(`/room/${room.id}?type=shared`)
      } else {
        toast('Could not establish shared Wi-Fi room. Try creating a private room.', 'error')
      }
    } catch {
      toast('Failed to connect to shared Wi-Fi space.', 'error')
    } finally {
      setWifiConnecting(false)
    }
  }

  // Option 2: Private Room (Create with code)
  const handleCreatePrivateRoom = async () => {
    const room = await createRoom(60) // default 1 hour
    if (room) {
      triggerBackgroundPulse()
      navigate(`/room/${room.id}?type=private`)
    } else {
      toast('Failed to create private space. Please try again.', 'error')
    }
  }

  // Option 2: Private Room (Join with 6-digit code)
  const handleJoinPrivate = async (code: string) => {
    if (code.length !== 6) return
    const room = await joinRoomByCode(code)
    if (room) {
      triggerBackgroundPulse()
      navigate(`/room/${room.id}?type=private`)
    } else {
      toast('Invalid or expired code.', 'error')
    }
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-bg transition-colors duration-300">
      {/* Abstract Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-accent-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent-500/10 blur-[120px] pointer-events-none" />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl w-full mx-auto">
        <div className="flex items-center gap-2 text-text-primary font-bold text-xl tracking-tight">
          <div className="w-8 h-8 rounded-lg bg-accent-600 flex items-center justify-center text-white shadow-sm shadow-accent-600/30">
            <Zap className="w-5 h-5 fill-white" />
          </div>
          1Tap
        </div>
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme" className="rounded-full">
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 w-full max-w-4xl mx-auto text-center py-8">
        
        {/* Animated Connection Visual */}
        <div className="mb-8 flex items-center gap-4 text-text-muted">
          <div className="w-12 h-16 rounded-xl border-2 border-surface-border flex items-center justify-center relative overflow-hidden bg-surface shadow-sm">
            <div className="absolute bottom-2 w-4 h-1 rounded-full bg-surface-border" />
          </div>
          <div className="relative w-24 h-px bg-surface-border">
            <div className="absolute top-1/2 left-0 -translate-y-1/2 w-2 h-2 rounded-full bg-accent-500 animate-[progress-shimmer_1.5s_ease-in-out_infinite]" />
          </div>
          <div className="w-16 h-12 rounded-xl border-2 border-surface-border flex items-center justify-center relative bg-surface shadow-sm">
            <div className="absolute bottom-0 w-8 h-1 rounded-t-full bg-surface-border" />
          </div>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-text-primary mb-4 animate-slide-up-fade">
          Share files & text. <br className="sm:hidden" />
          <span className="text-accent-600">Instantly.</span>
        </h1>
        
        <p className="text-base sm:text-lg text-text-secondary max-w-lg mb-8 animate-slide-up-fade">
          Move anything between devices in real-time. No accounts, no hassle.
        </p>

        {/* Room Type Selector Tabs */}
        <div className="w-full max-w-md bg-surface border border-surface-border p-1.5 rounded-2xl flex items-center gap-1 mb-8 shadow-sm">
          <button
            onClick={() => setActiveTab('shared')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'shared'
                ? 'bg-accent-600 text-white shadow-md shadow-accent-600/20'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
            }`}
          >
            <Wifi className="w-4 h-4" />
            Shared Room (Wi-Fi)
          </button>
          <button
            onClick={() => setActiveTab('private')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'private'
                ? 'bg-accent-600 text-white shadow-md shadow-accent-600/20'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
            }`}
          >
            <Lock className="w-4 h-4" />
            Private Room
          </button>
        </div>

        {/* Dynamic Card based on Tab */}
        <div className="w-full max-w-md animate-slide-up-fade">
          {activeTab === 'shared' ? (
            /* Option 1: Shared Room (Same Wi-Fi) */
            <div className="bg-surface/80 backdrop-blur-md border border-surface-border rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col items-center text-center relative overflow-hidden">
              <div className="w-16 h-16 rounded-2xl bg-accent-50 dark:bg-accent-500/10 text-accent-600 dark:text-accent-400 flex items-center justify-center mb-5 relative">
                <Wifi className="w-8 h-8" />
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-green-500"></span>
                </span>
              </div>

              <h2 className="text-2xl font-bold text-text-primary mb-2">Same Wi-Fi Space</h2>
              <p className="text-sm text-text-secondary mb-6 max-w-xs">
                Devices connected to the same Wi-Fi join this room automatically. No codes or QR scans required!
              </p>

              <div className="w-full space-y-3">
                <Button 
                  size="lg" 
                  className="w-full text-base h-14 rounded-2xl group shadow-lg shadow-accent-600/20" 
                  onClick={handleJoinSharedWifi}
                  isLoading={loading || wifiConnecting}
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Connect via Wi-Fi
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>

              <div className="mt-6 flex items-center gap-2 text-xs text-text-muted">
                <ShieldCheck className="w-4 h-4 text-green-500" />
                <span>Automatic network pairing enabled</span>
              </div>
            </div>
          ) : (
            /* Option 2: Private Room (Code Protected) */
            <div className="bg-surface/80 backdrop-blur-md border border-surface-border rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-accent-50 dark:bg-accent-500/10 text-accent-600 dark:text-accent-400 flex items-center justify-center mb-5">
                <Lock className="w-8 h-8" />
              </div>

              <h2 className="text-2xl font-bold text-text-primary mb-2">Private Space</h2>
              <p className="text-sm text-text-secondary mb-6 max-w-xs">
                Create an exclusive space with a 6-digit code or enter a code to join.
              </p>

              <div className="w-full flex flex-col gap-5">
                <Button 
                  size="lg" 
                  className="w-full text-base h-13 rounded-2xl group" 
                  onClick={handleCreatePrivateRoom}
                  isLoading={loading}
                >
                  Create Private Room
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-surface-border" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-3 bg-surface text-text-muted">or join with code</span>
                  </div>
                </div>

                <div>
                  <CodeInput onComplete={handleJoinPrivate} disabled={loading} />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-xs text-text-muted">
        Deleted files are instantly removed from all screens • No permanent logs
      </footer>
    </div>
  )
}
