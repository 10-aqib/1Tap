import { useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'
import { ToastContext } from '../../contexts/ToastContext'

interface ToastItem {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const toast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = crypto.randomUUID()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={cn(
              "px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-in slide-in-from-bottom-5 pointer-events-auto",
              t.type === 'success' ? 'bg-green-500 text-white' :
              t.type === 'error' ? 'bg-red-500 text-white' :
              'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900'
            )}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}