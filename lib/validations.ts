import { z } from 'zod'

export const rsvpSubmissionSchema = z.object({
  attendance: z.enum(['attending', 'attending_plus_one', 'decline'], {
    required_error: 'Выберите вариант присутствия',
  }),
  names: z.string().min(2, 'Введите имя и фамилию'),
  transfer: z.enum(['required', 'not_required'], {
    required_error: 'Укажите, нужен ли трансфер',
  }),
  honeypot: z.string().max(0, 'Bot detected').optional(),
})

export type RSVPSubmissionFormData = z.infer<typeof rsvpSubmissionSchema>
