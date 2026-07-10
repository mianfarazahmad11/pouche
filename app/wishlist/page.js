'use client'
import { useStore } from '@/lib/store'
import Link from 'next/link'
import { Heart, ShoppingCart, ArrowRight, Tag, Trash2, Package } from 'lucide-react'
import WishlistToggle from '@/components/WishlistToggle'

export default function WishlistPage() {
  const { wishlist, isHydrated, addToCartMock } = useStore()

  if (!isHydrated) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-primary">
          <Heart className="w-5 h-5 fill-current" />
          <span className="text-sm font-black uppercase tracking-widest">Saved Items</span>
        </div>
        <h1 className="text-5xl font-black tracking-tighter">My Wishlist</h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Your personal collection of premium aesthetics. Items saved here will be waiting for you whenever you return.
        </p>
      </div>

      {wishlist.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {wishlist.map(product => (
            <div key={product._id} className="group flex flex-col gap-4">
              <div className="relative aspect-[4/5] rounded-[2.5rem] bg-secondary/30 overflow-hidden border border-border/40 group-hover:shadow-2xl transition-all duration-500">
                {product.discountPrice && (
                  <div className="absolute top-4 left-4 z-10 bg-destructive text-destructive-foreground text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1 shadow-lg uppercase tracking-widest">
                    <Tag className="w-3 h-3"/> 
                    -{Math.round((1 - product.discountPrice / product.price) * 100)}%
                  </div>
                )}
                
                <div className="absolute top-4 right-4 z-10">
                  <WishlistToggle product={product} />
                </div>

                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-1000 ease-out" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-gradient-to-br from-secondary to-background">
                    <span className="text-2xl font-light italic text-primary/30">Luxe</span>
                  </div>
                )}
                
                {/* Action Overlay */}
                <div className="absolute bottom-4 left-4 right-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  <button 
                    onClick={() => addToCartMock(product)}
                    className="w-full bg-primary text-primary-foreground py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl hover:bg-primary/90 transition-colors"
                  >
                    <ShoppingCart className="w-4 h-4" /> Add to Cart
                  </button>
                </div>
              </div>

              <div className="px-2 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] text-primary uppercase tracking-[0.2em] font-black">{product.category}</div>
                </div>
                <Link href={`/product/${product._id}`}>
                  <h3 className="font-bold text-xl line-clamp-1 hover:text-primary transition-colors cursor-pointer">{product.name}</h3>
                </Link>
                <div className="flex items-center gap-2 mt-1">
                  {product.discountPrice ? (
                    <>
                      <span className="font-black text-2xl text-foreground">Rs. {product.discountPrice.toFixed(2)}</span>
                      <span className="text-sm text-muted-foreground line-through opacity-50 font-bold">Rs. {product.price.toFixed(2)}</span>
                    </>
                  ) : (
                    <span className="font-black text-2xl text-foreground">Rs. {product.price.toFixed(2)}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-32 text-center rounded-[3rem] bg-secondary/10 border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-6">
          <div className="bg-background p-8 rounded-full shadow-inner border border-border/20">
            <Heart className="w-16 h-16 text-muted-foreground opacity-20" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black tracking-tight">Your wishlist is empty</h2>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Start adding your favorite products here so you don't miss out on premium deals.
            </p>
          </div>
          <Link href="/products" className="bg-primary text-primary-foreground px-10 py-4 rounded-2xl font-bold hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center gap-3 mt-4">
            Start Exploring <ArrowRight className="w-5 h-5"/>
          </Link>
        </div>
      )}
    </div>
  )
}
