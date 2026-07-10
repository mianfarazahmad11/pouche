'use client'

import { useEffect, useMemo, useState } from 'react'
import { Edit, Trash2, Plus } from 'lucide-react'
import { useStore } from '@/lib/store'

const initialForm = {
  placement: 'home',
  title: '',
  subtitle: '',
  imageUrl: '',
  buttonText: '',
  buttonLink: '',
  status: 'active',
}

export default function AdminBannersPage() {
  const { showNotification } = useStore()
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState(initialForm)
  const [editId, setEditId] = useState(null)
  const [pendingDeleteId, setPendingDeleteId] = useState(null)

  const fetchBanners = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/banners')
      const data = await res.json()
      setBanners(Array.isArray(data) ? data : [])
    } catch (error) {
      setBanners([])
      showNotification('Failed to load banners')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBanners()
  }, [])

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const data = new FormData()
    data.append('file', file)
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: data })
      const result = await res.json()
      if (!res.ok) {
        showNotification(result.error || 'Image upload failed')
        return
      }
      setFormData((prev) => ({ ...prev, imageUrl: result.url }))
      showNotification('Banner image uploaded')
    } catch (error) {
      showNotification('Image upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const url = editId ? `/api/banners/${editId}` : '/api/banners'
    const method = editId ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
    const data = await res.json()
    if (!res.ok) {
      showNotification(data.error || 'Failed to save banner')
      return
    }
    showNotification(editId ? 'Banner updated' : 'Banner created')
    setFormData(initialForm)
    setEditId(null)
    fetchBanners()
  }

  const handleEdit = (banner) => {
    setEditId(banner._id)
    setFormData({
      placement: banner.placement === 'collection' ? 'collection' : banner.placement === 'promotion' ? 'promotion' : 'home',
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      imageUrl: banner.imageUrl || '',
      buttonText: banner.buttonText || '',
      buttonLink: banner.buttonLink || '',
      status: banner.status === 'inactive' ? 'inactive' : 'active',
    })
  }

  const handleDelete = async (id) => {
    if (pendingDeleteId !== id) {
      setPendingDeleteId(id)
      showNotification('Click delete again to confirm')
      setTimeout(() => setPendingDeleteId(null), 3500)
      return
    }

    const res = await fetch(`/api/banners/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) {
      showNotification(data.error || 'Failed to delete banner')
      return
    }
    showNotification('Banner deleted')
    setPendingDeleteId(null)
    fetchBanners()
  }

  const stats = useMemo(() => {
    const active = banners.filter((b) => b.status === 'active').length
    const inactive = banners.filter((b) => b.status === 'inactive').length
    return { total: banners.length, active, inactive }
  }, [banners])

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold">Manage Banners</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-background rounded-2xl border border-border p-5 shadow-sm">
          <p className="text-sm text-muted-foreground font-semibold mb-2">Total Banners</p>
          <p className="text-3xl font-black">{stats.total}</p>
        </div>
        <div className="bg-background rounded-2xl border border-border p-5 shadow-sm">
          <p className="text-sm text-muted-foreground font-semibold mb-2">Active</p>
          <p className="text-3xl font-black text-emerald-600">{stats.active}</p>
        </div>
        <div className="bg-background rounded-2xl border border-border p-5 shadow-sm">
          <p className="text-sm text-muted-foreground font-semibold mb-2">Inactive</p>
          <p className="text-3xl font-black text-orange-500">{stats.inactive}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-background p-6 rounded-2xl border space-y-4 shadow-sm">
        <h2 className="font-bold text-lg">{editId ? 'Edit Banner' : 'Add Banner'}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={formData.placement}
            onChange={(e) => setFormData((prev) => ({ ...prev, placement: e.target.value }))}
            className="p-3 border rounded-xl bg-secondary/50 focus:bg-background outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="home">Home Top Banner</option>
            <option value="promotion">Home Promotion Banner</option>
            <option value="collection">Collection Top Banner</option>
          </select>
          <input
            required
            type="text"
            placeholder="Banner title"
            value={formData.title}
            onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
            className="p-3 border rounded-xl bg-secondary/50 focus:bg-background outline-none focus:ring-2 focus:ring-primary/50"
          />
          <input
            type="text"
            placeholder="Banner subtitle"
            value={formData.subtitle}
            onChange={(e) => setFormData((prev) => ({ ...prev, subtitle: e.target.value }))}
            className="p-3 border rounded-xl bg-secondary/50 focus:bg-background outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Button text"
            value={formData.buttonText}
            onChange={(e) => setFormData((prev) => ({ ...prev, buttonText: e.target.value }))}
            className="p-3 border rounded-xl bg-secondary/50 focus:bg-background outline-none focus:ring-2 focus:ring-primary/50"
          />
          <input
            type="text"
            placeholder="Button link (e.g. /products)"
            value={formData.buttonLink}
            onChange={(e) => setFormData((prev) => ({ ...prev, buttonLink: e.target.value }))}
            className="p-3 border rounded-xl bg-secondary/50 focus:bg-background outline-none focus:ring-2 focus:ring-primary/50"
          />
          <select
            value={formData.status}
            onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
            className="p-3 border rounded-xl bg-secondary/50 focus:bg-background outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-center">
          <input type="file" accept="image/*" onChange={handleImageUpload} className="text-sm w-full" />
          {formData.imageUrl ? (
            <div className="w-28 h-16 rounded-xl border overflow-hidden bg-secondary/30">
              <img src={formData.imageUrl} alt="Banner preview" className="w-full h-full object-cover" />
            </div>
          ) : null}
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={uploading}
            className={`bg-primary text-primary-foreground px-6 py-2 rounded-xl font-bold hover:bg-primary/90 flex items-center gap-2 ${uploading ? 'opacity-50' : ''}`}
          >
            {editId ? 'Update Banner' : <><Plus className="w-4 h-4" /> Add Banner</>}
          </button>
          {editId ? (
            <button
              type="button"
              onClick={() => {
                setEditId(null)
                setFormData(initialForm)
              }}
              className="bg-secondary text-secondary-foreground px-6 py-2 rounded-xl font-bold hover:bg-secondary/80"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      <div className="bg-background rounded-2xl border overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-border/70">
          <h2 className="font-bold text-lg">Banner List</h2>
        </div>

        {loading ? (
          <div className="p-10 text-center text-muted-foreground animate-pulse">Loading banners...</div>
        ) : banners.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">No banners found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondary/70 text-muted-foreground text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold">Placement</th>
                  <th className="p-4 font-semibold">Image</th>
                  <th className="p-4 font-semibold">Title</th>
                  <th className="p-4 font-semibold">Subtitle</th>
                  <th className="p-4 font-semibold">Button</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {banners.map((banner) => (
                  <tr key={banner._id} className="hover:bg-secondary/30 transition-colors">
                    <td className="p-4 text-sm font-semibold">
                      {banner.placement === 'collection' ? 'Collection' : banner.placement === 'promotion' ? 'Promotion' : 'Home'}
                    </td>
                    <td className="p-4">
                      <img src={banner.imageUrl} alt={banner.title} className="w-16 h-10 rounded object-cover border" />
                    </td>
                    <td className="p-4 font-semibold">{banner.title}</td>
                    <td className="p-4 text-muted-foreground">{banner.subtitle || '-'}</td>
                    <td className="p-4 text-sm">
                      {banner.buttonText ? `${banner.buttonText} (${banner.buttonLink || '#'})` : '-'}
                    </td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-bold ${banner.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                        {banner.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 flex gap-2 justify-end">
                      <button onClick={() => handleEdit(banner)} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(banner._id)} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
