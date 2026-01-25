import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { rsvpSubmissionSchema } from '@/lib/validations'
import { checkRateLimit } from '@/lib/rate-limit'

function getClientIP(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  return null
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const ipAddress = getClientIP(request)

    // Check rate limiting
    const rateLimit = await checkRateLimit(ipAddress)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Check honeypot field (bot detection)
    if (body.honeypot && body.honeypot.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid submission' },
        { status: 400 }
      )
    }

    const validatedData = rsvpSubmissionSchema.parse(body)

    const attending = validatedData.attendance !== 'decline'
    const guestCount =
      validatedData.attendance === 'attending_plus_one'
        ? 2
        : validatedData.attendance === 'attending'
          ? 1
          : null
    const transferNote =
      validatedData.transfer === 'required' ? 'Transfer: required' : 'Transfer: not required'

    // Save to database
    const submission = await db.rSVPSubmission.create({
      data: {
        name: validatedData.names,
        email: null,
        phone: null,
        attending,
        guestCount,
        dietaryPrefs: null,
        message: transferNote,
        ipAddress,
        honeypot: body.honeypot || null,
      },
    })

    return NextResponse.json({
      success: true,
      id: submission.id,
    })
  } catch (error: any) {
    console.error('RSVP submission error:', error)

    // Zod validation errors
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Invalid form data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'An error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
