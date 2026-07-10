import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Category from "@/models/Category"
import { requireAdmin } from "@/lib/auth"

export const dynamic = "force-dynamic"
const ALLOWED_CATEGORY_NAMES = ["Electronics", "Mobiles", "Toys", "Cosmetics", "Food", "Fashion", "Home & Living", "Sports"]

export async function GET() {
  try {
    await dbConnect()
    const categories = await Category.find({}).sort({ createdAt: -1 }).lean()
    return NextResponse.json(categories)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await dbConnect()
    const body = await req.json()
    const name = String(body?.name || "").trim()
    const imageUrl = String(body?.imageUrl || "").trim()
    const status = body?.status === "inactive" ? "inactive" : "active"
    const subcategories = Array.isArray(body?.subcategories)
      ? body.subcategories.map((item) => String(item || "").trim()).filter(Boolean)
      : []

    if (!name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 })
    }
    if (!ALLOWED_CATEGORY_NAMES.includes(name)) {
      return NextResponse.json({ error: "Invalid category name" }, { status: 400 })
    }

    const existing = await Category.findOne({ name })
    if (existing) {
      return NextResponse.json({ error: "Category already exists" }, { status: 409 })
    }

    const category = await Category.create({ name, subcategories, imageUrl, status })
    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 })
  }
}
