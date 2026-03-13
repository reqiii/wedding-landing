'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { rsvpSubmissionSchema, type RSVPSubmissionFormData } from '@/lib/validations'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

type RSVPFormProps = {
  controlSurface?: 'glass' | 'landing'
  className?: string
  controlClassName?: string
  submitClassName?: string
  successClassName?: string
  errorClassName?: string
}

export function RSVPForm({
  controlSurface = 'glass',
  className,
  controlClassName,
  submitClassName,
  successClassName,
  errorClassName,
}: RSVPFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RSVPSubmissionFormData>({
    resolver: zodResolver(rsvpSubmissionSchema),
  })

  const onSubmit = async (data: RSVPSubmissionFormData) => {
    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      const response = await fetch('/api/rsvp/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setSubmitStatus('success')
        reset()
      } else {
        setSubmitStatus('error')
      }
    } catch (error) {
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitStatus === 'success') {
    return (
      <div className={cn('space-y-4 text-center', successClassName)} role="status" aria-live="polite">
        <div className="text-3xl">✨</div>
        <h3 className="font-display text-2xl text-dark-gray">Спасибо!</h3>
        <p className="text-medium-gray">
          Мы получили вашу анкету и будем рады видеть вас.
        </p>
        <Button
          type="button"
          variant="solid"
          className={submitClassName}
          onClick={() => {
            setSubmitStatus('idle')
          }}
        >
          Заполнить снова
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={cn('space-y-4', className)}>
      <input
        type="text"
        {...register('honeypot')}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
      />

      <Select
        label="Сможете ли вы присутствовать на нашем торжестве?"
        {...register('attendance')}
        error={errors.attendance?.message}
        required
        surface={controlSurface}
        className={controlClassName}
        options={[
          { value: '', label: 'Выберите вариант' },
          { value: 'attending', label: 'Буду' },
          { value: 'attending_plus_one', label: 'Буду +1' },
          { value: 'decline', label: 'Не буду' },
        ]}
      />

      <Input
        label="Укажите ваши Имя и Фамилию"
        {...register('names')}
        error={errors.names?.message}
        required
        surface={controlSurface}
        className={controlClassName}
        autoComplete="name"
        placeholder="Если вы будете парой или семьей, укажите всех"
      />

      <Select
        label="Потребуется ли вам трансфер?"
        {...register('transfer')}
        error={errors.transfer?.message}
        required
        surface={controlSurface}
        className={controlClassName}
        options={[
          { value: '', label: 'Выберите вариант' },
          { value: 'required', label: 'Потребуется' },
          { value: 'not_required', label: 'Не потребуется' },
        ]}
      />

      {submitStatus === 'error' && (
        <p className={cn('text-soft-rose text-sm', errorClassName)} role="alert" aria-live="polite">
          Что-то пошло не так. Пожалуйста, попробуйте еще раз.
        </p>
      )}

      <Button
        type="submit"
        variant="solid"
        className={cn('w-full', submitClassName)}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Отправляем...' : 'Отправить'}
      </Button>
    </form>
  )
}
