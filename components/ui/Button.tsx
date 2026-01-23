'use client'

import React from 'react'
import { Glass } from './Glass'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'glass' | 'solid'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export function Button({
  variant = 'glass',
  size = 'md',
  children,
  className,
  type,
  ...props
}: ButtonProps) {
  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  }

  if (variant === 'glass') {
    return (
      <Glass variant="button" className={cn('inline-flex', className)}>
        <button
          type={type ?? 'button'}
          className={cn(
            'w-full h-full bg-transparent text-dark-gray font-semibold focus-ring',
            textSizeClasses[size]
          )}
          {...props}
        >
          {children}
        </button>
      </Glass>
    )
  }

  return (
    <button
      type={type ?? 'button'}
      className={cn(
        'bg-light-orange text-white rounded-small font-semibold',
        'hover:bg-opacity-90 active:scale-95',
        'focus-ring',
        'px-6 py-3',
        textSizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
