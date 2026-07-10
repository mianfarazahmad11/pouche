'use client'
import Link from 'next/link'
import { ShoppingCart, Tag, Sparkles } from 'lucide-react'
import { useStore } from '@/lib/store'
import WishlistToggle from './WishlistToggle'
import { getProductAvailability } from '@/lib/productAvailability'

export default function ProductCard({ product, isNew }) {
  const { addToCartMock, user, setCart, showNotification } = useStore()
  const availability = getProductAvailability(product)
  const quickAddDisabled = !availability.canPurchase

  const handleQuickAdd = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!availability.canPurchase) {
      showNotification(availability.label)
      return
    }
    
    if (!user) {
      addToCartMock(product)
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
    }
  }

  return (
    <Link href={`/product/${product._id}`} className="group flex flex-col gap-3 transition-transform duration-300 hover:-translate-y-1">
      <div className="relative aspect-[4/5] rounded-3xl bg-secondary overflow-hidden border border-border/40 shadow-sm group-hover:shadow-xl group-hover:border-primary/30 transition-all duration-300">
        {/* Badges */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
          {isNew && (
            <div className="bg-primary text-primary-foreground text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg uppercase tracking-widest transition-transform duration-300 group-hover:scale-105">
              <Sparkles className="w-3 h-3"/> New
            </div>
          )}
          {product.discountPrice && (
            <div className="bg-destructive text-destructive-foreground text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg uppercase tracking-widest transition-transform duration-300 group-hover:scale-105">
              <Tag className="w-3 h-3"/> 
              -{Math.round((1 - product.discountPrice / product.price) * 100)}%
            </div>
          )}
          {availability.code === 'coming_soon' ? (
            <div className="bg-indigo-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg uppercase tracking-widest">
              Coming Soon
            </div>
          ) : null}
          {availability.code === 'out_of_stock' ? (
            <div className="bg-slate-700 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg uppercase tracking-widest">
              Out of Stock
            </div>
          ) : null}
          {availability.code === 'low_stock' ? (
            <div className="bg-amber-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg uppercase tracking-widest">
              Low Stock
            </div>
          ) : null}
        </div>

        <div className="absolute top-3 right-3 z-20">
          <WishlistToggle product={product} />
        </div>

        {/* Quick Add Button */}
        <button 
          onClick={handleQuickAdd}
          disabled={quickAddDisabled}
          className={`absolute bottom-4 right-4 z-20 p-3 rounded-2xl shadow-xl transition-all duration-300 ${
            quickAddDisabled
              ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-100'
              : 'bg-primary text-primary-foreground transform translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 hover:scale-110 active:scale-95'
          }`}
          title={quickAddDisabled ? availability.label : 'Quick add to cart'}
        >
          <ShoppingCart className="w-5 h-5" />
        </button>
        
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700 ease-in-out" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-gradient-to-br from-secondary to-muted">
            <span className="text-2xl font-light italic">Luxe</span>
          </div>
        )}
      </div>
      <div className="px-1">
        <div className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold mb-1">{product.category}</div>
        <h3 className="font-bold text-lg line-clamp-1 group-hover:text-primary transition-colors">{product.name}</h3>
        <div className="flex items-center gap-2 mt-1">
          {product.discountPrice ? (
            <>
              <span className="font-black text-xl text-foreground">Rs. {product.discountPrice.toFixed(2)}</span>
              <span className="text-sm text-muted-foreground line-through opacity-50">Rs. {product.price.toFixed(2)}</span>
            </>
          ) : (
            <span className="font-black text-xl text-foreground">Rs. {product.price.toFixed(2)}</span>
          )}
        </div>
      </div>
    </Link>
  )
}
