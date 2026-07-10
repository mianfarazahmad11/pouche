import dbConnect from "@/lib/mongodb";
import Product from "@/models/Product";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { productSchema, slugifyProductName, makeUniqueSlug, makeUniqueSku } from "@/lib/validation/product";
import { getFirstZodError } from "@/lib/validation/settings";

export async function GET(req, { params }) {
  try {
    const resolvedParams = await params;
    await dbConnect();
    const product = await Product.findById(resolvedParams.id);
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    return NextResponse.json(product, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const resolvedParams = await params;
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    await dbConnect();
    const body = await req.json();
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: getFirstZodError(parsed.error) }, { status: 400 });
    }

    const input = parsed.data;
    const desiredSlug = slugifyProductName(input.slug || input.name);
    const slug = await makeUniqueSlug(Product, desiredSlug, resolvedParams.id);
    const sku = await makeUniqueSku(Product, input.sku, resolvedParams.id);
    const imageUrl = input.imageUrl || input.galleryImages?.[0] || "";
    const galleryImages = [...new Set([...(input.galleryImages || []), ...(imageUrl ? [imageUrl] : [])])];
    const featuredThumbnail = input.featuredThumbnail && galleryImages.includes(input.featuredThumbnail)
      ? input.featuredThumbnail
      : (galleryImages[0] || "");

    const updatedProduct = await Product.findByIdAndUpdate(
      resolvedParams.id,
      {
        ...input,
        slug,
        sku,
        imageUrl,
        galleryImages,
        featuredThumbnail,
        quantity: Number(input.quantity),
      },
      { new: true }
    );
    
    if (!updatedProduct) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    return NextResponse.json(updatedProduct, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const resolvedParams = await params;
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    await dbConnect();
    const deletedProduct = await Product.findByIdAndDelete(resolvedParams.id);
    
    if (!deletedProduct) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    return NextResponse.json({ message: "Product deleted" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
