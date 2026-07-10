'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import {
  LayoutDashboard,
  ShoppingBag,
  Tags,
  ClipboardList,
  Users,
  BarChart3,
  ImagePlus,
  Settings,
  Menu,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react'

const navItems = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: ShoppingBag },
  { href: '/admin/categories', label: 'Categories', icon: Tags },
  { href: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { href: '/admin/banners', label: 'Banners', icon: ImagePlus },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function AdminSidebar() {
  const storageKey = 'admin-sidebar-collapsed'
  const router = useRouter()
  const pathname = usePathname()
  const logout = useStore((state) => state.logout)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 767px)')
    const tabletQuery = window.matchMedia('(min-width: 768px) and (max-width: 1023px)')
    const stored = window.localStorage.getItem(storageKey) === 'true'

    const syncScreen = () => {
      const mobile = mobileQuery.matches
      const tablet = tabletQuery.matches
      setIsMobile(mobile)
      setIsTablet(tablet)

      if (mobile) {
        setIsMobileOpen(false)
      }

      // Tablet defaults to collapsed for better space usage.
      if (tablet) {
        setIsCollapsed(true)
      } else {
        setIsCollapsed(stored)
      }
    }

    syncScreen()
    mobileQuery.addEventListener('change', syncScreen)
    tabletQuery.addEventListener('change', syncScreen)

    return () => {
      mobileQuery.removeEventListener('change', syncScreen)
      tabletQuery.removeEventListener('change', syncScreen)
    }
  }, [])

  useEffect(() => {
    if (!isTablet) {
      window.localStorage.setItem(storageKey, String(isCollapsed))
    }
  }, [isCollapsed, isTablet])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    logout()
    router.push('/login?admin=true')
  }

  const handleToggle = () => {
    if (isMobile) {
      setIsMobileOpen((prev) => !prev)
      return
    }
    setIsCollapsed((prev) => !prev)
  }

  const isItemActive = (href) => {
    if (href === '/admin') return pathname === href
    return pathname?.startsWith(href)
  }

  const isExpanded = !isCollapsed

  const navLinkClasses = (isActive) =>
    `group relative mb-1.5 flex items-center rounded-xl transition-all duration-200 font-medium ${
      isExpanded ? 'justify-start gap-3 px-3 py-2.5' : 'justify-center px-2 py-2.5'
    } ${
      isActive
        ? 'bg-primary/10 text-primary'
        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
    }`

  const renderNavItems = (closeOnClick = false) =>
    navItems.map((item) => {
      const Icon = item.icon
      const isActive = isItemActive(item.href)
      return (
        <Link
          key={item.href}
          href={item.href}
          title={isCollapsed ? item.label : undefined}
          onClick={() => {
            if (closeOnClick) setIsMobileOpen(false)
          }}
          className={navLinkClasses(isActive)}
        >
          {isActive ? <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-primary" /> : null}
          <Icon className="w-5 h-5 shrink-0" />
          {isExpanded ? <span className="text-sm">{item.label}</span> : null}
          {!isExpanded ? (
            <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-semibold text-background opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
              {item.label}
            </span>
          ) : null}
        </Link>
      )
    })

  const desktopSidebarClasses = `hidden md:flex md:sticky md:top-24 md:h-[calc(100vh-7rem)] md:flex-col rounded-2xl md:rounded-3xl border border-border/60 bg-background/90 backdrop-blur px-2.5 pt-4 pb-3 md:shadow-sm transition-all duration-300 ${
    isExpanded ? 'md:w-60' : 'md:w-20'
  }`

  const mobileDrawerClasses = `fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] transform border-r border-border/60 bg-background/95 backdrop-blur px-3 pt-4 pb-4 transition-transform duration-300 md:hidden ${
    isMobileOpen ? 'translate-x-0' : '-translate-x-full'
  }`

  return (
    <>
      <button
        type="button"
        onClick={handleToggle}
        className="md:hidden mb-3 inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background px-3 py-2 text-sm font-semibold hover:bg-secondary transition-colors"
      >
        <Menu className="w-4 h-4" />
        Menu
      </button>

      {isMobileOpen ? (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] md:hidden"
        />
      ) : null}

      <aside id="admin-sidebar-nav" className={desktopSidebarClasses}>
        <div className={`mb-3 flex items-center ${isExpanded ? 'justify-between' : 'justify-center'}`}>
          {isExpanded ? (
            <h2 className="px-1.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Admin Panel</h2>
          ) : (
            <span className="text-xl font-black leading-none text-muted-foreground">aiQ</span>
          )}
          <button
            type="button"
            onClick={handleToggle}
            className="h-8 w-8 inline-flex items-center justify-center rounded-full border border-border bg-background hover:bg-secondary transition-colors"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
            aria-controls="admin-sidebar-nav"
          >
            {isExpanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-1">{renderNavItems()}</div>

        <div className="pt-2 mt-2 border-t border-border/60">
          <button
            type="button"
            onClick={handleLogout}
            title={isCollapsed ? 'Logout' : undefined}
            className={`w-full group relative flex items-center rounded-xl transition-all duration-200 font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive ${
              isExpanded ? 'justify-start gap-3 px-3 py-2.5' : 'justify-center px-2 py-2.5'
            }`}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {isExpanded ? <span className="text-sm">Logout</span> : null}
            {!isExpanded ? (
              <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-semibold text-background opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                Logout
              </span>
            ) : null}
          </button>
        </div>
      </aside>

      <aside id="admin-sidebar-mobile" className={mobileDrawerClasses}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="px-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Admin Panel</h2>
          <button
            type="button"
            onClick={() => setIsMobileOpen(false)}
            className="h-8 w-8 inline-flex items-center justify-center rounded-full border border-border bg-background hover:bg-secondary transition-colors"
            aria-label="Close sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{renderNavItems(true)}</div>
        <div className="pt-3 mt-3 border-t border-border/60">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}
