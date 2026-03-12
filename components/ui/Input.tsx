'use client'

import React, { useId } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  surface?: 'glass' | 'landing'
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, className, id, surface = 'glass', ...props },
  ref
) {
  const autoId = useId()
  const inputId = id ?? autoId
  const surfaceClassName =
    surface === 'landing'
      ? 'border border-white/45 bg-white/78 shadow-[0_8px_24px_rgba(15,23,42,0.08)] focus:border-light-orange/45 focus:bg-white/88'
      : 'glass-base backdrop-blur-[15px] border border-white/20 focus:border-light-orange/50 focus:bg-white/20'

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-dark-gray mb-2"
        >
          {label}
          {props.required && <span className="text-soft-rose ml-1">*</span>}
        </label>
      )}
      <input
        id={inputId}
        ref={ref}
        className={cn(
          'w-full px-4 py-3 rounded-medium',
          surfaceClassName,
          'text-dark-gray placeholder-medium-gray',
          'focus-ring',
          'transition-all duration-200',
          error && 'border-soft-rose',
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-soft-rose" role="alert">
          {error}
        </p>
      )}
    </div>
  )
})
