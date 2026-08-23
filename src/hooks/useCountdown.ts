import { useState, useEffect } from 'react'
import { differenceInSeconds } from 'date-fns'

export const useCountdown = (expiresAt: string | undefined) => {
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    if (!expiresAt) {
      setTimeLeft(null)
      return
    }

    const calculateTimeLeft = () => {
      const now = new Date()
      const expiry = new Date(expiresAt)
      const diff = differenceInSeconds(expiry, now)
      
      if (diff <= 0) {
        setTimeLeft(0)
        setIsExpired(true)
        return 0
      }
      
      setTimeLeft(diff)
      return diff
    }

    // Initial calc
    const initialDiff = calculateTimeLeft()
    
    if (initialDiff > 0) {
      const timer = setInterval(() => {
        calculateTimeLeft()
      }, 1000)
      return () => clearInterval(timer)
    }

  }, [expiresAt])

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return '--:--'
    if (seconds <= 0) return '00:00'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return {
    timeLeft,
    isExpired,
    formattedTime: formatTime(timeLeft),
    isWarning: timeLeft !== null && timeLeft <= 300 && !isExpired // Less than 5 mins
  }
}