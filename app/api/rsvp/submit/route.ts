import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { rsvpAttendanceSchema, rsvpDeclineSchema } from '@/lib/validations'
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

    // Validate based on attending status
    let validatedData
    if (body.attending === true) {
      validatedData = rsvpAttendanceSchema.parse(body)
    } else {
      validatedData = rsvpDeclineSchema.parse(body)
    }

    // Save to database
    const submission = await db.rSVPSubmission.create({
      data: {
        name: validatedData.name,
        email: validatedData.email || null,
        phone: validatedData.phone || null,
        attending: body.attending,
        guestCount: body.attending ? validatedData.guestCount : null,
        dietaryPrefs: validatedData.dietaryPrefs || null,
        message: validatedData.message || null,
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
