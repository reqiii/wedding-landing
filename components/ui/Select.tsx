'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export function Select({ label, error, options, className, id, ...props }: SelectProps) {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-dark-gray mb-2"
        >
          {label}
          {props.required && <span className="text-soft-rose ml-1">*</span>}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          'w-full px-4 py-3 rounded-medium',
          'glass-base backdrop-blur-[15px]',
          'border border-white/20',
          'text-dark-gray',
          'focus-ring',
          'transition-all duration-200',
          'focus:border-light-orange/50 focus:bg-white/20',
          'appearance-none bg-no-repeat bg-right',
          'bg-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%232C2C2C\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")] bg-[length:12px] pr-10',
          error && 'border-soft-rose',
          className
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-soft-rose" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
