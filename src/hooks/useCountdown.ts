import { useState, useEffect } from 'react'
import { differenceInSeconds } from 'date-fns'

export const useCountdown = (expiresAt: string | undefined) => {
  const getInitialTimeLeft = () => {
    if (!expiresAt) return null
    const diff = differenceInSeconds(new Date(expiresAt), new Date())
    return diff > 0 ? diff : 0
  }

  const [timeLeft, setTimeLeft] = useState<number | null>(getInitialTimeLeft)
  const isExpired = timeLeft !== null && timeLeft <= 0

  useEffect(() => {
    if (!expiresAt) return

    const tick = () => {
      const diff = differenceInSeconds(new Date(expiresAt), new Date())
      if (diff <= 0) {
        setTimeLeft(0)
      } else {
        setTimeLeft(diff)
      }
    }

    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
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
    isWarning: timeLeft !== null && timeLeft <= 300 && !isExpired, // Less than 5 mins
    isCritical: timeLeft !== null && timeLeft <= 60 && !isExpired // Less than 1 min
  }
}