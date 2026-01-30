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
    if (existingUser.isVerified) {
      return NextResponse.json(
        { message: "User already exists" },
        { status: 409 }
      );
    }

    // User exists but not verified -> Update password/name and Resend OTP
    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    existingUser.name = name;
    existingUser.password = hashedPassword;
    existingUser.otp = otp;
    existingUser.otpExpiry = otpExpiry;
    existingUser.role = role || existingUser.role; // Update role if provided
    await existingUser.save();

    // Send verification email
    try {
      await sendData({
        to: email,
        subject: "Verify your email address",
        html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome Back!</h2>
          <p>You previously started signing up but didn't verify.</p>
          <p>Your new verification code is:</p>
          <h1 style="background: #f4f4f4; padding: 10px; text-align: center; letter-spacing: 5px;">${otp}</h1>
          <p>This code will expire in 10 minutes.</p>
        </div>
      `
      });
    } catch (error) {
      console.error("Email sending failed:", error);
    }

    return NextResponse.json(
      { message: "Signup successful. Verification code resent." },
      { status: 201 }
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
    // We await this, but now with a 10s timeout from the transporter config
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
    console.error("Email sending failed during signup:", error);
    // If email fails, we still return success for the account creation
    // The user will see the OTP screen and can click "Resend" to try again
    // This prevents the "40s wait then crash" experience
    return NextResponse.json(
      { message: "Signup successful, but email failed to send. Please try 'Resend Code'." },
      { status: 201 }
    );
  }

  return NextResponse.json(
    { message: "Signup successful. Please verify your email." },
    { status: 201 }
  );
}
