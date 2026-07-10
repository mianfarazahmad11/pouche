'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useStore } from '@/lib/store'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { setUser } = useStore() // optionally log them in instantly or refetch

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      })
      const data = await res.json()
      
      if (res.ok) {
        // Fetch newly created session
        const sessRes = await fetch('/api/auth/me')
        const sessData = await sessRes.json()
        if (sessData.user) setUser(sessData.user)
        
        router.push('/')
      } else {
        setError(data.error || 'Registration failed')
      }
    } catch(err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] animate-in fade-in duration-500">
      <div className="w-full max-w-md p-8 glass rounded-3xl shadow-2xl border border-border/50 bg-card">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Create Account</h1>
          <p className="text-muted-foreground mt-2">Join LuxeShop for premium access</p>
        </div>
        
        {error && <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm mb-6 font-medium text-center">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold">Full Name</label>
            <input 
              type="text" 
              required 
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="John Doe"
            />
          </div>
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
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center mt-8 text-sm text-muted-foreground">
          Already have an account? <Link href="/login" className="text-primary font-bold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
