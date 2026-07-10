'use client'
import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'

export default function CheckoutSuccessPage() {
  const { setCart } = useStore()
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('session_id')
  const method = searchParams.get('method')
  const paramOrderId = searchParams.get('orderId')

  const [status, setStatus] = useState('loading') // loading | success | error
  const [orderId, setOrderId] = useState(paramOrderId)

  useEffect(() => {
    // If it's a COD order, it's already created in the API
    if (method === 'cod' && paramOrderId) {
      setCart({ items: [] })
      setStatus('success')
      return
    }

    if (!sessionId) {
      router.push('/')
      return
    }

    const verifyAndCreateOrder = async () => {
      try {
        const res = await fetch(`/api/checkout/verify?session_id=${sessionId}`)
        const data = await res.json()

        if (res.ok && data.order) {
          // Clear cart from DB
          await fetch('/api/cart', { method: 'DELETE' })
          // Clear cart from local store
          setCart({ items: [] })
          setOrderId(data.order._id)
          setStatus('success')
        } else {
          setStatus('error')
        }
      } catch {
        setStatus('error')
      }
    }

    verifyAndCreateOrder()
  }, [sessionId, method, paramOrderId, setCart, router])

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-in fade-in duration-500">
        <Loader2 className="w-16 h-16 text-primary animate-spin" />
        <h1 className="text-2xl font-bold">Confirming your payment...</h1>
        <p className="text-muted-foreground">Please wait while we verify your order.</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center animate-in fade-in duration-500">
        <XCircle className="w-20 h-20 text-destructive" />
        <h1 className="text-3xl font-bold">Something went wrong</h1>
        <p className="text-muted-foreground mb-6">We could not verify your payment. Please contact support.</p>
        <Link href="/cart" className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-bold hover:bg-primary/90 transition-all">
          Back to Cart
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center animate-in fade-in zoom-in duration-500">
      <div className="relative">
        <div className="absolute inset-0 bg-green-400/20 rounded-full blur-3xl scale-150" />
        <CheckCircle2 className="w-24 h-24 text-green-500 relative z-10" />
      </div>
      <div className="space-y-3">
        <h1 className="text-4xl font-extrabold tracking-tight">
          {method === 'cod' ? 'Order Placed!' : 'Payment Successful!'}
        </h1>
        <p className="text-muted-foreground text-lg max-w-md">
          {method === 'cod' 
            ? 'Your Cash on Delivery order has been successfully placed. Please keep the cash ready at the time of delivery.'
            : 'Thank you for your purchase. Your payment has been confirmed and your order is being processed.'
          }
        </p>
      </div>
      <div className="flex gap-4 mt-4">
        <Link
          href="/orders"
          className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-bold hover:bg-primary/90 transition-all shadow-lg"
        >
          View Orders
        </Link>
        {orderId && (
          <Link
            href={`/invoice/${orderId}`}
            className="bg-secondary text-secondary-foreground px-8 py-3 rounded-full font-bold hover:bg-secondary/80 transition-all"
          >
            View Invoice
          </Link>
        )}
      </div>
    </div>
  )
}
