import dbConnect from "@/lib/mongodb"
import Product from "@/models/Product"
import Banner from "@/models/Banner"
import Link from "next/link"
import { Tag, Search, Filter, X } from "lucide-react"
import ProductCard from "@/components/ProductCard"

export const dynamic = 'force-dynamic'

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function getProducts(search, category, minPrice, maxPrice) {
  try {
    await dbConnect()

    const query = {}

    if (search) {
      const safeSearch = escapeRegex(search)
      query.$or = [
        { name: { $regex: safeSearch, $options: 'i' } },
        { description: { $regex: safeSearch, $options: 'i' } },
        { category: { $regex: safeSearch, $options: 'i' } }
      ]
    }

    if (category) {
      query.category = category
    }

    // Price Filtering logic
    if (minPrice || maxPrice) {
      query.price = {}
      if (minPrice) query.price.$gte = Number(minPrice)
      if (maxPrice) query.price.$lte = Number(maxPrice)
    }

    const products = await Product.find(query).sort({ createdAt: -1 }).limit(60)
    const categories = await Product.distinct('category')
    const activeBanner = await Banner.findOne({
      status: "active",
      $or: [{ placement: "collection" }, { placement: { $exists: false } }],
    })
      .sort({ createdAt: -1 })
      .lean()

    return {
      banner: activeBanner ? JSON.parse(JSON.stringify(activeBanner)) : null,
      products: JSON.parse(JSON.stringify(products)),
      categories: categories.filter(Boolean)
    }
  } catch (error) {
    console.warn("PRODUCT LIST FALLBACK:", error?.message || error)
    return {
      banner: null,
      products: [],
      categories: [],
    }
  }
}

export default async function ProductsPage({ searchParams }) {
  const { search, category, minPrice, maxPrice } = await searchParams
  const { banner, products, categories } = await getProducts(search, category, minPrice, maxPrice)

  return (
    <div className="space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {banner ? (
        <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-primary/5 p-8 md:p-10">
          <img src={banner.imageUrl} alt={banner.title || "Collection banner"} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-background/70" />
          <div className="relative z-10 max-w-2xl space-y-3">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">{banner.title}</h2>
            {banner.subtitle ? <p className="text-muted-foreground text-base md:text-lg">{banner.subtitle}</p> : null}
            {banner.buttonText ? (
              <Link href={banner.buttonLink || '/products'} className="inline-flex mt-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors">
                {banner.buttonText}
              </Link>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* Header & Active Filters */}
      <div className="flex flex-col gap-6">
        <div className="space-y-2">
          <h1 className="text-5xl font-black tracking-tighter">
            {category ? category : search ? `Results for "${search}"` : 'The Collection'}
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            {search ? `We found ${products.length} items matching your search.` : 'Discover our curated selection of premium aesthetics and high-end lifestyle products.'}
          </p>
        </div>

        {(search || category || minPrice || maxPrice) && (
          <div className="flex flex-wrap gap-2 items-center">
            {search && (
              <div className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 border border-primary/20">
                Search: {search}
                <Link href={`/products?${new URLSearchParams({ ...(category && { category }), ...(minPrice && { minPrice }), ...(maxPrice && { maxPrice }) }).toString()}`}><X className="w-3 h-3 cursor-pointer hover:text-foreground"/></Link>
              </div>
            )}
            {category && (
              <div className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 border border-primary/20">
                Category: {category}
                <Link href={`/products?${new URLSearchParams({ ...(search && { search }), ...(minPrice && { minPrice }), ...(maxPrice && { maxPrice }) }).toString()}`}><X className="w-3 h-3 cursor-pointer hover:text-foreground"/></Link>
              </div>
            )}
            {(minPrice || maxPrice) && (
              <div className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 border border-primary/20">
                Price: Rs. {minPrice || 0} - Rs. {maxPrice || '∞'}
                <Link href={`/products?${new URLSearchParams({ ...(search && { search }), ...(category && { category }) }).toString()}`}><X className="w-3 h-3 cursor-pointer hover:text-foreground"/></Link>
              </div>
            )}
            <Link href="/products" className="text-xs font-bold text-muted-foreground hover:text-foreground underline underline-offset-4 ml-2">
              Clear All
            </Link>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Sidebar Filters */}
        <aside className="lg:col-span-1 space-y-10 hidden lg:block">
          {/* Category Filter */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <Filter className="w-4 h-4" /> Categories
            </h3>
            <div className="flex flex-col gap-2">
              <Link 
                href={`/products?${new URLSearchParams({ ...(search && { search }), ...(minPrice && { minPrice }), ...(maxPrice && { maxPrice }) }).toString()}`}
                className={`text-sm py-2 px-4 rounded-xl transition-all ${!category ? 'bg-primary text-primary-foreground font-bold shadow-md' : 'hover:bg-secondary text-muted-foreground'}`}
              >
                All Products
              </Link>
              {categories.map(cat => (
                <Link 
                  key={cat}
                  href={`/products?${new URLSearchParams({ category: cat, ...(search && { search }), ...(minPrice && { minPrice }), ...(maxPrice && { maxPrice }) }).toString()}`}
                  className={`text-sm py-2 px-4 rounded-xl transition-all capitalize ${category === cat ? 'bg-primary text-primary-foreground font-bold shadow-md' : 'hover:bg-secondary text-muted-foreground'}`}
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>

          {/* Price Filter Form */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <Tag className="w-4 h-4" /> Price Range
            </h3>
            <form action="/products" method="GET" className="space-y-4">
              {/* Preserving other filters */}
              {search && <input type="hidden" name="search" value={search} />}
              {category && <input type="hidden" name="category" value={category} />}
              
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground ml-1">MIN</label>
                  <input 
                    name="minPrice" 
                    type="number" 
                    placeholder="0" 
                    defaultValue={minPrice}
                    className="w-full bg-secondary/50 border-none rounded-xl py-2 px-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground ml-1">MAX</label>
                  <input 
                    name="maxPrice" 
                    type="number" 
                    placeholder="1000" 
                    defaultValue={maxPrice}
                    className="w-full bg-secondary/50 border-none rounded-xl py-2 px-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              </div>
              <button type="submit" className="w-full bg-primary/10 text-primary py-2 rounded-xl text-xs font-bold hover:bg-primary hover:text-primary-foreground transition-all">
                Apply Price
              </button>
            </form>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map(product => (
              <ProductCard key={product._id} product={product} isNew={false} />
            ))}
          </div>

          {products.length === 0 && (
            <div className="col-span-full py-32 text-center rounded-[3rem] bg-secondary/20 border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-4">
              <Search className="w-12 h-12 text-muted-foreground opacity-20" />
              <div className="space-y-1">
                <p className="text-xl font-bold">No products found</p>
                <p className="text-muted-foreground text-sm">Try adjusting your search or filters.</p>
              </div>
              <Link href="/products" className="mt-4 bg-primary text-primary-foreground px-8 py-3 rounded-full font-bold hover:shadow-lg transition-all">
                Clear All Filters
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
