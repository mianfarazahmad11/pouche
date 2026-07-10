'use client'
import { useState } from 'react'
import { useStore } from '@/lib/store'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import GoogleSignInButton from '@/components/GoogleSignInButton'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setUser, setCart } = useStore()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isAdminPortal = searchParams.get('admin') === 'true'
  
  const completeSignIn = async (userFromLogin) => {
    // Always hydrate user from server session to keep profile image persistent.
    const sessionRes = await fetch('/api/auth/me')
    const sessionData = await sessionRes.json()
    setUser(sessionData?.user || userFromLogin)

    // fetch cart
    const cartRes = await fetch('/api/cart')
    const cartData = await cartRes.json()
    setCart(cartData)
    
    router.push(userFromLogin.role === 'admin' ? '/admin' : '/')
  }

  const enforcePortalRole = async (userFromLogin) => {
    // Enforce role check for Admin Portal
    if (isAdminPortal && userFromLogin.role !== 'admin') {
      setError('Access Denied: Only administrators can log in here.')
      await fetch('/api/auth/logout', { method: 'POST' })
      return false
    }

    // Enforce role check for Customer Portal (Strict Separation)
    if (!isAdminPortal && userFromLogin.role === 'admin') {
      setError('Admin accounts must use the Admin Portal to log in.')
      await fetch('/api/auth/logout', { method: 'POST' })
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      
      if (res.ok) {
        const isAllowed = await enforcePortalRole(data.user)
        if (!isAllowed) return
        await completeSignIn(data.user)
      } else {
        setError(data.error || 'Login failed')
      }
    } catch(err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleCredential = async (credential) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Google login failed')
        return
      }

      const isAllowed = await enforcePortalRole(data.user)
      if (!isAllowed) return
      await completeSignIn(data.user)
    } catch (err) {
      setError('Google login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] animate-in fade-in duration-500">
      <div className="w-full max-w-md p-8 glass rounded-3xl shadow-2xl border border-border/50 bg-card">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            {isAdminPortal ? 'Admin Portal' : 'Welcome Back'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isAdminPortal ? 'Enter your credentials to access the dashboard' : 'Enter your details to access your account'}
          </p>
        </div>
        
        {error && <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm mb-6 font-medium text-center">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold">Email</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">Password</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className={`w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-bold mt-4 shadow-md hover:-translate-y-0.5 transition-all ${loading ? 'opacity-70' : ''}`}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        {!isAdminPortal ? (
          <>
            <div className="my-5 flex items-center gap-3">
              <span className="h-px flex-1 bg-border/70" />
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">or</span>
              <span className="h-px flex-1 bg-border/70" />
            </div>
            <GoogleSignInButton
              disabled={loading}
              onCredential={handleGoogleCredential}
              onError={(message) => setError(message)}
            />
          </>
        ) : null}

        <p className="mt-4 text-right text-sm">
          <Link href="/forgot-password" className="font-semibold text-primary hover:underline">
            Forgot password?
          </Link>
        </p>

        {!isAdminPortal && (
          <p className="text-center mt-8 text-sm text-muted-foreground">
            Don&apos;t have an account? <Link href="/register" className="text-primary font-bold hover:underline">Sign up</Link>
          </p>
        )}
      </div>
    </div>
  )
}
