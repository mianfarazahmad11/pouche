import dbConnect from "@/lib/mongodb"
import Product from "@/models/Product"
import AddToCartButton from "@/components/AddToCartButton"
import ProductGallery from "@/components/ProductGallery"
import { getProductAvailability } from "@/lib/productAvailability"
import Link from "next/link"
import { ArrowLeft, Check, ShieldCheck, Truck } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function ProductDetail({ params }) {
  const resolvedParams = await params;
  await dbConnect()
  let product = null
  try {
    product = await Product.findById(resolvedParams.id)
    if (product) product = JSON.parse(JSON.stringify(product))
  } catch (e) {
    // ignore e
  }

  if (product) {
    const legacyGallery = Array.isArray(product.gallery_images) ? product.gallery_images : []
    const modernGallery = Array.isArray(product.galleryImages) ? product.galleryImages : []
    const primary = product.imageUrl || product.image_url || ''
    const featured = product.featuredThumbnail || ''

    product.imageUrl = primary
    product.featuredThumbnail = featured || primary
    product.galleryImages = [...new Set([featured, primary, ...modernGallery, ...legacyGallery].filter(Boolean))]
  }

  if (!product) {
    return <div className="text-center py-20 text-2xl font-bold">Product not found.</div>
  }
  const availability = getProductAvailability(product)

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <Link href="/products" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-8 transition-colors text-sm font-medium">
        <ArrowLeft className="w-4 h-4"/> Back to Shop
      </Link>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 text-left">
        <ProductGallery product={product} />

        <div className="flex flex-col justify-center space-y-8">
          <div className="space-y-4">
            <div className="text-sm font-bold tracking-widest text-primary uppercase">{product.category}</div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">{product.name}</h1>
            <div className="inline-flex">
              <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide ${
                availability.code === 'coming_soon'
                  ? 'bg-indigo-100 text-indigo-700'
                  : availability.code === 'out_of_stock'
                  ? 'bg-slate-200 text-slate-700'
                  : availability.code === 'low_stock'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}>
                {availability.label}
              </span>
            </div>
            
            <div className="flex items-end gap-3 pb-4 border-b border-border/50">
              {product.discountPrice ? (
                <>
                  <span className="text-3xl font-black text-foreground">Rs. {product.discountPrice.toFixed(2)}</span>
                  <span className="text-xl text-muted-foreground line-through mb-1">Rs. {product.price.toFixed(2)}</span>
                  <span className="bg-destructive/10 text-destructive text-sm font-bold px-2 py-1 rounded-md mb-1 ml-2">
                    Save Rs. { (product.price - product.discountPrice).toFixed(2) }
                  </span>
                </>
              ) : (
                <span className="text-3xl font-black text-foreground">Rs. {product.price.toFixed(2)}</span>
              )}
            </div>
          </div>

          <p className="text-lg text-muted-foreground leading-relaxed">
            {product.description || "Premium quality product carefully selected for your needs. Enhance your lifestyle with this unique piece designed specifically to bring a touch of luxury to your daily routine."}
          </p>

          <div className="space-y-4 pt-4">
            <AddToCartButton product={product} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-border/50 mt-8">
             <div className="flex items-center gap-3 text-sm text-muted-foreground">
               <Truck className="w-5 h-5 text-primary"/>
               <span>Fast & Free Shipping</span>
             </div>
             <div className="flex items-center gap-3 text-sm text-muted-foreground">
               <ShieldCheck className="w-5 h-5 text-primary"/>
               <span>Premium Warranty</span>
             </div>
             <div className="flex items-center gap-3 text-sm text-muted-foreground">
               <Check className="w-5 h-5 text-primary"/>
               <span>Secure Checkout</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}
