'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [resetUrl, setResetUrl] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    setResetUrl('')

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Unable to process request')
        return
      }

      setSuccess(data.message || 'Reset instructions sent.')
      if (data.resetUrl) {
        setResetUrl(data.resetUrl)
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center animate-in fade-in duration-500">
      <div className="w-full max-w-md rounded-3xl border border-border/50 bg-card p-8 shadow-xl">
        <h1 className="text-3xl font-bold tracking-tight">Forgot Password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a reset link.
        </p>

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
            <label className="text-sm font-semibold">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="you@example.com"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded-xl bg-primary py-3.5 font-bold text-primary-foreground shadow-md transition-all ${loading ? 'opacity-70' : 'hover:-translate-y-0.5'}`}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        {resetUrl ? (
          <div className="mt-5 rounded-lg border border-border/60 bg-secondary/30 p-3 text-xs text-muted-foreground">
            Dev link:{' '}
            <a className="font-semibold text-primary underline" href={resetUrl}>
              Open reset page
            </a>
          </div>
        ) : null}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Remember your password?{' '}
          <Link href="/login" className="font-bold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
