import dbConnect from "@/lib/mongodb"
import Product from "@/models/Product"
import Banner from "@/models/Banner"
import Category from "@/models/Category"
import Link from "next/link"
import { ArrowRight, Tag, Sparkles, Package } from "lucide-react"
import ProductCard from "@/components/ProductCard"

export const dynamic = 'force-dynamic'

async function getLandingData() {
  try {
    await dbConnect()
    const homeBanner = await Banner.findOne({
      status: "active",
      $or: [{ placement: "home" }, { placement: { $exists: false } }],
    })
      .sort({ createdAt: -1 })
      .lean()
    const promotionBanner = await Banner.findOne({
      status: "active",
      placement: "promotion",
    })
      .sort({ createdAt: -1 })
      .lean()
    const newArrivals = await Product.find({}).sort({ createdAt: -1 }).limit(4).lean()
    const featured = await Product.find({ 
      _id: { $nin: newArrivals.map(p => p._id) } 
    }).sort({ createdAt: -1 }).limit(8).lean()
    
    const adminCategories = await Category.find({ status: "active" })
      .sort({ name: 1 })
      .lean()
    const categories = adminCategories
      .filter((category) => category?.name)
      .map((category) => ({
        name: category.name,
        imageUrl: category.imageUrl || "",
      }))
    
    console.log(`FETCHED: ${newArrivals.length} new arrivals, ${featured.length} featured items, ${categories.length} categories`)
    
    return {
      heroBanner: homeBanner ? JSON.parse(JSON.stringify(homeBanner)) : null,
      promotionBanner: promotionBanner ? JSON.parse(JSON.stringify(promotionBanner)) : null,
      newArrivals: JSON.parse(JSON.stringify(newArrivals)),
      featured: JSON.parse(JSON.stringify(featured)),
      categories: categories.filter(Boolean) // remove any nulls
    }
  } catch (err) {
    console.error("LANDING DATA ERROR:", err)
    return { heroBanner: null, promotionBanner: null, newArrivals: [], featured: [], categories: [] }
  }
}


export default async function Home() {
  const { heroBanner, promotionBanner, newArrivals, featured, categories } = await getLandingData()

  return (
    <div className="flex flex-col gap-20 pb-20">
      {/* Hero Section */}
      <section className="relative rounded-[2.5rem] overflow-hidden bg-primary/5 border border-primary/10 p-8 md:p-20 flex flex-col md:flex-row items-center justify-between gap-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        {heroBanner?.imageUrl ? (
          <>
            <img src={heroBanner.imageUrl} alt={heroBanner.title || "Banner"} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-background/65" />
          </>
        ) : null}
        <div className="max-w-2xl space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border border-primary/20">
            <Sparkles className="w-3 h-3"/> Season 2024 Collection
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-foreground leading-[0.9]">
            The New Era of <br/><span className="text-primary">Aesthetic</span> Luxury
          </h1>
          <p className="text-lg text-muted-foreground md:text-xl max-w-lg leading-relaxed">
            Experience the fusion of high-end design and premium quality. Our latest arrivals are crafted for those who define the trend.
          </p>
          <div className="flex gap-4">
            <Link href="/products" className="bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-bold hover:bg-primary/90 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center gap-3">
              Shop Now <ArrowRight className="w-5 h-5"/>
            </Link>
          </div>
        </div>
        <div className="hidden lg:block relative flex-1 group">
           <div className="absolute -inset-4 bg-primary/20 blur-[100px] rounded-full animate-pulse opacity-30"/>
           <div className="relative z-10 w-full aspect-square max-w-md ml-auto rounded-[3rem] bg-secondary/40 border border-white/10 shadow-[0_0_100px_rgba(var(--primary),0.1)] overflow-hidden rotate-3 transition-all duration-500 group-hover:rotate-1 group-hover:scale-[1.02] group-hover:shadow-[0_0_120px_rgba(var(--primary),0.22)]">
              {promotionBanner?.imageUrl ? (
                <>
                  <img src={promotionBanner.imageUrl} alt={promotionBanner.title || "Promotion"} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-background/55" />
                </>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
              )}
              <div className="relative z-10 h-full w-full p-6 flex flex-col justify-end">
                <span className="inline-flex w-fit items-center rounded-full bg-primary/15 text-primary px-3 py-1 text-[11px] font-black uppercase tracking-wider border border-primary/30">
                  Promotion
                </span>
                <p className="mt-3 text-xl font-black leading-tight text-foreground">
                  {promotionBanner?.title || "Exclusive Promotion"}
                </p>
                {promotionBanner?.subtitle ? (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{promotionBanner.subtitle}</p>
                ) : null}
                {promotionBanner?.buttonText ? (
                  <Link href={promotionBanner.buttonLink || "/products"} className="mt-4 inline-flex w-fit bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors">
                    {promotionBanner.buttonText}
                  </Link>
                ) : null}
              </div>
           </div>
        </div>
      </section>

      {/* Categories Section */}
      {categories.length > 0 && (
        <section className="space-y-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <div className="h-[2px] w-8 bg-primary rounded-full"/>
              <span className="text-sm font-black uppercase tracking-widest">Explore</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">Shop by Category</h2>
          </div>

          <div className="flex items-start gap-5 md:gap-6 overflow-x-auto pb-2 snap-x snap-mandatory">
            {categories.map((cat) => (
              <Link 
                key={cat.name} 
                href={`/products?category=${encodeURIComponent(cat.name)}`}
                className="group min-w-[90px] md:min-w-[110px] flex flex-col items-center gap-3 snap-start transition-transform duration-300 hover:-translate-y-1"
              >
                <div className="relative w-24 h-16 md:w-28 md:h-[4.5rem] rounded-2xl border border-border/70 bg-background overflow-hidden shadow-sm group-hover:border-primary group-hover:shadow-md transition-all duration-300">
                  {cat.imageUrl ? (
                    <img src={cat.imageUrl} alt={cat.name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                      <Tag className="w-6 h-6" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-background/10 group-hover:bg-background/0 transition-colors" />
                </div>
                <span className="text-sm md:text-base font-medium tracking-tight text-center leading-tight group-hover:text-primary transition-colors">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* New Arrivals Slider/Grid */}
      {newArrivals.length > 0 && (
        <section className="space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <div className="h-[2px] w-8 bg-primary rounded-full"/>
                <span className="text-sm font-black uppercase tracking-widest">Just Dropped</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">New Arrivals</h2>
            </div>
            <Link href="/products" className="group text-sm font-bold flex items-center gap-2 px-6 py-2.5 rounded-full border border-border hover:border-primary hover:bg-primary/5 transition-all">
              See All Arrivals <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {newArrivals.map(product => (
              <ProductCard key={product._id} product={product} isNew={true} />
            ))}
          </div>
        </section>
      )}

      {/* Featured Products Grid */}
      <section className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="h-[2px] w-8 bg-muted-foreground rounded-full"/>
              <span className="text-sm font-black uppercase tracking-widest">Handpicked</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">Featured</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {featured.map(product => (
            <ProductCard key={product._id} product={product} isNew={false} />
          ))}
          {featured.length === 0 && newArrivals.length === 0 && (
             <div className="col-span-full py-20 text-center text-muted-foreground border-2 border-dashed rounded-[2rem] bg-secondary/20">
               <Package className="w-12 h-12 mx-auto mb-4 opacity-20"/>
               <p className="text-lg font-medium">Our collection is currently empty.</p>
               <p className="text-sm opacity-50 mt-1">Check back soon for premium updates.</p>
             </div>
          )}
        </div>
      </section>
    </div>
  )
}
