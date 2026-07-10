import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { createPasswordResetToken, getPasswordResetUrl } from "@/lib/passwordReset";

export async function POST(req) {
  try {
    await dbConnect();
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    let resetUrl = null;

    if (user) {
      const { token, tokenHash, expiresAt } = createPasswordResetToken();
      user.resetPasswordTokenHash = tokenHash;
      user.resetPasswordExpiresAt = expiresAt;
      await user.save();
      resetUrl = getPasswordResetUrl(token);

      // Replace this with an email provider integration in production.
      console.info("Password reset link:", resetUrl);
    }

    return NextResponse.json(
      {
        message:
          "If that email exists, a password reset link has been generated.",
        resetUrl:
          process.env.NODE_ENV !== "production" ? resetUrl : undefined,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
