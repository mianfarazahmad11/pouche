'use client'

import Link from 'next/link'
import { ShoppingCart, User, LogOut, Package2, Shield, Search, Heart } from 'lucide-react'
import { useStore } from '@/lib/store'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

export default function Navbar() {
  const { user, cart, wishlist, logout, setUser, setCart, isHydrated } = useStore()
  const searchParams = useSearchParams()
  const router = useRouter()
  const isAdminPortal = searchParams.get('admin') === 'true'
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [searchSuggestions, setSearchSuggestions] = useState([])
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [categories, setCategories] = useState([])
  const [branding, setBranding] = useState({ websiteName: 'LuxeShop', websiteLogoUrl: '' })
  const searchBoxRef = useRef(null)

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
      setDebouncedQuery('')
      setShowSearchDropdown(false)
    }
  }

  const handleSuggestionClick = (suggestion) => {
    setShowSearchDropdown(false)
    setSearchQuery('')
    setDebouncedQuery('')
    if (suggestion?._id) {
      router.push(`/product/${suggestion._id}`)
      return
    }
    router.push(`/products?search=${encodeURIComponent(suggestion.name || '')}`)
  }

  // Standard hydration check
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch session once hydrated
  useEffect(() => {
    if (!mounted || !isHydrated) return;
    const fetchData = async () => {
      try {
        // Fetch session
        const res = await fetch('/api/auth/me')
        const data = await res.json()
        if (data.user) {
          setUser(data.user)
          const cartRes = await fetch('/api/cart')
          const cartData = await cartRes.json()
          setCart(cartData)
        }
      } catch (err) {
        console.error(err)
      }
    }
    fetchData()
  }, [setUser, setCart, isHydrated, mounted])

  useEffect(() => {
    if (!mounted) return
    const fetchBranding = async () => {
      try {
        const res = await fetch('/api/settings/public')
        if (!res.ok) return
        const data = await res.json()
        setBranding({
          websiteName: data.websiteName || 'LuxeShop',
          websiteLogoUrl: data.websiteLogoUrl || '',
        })
      } catch (err) {
        // Fall back to local defaults if settings are unavailable.
      }
    }
    fetchBranding()
  }, [mounted])

  useEffect(() => {
    const trimmed = searchQuery.trim()
    const timer = setTimeout(() => {
      setDebouncedQuery(trimmed)
    }, 350)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        setSearchSuggestions([])
        setShowSearchDropdown(false)
        return
      }
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(debouncedQuery)}`)
        if (!res.ok) {
          setSearchSuggestions([])
          setShowSearchDropdown(false)
          return
        }
        const data = await res.json()
        const next = Array.isArray(data) ? data.slice(0, 6) : []
        setSearchSuggestions(next)
        setShowSearchDropdown(next.length > 0)
      } catch (error) {
        setSearchSuggestions([])
        setShowSearchDropdown(false)
      }
    }
    fetchSuggestions()
  }, [debouncedQuery])

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!searchBoxRef.current) return
      if (!searchBoxRef.current.contains(event.target)) {
        setShowSearchDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    logout()
  }

  const cartCount = cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0
  const wishlistCount = wishlist?.length || 0

  if (!mounted) return (
    <nav className="glass sticky top-0 z-50 p-4 shadow-sm border-b border-border/40 min-h-[80px]">
      <div className="max-w-7xl mx-auto flex items-center justify-between opacity-50">
        <div className="flex items-center gap-2"><div className="w-8 h-8 bg-secondary rounded-lg animate-pulse"/><div className="w-24 h-6 bg-secondary rounded animate-pulse"/></div>
      </div>
    </nav>
  )

  if (isAdminPortal) return null

  return (
    <nav className="glass sticky top-0 z-50 p-4 shadow-sm border-b border-border/40">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
        <Link href="/" className="font-bold text-2xl tracking-tighter flex items-center gap-2 shrink-0">
          {branding.websiteLogoUrl ? (
            <img src={branding.websiteLogoUrl} alt={branding.websiteName} className="h-10 w-auto rounded-md border border-border/50 bg-background p-1" />
          ) : (
            <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
              <Package2 className="w-5 h-5"/>
            </div>
          )}
        </Link>

        {/* Navigation Links (Removed Shop as requested) */}
        <div className="hidden lg:flex items-center gap-6">
          {/* Shop link removed */}
        </div>

        {/* Search Bar */}
        <form ref={searchBoxRef} onSubmit={handleSearch} className="flex-1 max-w-sm relative group hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search aesthetics..." 
            value={searchQuery}
            onFocus={() => {
              if (searchSuggestions.length > 0) setShowSearchDropdown(true)
            }}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-secondary/50 border border-transparent focus:border-primary/20 focus:bg-background rounded-full py-2 pl-10 pr-4 text-xs outline-none transition-all font-bold"
          />
          {showSearchDropdown && (
            <div className="absolute z-50 mt-2 w-full rounded-2xl border border-border bg-background shadow-xl overflow-hidden">
              {searchSuggestions.map((item) => (
                <button
                  key={item._id || item.name}
                  type="button"
                  onClick={() => handleSuggestionClick(item)}
                  className="w-full text-left px-4 py-2.5 hover:bg-secondary/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg border bg-secondary/40 overflow-hidden shrink-0">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{item.name}</p>
                      <p className="text-[12px] text-primary font-bold">
                        Rs. {Number(item.price || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
                  setShowSearchDropdown(false)
                }}
                className="w-full text-left px-4 py-2.5 text-xs font-bold text-primary hover:bg-primary/5 border-t border-border/70"
              >
                View all results for "{searchQuery.trim()}"
              </button>
            </div>
          )}
        </form>

        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/wishlist" className="relative p-2 hover:bg-secondary rounded-full transition-all duration-200 hover:scale-110 active:scale-95 flex items-center justify-center group">
              <Heart className={`w-5 h-5 ${wishlistCount > 0 ? 'fill-primary text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 bg-primary text-primary-foreground text-[8px] font-black px-1.5 py-0.5 rounded-full min-w-[16px] text-center transform translate-x-1/4 -translate-y-1/4 shadow-sm">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link href="/cart" className="relative p-2 hover:bg-secondary rounded-full transition-all duration-200 hover:scale-110 active:scale-95 flex items-center justify-center group">
              <ShoppingCart className="w-5 h-5 group-hover:text-primary transition-colors" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 bg-primary text-primary-foreground text-[8px] font-black px-1.5 py-0.5 rounded-full min-w-[16px] text-center transform translate-x-1/4 -translate-y-1/4 shadow-sm">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
          
          {user ? (
            <div className="flex items-center gap-4 border-l border-border/50 pl-4 h-8">
              <Link href="/profile" className="text-xs font-black uppercase tracking-widest flex items-center gap-1.5 hover:text-primary transition-colors group">
                {user.profileImageUrl ? (
                  <img src={user.profileImageUrl} alt={user.name || 'Account'} className="w-7 h-7 rounded-full object-cover border border-border/60" />
                ) : (
                  <div className="p-1.5 rounded-full bg-secondary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                    <User className="w-4 h-4"/>
                  </div>
                )}
                <span className="hidden xl:inline">Account</span>
              </Link>
            </div>
          ) : (
            <Link href="/login" className="text-xs font-black uppercase tracking-widest hover:text-primary transition-colors flex items-center gap-2 border border-border/50 px-5 py-2.5 rounded-full hover:bg-secondary/50">
              <User className="w-4 h-4"/> <span>Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
