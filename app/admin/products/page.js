'use client'
import { useMemo, useState, useEffect } from 'react'
import { Edit, Trash2, Plus, Search, Package, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import { useStore } from '@/lib/store'

const initialFormData = {
  name: '',
  slug: '',
  sku: '',
  brand: '',
  category: '',
  subcategory: '',
  description: '',
  price: '',
  discountPrice: '',
  quantity: 0,
  lowStockAlertLevel: 5,
  status: 'active',
  featured: false,
  newArrival: false,
  imageUrl: '',
  galleryImages: [],
  featuredThumbnail: '',
  colorVariantsInput: '',
  deviceCompatibility: '',
  materialType: '',
  seoTitle: '',
  seoDescription: '',
  tagsInput: '',
  model: '',
  ram: '',
  storage: '',
  battery: '',
  color: '',
  ageGroup: '',
  material: '',
  safetyStandards: '',
  dimensions: '',
  shadeColor: '',
  ingredients: '',
  expiryDate: '',
  skinType: '',
  netWeight: '',
  packagingType: '',
  size: '',
  returnPolicy: '',
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

const CATEGORY_SUBCATEGORIES = {
  Electronics: ['Laptops', 'TVs', 'Audio', 'Accessories'],
  Mobiles: ['Smartphones', 'Feature Phones', 'Accessories'],
  Toys: ['Educational Toys', 'Action Figures', 'Puzzles', 'Outdoor Toys'],
  Cosmetics: ['Makeup', 'Skincare', 'Haircare', 'Fragrances'],
  Food: ['Snacks', 'Beverages', 'Staples', 'Ready-to-Eat'],
  Fashion: ['Men', 'Women', 'Kids', 'Footwear'],
  'Home & Living': ['Furniture', 'Kitchen', 'Decor', 'Bedding'],
  Sports: ['Fitness', 'Outdoor Sports', 'Team Sports', 'Accessories'],
}

const CATEGORY_FIELD_CONFIG = {
  Electronics: [
    { key: 'name', label: 'Product Name', type: 'text', required: true, placeholder: 'Enter product name' },
    { key: 'sku', label: 'SKU', type: 'text', required: true, placeholder: 'Enter SKU' },
    { key: 'brand', label: 'Brand', type: 'text', required: true, placeholder: 'Enter brand name' },
    { key: 'model', label: 'Model', type: 'text', required: true, placeholder: 'Enter model' },
    { key: 'ram', label: 'RAM', type: 'text', required: true, placeholder: 'e.g. 8GB' },
    { key: 'storage', label: 'Storage', type: 'text', required: true, placeholder: 'e.g. 128GB' },
    { key: 'battery', label: 'Battery', type: 'text', required: true, placeholder: 'e.g. 5000mAh' },
    { key: 'color', label: 'Color', type: 'text', required: true, placeholder: 'Enter color' },
    { key: 'price', label: 'Price', type: 'number', required: true, placeholder: 'Enter price', step: '0.01', min: '0' },
    { key: 'discountPrice', label: 'Discount Price', type: 'number', required: false, placeholder: 'Optional discount price', step: '0.01', min: '0' },
    { key: 'quantity', label: 'Stock Quantity', type: 'number', required: true, placeholder: 'Enter stock quantity', min: '0' },
  ],
  Mobiles: [
    { key: 'name', label: 'Product Name', type: 'text', required: true, placeholder: 'Enter product name' },
    { key: 'sku', label: 'SKU', type: 'text', required: true, placeholder: 'Enter SKU' },
    { key: 'brand', label: 'Brand', type: 'text', required: true, placeholder: 'Enter brand name' },
    { key: 'model', label: 'Model', type: 'text', required: true, placeholder: 'Enter model' },
    { key: 'ram', label: 'RAM', type: 'text', required: true, placeholder: 'e.g. 8GB' },
    { key: 'storage', label: 'Storage', type: 'text', required: true, placeholder: 'e.g. 128GB' },
    { key: 'battery', label: 'Battery', type: 'text', required: true, placeholder: 'e.g. 5000mAh' },
    { key: 'color', label: 'Color', type: 'text', required: true, placeholder: 'Enter color' },
    { key: 'price', label: 'Price', type: 'number', required: true, placeholder: 'Enter price', step: '0.01', min: '0' },
    { key: 'discountPrice', label: 'Discount Price', type: 'number', required: false, placeholder: 'Optional discount price', step: '0.01', min: '0' },
    { key: 'quantity', label: 'Stock Quantity', type: 'number', required: true, placeholder: 'Enter stock quantity', min: '0' },
  ],
  Toys: [
    { key: 'name', label: 'Product Name', type: 'text', required: true, placeholder: 'Enter product name' },
    { key: 'sku', label: 'SKU', type: 'text', required: true, placeholder: 'Enter SKU' },
    { key: 'brand', label: 'Brand', type: 'text', required: true, placeholder: 'Enter brand name' },
    { key: 'ageGroup', label: 'Age Group', type: 'text', required: true, placeholder: 'e.g. 3-5 years' },
    { key: 'material', label: 'Material', type: 'text', required: true, placeholder: 'e.g. Plastic' },
    { key: 'safetyStandards', label: 'Safety Standards', type: 'text', required: true, placeholder: 'e.g. ASTM F963' },
    { key: 'dimensions', label: 'Dimensions', type: 'text', required: true, placeholder: 'e.g. 20x10x5 cm' },
    { key: 'price', label: 'Price', type: 'number', required: true, placeholder: 'Enter price', step: '0.01', min: '0' },
    { key: 'quantity', label: 'Stock Quantity', type: 'number', required: true, placeholder: 'Enter stock quantity', min: '0' },
  ],
  Cosmetics: [
    { key: 'name', label: 'Product Name', type: 'text', required: true, placeholder: 'Enter product name' },
    { key: 'sku', label: 'SKU', type: 'text', required: true, placeholder: 'Enter SKU' },
    { key: 'brand', label: 'Brand', type: 'text', required: true, placeholder: 'Enter brand name' },
    { key: 'shadeColor', label: 'Shade / Color', type: 'text', required: true, placeholder: 'Enter shade or color' },
    { key: 'ingredients', label: 'Ingredients', type: 'text', required: true, placeholder: 'Enter ingredients' },
    { key: 'expiryDate', label: 'Expiry Date', type: 'date', required: true, placeholder: '' },
    { key: 'skinType', label: 'Skin Type', type: 'text', required: true, placeholder: 'e.g. Oily, Dry, Sensitive' },
    { key: 'price', label: 'Price', type: 'number', required: true, placeholder: 'Enter price', step: '0.01', min: '0' },
    { key: 'quantity', label: 'Stock Quantity', type: 'number', required: true, placeholder: 'Enter stock quantity', min: '0' },
  ],
  Food: [
    { key: 'name', label: 'Product Name', type: 'text', required: true, placeholder: 'Enter product name' },
    { key: 'sku', label: 'SKU', type: 'text', required: true, placeholder: 'Enter SKU' },
    { key: 'brand', label: 'Brand', type: 'text', required: true, placeholder: 'Enter brand name' },
    { key: 'ingredients', label: 'Ingredients', type: 'text', required: true, placeholder: 'Enter ingredients' },
    { key: 'expiryDate', label: 'Expiry Date', type: 'date', required: true, placeholder: '' },
    { key: 'netWeight', label: 'Net Weight', type: 'text', required: true, placeholder: 'e.g. 500g' },
    { key: 'packagingType', label: 'Packaging Type', type: 'text', required: true, placeholder: 'e.g. Box, Pouch' },
    { key: 'price', label: 'Price', type: 'number', required: true, placeholder: 'Enter price', step: '0.01', min: '0' },
    { key: 'quantity', label: 'Stock Quantity', type: 'number', required: true, placeholder: 'Enter stock quantity', min: '0' },
  ],
  Fashion: [
    { key: 'name', label: 'Product Name', type: 'text', required: true, placeholder: 'Enter product name' },
    { key: 'sku', label: 'SKU', type: 'text', required: true, placeholder: 'Enter SKU' },
    { key: 'brand', label: 'Brand', type: 'text', required: true, placeholder: 'Enter brand name' },
    { key: 'size', label: 'Size', type: 'text', required: true, placeholder: 'e.g. S, M, L, XL' },
    { key: 'color', label: 'Color', type: 'text', required: true, placeholder: 'Enter color' },
    { key: 'material', label: 'Material', type: 'text', required: true, placeholder: 'e.g. Cotton' },
    { key: 'price', label: 'Price', type: 'number', required: true, placeholder: 'Enter price', step: '0.01', min: '0' },
    { key: 'quantity', label: 'Stock Quantity', type: 'number', required: true, placeholder: 'Enter stock quantity', min: '0' },
  ],
  'Home & Living': [
    { key: 'name', label: 'Product Name', type: 'text', required: true, placeholder: 'Enter product name' },
    { key: 'sku', label: 'SKU', type: 'text', required: true, placeholder: 'Enter SKU' },
    { key: 'brand', label: 'Brand', type: 'text', required: true, placeholder: 'Enter brand name' },
    { key: 'material', label: 'Material', type: 'text', required: false, placeholder: 'e.g. Wood, Metal, Cotton' },
    { key: 'color', label: 'Color', type: 'text', required: false, placeholder: 'Enter color' },
    { key: 'price', label: 'Price', type: 'number', required: true, placeholder: 'Enter price', step: '0.01', min: '0' },
    { key: 'quantity', label: 'Stock Quantity', type: 'number', required: true, placeholder: 'Enter stock quantity', min: '0' },
  ],
  Sports: [
    { key: 'name', label: 'Product Name', type: 'text', required: true, placeholder: 'Enter product name' },
    { key: 'sku', label: 'SKU', type: 'text', required: true, placeholder: 'Enter SKU' },
    { key: 'brand', label: 'Brand', type: 'text', required: true, placeholder: 'Enter brand name' },
    { key: 'material', label: 'Material', type: 'text', required: false, placeholder: 'e.g. Rubber, Nylon' },
    { key: 'dimensions', label: 'Dimensions', type: 'text', required: false, placeholder: 'e.g. 30x20x10 cm' },
    { key: 'price', label: 'Price', type: 'number', required: true, placeholder: 'Enter price', step: '0.01', min: '0' },
    { key: 'quantity', label: 'Stock Quantity', type: 'number', required: true, placeholder: 'Enter stock quantity', min: '0' },
  ],
}

const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

const normalizeCategoryNames = (data) => {
  if (!Array.isArray(data)) return []
  if (data.length === 0) return []
  if (typeof data[0] === 'string') return data.filter(Boolean)
  return data
    .filter((item) => item && item.name)
    .filter((item) => item.status !== 'inactive')
    .map((item) => item.name)
}

export default function AdminProducts() {
  const { showNotification } = useStore()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState(initialFormData)
  const [editId, setEditId] = useState(null)
  const [pendingDeleteId, setPendingDeleteId] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  const [categories, setCategories] = useState([])
  const [filters, setFilters] = useState({
    search: '',
    category: 'All',
    stockStatus: 'all',
    sort: 'newest',
  })
  const [bulkAction, setBulkAction] = useState('delete')
  const [bulkCategory, setBulkCategory] = useState('')
  const [bulkStatus, setBulkStatus] = useState('active')
  const [bulkDiscount, setBulkDiscount] = useState('')
  const [galleryPreviewUrls, setGalleryPreviewUrls] = useState([])
  const [formError, setFormError] = useState('')
  const [showAdditionalFields, setShowAdditionalFields] = useState(false)
  const selectedCategory = formData.category
  const selectedCategoryFields = CATEGORY_FIELD_CONFIG[selectedCategory] || []
  const subcategoryOptions = CATEGORY_SUBCATEGORIES[selectedCategory] || []
  
  const fetchProducts = async () => {
    setLoading(true)
    const query = new URLSearchParams({
      ...(filters.search ? { search: filters.search } : {}),
      ...(filters.category && filters.category !== 'All' ? { category: filters.category } : {}),
      ...(filters.stockStatus && filters.stockStatus !== 'all' ? { stockStatus: filters.stockStatus } : {}),
      ...(filters.sort ? { sort: filters.sort } : {}),
    }).toString()
    const res = await fetch(`/api/products${query ? `?${query}` : ''}`)
    const data = await res.json()
    setProducts(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchProducts()
  }, [filters.search, filters.category, filters.stockStatus, filters.sort])

  useEffect(() => {
    const fetchCategories = async () => {
      const res = await fetch('/api/categories')
      const data = await res.json()
      const normalized = normalizeCategoryNames(data)
      setCategories([...new Set([...CATEGORY_OPTIONS, ...normalized])])
    }
    fetchCategories()
  }, [])

  const stockMeta = (product) => {
    if (product.quantity <= 0) return { label: 'Out of Stock', color: 'text-destructive' }
    if (product.quantity <= (product.lowStockAlertLevel || 0)) return { label: 'Low Stock', color: 'text-yellow-600' }
    return { label: 'In Stock', color: 'text-green-600' }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    const data = new FormData()
    data.append('file', file)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: data
      })
      const result = await res.json()
      if (res.ok) {
        setFormData(prev => ({
          ...prev,
          imageUrl: result.url,
          galleryImages: prev.galleryImages.includes(result.url) ? prev.galleryImages : [...prev.galleryImages, result.url],
          featuredThumbnail: prev.featuredThumbnail || result.url,
        }))
        showNotification('Image uploaded successfully')
      } else {
        showNotification(result.error || 'Upload failed')
      }
    } catch (err) {
      showNotification('Error uploading image')
    } finally {
      setUploading(false)
    }
  }

  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    const localPreviews = files.map((f) => URL.createObjectURL(f))
    setGalleryPreviewUrls((prev) => [...prev, ...localPreviews])
    setUploading(true)
    try {
      const uploadedUrls = []
      for (const file of files) {
        const data = new FormData()
        data.append('file', file)
        const res = await fetch('/api/upload', { method: 'POST', body: data })
        const result = await res.json()
        if (res.ok) uploadedUrls.push(result.url)
      }
      if (!uploadedUrls.length) {
        showNotification('Gallery upload failed')
        return
      }
      setFormData((prev) => {
        const galleryImages = [...new Set([...(prev.galleryImages || []), ...uploadedUrls])]
        return {
          ...prev,
          galleryImages,
          imageUrl: prev.imageUrl || galleryImages[0],
          featuredThumbnail: prev.featuredThumbnail || galleryImages[0],
        }
      })
      showNotification('Gallery images uploaded')
    } catch {
      showNotification('Error uploading gallery images')
    } finally {
      setUploading(false)
      // Allow selecting the same files again in next upload.
      e.target.value = ''
      setTimeout(() => {
        setGalleryPreviewUrls((prev) => {
          prev.forEach((url) => URL.revokeObjectURL(url))
          return []
        })
      }, 300)
    }
  }

  const removeGalleryImage = (url) => {
    setFormData((prev) => {
      const galleryImages = prev.galleryImages.filter((img) => img !== url)
      return {
        ...prev,
        galleryImages,
        imageUrl: prev.imageUrl === url ? (galleryImages[0] || '') : prev.imageUrl,
        featuredThumbnail: prev.featuredThumbnail === url ? (galleryImages[0] || '') : prev.featuredThumbnail,
      }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    if (!formData.category) {
      setFormError('Category is required')
      return
    }
    const missingRequiredField = selectedCategoryFields.find((field) => field.required && !String(formData[field.key] ?? '').trim())
    if (missingRequiredField) {
      setFormError(`${missingRequiredField.label} is required`)
      return
    }
    if (formData.discountPrice && Number(formData.discountPrice) > Number(formData.price)) {
      setFormError('Discount Price cannot be greater than Price')
      return
    }
    if (Number.isNaN(Number(formData.quantity))) {
      setFormError('Stock Quantity must be numeric')
      return
    }
    const url = editId ? `/api/products/${editId}` : '/api/products'
    const method = editId ? 'PUT' : 'POST'
    
    const payload = {
      ...formData,
      slug: formData.slug || slugify(formData.name),
      price: Number(formData.price),
      discountPrice: formData.discountPrice ? Number(formData.discountPrice) : undefined,
      quantity: Number(formData.quantity),
      lowStockAlertLevel: Number(formData.lowStockAlertLevel),
      colorVariants: formData.colorVariantsInput
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean),
      tags: formData.tagsInput
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean),
    }

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (!res.ok) {
      showNotification('Failed to save product')
      return
    }
    
    setFormData(initialFormData)
    setEditId(null)
    showNotification(editId ? 'Product updated successfully' : 'Product added successfully')
    fetchProducts()
    const categoriesRes = await fetch('/api/categories')
    const categoryData = await categoriesRes.json()
    const normalized = normalizeCategoryNames(categoryData)
    setCategories([...new Set([...CATEGORY_OPTIONS, ...normalized])])
  }

  const handleDelete = async (id) => {
    if (pendingDeleteId !== id) {
      setPendingDeleteId(id)
      showNotification('Click delete again to confirm')
      setTimeout(() => setPendingDeleteId(null), 4000)
      return
    }

    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      showNotification('Failed to delete product')
      return
    }
    setPendingDeleteId(null)
    showNotification('Product deleted successfully')
    fetchProducts()
  }

  const handleBulkAction = async () => {
    if (!selectedIds.length) {
      showNotification('Select at least one product')
      return
    }
    const payload = {
      action: bulkAction,
      productIds: selectedIds,
      ...(bulkAction === 'changeCategory' ? { category: bulkCategory } : {}),
      ...(bulkAction === 'changeStatus' ? { status: bulkStatus } : {}),
      ...(bulkAction === 'applyDiscount' ? { discountPercent: Number(bulkDiscount) } : {}),
    }
    const res = await fetch('/api/products/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) {
      showNotification(data.error || 'Bulk action failed')
      return
    }
    showNotification(data.message || 'Bulk action completed')
    setSelectedIds([])
    fetchProducts()
  }

  const handleEdit = (product) => {
    setEditId(product._id)
    setFormData({
      name: product.name,
      slug: product.slug || '',
      sku: product.sku || '',
      brand: product.brand || '',
      model: product.model || '',
      ram: product.ram || '',
      storage: product.storage || '',
      battery: product.battery || '',
      color: product.color || '',
      ageGroup: product.ageGroup || '',
      material: product.material || '',
      safetyStandards: product.safetyStandards || '',
      dimensions: product.dimensions || '',
      shadeColor: product.shadeColor || '',
      ingredients: product.ingredients || '',
      expiryDate: product.expiryDate ? new Date(product.expiryDate).toISOString().split('T')[0] : '',
      skinType: product.skinType || '',
      netWeight: product.netWeight || '',
      packagingType: product.packagingType || '',
      size: product.size || '',
      returnPolicy: product.returnPolicy || '',
      description: product.description,
      price: product.price,
      discountPrice: product.discountPrice || '',
      imageUrl: product.imageUrl || '',
      category: product.category || '',
      subcategory: product.subcategory || '',
      quantity: product.quantity ?? 0,
      lowStockAlertLevel: product.lowStockAlertLevel ?? 5,
      status: product.status || 'active',
      featured: Boolean(product.featured),
      newArrival: Boolean(product.newArrival),
      galleryImages: product.galleryImages || (product.imageUrl ? [product.imageUrl] : []),
      featuredThumbnail: product.featuredThumbnail || product.imageUrl || '',
      colorVariantsInput: (product.colorVariants || []).join(', '),
      deviceCompatibility: product.deviceCompatibility || '',
      materialType: product.materialType || '',
      seoTitle: product.seoTitle || '',
      seoDescription: product.seoDescription || '',
      tagsInput: (product.tags || []).join(', '),
    })
  }

  const allSelected = useMemo(
    () => products.length > 0 && products.every((p) => selectedIds.includes(p._id)),
    [products, selectedIds]
  )

  const stats = useMemo(() => {
    const active = products.filter((p) => p.status === 'active').length
    const lowOrOut = products.filter((p) => p.quantity <= (p.lowStockAlertLevel || 0)).length
    return [
      {
        label: 'Total Products',
        value: products.length,
        icon: Package,
        iconClassName: 'bg-primary/15 text-primary',
      },
      {
        label: 'Active',
        value: active,
        icon: CheckCircle2,
        iconClassName: 'bg-emerald-500/15 text-emerald-600',
      },
      {
        label: 'Low or Out Stock',
        value: lowOrOut,
        icon: AlertTriangle,
        iconClassName: 'bg-orange-500/15 text-orange-500',
      },
      {
        label: 'Draft',
        value: Math.max(products.length - active, 0),
        icon: XCircle,
        iconClassName: 'bg-slate-500/15 text-slate-600',
      },
    ]
  }, [products])

  return (
    <div className="space-y-8 min-w-0 animate-in fade-in duration-500">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Manage Products</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage catalog, pricing, stock and product media from one place.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
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
              <p className="text-3xl font-black">{item.value}</p>
            </div>
          )
        })}
      </div>

      <div className="bg-background p-4 rounded-2xl border shadow-sm grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by product name"
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            className="w-full pl-10 p-2.5 border rounded-xl bg-secondary/50"
          />
        </div>
        <select
          value={filters.category}
          onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
          className="p-2.5 border rounded-xl bg-secondary/50"
        >
          <option value="All">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <select
            value={filters.stockStatus}
            onChange={(e) => setFilters((prev) => ({ ...prev, stockStatus: e.target.value }))}
            className="p-2.5 border rounded-xl bg-secondary/50"
          >
            <option value="all">All Stock</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
          <select
            value={filters.sort}
            onChange={(e) => setFilters((prev) => ({ ...prev, sort: e.target.value }))}
            className="p-2.5 border rounded-xl bg-secondary/50"
          >
            <option value="newest">Newest</option>
            <option value="price_low">Price low to high</option>
            <option value="price_high">Price high to low</option>
          </select>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-background p-6 rounded-2xl border space-y-4 shadow-sm">
        <h2 className="font-bold text-lg">{editId ? 'Edit Product' : 'Add New Product'}</h2>
        {formError && (
          <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-3">
            {formError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-semibold">Category</label>
            <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value, subcategory: ''})} className="w-full p-3 border rounded-xl bg-secondary/50 focus:bg-background outline-none focus:ring-2 focus:ring-primary/50">
              <option value="">Select category</option>
              {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold">Subcategory</label>
            <select value={formData.subcategory} onChange={e => setFormData({...formData, subcategory: e.target.value})} className="w-full p-3 border rounded-xl bg-secondary/50 focus:bg-background outline-none focus:ring-2 focus:ring-primary/50" disabled={!selectedCategory}>
              <option value="">{selectedCategory ? 'Select subcategory' : 'Select category first'}</option>
              {subcategoryOptions.map(sc => <option key={sc} value={sc}>{sc}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold">Slug</label>
            <input type="text" placeholder="Auto generated if empty" value={formData.slug} onChange={e => setFormData({...formData, slug: slugify(e.target.value)})} className="w-full p-3 border rounded-xl bg-secondary/50 focus:bg-background outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
        </div>

        {selectedCategory && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {selectedCategoryFields.map((field) => (
              <div key={field.key} className="space-y-1">
                <label className="text-sm font-semibold">{field.label}{field.required ? ' *' : ''}</label>
                <input
                  required={field.required}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={formData[field.key] ?? ''}
                  step={field.step}
                  min={field.min}
                  onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                  className="w-full p-3 border rounded-xl bg-secondary/50 focus:bg-background outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input required type="number" min="0" placeholder="Low stock alert level" value={formData.lowStockAlertLevel} onChange={e => setFormData({...formData, lowStockAlertLevel: Number(e.target.value)})} className="p-3 border rounded-xl bg-secondary/50 focus:bg-background outline-none focus:ring-2 focus:ring-primary/50" />
          <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="p-3 border rounded-xl bg-secondary/50 focus:bg-background outline-none focus:ring-2 focus:ring-primary/50">
            <option value="active">Active</option>
            <option value="draft">Draft</option>
          </select>
          <label className="flex items-center gap-2 text-sm p-3 border rounded-xl bg-secondary/50">
            <input type="checkbox" checked={showAdditionalFields} onChange={e => setShowAdditionalFields(e.target.checked)} />
            Show additional fields
          </label>
        </div>
        {showAdditionalFields && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-6 p-3 border rounded-xl bg-secondary/50">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={formData.featured} onChange={e => setFormData({...formData, featured: e.target.checked})} />
                Featured Product
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={formData.newArrival} onChange={e => setFormData({...formData, newArrival: e.target.checked})} />
                New Arrival
              </label>
            </div>
            <input type="text" placeholder="Return Policy (optional)" value={formData.returnPolicy} onChange={e => setFormData({...formData, returnPolicy: e.target.value})} className="p-3 border rounded-xl bg-secondary/50 focus:bg-background outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
        )}
        
        <div className="space-y-3">
          <label className="text-sm font-semibold">Product Image</label>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className={`w-24 h-24 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden bg-secondary/30 ${uploading ? 'animate-pulse' : ''}`}>
              {formData.imageUrl ? (
                <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <Plus className="text-muted-foreground w-6 h-6" />
              )}
            </div>
            <div className="flex-1">
              <input 
                type="file" 
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden" 
                id="file-upload"
              />
              <label 
                htmlFor="file-upload" 
                className={`inline-block px-6 py-2.5 rounded-xl border-2 border-primary text-primary font-bold cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {uploading ? 'Uploading...' : 'Upload Image'}
              </label>
              <p className="text-xs text-muted-foreground mt-2">Required for new products. Max size 5MB.</p>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">Gallery Images</label>
            <input type="file" accept="image/*" multiple onChange={handleGalleryUpload} className="block w-full text-sm" />
            <p className="text-xs text-muted-foreground">You can select multiple images at once.</p>
            <div className="flex flex-wrap gap-3">
              {galleryPreviewUrls.map((url) => (
                <img key={url} src={url} alt="Preview before upload" className="w-16 h-16 rounded-lg object-cover border" />
              ))}
              {formData.galleryImages.map((url) => (
                <div key={url} className="relative">
                  <img src={url} alt="Gallery" className="w-16 h-16 rounded-lg object-cover border" />
                  <button type="button" onClick={() => removeGalleryImage(url)} className="absolute -top-2 -right-2 w-5 h-5 text-[10px] rounded-full bg-destructive text-white">x</button>
                  <button type="button" onClick={() => setFormData(prev => ({ ...prev, featuredThumbnail: url, imageUrl: url }))} className={`absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px] px-2 py-0.5 rounded-full ${formData.featuredThumbnail === url ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                    Thumb
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <textarea required placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-3 border rounded-xl bg-secondary/50 focus:bg-background outline-none focus:ring-2 focus:ring-primary/50 h-24" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input type="text" placeholder="Color variants (comma separated)" value={formData.colorVariantsInput} onChange={e => setFormData({...formData, colorVariantsInput: e.target.value})} className="p-3 border rounded-xl bg-secondary/50 focus:bg-background outline-none focus:ring-2 focus:ring-primary/50" />
          <input type="text" placeholder="Device compatibility (e.g. iPhone 13)" value={formData.deviceCompatibility} onChange={e => setFormData({...formData, deviceCompatibility: e.target.value})} className="p-3 border rounded-xl bg-secondary/50 focus:bg-background outline-none focus:ring-2 focus:ring-primary/50" />
          <input type="text" placeholder="Material type (silicone, leather)" value={formData.materialType} onChange={e => setFormData({...formData, materialType: e.target.value})} className="p-3 border rounded-xl bg-secondary/50 focus:bg-background outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input type="text" placeholder="SEO title" value={formData.seoTitle} onChange={e => setFormData({...formData, seoTitle: e.target.value})} className="p-3 border rounded-xl bg-secondary/50 focus:bg-background outline-none focus:ring-2 focus:ring-primary/50" />
          <input type="text" placeholder="Product tags (comma separated)" value={formData.tagsInput} onChange={e => setFormData({...formData, tagsInput: e.target.value})} className="p-3 border rounded-xl bg-secondary/50 focus:bg-background outline-none focus:ring-2 focus:ring-primary/50" />
          <textarea placeholder="SEO description" value={formData.seoDescription} onChange={e => setFormData({...formData, seoDescription: e.target.value})} className="p-3 border rounded-xl bg-secondary/50 focus:bg-background outline-none focus:ring-2 focus:ring-primary/50 h-11 md:h-auto" />
        </div>
        
        <div className="flex gap-2">
          <button type="submit" disabled={uploading} className={`bg-primary text-primary-foreground px-6 py-2 rounded-xl font-bold hover:bg-primary/90 flex items-center gap-2 ${uploading ? 'opacity-50' : ''}`}>
            {editId ? 'Update Product' : <><Plus className="w-4 h-4"/> Add Product</>}
          </button>
          {editId && (
             <button type="button" onClick={() => { setEditId(null); setFormData(initialFormData) }} className="bg-secondary text-secondary-foreground px-6 py-2 rounded-xl font-bold hover:bg-secondary/80">
               Cancel
             </button>
          )}
        </div>
      </form>

      <div className="bg-background p-4 rounded-2xl border shadow-sm flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div className="text-sm font-semibold">
          {selectedIds.length} selected
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <select value={bulkAction} onChange={(e) => setBulkAction(e.target.value)} className="p-2 border rounded-lg bg-secondary/50">
            <option value="delete">Bulk Delete</option>
            <option value="changeCategory">Bulk Category Change</option>
            <option value="changeStatus">Bulk Status Change</option>
            <option value="applyDiscount">Bulk Discount Apply</option>
          </select>
          {bulkAction === 'changeCategory' && (
            <select value={bulkCategory} onChange={(e) => setBulkCategory(e.target.value)} className="p-2 border rounded-lg bg-secondary/50">
              <option value="">Select category</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          {bulkAction === 'changeStatus' && (
            <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)} className="p-2 border rounded-lg bg-secondary/50">
              <option value="active">Active</option>
              <option value="draft">Draft</option>
            </select>
          )}
          {bulkAction === 'applyDiscount' && (
            <input type="number" min="0" max="100" placeholder="Discount %" value={bulkDiscount} onChange={(e) => setBulkDiscount(e.target.value)} className="p-2 border rounded-lg bg-secondary/50 w-32" />
          )}
          <button type="button" onClick={handleBulkAction} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold">Apply</button>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground animate-pulse p-10">Loading products...</div>
      ) : (
        <div className="bg-background rounded-2xl border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left border-collapse">
             <thead>
               <tr className="bg-secondary text-muted-foreground text-sm uppercase tracking-wider">
                 <th className="p-4 font-semibold">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedIds(products.map((p) => p._id))
                      else setSelectedIds([])
                    }}
                  />
                 </th>
                 <th className="p-4 font-semibold">Product</th>
                 <th className="p-4 font-semibold">Category</th>
                 <th className="p-4 font-semibold">Price</th>
                 <th className="p-4 font-semibold">Stock</th>
                 <th className="p-4 font-semibold">Status</th>
                 <th className="p-4 font-semibold">Featured</th>
                 <th className="p-4 font-semibold">Created</th>
                 <th className="p-4 font-semibold text-right">Actions</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-border">
               {products.map(p => (
                 <tr key={p._id} className="hover:bg-secondary/30 transition-colors">
                   <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(p._id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedIds((prev) => [...prev, p._id])
                        else setSelectedIds((prev) => prev.filter((id) => id !== p._id))
                      }}
                    />
                   </td>
                  <td className="p-4 font-medium">
                    <div className="flex items-center gap-3">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} className="w-10 h-10 rounded-md object-cover"/>
                      ) : <div className="w-10 h-10 bg-secondary rounded-md"></div>}
                      <div className="min-w-0">
                        <span className="block truncate">{p.name}</span>
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Primary</span>
                      </div>
                    </div>
                   </td>
                   <td className="p-4 ">{p.category}{p.subcategory ? ` / ${p.subcategory}` : ''}</td>
                   <td className="p-4">
                     Rs. {p.price.toFixed(2)}
                     {p.discountPrice && <span className="text-destructive ml-2 text-sm">Rs. {p.discountPrice.toFixed(2)}</span>}
                   </td>
                   <td className="p-4">
                    <div className="font-semibold">{p.quantity}</div>
                    <div className={`text-xs ${stockMeta(p).color}`}>{stockMeta(p).label}</div>
                   </td>
                   <td className="p-4 capitalize">{p.status}</td>
                   <td className="p-4">
                    {p.featured ? <span className="text-xs px-2 py-1 rounded-full bg-primary/15 text-primary font-bold">Featured</span> : '-'}
                   </td>
                   <td className="p-4 text-sm text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</td>
                   <td className="p-4 flex gap-2 justify-end">
                      <button onClick={() => handleEdit(p)} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"><Edit className="w-4 h-4"/></button>
                      <button onClick={() => handleDelete(p._id)} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                   </td>
                 </tr>
               ))}
               {products.length === 0 && (
                 <tr><td colSpan="9" className="p-8 text-center text-muted-foreground">No products found. Add one above.</td></tr>
               )}
             </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  )
}
