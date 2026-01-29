
import { connectDB } from "@/app/backend/db/connect";
import User from "@/app/backend/models/User.model";
import { signToken } from "@/app/lib/jwt";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const { email, otp } = await req.json();

        if (!email || !otp) {
            return NextResponse.json(
                { message: "Email and OTP are required" },
                { status: 400 }
            );
        }

        await connectDB();

        // Find user and explicitly select OTP fields
        const user = await User.findOne({ email }).select("+otp +otpExpiry");

        if (!user) {
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 }
            );
        }

        if (user.isVerified) {
            return NextResponse.json(
                { message: "User already verified" },
                { status: 400 }
            );
        }

        // Check OTP
        if (user.otp !== otp) {
            return NextResponse.json(
                { message: "Invalid verification code" },
                { status: 400 }
            );
        }

        // Check expiry
        if (user.otpExpiry < Date.now()) {
            return NextResponse.json(
                { message: "Verification code expired" },
                { status: 400 }
            );
        }

        // Verify user & clear OTP
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        // Login user immediately after verification
        const token = signToken({
            id: user._id,
            role: user.role,
        });

        const response = NextResponse.json(
            { message: "Email verified successfully" },
            { status: 200 }
        );

        response.cookies.set("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: 60 * 60 * 24 * 7, // 7 days
        });

        return response;
    } catch (error) {
        console.error("Verify OTP error:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
