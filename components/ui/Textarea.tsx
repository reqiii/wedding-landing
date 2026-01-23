'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export function Textarea({ label, error, className, id, ...props }: TextareaProps) {
  const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-sm font-medium text-dark-gray mb-2"
        >
          {label}
          {props.required && <span className="text-soft-rose ml-1">*</span>}
        </label>
      )}
      <textarea
        id={textareaId}
        className={cn(
          'w-full px-4 py-3 rounded-medium',
          'glass-base backdrop-blur-[15px]',
          'border border-white/20',
          'text-dark-gray placeholder-medium-gray',
          'focus-ring',
          'transition-all duration-200',
          'focus:border-light-orange/50 focus:bg-white/20',
          'resize-y min-h-[100px]',
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
