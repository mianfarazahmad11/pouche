import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import User from "@/models/User"
import { getSession } from "@/lib/auth"

export async function PUT(req) {
  try {
    const session = await getSession()
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await req.json()
    const profileImageUrl = String(body?.profileImageUrl || "").trim()
    if (!profileImageUrl) {
      return NextResponse.json({ error: "Profile image is required" }, { status: 400 })
    }

    await dbConnect()
    const updatedUser = await User.findByIdAndUpdate(
      session.userId,
      { profileImageUrl },
      { new: true }
    ).select("name email role profileImageUrl")

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ user: updatedUser }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
