'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Glass } from '@/components/ui/Glass'
import { Button } from '@/components/ui/Button'

interface Submission {
  id: string
  name: string
  email: string | null
  phone: string | null
  attending: boolean
  guestCount: number | null
  dietaryPrefs: string | null
  message: string | null
  submittedAt: string
}

export default function AdminDashboard() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [filter, setFilter] = useState<'all' | 'true' | 'false'>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetchSubmissions()
  }, [filter])

  const fetchSubmissions = async () => {
    setIsLoading(true)
    setError('')

    try {
      const attendingParam = filter === 'all' ? '' : `?attending=${filter}`
      const response = await fetch(`/api/admin/submissions${attendingParam}`)

      if (response.status === 401) {
        router.push('/admin/login')
        return
      }

      if (!response.ok) {
        throw new Error('Failed to fetch submissions')
      }

      const data = await response.json()
      setSubmissions(data.submissions)
    } catch (err: any) {
      setError(err.message || 'Failed to load submissions')
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const attendingParam = filter === 'all' ? '' : `&attending=${filter}`
      const response = await fetch(`/api/admin/export?format=${format}${attendingParam}`)

      if (!response.ok) {
        throw new Error('Export failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `rsvp-submissions.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      alert('Failed to export. Please try again.')
    }
  }

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  const attendingCount = submissions.filter((s) => s.attending).length
  const declinedCount = submissions.filter((s) => !s.attending).length
  const totalGuests = submissions
    .filter((s) => s.attending)
    .reduce((sum, s) => sum + (s.guestCount || 0), 0)

  return (
    <div className="min-h-screen py-12 px-4 max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-4xl text-dark-gray mb-2">Admin Dashboard</h1>
          <p className="text-medium-gray">Manage RSVP submissions</p>
        </div>
        <Button onClick={handleLogout} variant="solid">
          Logout
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Glass variant="card" className="text-center">
          <div className="text-3xl font-display text-dark-gray mb-2">
            {submissions.length}
          </div>
          <div className="text-medium-gray">Total Responses</div>
        </Glass>
        <Glass variant="card" className="text-center">
          <div className="text-3xl font-display text-dark-gray mb-2">
            {attendingCount}
          </div>
          <div className="text-medium-gray">Attending</div>
        </Glass>
        <Glass variant="card" className="text-center">
          <div className="text-3xl font-display text-dark-gray mb-2">
            {totalGuests}
          </div>
          <div className="text-medium-gray">Total Guests</div>
        </Glass>
      </div>

      {/* Filters and Export */}
      <Glass variant="panel" className="mb-8">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'solid' : 'glass'}
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'true' ? 'solid' : 'glass'}
              onClick={() => setFilter('true')}
            >
              Attending
            </Button>
            <Button
              variant={filter === 'false' ? 'solid' : 'glass'}
              onClick={() => setFilter('false')}
            >
              Declined
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="glass" onClick={() => handleExport('csv')}>
              Export CSV
            </Button>
            <Button variant="glass" onClick={() => handleExport('json')}>
              Export JSON
            </Button>
          </div>
        </div>
      </Glass>

      {/* Submissions List */}
      {isLoading ? (
        <Glass variant="panel" className="text-center py-12">
          <p className="text-medium-gray">Loading...</p>
        </Glass>
      ) : error ? (
        <Glass variant="panel" className="text-center py-12">
          <p className="text-soft-rose">{error}</p>
        </Glass>
      ) : submissions.length === 0 ? (
        <Glass variant="panel" className="text-center py-12">
          <p className="text-medium-gray">No submissions found.</p>
        </Glass>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission) => (
            <Glass key={submission.id} variant="card">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-dark-gray text-lg">
                      {submission.name}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-small text-sm ${
                        submission.attending
                          ? 'bg-pale-sky-blue/30 text-dark-gray'
                          : 'bg-medium-gray/20 text-medium-gray'
                      }`}
                    >
                      {submission.attending ? 'Attending' : 'Declined'}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-medium-gray">
                    {submission.email && <div>Email: {submission.email}</div>}
                    {submission.phone && <div>Phone: {submission.phone}</div>}
                    {submission.attending && submission.guestCount && (
                      <div>Guests: {submission.guestCount}</div>
                    )}
                    {submission.dietaryPrefs && (
                      <div>Dietary: {submission.dietaryPrefs}</div>
                    )}
                    {submission.message && (
                      <div className="mt-2 italic">"{submission.message}"</div>
                    )}
                  </div>
                </div>
                <div className="text-sm text-medium-gray">
                  {new Date(submission.submittedAt).toLocaleDateString()}
                </div>
              </div>
            </Glass>
          ))}
        </div>
      )}
    </div>
  )
}
