'use client'
import { useStore } from '@/lib/store'
import { CheckCircle2, X } from 'lucide-react'

export default function Toaster() {
  const { notification, showNotification } = useStore()

  if (!notification) return null

  return (
    <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="glass bg-background/80 backdrop-blur-xl border border-primary/20 p-4 pl-5 pr-6 rounded-2xl shadow-2xl flex items-center gap-4 min-w-[320px]">
        <div className="bg-primary/10 p-2 rounded-xl">
          <CheckCircle2 className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold tracking-tight">{notification}</p>
        </div>
        <button 
          onClick={() => showNotification(null)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
