import { NextResponse } from "next/server";
import { connectDB } from "@/app/backend/db/connect";
import User from "@/app/backend/models/User.model";
import { getUserFromRequest } from "@/app/lib/auth";

// GET /api/admin/users/[id]/profile
export async function GET(req, { params }) {
  try {
    await connectDB();
    const currentUser = await getUserFromRequest(req);

    if (!currentUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Forbidden: Admins only" },
        { status: 403 },
      );
    }

    const { id } = params;
    const user = await User.findById(id).select("-password -otp -otpExpiry");

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "User profile fetched successfully",
      profile: user,
    });
  } catch (error) {
    console.error("Error fetching user profile (admin):", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// PATCH /api/admin/users/[id]/profile
export async function PATCH(req, { params }) {
  try {
    await connectDB();
    const currentUser = await getUserFromRequest(req);

    if (!currentUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Forbidden: Admins only" },
        { status: 403 },
      );
    }

    const { id } = params;
    const body = await req.json();

    // Fields allowed to be updated by admin
    // Admins can update verification status and profile details

    const updateData = {};

    // 1. Handle Verification Status (for Landlords)
    if (body.isVerified !== undefined) {
      updateData["landlordProfile.isVerified"] = body.isVerified;
      if (body.isVerified) {
        updateData["landlordProfile.verifiedAt"] = new Date();
      } else {
        updateData["landlordProfile.verifiedAt"] = null;
      }
    }

    // 2. Handle generic profile updates if needed
    // For now, let's focus on verification and maybe basic info
    // We can expand this to allow editing other fields if requested

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    ).select("-password -otp -otpExpiry");

    if (!updatedUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "User profile updated successfully",
      profile: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user profile (admin):", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
