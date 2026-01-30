
import crypto from "crypto";
import { connectDB } from "@/app/backend/db/connect";
import User from "@/app/backend/models/User.model";
import { sendData } from "@/app/lib/email";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const { email } = await req.json();
        console.log("Resend OTP Requested for:", email);

        if (!email) {
            return NextResponse.json(
                { message: "Email is required" },
                { status: 400 }
            );
        }

        await connectDB();

        const user = await User.findOne({ email });
        console.log("User found:", !!user);

        if (!user) {
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 }
            );
        }

        if (user.isVerified) {
            return NextResponse.json(
                { message: "Email already verified" },
                { status: 400 }
            );
        }

        // Generate numeric OTP
        const otp = crypto.randomInt(100000, 999999).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        user.otp = otp;
        user.otpExpiry = otpExpiry;
        await user.save();
        console.log("OTP updated in DB for user:", user._id);

        // Send email
        try {
            await sendData({
                to: email,
                subject: "Verify your email address",
                html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Email Verification</h2>
          <p>Your verification code is:</p>
          <h1 style="background: #f4f4f4; padding: 10px; text-align: center; letter-spacing: 5px;">${otp}</h1>
          <p>This code will expire in 10 minutes.</p>
        </div>
      `
            });
            console.log("Resend OTP email sent successfully");
        } catch (error) {
            console.error("Resend OTP Email failed:", error);
            // Return 500 but with specific message so user knows to try again or contact support
            return NextResponse.json(
                { message: "Failed to send email. Provider might be blocking access." },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { message: "OTP resent successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Resend OTP error:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
