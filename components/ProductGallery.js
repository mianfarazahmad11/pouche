'use client'

import { useEffect, useMemo, useState } from 'react'

export default function ProductGallery({ product }) {
  const images = useMemo(() => {
    const list = [
      product?.featuredThumbnail,
      product?.imageUrl,
      ...(product?.galleryImages || []),
    ].filter(Boolean)
    return [...new Set(list)]
  }, [product])

  const [selectedImage, setSelectedImage] = useState(images[0] || '')

  useEffect(() => {
    setSelectedImage(images[0] || '')
  }, [images])

  return (
    <div className="space-y-4">
      <div className="relative aspect-square rounded-3xl bg-secondary/50 overflow-hidden shadow-xl flex items-center justify-center">
        {selectedImage ? (
          <img src={selectedImage} alt={product?.name || 'Product image'} className="object-cover w-full h-full" />
        ) : (
          <div className="text-4xl text-muted-foreground font-light tracking-widest uppercase">Luxe</div>
        )}
      </div>

      {images.length > 1 ? (
        <div className="flex flex-wrap gap-3">
          {images.map((image) => (
            <button
              key={image}
              type="button"
              onClick={() => setSelectedImage(image)}
              className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                selectedImage === image ? 'border-primary' : 'border-border hover:border-primary/60'
              }`}
            >
              <img src={image} alt={product?.name || 'Product thumbnail'} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
