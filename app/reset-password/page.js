'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, confirmPassword }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Unable to reset password')
        return
      }

      setSuccess(data.message || 'Password reset successfully.')
      setTimeout(() => router.push('/login'), 1200)
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center animate-in fade-in duration-500">
      <div className="w-full max-w-md rounded-3xl border border-border/50 bg-card p-8 shadow-xl">
        <h1 className="text-3xl font-bold tracking-tight">Reset Password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter a new password for your account.
        </p>

        {!token ? (
          <div className="mt-5 rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">
            Missing reset token. Please request a new reset link.
          </div>
        ) : null}

        {error ? (
          <div className="mt-5 rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mt-5 rounded-lg bg-emerald-500/10 p-3 text-sm font-medium text-emerald-600">
            {success}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold">New Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="Minimum 8 characters"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">Confirm Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="Re-enter password"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !token}
            className={`w-full rounded-xl bg-primary py-3.5 font-bold text-primary-foreground shadow-md transition-all ${loading || !token ? 'opacity-70' : 'hover:-translate-y-0.5'}`}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Back to{' '}
          <Link href="/login" className="font-bold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
