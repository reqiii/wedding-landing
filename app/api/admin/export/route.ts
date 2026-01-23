import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  // Check authentication
  const isAuthenticated = await getSession()
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') || 'csv'
    const attendingFilter = searchParams.get('attending')

    // Build where clause
    const where: any = {}
    if (attendingFilter === 'true') {
      where.attending = true
    } else if (attendingFilter === 'false') {
      where.attending = false
    }

    const submissions = await db.rSVPSubmission.findMany({
      where,
      orderBy: {
        submittedAt: 'desc',
      },
    })

    if (format === 'json') {
      return NextResponse.json(submissions, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': 'attachment; filename="rsvp-submissions.json"',
        },
      })
    }

    // Generate CSV
    const headers = [
      'ID',
      'Name',
      'Email',
      'Phone',
      'Attending',
      'Guest Count',
      'Dietary Preferences',
      'Message',
      'Submitted At',
      'IP Address',
    ]

    const rows = submissions.map((sub) => [
      sub.id,
      sub.name,
      sub.email || '',
      sub.phone || '',
      sub.attending ? 'Yes' : 'No',
      sub.guestCount?.toString() || '',
      sub.dietaryPrefs || '',
      sub.message || '',
      sub.submittedAt.toISOString(),
      sub.ipAddress || '',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n')

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="rsvp-submissions.csv"',
      },
    })
  } catch (error) {
    console.error('Error exporting submissions:', error)
    return NextResponse.json(
      { error: 'Failed to export submissions' },
      { status: 500 }
    )
  }
}
