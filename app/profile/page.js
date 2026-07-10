'use client'
import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
import Link from 'next/link'
import { FileText, Package, User, Mail, ShieldCheck, ArrowRight, LogOut, Camera } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const { user, isHydrated, logout, setUser, showNotification } = useStore()
  const router = useRouter()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploadingImage, setUploadingImage] = useState(false)

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      logout()
      router.push('/login')
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    if (isHydrated && !user) {
      router.push('/login')
      return;
    }

    if (user?.role === 'admin') {
      router.replace('/admin/profile')
      return
    }

    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/orders')
        if (res.ok) {
          const data = await res.json()
          setOrders(data)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchOrders()
    }
  }, [user, isHydrated, router])

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

      if (updateData.user) {
        setUser(updateData.user)
      }
      showNotification('Profile image updated')
    } catch (err) {
      showNotification('Unable to update profile image')
    } finally {
      setUploadingImage(false)
      e.target.value = ''
    }
  }

  if (!isHydrated || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-pulse text-muted-foreground">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p>Loading your profile...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-muted-foreground">
        <p>Redirecting to login...</p>
      </div>
    )
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      <div className="mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight mb-2">My Profile</h1>
        <p className="text-muted-foreground">Manage your account details and view your order history.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Details Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass p-8 rounded-3xl border bg-card shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-500" />
            
            <div className="relative z-10 space-y-6">
              <div className="relative w-20 h-20">
                {user?.profileImageUrl ? (
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
                    <span>Role: {user.role === 'admin' ? 'Administrator' : 'Verified Customer'}</span>
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

        {/* Order History Main Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Package className="w-6 h-6 text-primary" />
              Recent Orders
            </h2>
            <Link href="/products" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
              Shop More <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="glass p-12 rounded-3xl border border-dashed text-center space-y-4">
              <Package className="w-12 h-12 text-muted-foreground mx-auto opacity-30" />
              <p className="text-muted-foreground font-medium">You haven't placed any orders yet.</p>
              <Link href="/products" className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-full font-bold hover:bg-primary/90 transition-all">
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map(order => (
                <div key={order._id} className="glass p-6 rounded-3xl bg-card border hover:shadow-lg transition-all group">
                   <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                     <div className="space-y-1">
                       <div className="flex items-center gap-3">
                         <span className="font-mono text-xs font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded">#{order._id.slice(-8).toUpperCase()}</span>
                         <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest
                            ${order.status === 'delivered' ? 'bg-green-100 text-green-700' : 
                              order.status === 'shipped' ? 'bg-blue-100 text-blue-700' : 'bg-primary/10 text-primary'}
                         `}>
                           {order.status}
                         </span>
                       </div>
                       <div className="text-sm font-medium text-muted-foreground">
                         {new Date(order.createdAt).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric'})}
                       </div>
                     </div>
                     
                     <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                       <div className="text-right">
                         <div className="text-xl font-black text-foreground">Rs. {order.totalPrice.toFixed(2)}</div>
                         <div className="text-[10px] text-muted-foreground font-bold uppercase">{order.products.length} {order.products.length === 1 ? 'item' : 'items'}</div>
                       </div>
                       <Link 
                          href={`/invoice/${order._id}`} 
                          className="px-4 py-2 bg-secondary rounded-xl text-xs font-bold hover:bg-primary hover:text-primary-foreground transition-all flex items-center gap-1.5"
                        >
                         <FileText className="w-3 h-3"/> Invoice
                       </Link>
                     </div>
                   </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
