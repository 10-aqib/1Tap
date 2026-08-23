import { useNavigate } from 'react-router-dom'
import { Layout } from '../components/common/Layout'
import { Button } from '../components/ui/Button'
import { Clock } from 'lucide-react'

export function ExpiredRoomPage() {
  const navigate = useNavigate()

  return (
    <Layout>
      <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
        <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-6">
          <Clock className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold mb-4">This room has expired.</h1>
        <p className="text-slate-500 mb-8 max-w-md">
          For security, temporary rooms are automatically closed and all data is permanently deleted after the expiration time.
        </p>
        <Button onClick={() => navigate('/')} size="lg">
          Create a New Room
        </Button>
      </div>
    </Layout>
  )
}

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <Layout>
      <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
        <h1 className="text-8xl font-black text-slate-200 dark:text-slate-800 mb-4">404</h1>
        <h2 className="text-2xl font-bold mb-4">Room not found</h2>
        <p className="text-slate-500 mb-8">
          The room you're looking for doesn't exist or has already expired.
        </p>
        <div className="flex gap-4">
          <Button onClick={() => navigate('/')} size="lg">
            Go Home
          </Button>
        </div>
      </div>
    </Layout>
  )
}
