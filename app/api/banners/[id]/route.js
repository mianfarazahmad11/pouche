import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Banner from "@/models/Banner"
import { requireAdmin } from "@/lib/auth"

export async function PUT(req, { params }) {
  try {
    const admin = await requireAdmin()
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

    await dbConnect()
    const resolvedParams = await params
    const body = await req.json()

    const title = String(body?.title || "").trim()
    const subtitle = String(body?.subtitle || "").trim()
    const imageUrl = String(body?.imageUrl || "").trim()
    const buttonText = String(body?.buttonText || "").trim()
    const buttonLink = String(body?.buttonLink || "").trim()
    const placementValue = String(body?.placement || "").trim().toLowerCase()
    const placement = placementValue === "collection"
      ? "collection"
      : placementValue === "promotion"
        ? "promotion"
        : "home"
    const status = body?.status === "inactive" ? "inactive" : "active"

    if (!title) return NextResponse.json({ error: "Banner title is required" }, { status: 400 })
    if (!imageUrl) return NextResponse.json({ error: "Banner image is required" }, { status: 400 })

    const updated = await Banner.findByIdAndUpdate(
      resolvedParams.id,
      { title, subtitle, imageUrl, buttonText, buttonLink, placement, status },
      { new: true }
    )

    if (!updated) return NextResponse.json({ error: "Banner not found" }, { status: 404 })
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: error?.message || "Failed to update banner" }, { status: 500 })
  }
}

export async function DELETE(req, { params }) {
  try {
    const admin = await requireAdmin()
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

    await dbConnect()
    const resolvedParams = await params
    const deleted = await Banner.findByIdAndDelete(resolvedParams.id)
    if (!deleted) return NextResponse.json({ error: "Banner not found" }, { status: 404 })

    return NextResponse.json({ message: "Banner deleted" })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete banner" }, { status: 500 })
  }
}
