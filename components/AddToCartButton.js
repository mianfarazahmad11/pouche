'use client'
import { useState } from 'react'
import { ShoppingCart } from 'lucide-react'
import { useStore } from '@/lib/store'
import { getProductAvailability } from '@/lib/productAvailability'

export default function AddToCartButton({ product }) {
  const [loading, setLoading] = useState(false)
  const { addToCartMock, user, setCart, showNotification } = useStore()
  const availability = getProductAvailability(product)
  const isDisabled = loading || !availability.canPurchase

  const handleAdd = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!availability.canPurchase) {
      showNotification(availability.label)
      return
    }
    setLoading(true)
    if (!user) {
      addToCartMock(product)
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product._id, quantity: 1 })
      });
      if (res.ok) {
        const updatedCart = await res.json()
        setCart(updatedCart)
        showNotification(`Added ${product.name} to cart!`)
      } else {
        const data = await res.json().catch(() => ({}))
        showNotification(data.error || 'Unable to add product')
      }
    } catch(err) {
      console.error(err)
      showNotification('Unable to add product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button 
      onClick={handleAdd}
      disabled={isDisabled}
      className={`px-8 py-4 rounded-full font-bold transition-all flex items-center justify-center gap-3 w-full md:w-auto shadow-xl ${
        availability.canPurchase
          ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-2xl hover:-translate-y-0.5'
          : 'bg-muted text-muted-foreground cursor-not-allowed shadow-none'
      } ${loading ? 'opacity-70' : ''}`}
    >
      <ShoppingCart className="w-5 h-5"/>
      {loading ? 'Adding...' : availability.canPurchase ? 'Add to Cart' : availability.label}
    </button>
  )
}
