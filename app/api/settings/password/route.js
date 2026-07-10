import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { requireAdmin } from "@/lib/auth";
import { getFirstZodError, passwordChangeSchema } from "@/lib/validation/settings";

export async function POST(req) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = passwordChangeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: getFirstZodError(parsed.error) }, { status: 400 });
    }
    const { currentPassword, newPassword } = parsed.data;

    await dbConnect();
    const adminUser = await User.findById(session.userId);
    if (!adminUser) {
      return NextResponse.json({ error: "Admin user not found" }, { status: 404 });
    }

    const isMatch = await bcrypt.compare(currentPassword, adminUser.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    adminUser.passwordHash = await bcrypt.hash(newPassword, 10);
    await adminUser.save();

    return NextResponse.json({ message: "Password updated successfully" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
