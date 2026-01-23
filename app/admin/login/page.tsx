'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Glass } from '@/components/ui/Glass'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function AdminLogin() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if already logged in
    fetch('/api/admin/submissions')
      .then((res) => {
        if (res.ok) {
          router.push('/admin')
        }
      })
      .catch(() => {
        // Not logged in, stay on login page
      })
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      const result = await response.json()

      if (result.success) {
        router.push('/admin')
      } else {
        setError(result.error || 'Invalid password')
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <Glass variant="panel" className="max-w-md w-full">
        <h1 className="font-display text-3xl text-dark-gray mb-6 text-center">
          Admin Login
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus
          />
          {error && (
            <p className="text-soft-rose text-sm" role="alert">
              {error}
            </p>
          )}
          <Button
            type="submit"
            variant="solid"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
      </Glass>
    </div>
  )
}
