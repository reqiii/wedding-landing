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
    const attendingFilter = searchParams.get('attending')

    // Build where clause
    const where: any = {}
    if (attendingFilter === 'true') {
      where.attending = true
    } else if (attendingFilter === 'false') {
      where.attending = false
    }
    // 'all' or no filter = show all

    const submissions = await db.rSVPSubmission.findMany({
      where,
      orderBy: {
        submittedAt: 'desc',
      },
    })

    return NextResponse.json({ submissions })
  } catch (error) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    )
  }
}
