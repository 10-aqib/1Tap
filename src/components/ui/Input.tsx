import React from 'react'
import { cn } from './Button'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-lg border bg-surface px-3 py-2 text-sm text-text-primary",
          "transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-muted",
          "focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-accent-500",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error ? "border-red-500 focus:ring-red-500/30 focus:border-red-500" : "border-surface-border",
          className
        )}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'