'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { rsvpDeclineSchema, type RSVPDeclineFormData } from '@/lib/validations'
import { Glass } from '@/components/ui/Glass'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'

export function DeclineForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RSVPDeclineFormData>({
    resolver: zodResolver(rsvpDeclineSchema),
  })

  const onSubmit = async (data: RSVPDeclineFormData) => {
    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      const response = await fetch('/api/rsvp/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          attending: false,
        }),
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
      <Glass variant="panel" className="text-center">
        <div className="text-4xl mb-4">💙</div>
        <h3 className="font-display text-2xl text-dark-gray mb-4">
          Thank You
        </h3>
        <p className="text-medium-gray">
          We're sorry you can't make it, but we appreciate you letting us know!
        </p>
      </Glass>
    )
  }

  return (
    <Glass variant="panel">
      <h3 className="font-display text-2xl text-dark-gray mb-6 text-center">
        Regretfully Decline
      </h3>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Honeypot field - hidden from users */}
        <input
          type="text"
          {...register('honeypot')}
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
        />

        <Input
          label="Full Name"
          {...register('name')}
          error={errors.name?.message}
          required
          autoComplete="name"
        />

        <Input
          label="Email (Optional but recommended)"
          type="email"
          {...register('email')}
          error={errors.email?.message}
          autoComplete="email"
        />

        <Input
          label="Phone (Optional)"
          type="tel"
          {...register('phone')}
          error={errors.phone?.message}
          autoComplete="tel"
        />

        <Textarea
          label="Message (Optional)"
          {...register('message')}
          error={errors.message?.message}
          placeholder="We'd love to hear from you..."
        />

        {submitStatus === 'error' && (
          <p className="text-soft-rose text-sm" role="alert">
            Something went wrong. Please try again or contact us directly.
          </p>
        )}

        <Button
          type="submit"
          variant="solid"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </Button>
      </form>
    </Glass>
  )
}
