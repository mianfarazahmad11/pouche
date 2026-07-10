'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function OrdersPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the new profile page where orders are now shown
    router.replace('/profile')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground animate-pulse">
      <p>Redirecting to your profile...</p>
    </div>
  )
}
