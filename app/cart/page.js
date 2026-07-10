'use client'
import { useStore } from '@/lib/store'
import Link from 'next/link'
import { Trash2, ArrowRight, Package2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CartPage() {
  const { cart, user, setCart, removeFromCartMock, updateQuantityMock } = useStore()
  const [loadingId, setLoadingId] = useState(null)
  const router = useRouter()

  const items = cart?.items || []

  const getProduct = (item) => {
    const product = item?.productId
    if (product && typeof product === 'object') return product
    return null
  }

  const handleUpdateQty = (productId, delta) => {
    updateQuantityMock(productId, delta)
  }

  const handleRemove = async (productId) => {
    if (!user) {
      removeFromCartMock(productId)
      return
    }
    setLoadingId(productId)
    try {
      const res = await fetch(`/api/cart?productId=${productId}`, { method: 'DELETE' })
      if (res.ok) {
        const updated = await res.json()
        setCart(updated)
      }
    } catch(err) {
      console.error(err)
    } finally {
      setLoadingId(null)
    }
  }

  const subtotal = items.reduce((acc, item) => {
    const product = getProduct(item)
    if (!product) return acc
    const price = product.discountPrice || product.price || 0
    return acc + price * item.quantity
  }, 0)

  useEffect(() => {
    if (!user) return
    const syncCart = async () => {
      try {
        const res = await fetch('/api/cart')
        if (!res.ok) return
        const latestCart = await res.json()
        setCart(latestCart || { items: [] })
      } catch (err) {
        // keep local cart if sync fails
      }
    }
    syncCart()
  }, [user, setCart])

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center animate-in fade-in duration-500">
        <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mb-6">
          <Package2 className="w-10 h-10 text-muted-foreground"/>
        </div>
        <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
        <p className="text-muted-foreground mb-8 text-lg">Looks like you haven&apos;t added anything to your cart yet.</p>
        <Link href="/products" className="bg-primary text-primary-foreground px-8 py-4 rounded-full font-bold hover:bg-primary/90 transition-all shadow-xl flex items-center gap-2">
          Start Shopping <ArrowRight className="w-4 h-4"/>
        </Link>
      </div>
    )
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <h1 className="text-4xl font-extrabold tracking-tight mb-8">Shopping Cart</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-6">
          {items.map((item, index) => {
             const product = getProduct(item)
             if (!product?._id) return null
             const price = product.discountPrice || product.price
             return (
              <div key={`${product._id}-${index}`} className="flex gap-6 items-center p-4 md:p-6 bg-card border rounded-3xl shadow-sm relative pr-12 md:pr-6">
                <div className="w-24 h-24 md:w-32 md:h-32 bg-secondary rounded-2xl overflow-hidden shadow-inner flex-shrink-0 relative border">
                  {product.imageUrl ? (
                     <img src={product.imageUrl} alt={product.name} className="object-cover w-full h-full" />
                  ) : (
                     <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground uppercase font-black">Luxe</div>
                  )}
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{product.category}</div>
                  <Link href={`/product/${product._id}`} className="font-bold text-lg hover:text-primary transition-colors block line-clamp-1">{product.name}</Link>
                  <div className="text-primary font-black text-xl mb-3">Rs. {price?.toFixed(2)}</div>
                  
                  {/* Quantity Controls */}
                  <div className="flex items-center gap-3 bg-secondary/30 w-fit rounded-full px-2 py-1 border border-border/50">
                    <button 
                      onClick={() => handleUpdateQty(product._id, -1)}
                      className="w-8 h-8 rounded-full border border-border/50 bg-background flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all hover:shadow-sm"
                    >
                      <span className="text-lg font-bold leading-none">-</span>
                    </button>
                    <span className="w-6 text-center font-black text-sm">{item.quantity}</span>
                    <button 
                      onClick={() => handleUpdateQty(product._id, 1)}
                      className="w-8 h-8 rounded-full border border-border/50 bg-background flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all hover:shadow-sm"
                    >
                      <span className="text-lg font-bold leading-none">+</span>
                    </button>
                  </div>
                </div>

                <button 
                  disabled={loadingId === product._id}
                  onClick={() => handleRemove(product._id)}
                  className="absolute top-4 right-4 md:relative md:top-0 md:right-0 p-2 md:p-3 bg-destructive/10 text-destructive rounded-full hover:bg-destructive hover:text-destructive-foreground transition-all ml-auto disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4 md:w-5 md:h-5"/>
                </button>
              </div>
             )
          })}
        </div>

        <div>
          <div className="glass p-6 md:p-8 rounded-3xl sticky top-24 space-y-6">
            <h2 className="text-2xl font-bold border-b border-border/50 pb-4 tracking-tight">Order Summary</h2>
            <div className="space-y-4 text-lg">
              <div className="flex justify-between text-muted-foreground font-medium">
                <span>Subtotal</span>
                <span>Rs. {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground font-medium">
                <span>Shipping</span>
                <span>{subtotal > 5000 ? 'Free' : 'Rs. 200.00'}</span>
              </div>
            </div>
            <div className="flex justify-between font-black text-3xl pt-6 border-t border-border/50">
                <span className="tracking-tight">Total</span>
                <span>Rs. {(subtotal > 5000 ? subtotal : subtotal + 200).toFixed(2)}</span>
            </div>
            
            <button 
              onClick={() => {
                if(!user) {
                  router.push('/login?redirect=/checkout')
                } else {
                  router.push('/checkout')
                }
              }}
              className="w-full bg-primary text-primary-foreground py-5 rounded-full font-black text-lg hover:bg-primary/90 transition-all shadow-xl hover:-translate-y-1 flex justify-center items-center gap-2 mt-6 active:scale-95"
            >
              Proceed to Checkout <ArrowRight className="w-5 h-5"/>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
