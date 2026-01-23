import { z } from 'zod'

export const rsvpAttendanceSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  guestCount: z.number().int().min(1, 'Guest count must be at least 1').max(20, 'Maximum 20 guests'),
  dietaryPrefs: z.string().optional(),
  message: z.string().optional(),
  honeypot: z.string().max(0, 'Bot detected').optional(), // Honeypot field
})

export const rsvpDeclineSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  message: z.string().optional(),
  honeypot: z.string().max(0, 'Bot detected').optional(), // Honeypot field
})

export type RSVPAttendanceFormData = z.infer<typeof rsvpAttendanceSchema>
export type RSVPDeclineFormData = z.infer<typeof rsvpDeclineSchema>
