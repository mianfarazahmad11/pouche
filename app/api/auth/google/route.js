import bcrypt from "bcryptjs";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { signToken, SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS } from "@/lib/auth";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

export async function POST(req) {
  try {
    await dbConnect();
    const { credential } = await req.json();

    if (!credential || typeof credential !== "string") {
      return NextResponse.json({ error: "Missing Google credential" }, { status: 400 });
    }

    const audience = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!audience) {
      return NextResponse.json({ error: "Google login is not configured" }, { status: 500 });
    }

    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience });
    const payload = ticket.getPayload();

    const email = String(payload?.email || "").trim().toLowerCase();
    const name = String(payload?.name || "").trim();
    const picture = String(payload?.picture || "").trim();

    if (!email) {
      return NextResponse.json({ error: "Unable to verify Google account email" }, { status: 400 });
    }

    let user = await User.findOne({ email });
    if (!user) {
      const randomPassword = `google-oauth-${crypto.randomUUID()}`;
      const passwordHash = await bcrypt.hash(randomPassword, 10);
      user = await User.create({
        name: name || email.split("@")[0],
        email,
        passwordHash,
        role: "user",
        profileImageUrl: picture || "",
      });
    } else {
      if (name && !user.name) user.name = name;
      if (picture && !user.profileImageUrl) user.profileImageUrl = picture;
      user.lastLoginAt = new Date();
      await user.save();
    }

    const token = await signToken({ userId: user._id.toString(), role: user.role, name: user.name });
    const response = NextResponse.json(
      {
        message: "Google login successful",
        user: {
          name: user.name,
          role: user.role,
          email: user.email,
          profileImageUrl: user.profileImageUrl || "",
          phoneNumber: user.phoneNumber || "",
          accountStatus: user.accountStatus || "active",
          lastLoginAt: user.lastLoginAt || null,
        },
      },
      { status: 200 }
    );
    response.cookies.set(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);
    return response;
  } catch (error) {
    console.error("Google auth API error:", error);
    return NextResponse.json({ error: "Google authentication failed" }, { status: 401 });
  }
}
