'use client'
import { Heart } from 'lucide-react'
import { useStore } from '@/lib/store'

export default function WishlistToggle({ product }) {
  const { wishlist, toggleWishlist, isHydrated } = useStore()
  
  if (!isHydrated) return (
    <div className="p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 text-muted-foreground/50">
      <Heart className="w-4 h-4" />
    </div>
  )

  const isInWishlist = wishlist?.some((p) => p._id === product._id)

  const handleToggle = (e) => {
    e.preventDefault()
    e.stopPropagation()
    toggleWishlist(product)
  }

  return (
    <button 
      onClick={handleToggle}
      className={`p-2.5 rounded-full backdrop-blur-md border transition-all duration-300 shadow-sm hover:scale-110 active:scale-90 ${
        isInWishlist 
          ? 'bg-primary border-primary text-primary-foreground shadow-primary/20' 
          : 'bg-background/80 border-border/50 text-muted-foreground hover:text-primary hover:border-primary/30'
      }`}
    >
      <Heart className={`w-4 h-4 ${isInWishlist ? 'fill-current' : ''}`} />
    </button>
  )
}
