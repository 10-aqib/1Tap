import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRoom } from '../hooks/useRoom'
import { useToast } from '../components/ui/ToastProvider'
import { Button } from '../components/ui/Button'
import { CodeInput } from '../components/ui/CodeInput'
import { triggerBackgroundPulse } from '../components/background/LivingBackground'
import { Moon, Sun, ArrowRight, Zap } from 'lucide-react'

export function HomePage() {
  const navigate = useNavigate()
  const { createRoom, joinRoomByCode, loading } = useRoom()
  const { toast } = useToast()
  
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'))

  const toggleTheme = () => {
    const root = document.documentElement
    if (isDark) {
      root.classList.remove('dark')
    } else {
      root.classList.add('dark')
    }
    setIsDark(!isDark)
  }

  const handleCreateRoom = async () => {
    const room = await createRoom(60) // default 1 hour
    if (room) {
      triggerBackgroundPulse()
      navigate(`/room/${room.id}`)
    } else {
      toast('Failed to create space. Please try again.', 'error')
    }
  }

  const handleJoin = async (code: string) => {
    if (code.length !== 6) return
    const room = await joinRoomByCode(code)
    if (room) {
      triggerBackgroundPulse()
      navigate(`/room/${room.id}`)
    } else {
      toast('Invalid or expired code.', 'error')
    }
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-bg transition-colors duration-300">
      {/* Abstract Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-accent-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent-500/5 blur-[120px] pointer-events-none" />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl w-full mx-auto">
        <div className="flex items-center gap-2 text-text-primary font-bold text-xl tracking-tight">
          <div className="w-8 h-8 rounded-lg bg-accent-600 flex items-center justify-center text-white">
            <Zap className="w-5 h-5 fill-white" />
          </div>
          DropShare
        </div>
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme" className="rounded-full">
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 w-full max-w-4xl mx-auto text-center">
        
        {/* Animated Connection Visual */}
        <div className="mb-12 flex items-center gap-4 text-text-muted">
          <div className="w-12 h-16 rounded-xl border-2 border-surface-border flex items-center justify-center relative overflow-hidden bg-surface shadow-sm">
            <div className="absolute bottom-2 w-4 h-1 rounded-full bg-surface-border" />
          </div>
          <div className="relative w-24 h-px bg-surface-border">
            <div className="absolute top-1/2 left-0 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-accent-500 animate-[progress-shimmer_1.5s_ease-in-out_infinite]" />
          </div>
          <div className="w-16 h-12 rounded-xl border-2 border-surface-border flex items-center justify-center relative bg-surface shadow-sm">
            <div className="absolute bottom-0 w-8 h-1 rounded-t-full bg-surface-border" />
          </div>
        </div>

        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-text-primary mb-6 animate-slide-up-fade" style={{ animationDelay: '0.1s' }}>
          Send it. <br className="sm:hidden" />
          <span className="text-accent-600">See it there.</span>
        </h1>
        
        <p className="text-lg sm:text-xl text-text-secondary max-w-xl mb-12 animate-slide-up-fade" style={{ animationDelay: '0.2s' }}>
          Create a temporary space between your devices in seconds. No accounts, no friction.
        </p>

        <div className="w-full max-w-sm flex flex-col gap-8 animate-slide-up-fade" style={{ animationDelay: '0.3s' }}>
          <Button 
            size="lg" 
            className="w-full text-lg h-14 rounded-2xl group" 
            onClick={handleCreateRoom}
            isLoading={loading}
          >
            Create a Space
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-bg text-text-muted">or join with a code</span>
            </div>
          </div>

          <div className="pt-2">
            <CodeInput onComplete={handleJoin} disabled={loading} />
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-sm text-text-muted">
        End-to-end encrypted locally. Files deleted automatically.
      </footer>
    </div>
  )
}
