import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { signToken, SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS } from "@/lib/auth";

export async function POST(req) {
  try {
    await dbConnect();
    const { name, email, password, role } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name,
      email,
      passwordHash,
      role: role === "admin" ? "admin" : "user", // Basic role enforcement for demo
    });

    const token = await signToken({
      userId: newUser._id.toString(),
      role: newUser.role,
    });

    const response = NextResponse.json(
      { message: "Registration successful" },
      { status: 201 },
    );
    response.cookies.set(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
