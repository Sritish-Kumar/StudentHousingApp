import crypto from "crypto";
import { connectDB } from "@/app/backend/db/connect";
import bcrypt from "bcryptjs";
import User from "@/app/backend/models/User.model";
import { NextResponse } from "next/server";
import { sendData } from "@/app/lib/email";

export async function POST(req) {
  const { name, email, password, role } = await req.json();

  if (!name || !email || !password) {
    return NextResponse.json(
      { message: "All fields required" },
      { status: 400 }
    );
  }

  await connectDB();

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return NextResponse.json(
      { message: "User already exists" },
      { status: 409 }
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Generate OTP
  const otp = crypto.randomInt(100000, 999999).toString();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await User.create({
    name,
    email,
    password: hashedPassword,
    role: role || "STUDENT",
    otp,
    otpExpiry,
    isVerified: false,
  });

  // Send verification email
  try {
    await sendData({
      to: email,
      subject: "Verify your email address",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to Student Housing App!</h2>
          <p>Please verify your email address to continue.</p>
          <p>Your verification code is:</p>
          <h1 style="background: #f4f4f4; padding: 10px; text-align: center; letter-spacing: 5px;">${otp}</h1>
          <p>This code will expire in 10 minutes.</p>
        </div>
      `
    });
  } catch (error) {
    console.error("Email sending failed:", error);
    // Continue even if email fails, user can resend
  }

  return NextResponse.json(
    { message: "Signup successful. Please verify your email." },
    { status: 201 }
  );
}
