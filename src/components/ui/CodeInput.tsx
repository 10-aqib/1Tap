import React, { useRef, useState } from 'react'
import type { KeyboardEvent, ClipboardEvent } from 'react'
import { cn } from './Button'

interface CodeInputProps {
  length?: number
  onComplete: (code: string) => void
  disabled?: boolean
}

export function CodeInput({ length = 6, onComplete, disabled = false }: CodeInputProps) {
  const [code, setCode] = useState<string[]>(Array(length).fill(''))
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const focusInput = (index: number) => {
    inputRefs.current[index]?.focus()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (!code[index] && index > 0) {
        const newCode = [...code]
        newCode[index - 1] = ''
        setCode(newCode)
        focusInput(index - 1)
      } else {
        const newCode = [...code]
        newCode[index] = ''
        setCode(newCode)
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      focusInput(index - 1)
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      focusInput(index + 1)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(-1)
    if (!value) return

    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)

    if (index < length - 1) {
      focusInput(index + 1)
    } else {
      const fullCode = newCode.join('')
      if (fullCode.length === length) {
        onComplete(fullCode)
      }
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, length)
    if (!pastedData) return

    const newCode = [...code]
    for (let i = 0; i < pastedData.length; i++) {
      newCode[i] = pastedData[i]
    }
    setCode(newCode)

    if (pastedData.length === length) {
      onComplete(pastedData)
      inputRefs.current[length - 1]?.focus()
    } else {
      inputRefs.current[pastedData.length]?.focus()
    }
  }

  return (
    <div className="flex gap-2 sm:gap-3 justify-center" dir="ltr">
      {code.map((value, index) => (
        <input
          key={index}
          ref={(el) => { inputRefs.current[index] = el }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={2} // Allows catching fast typing
          value={value}
          disabled={disabled}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          className={cn(
            "w-10 h-12 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-semibold rounded-xl bg-surface border border-surface-border text-text-primary shadow-sm",
            "transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-accent-500 focus:scale-105",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
          aria-label={`Digit ${index + 1}`}
        />
      ))}
    </div>
  )
}
