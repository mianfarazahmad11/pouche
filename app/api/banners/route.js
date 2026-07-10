import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Banner from "@/models/Banner"
import { requireAdmin } from "@/lib/auth"

export async function GET() {
  try {
    await dbConnect()
    const banners = await Banner.find({}).sort({ createdAt: -1 }).lean()
    return NextResponse.json(banners)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch banners" }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const admin = await requireAdmin()
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

    await dbConnect()
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

    const banner = await Banner.create({
      title,
      subtitle,
      imageUrl,
      buttonText,
      buttonLink,
      placement,
      status,
    })
    return NextResponse.json(banner, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error?.message || "Failed to create banner" }, { status: 500 })
  }
}
