import dbConnect from "@/lib/mongodb";
import Product from "@/models/Product";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { productSchema, slugifyProductName, makeUniqueSlug, makeUniqueSku } from "@/lib/validation/product";
import { getFirstZodError } from "@/lib/validation/settings";

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search')?.trim();
    const stockStatus = searchParams.get('stockStatus');
    const sort = searchParams.get('sort') || 'newest';
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || 24)));
    const skip = (page - 1) * limit;
    
    let query = {};
    if (category && category !== 'All') {
      query.category = category;
    }
    if (search) {
      query.name = { $regex: escapeRegex(search), $options: "i" };
    }
    if (stockStatus === "in_stock") {
      query.quantity = { $gt: 0 };
    }
    if (stockStatus === "out_of_stock") {
      query.quantity = 0;
    }
    if (stockStatus === "low_stock") {
      query.$expr = { $and: [{ $gt: ["$quantity", 0] }, { $lte: ["$quantity", "$lowStockAlertLevel"] }] };
    }

    const sortQuery = { createdAt: -1 };
    if (sort === "price_low") {
      sortQuery.price = 1;
      delete sortQuery.createdAt;
    }
    if (sort === "price_high") {
      sortQuery.price = -1;
      delete sortQuery.createdAt;
    }
    
    const [products, total] = await Promise.all([
      Product.find(query).sort(sortQuery).skip(skip).limit(limit),
      Product.countDocuments(query),
    ]);

    return NextResponse.json(products, {
      status: 200,
      headers: {
        'x-page': String(page),
        'x-limit': String(limit),
        'x-total-count': String(total),
        'x-total-pages': String(Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await dbConnect();
    const body = await req.json();
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: getFirstZodError(parsed.error) }, { status: 400 });
    }

    const input = parsed.data;
    const desiredSlug = slugifyProductName(input.slug || input.name);
    const slug = await makeUniqueSlug(Product, desiredSlug);
    const sku = await makeUniqueSku(Product, input.sku);

    const imageUrl = input.imageUrl || input.galleryImages?.[0] || "";
    const galleryImages = [...new Set([...(input.galleryImages || []), ...(imageUrl ? [imageUrl] : [])])];
    const featuredThumbnail = input.featuredThumbnail && galleryImages.includes(input.featuredThumbnail)
      ? input.featuredThumbnail
      : (galleryImages[0] || "");

    const newProduct = await Product.create({
      ...input,
      slug,
      sku,
      imageUrl,
      galleryImages,
      featuredThumbnail,
      quantity: Number(input.quantity),
    });
    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
