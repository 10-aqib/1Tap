import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { AlertCircle, Clock, ArrowLeft } from 'lucide-react'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-bg text-center">
      <div className="w-16 h-16 rounded-2xl bg-surface-hover flex items-center justify-center text-text-muted mb-6 shadow-sm">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-bold text-text-primary mb-2">Space Not Found</h1>
      <p className="text-text-secondary max-w-sm mx-auto mb-8">
        The code you entered is invalid, or the space never existed.
      </p>
      <Button onClick={() => navigate('/')} className="rounded-xl px-6 h-12">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Home
      </Button>
    </div>
  )
}

export function ExpiredRoomPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-bg text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-500 mb-6 shadow-sm">
        <Clock className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-bold text-text-primary mb-2">Space Expired</h1>
      <p className="text-text-secondary max-w-sm mx-auto mb-8">
        This temporary space has expired and all files have been securely deleted.
      </p>
      <Button onClick={() => navigate('/')} className="rounded-xl px-6 h-12">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Create a New Space
      </Button>
    </div>
  )
}
