import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { signToken, SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS } from "@/lib/auth";

function getAdminConfig() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD?.trim();

  if (!email || !password) {
    return null;
  }

  return { email, password };
}

export async function POST(req) {
  try {
    await dbConnect();
    const { email, password } = await req.json();
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const adminConfig = getAdminConfig();

    if (!normalizedEmail || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (adminConfig && normalizedEmail === adminConfig.email && password === adminConfig.password) {
      const adminName = "Administrator";
      let adminUser = await User.findOne({ email: adminConfig.email });

      if (!adminUser) {
        adminUser = await User.create({
          name: adminName,
          email: adminConfig.email,
          passwordHash: await bcrypt.hash(adminConfig.password, 10),
          role: "admin",
        });
      } else {
        adminUser.role = "admin";
        adminUser.passwordHash = await bcrypt.hash(adminConfig.password, 10);
        adminUser.lastLoginAt = new Date();
        await adminUser.save();
      }

      const token = await signToken({
        userId: adminUser._id.toString(),
        role: "admin",
        name: adminUser.name || adminName,
      });

      const response = NextResponse.json(
        {
          message: "Login successful",
          user: {
            name: adminUser.name || adminName,
            role: "admin",
            email: adminUser.email,
            profileImageUrl: adminUser.profileImageUrl || "",
            phoneNumber: adminUser.phoneNumber || "",
            accountStatus: adminUser.accountStatus || "active",
            lastLoginAt: adminUser.lastLoginAt || null,
          },
        },
        { status: 200 }
      );
      response.cookies.set(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);
      return response;
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (!user.passwordHash || typeof user.passwordHash !== "string") {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    user.lastLoginAt = new Date();
    await user.save();
    const token = await signToken({ userId: user._id.toString(), role: user.role, name: user.name });

    const response = NextResponse.json({
      message: "Login successful",
      user: {
        name: user.name,
        role: user.role,
        email: user.email,
        profileImageUrl: user.profileImageUrl || '',
        phoneNumber: user.phoneNumber || '',
        accountStatus: user.accountStatus || 'active',
        lastLoginAt: user.lastLoginAt || null,
      },
    }, { status: 200 });
    response.cookies.set(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);

    return response;
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
