import { createContext, useContext } from 'react'

export interface ToastContextType {
  toast: (message: string, type?: 'success' | 'error' | 'info') => void
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}
