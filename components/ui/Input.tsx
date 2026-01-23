'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`

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
        className={cn(
          'w-full px-4 py-3 rounded-medium',
          'glass-base backdrop-blur-[15px]',
          'border border-white/20',
          'text-dark-gray placeholder-medium-gray',
          'focus-ring',
          'transition-all duration-200',
          'focus:border-light-orange/50 focus:bg-white/20',
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
}
