import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { connectDB } from "@/app/backend/db/connect";
import User from "@/app/backend/models/User.model";
import { signToken } from "@/app/lib/jwt";

export async function POST(req) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json(
      { message: "Email & password required" },
      { status: 400 }
    );
  }

  await connectDB();

  const user = await User.findOne({ email });
  if (!user) {
    return NextResponse.json(
      { message: "Invalid credentials" },
      { status: 401 }
    );
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return NextResponse.json(
      { message: "Invalid credentials" },
      { status: 401 }
    );
  }

  if (user.suspended) {
    return NextResponse.json(
      { message: "Account suspended. Please contact admin." },
      { status: 403 }
    );
  }

  if (!user.isVerified) {
    return NextResponse.json(
      { message: "Email not verified. Please verify your email." },
      { status: 403 }
    );
  }

  const token = signToken({
    id: user._id,
    role: user.role,
  });

  const response = NextResponse.json({
    message: "Login successful",
  });

  response.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return response;
}
