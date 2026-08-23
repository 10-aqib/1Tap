import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { RoomPage } from './pages/RoomPage'
import { NotFoundPage, ExpiredRoomPage } from './pages/ErrorPages'
import { ToastProvider } from './components/ui/ToastProvider'

function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/room/:roomId" element={<RoomPage />} />
          <Route path="/expired" element={<ExpiredRoomPage />} />
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </Router>
    </ToastProvider>
  )
}

export default App
