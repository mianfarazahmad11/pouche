'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, LogOut, Mail, ShieldCheck, User } from 'lucide-react'
import { useStore } from '@/lib/store'

export default function AdminProfilePage() {
  const router = useRouter()
  const { user, logout, setUser, showNotification } = useStore()
  const [uploadingImage, setUploadingImage] = useState(false)

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    logout()
    router.push('/login?admin=true')
  }

  const handleProfileImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok) {
        showNotification(uploadData.error || 'Image upload failed')
        return
      }

      const updateRes = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileImageUrl: uploadData.url }),
      })
      const updateData = await updateRes.json()
      if (!updateRes.ok) {
        showNotification(updateData.error || 'Profile update failed')
        return
      }

      if (updateData.user) setUser(updateData.user)
      showNotification('Profile image updated')
    } catch (error) {
      showNotification('Unable to update profile image')
    } finally {
      setUploadingImage(false)
      e.target.value = ''
    }
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="py-10 text-muted-foreground">Admin profile unavailable.</div>
    )
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight mb-2">Admin Profile</h1>
        <p className="text-muted-foreground">Manage your administrator account details.</p>
      </div>

      <div className="max-w-2xl">
        <div className="glass p-8 rounded-3xl border bg-card shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-500" />

          <div className="relative z-10 space-y-6">
            <div className="relative w-20 h-20">
              {user.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt={user.name}
                  className="w-20 h-20 rounded-2xl object-cover border border-border"
                />
              ) : (
                <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                  <User className="w-10 h-10" />
                </div>
              )}
              <label className={`absolute -bottom-2 -right-2 h-8 w-8 rounded-full border bg-background text-foreground flex items-center justify-center cursor-pointer hover:bg-secondary transition-colors ${uploadingImage ? 'opacity-60 cursor-not-allowed' : ''}`}>
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingImage}
                  onChange={handleProfileImageUpload}
                />
              </label>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-1">
                  <User className="w-3 h-3" /> Full Name
                </label>
                <div className="text-xl font-bold">{user.name}</div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-1">
                  <Mail className="w-3 h-3" /> Email Address
                </label>
                <div className="text-lg font-medium text-muted-foreground break-all">{user.email}</div>
              </div>

              <div className="pt-4 border-t border-border/50">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Role: Administrator</span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full mt-4 flex items-center justify-center gap-2 bg-destructive/10 text-destructive py-3 rounded-2xl text-sm font-bold hover:bg-destructive hover:text-white transition-all shadow-sm"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
