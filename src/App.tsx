import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { RoomPage } from './pages/RoomPage'
import { NotFoundPage, ExpiredRoomPage } from './pages/ErrorPages'
import { ToastProvider } from './components/ui/ToastProvider'
import { LivingBackground } from './components/background/LivingBackground'

function AppContent() {
  const location = useLocation()
  const inRoom = location.pathname.startsWith('/room/')
  
  return (
    <>
      <LivingBackground active={inRoom} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/room/:roomId" element={<RoomPage />} />
        <Route path="/expired" element={<ExpiredRoomPage />} />
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </>
  )
}

function App() {
  return (
    <ToastProvider>
      <Router>
        <AppContent />
      </Router>
    </ToastProvider>
  )
}

export default App
