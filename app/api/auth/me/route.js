import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    await dbConnect();
    const user = await User.findById(session.userId).select("name email role profileImageUrl phoneNumber accountStatus lastLoginAt");
    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
