import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Category from "@/models/Category"
import { requireAdmin } from "@/lib/auth"
const ALLOWED_CATEGORY_NAMES = ["Electronics", "Mobiles", "Toys", "Cosmetics", "Food", "Fashion", "Home & Living", "Sports"]

export async function PUT(req, { params }) {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await dbConnect()
    const resolvedParams = await params
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

    const duplicate = await Category.findOne({
      name,
      _id: { $ne: resolvedParams.id },
    })
    if (duplicate) {
      return NextResponse.json({ error: "Category name already in use" }, { status: 409 })
    }

    const updated = await Category.findByIdAndUpdate(
      resolvedParams.id,
      { name, subcategories, imageUrl, status },
      { new: true }
    )

    if (!updated) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 })
  }
}

export async function DELETE(req, { params }) {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await dbConnect()
    const resolvedParams = await params
    const deleted = await Category.findByIdAndDelete(resolvedParams.id)

    if (!deleted) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Category deleted" })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 })
  }
}
