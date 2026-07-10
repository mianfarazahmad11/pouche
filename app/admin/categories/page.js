'use client'

import { useEffect, useMemo, useState } from 'react'
import { Edit, Trash2, Plus, LayoutList, CheckCircle2, Ban } from 'lucide-react'
import { useStore } from '@/lib/store'

const initialForm = {
  name: '',
  subcategoriesInput: '',
  imageUrl: '',
  status: 'active',
}

const CATEGORY_OPTIONS = [
  'Electronics',
  'Mobiles',
  'Toys',
  'Cosmetics',
  'Food',
  'Fashion',
  'Home & Living',
  'Sports',
]

const DEFAULT_SUBCATEGORIES = {
  Electronics: ['Laptops', 'TVs', 'Audio', 'Accessories'],
  Mobiles: ['Smartphones', 'Feature Phones', 'Accessories'],
  Toys: ['Educational Toys', 'Action Figures', 'Puzzles', 'Outdoor Toys'],
  Cosmetics: ['Makeup', 'Skincare', 'Haircare', 'Fragrances'],
  Food: ['Snacks', 'Beverages', 'Staples', 'Ready-to-Eat'],
  Fashion: ['Men', 'Women', 'Kids', 'Footwear'],
  'Home & Living': ['Furniture', 'Kitchen', 'Decor', 'Bedding'],
  Sports: ['Fitness', 'Outdoor Sports', 'Team Sports', 'Accessories'],
}

export default function AdminCategoriesPage() {
  const { showNotification } = useStore()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState(initialForm)
  const [editId, setEditId] = useState(null)
  const [pendingDeleteId, setPendingDeleteId] = useState(null)

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/categories')
      const data = await res.json()
      setCategories(Array.isArray(data) ? data : [])
    } catch (error) {
      setCategories([])
      showNotification('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
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
      showNotification('Category image uploaded')
    } catch (error) {
      showNotification('Image upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      ...formData,
      subcategories: String(formData.subcategoriesInput || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    }
    const url = editId ? `/api/categories/${editId}` : '/api/categories'
    const method = editId ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) {
      showNotification(data.error || 'Failed to save category')
      return
    }
    showNotification(editId ? 'Category updated' : 'Category created')
    setFormData(initialForm)
    setEditId(null)
    fetchCategories()
  }

  const handleEdit = (category) => {
    setEditId(category._id)
    setFormData({
      name: category.name || '',
      subcategoriesInput: Array.isArray(category.subcategories) ? category.subcategories.join(', ') : '',
      imageUrl: category.imageUrl || '',
      status: category.status === 'inactive' ? 'inactive' : 'active',
    })
  }

  const handleDelete = async (id) => {
    if (pendingDeleteId !== id) {
      setPendingDeleteId(id)
      showNotification('Click delete again to confirm')
      setTimeout(() => setPendingDeleteId(null), 3500)
      return
    }

    const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) {
      showNotification(data.error || 'Failed to delete category')
      return
    }
    showNotification('Category deleted')
    setPendingDeleteId(null)
    fetchCategories()
  }

  const stats = useMemo(() => {
    const active = categories.filter((c) => c.status === 'active').length
    const inactive = categories.filter((c) => c.status === 'inactive').length
    return [
      {
        label: 'Total Categories',
        value: categories.length,
        icon: LayoutList,
        valueClassName: 'text-foreground',
        iconClassName: 'bg-primary/15 text-primary',
      },
      {
        label: 'Active',
        value: active,
        icon: CheckCircle2,
        valueClassName: 'text-emerald-600',
        iconClassName: 'bg-emerald-500/15 text-emerald-600',
      },
      {
        label: 'Inactive',
        value: inactive,
        icon: Ban,
        valueClassName: 'text-orange-500',
        iconClassName: 'bg-orange-500/15 text-orange-500',
      },
    ]
  }, [categories])

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Manage Categories</h1>
          <p className="text-sm text-muted-foreground mt-1">Create and organize categories shown across your storefront.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.label} className="bg-background rounded-2xl border border-border/80 p-5 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs md:text-sm text-muted-foreground font-semibold uppercase tracking-wide">{item.label}</p>
                <div className={`p-2 rounded-lg ${item.iconClassName}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className={`text-3xl font-black ${item.valueClassName}`}>{item.value}</p>
            </div>
          )
        })}
      </div>

      <form onSubmit={handleSubmit} className="bg-background p-6 rounded-2xl border space-y-4 shadow-sm">
        <h2 className="font-bold text-lg">{editId ? 'Edit Category' : 'Add Category'}</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            required
            value={formData.name}
            onChange={(e) => {
              const nextName = e.target.value
              setFormData((prev) => ({
                ...prev,
                name: nextName,
                subcategoriesInput: DEFAULT_SUBCATEGORIES[nextName]?.join(', ') || '',
              }))
            }}
            className="p-3 border rounded-xl bg-secondary/50 focus:bg-background outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">Select category</option>
            {CATEGORY_OPTIONS.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Subcategories (comma separated)"
            value={formData.subcategoriesInput}
            onChange={(e) => setFormData((prev) => ({ ...prev, subcategoriesInput: e.target.value }))}
            className="p-3 border rounded-xl bg-secondary/50 focus:bg-background outline-none focus:ring-2 focus:ring-primary/50 md:col-span-2"
          />
          <select
            value={formData.status}
            onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
            className="p-3 border rounded-xl bg-secondary/50 focus:bg-background outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <div className="flex items-center gap-3">
            <input type="file" accept="image/*" onChange={handleImageUpload} className="text-sm w-full" />
          </div>
        </div>

        {formData.imageUrl ? (
          <div className="w-20 h-20 rounded-xl border overflow-hidden bg-secondary/30">
            <img src={formData.imageUrl} alt="Category" className="w-full h-full object-cover" />
          </div>
        ) : null}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={uploading}
            className={`bg-primary text-primary-foreground px-6 py-2 rounded-xl font-bold hover:bg-primary/90 flex items-center gap-2 ${uploading ? 'opacity-50' : ''}`}
          >
            {editId ? 'Update Category' : <><Plus className="w-4 h-4" /> Add Category</>}
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
          <h2 className="font-bold text-lg">Category List</h2>
        </div>

        {loading ? (
          <div className="p-10 text-center text-muted-foreground animate-pulse">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">No categories found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondary/70 text-muted-foreground text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold">Image</th>
                  <th className="p-4 font-semibold">Name</th>
                  <th className="p-4 font-semibold">Subcategories</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {categories.map((category) => (
                  <tr key={category._id} className="hover:bg-secondary/30 transition-colors">
                    <td className="p-4">
                      {category.imageUrl ? (
                        <img src={category.imageUrl} alt={category.name} className="w-10 h-10 rounded-md object-cover border" />
                      ) : (
                        <div className="w-10 h-10 rounded-md bg-secondary border" />
                      )}
                    </td>
                    <td className="p-4 font-semibold">{category.name}</td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {Array.isArray(category.subcategories) && category.subcategories.length > 0
                        ? category.subcategories.join(', ')
                        : '-'}
                    </td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-bold ${category.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                        {category.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 flex gap-2 justify-end">
                      <button onClick={() => handleEdit(category)} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(category._id)} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
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
