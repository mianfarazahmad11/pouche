'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Package2, User } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { useStore } from '@/lib/store'

function AdminHeader() {
  const user = useStore((state) => state.user)

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="w-full px-3 py-2.5 sm:px-4 md:px-6 md:py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-8 items-center rounded-full border border-primary/30 bg-primary/10 px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
            Admin
          </span>
          <h1 className="text-sm md:text-base font-black tracking-tight">Dashboard</h1>
        </div>
        <Link href="/admin/profile" className="flex items-center gap-2 rounded-full border border-border/60 bg-background px-2.5 py-1.5 shadow-sm hover:bg-secondary transition-colors">
          {user?.profileImageUrl ? (
            <img
              src={user.profileImageUrl}
              alt={user?.name || 'Admin'}
              className="w-7 h-7 rounded-full object-cover border border-border/60"
            />
          ) : (
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <User className="w-4 h-4" />
            </span>
          )}
          <span className="hidden sm:inline text-xs font-bold tracking-wide">
            {user?.name || 'Admin'}
          </span>
        </Link>
      </div>
    </header>
  )
}

function AdminFooter() {
  return (
    <footer className="border-t border-border/50 py-6 mt-auto">
      <div className="w-full px-3 sm:px-4 md:px-6 text-xs text-muted-foreground font-semibold">
        Admin Panel
      </div>
    </footer>
  )
}

function StoreFooter({ settings }) {
  return (
    <footer className="border-t border-border mt-auto bg-secondary/20">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-sm">
        <div className="space-y-3">
          {settings.websiteLogoUrl ? (
            <img
              src={settings.websiteLogoUrl}
              alt={settings.websiteName}
              className="h-10 w-auto rounded-md border border-border/50 bg-background p-1"
            />
          ) : (
            <div className="inline-flex items-center justify-center bg-primary text-primary-foreground p-2 rounded-lg">
              <Package2 className="w-5 h-5" />
            </div>
          )}
          <p className="text-muted-foreground leading-relaxed">
            Premium shopping experience with curated products and secure checkout.
          </p>
          {settings.shopAddress ? <p className="text-muted-foreground">{settings.shopAddress}</p> : null}
        </div>

        <div className="space-y-3">
          <h4 className="font-bold uppercase text-xs tracking-widest text-muted-foreground">Shop</h4>
          <div className="flex flex-col gap-2">
            <Link href="/products" className="hover:text-foreground transition-colors">All Products</Link>
            <Link href="/wishlist" className="hover:text-foreground transition-colors">Wishlist</Link>
            <Link href="/cart" className="hover:text-foreground transition-colors">Cart</Link>
            <Link href="/orders" className="hover:text-foreground transition-colors">My Orders</Link>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-bold uppercase text-xs tracking-widest text-muted-foreground">Support</h4>
          <div className="flex flex-col gap-2">
            {settings.storeEmailAddress ? <a href={`mailto:${settings.storeEmailAddress}`} className="hover:text-foreground transition-colors">{settings.storeEmailAddress}</a> : null}
            {settings.storePhoneNumber ? <a href={`tel:${settings.storePhoneNumber}`} className="hover:text-foreground transition-colors">{settings.storePhoneNumber}</a> : null}
            <Link href="/profile" className="hover:text-foreground transition-colors">My Account</Link>
            <Link href="/checkout" className="hover:text-foreground transition-colors">Checkout</Link>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-bold uppercase text-xs tracking-widest text-muted-foreground">Policies</h4>
          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground">Secure Payments</span>
            <span className="text-muted-foreground">Easy Returns</span>
            <span className="text-muted-foreground">Fast Shipping</span>
            <span className="text-muted-foreground">24/7 Support</span>
          </div>
        </div>
      </div>

      <div className="border-t border-border/70">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex flex-col md:flex-row gap-2 md:gap-4 items-start md:items-center justify-between text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} {settings.websiteName}. All rights reserved.</p>
          <p className="uppercase tracking-wider">Visa - Mastercard - COD</p>
        </div>
      </div>
    </footer>
  )
}

export default function AppChrome({ children, settings }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isAdmin = pathname?.startsWith('/admin')
  const isAdminLoginPage = pathname === '/login' && searchParams.get('admin') === 'true'

  return (
    <>
      {isAdmin ? (
        <AdminHeader />
      ) : (
        <Suspense fallback={<div className="h-20 bg-background border-b border-border/40 animate-pulse" />}>
          <Navbar />
        </Suspense>
      )}

      <main className={`flex-1 w-full ${isAdmin ? 'px-2 sm:px-3 md:px-4 pt-0 pb-2 md:pb-3' : 'max-w-7xl mx-auto p-4 md:p-8'}`}>
        {children}
      </main>

      {isAdmin ? <AdminFooter /> : !isAdminLoginPage ? <StoreFooter settings={settings} /> : null}
    </>
  )
}
