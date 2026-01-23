import { db } from './db'

const RATE_LIMIT_WINDOW = 60 * 60 * 1000 // 1 hour in milliseconds
const MAX_SUBMISSIONS = 5

export async function checkRateLimit(ipAddress: string | null): Promise<{ allowed: boolean; remaining: number }> {
  if (!ipAddress) {
    // If no IP, allow but log warning
    return { allowed: true, remaining: MAX_SUBMISSIONS }
  }

  const oneHourAgo = new Date(Date.now() - RATE_LIMIT_WINDOW)

  const recentSubmissions = await db.rSVPSubmission.count({
    where: {
      ipAddress,
      submittedAt: {
        gte: oneHourAgo,
      },
    },
  })

  const remaining = Math.max(0, MAX_SUBMISSIONS - recentSubmissions)
  const allowed = recentSubmissions < MAX_SUBMISSIONS

  return { allowed, remaining }
}
