import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { hashPasswordResetToken } from "@/lib/passwordReset";

export async function POST(req) {
  try {
    await dbConnect();
    const { token, password, confirmPassword } = await req.json();

    if (!token || !password || !confirmPassword) {
      return NextResponse.json(
        { error: "Token, password, and confirm password are required" },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    const tokenHash = hashPasswordResetToken(String(token));
    const user = await User.findOne({
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    user.passwordHash = await bcrypt.hash(password, 10);
    user.resetPasswordTokenHash = null;
    user.resetPasswordExpiresAt = null;
    await user.save();

    return NextResponse.json(
      { message: "Password reset successful. Please sign in." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset password API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
