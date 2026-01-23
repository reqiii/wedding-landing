'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { rsvpAttendanceSchema, type RSVPAttendanceFormData } from '@/lib/validations'
import { Glass } from '@/components/ui/Glass'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'

export function RSVPForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [submissionId, setSubmissionId] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RSVPAttendanceFormData>({
    resolver: zodResolver(rsvpAttendanceSchema),
  })

  const onSubmit = async (data: RSVPAttendanceFormData) => {
    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      const response = await fetch('/api/rsvp/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          attending: true,
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setSubmitStatus('success')
        setSubmissionId(result.id)
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
        <div className="text-4xl mb-4">✨</div>
        <h3 className="font-display text-2xl text-dark-gray mb-4">
          Thank You!
        </h3>
        <p className="text-medium-gray mb-6">
          We've received your RSVP and can't wait to celebrate with you!
        </p>
        <Button
          onClick={() => {
            setSubmitStatus('idle')
            setSubmissionId(null)
          }}
        >
          Submit Another
        </Button>
      </Glass>
    )
  }

  return (
    <Glass variant="panel">
      <h3 className="font-display text-2xl text-dark-gray mb-6 text-center">
        Yes, I'll Be There!
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
          label="Email"
          type="email"
          {...register('email')}
          error={errors.email?.message}
          required
          autoComplete="email"
        />

        <Input
          label="Phone (Optional)"
          type="tel"
          {...register('phone')}
          error={errors.phone?.message}
          autoComplete="tel"
        />

        <Select
          label="Number of Guests"
          {...register('guestCount', { valueAsNumber: true })}
          error={errors.guestCount?.message}
          required
          options={Array.from({ length: 20 }, (_, i) => ({
            value: String(i + 1),
            label: String(i + 1),
          }))}
        />

        <Input
          label="Dietary Preferences (Optional)"
          {...register('dietaryPrefs')}
          error={errors.dietaryPrefs?.message}
          placeholder="Vegetarian, gluten-free, allergies, etc."
        />

        <Textarea
          label="Message (Optional)"
          {...register('message')}
          error={errors.message?.message}
          placeholder="Any special notes or requests..."
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
          {isSubmitting ? 'Submitting...' : 'Submit RSVP'}
        </Button>
      </form>
    </Glass>
  )
}
