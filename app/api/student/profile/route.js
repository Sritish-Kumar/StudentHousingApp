import { NextResponse } from "next/server";
import { connectDB } from "@/app/backend/db/connect";
import User from "@/app/backend/models/User.model";
import { getUserFromRequest } from "@/app/lib/auth";

// GET /api/student/profile
export async function GET(req) {
  try {
    await connectDB();
    const user = await getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Verify the user is a student
    if (user.role !== "STUDENT") {
      return NextResponse.json(
        { message: "Forbidden: Students only" },
        { status: 403 },
      );
    }

    // Fetch fresh user data to get the latest profile
    const student = await User.findById(user.id).select(
      "-password -otp -otpExpiry",
    );

    if (!student) {
      return NextResponse.json(
        { message: "Student not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: "Profile fetched successfully",
      profile: student,
    });
  } catch (error) {
    console.error("Error fetching student profile:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// PATCH /api/student/profile
export async function PATCH(req) {
  try {
    await connectDB();
    const user = await getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "STUDENT") {
      return NextResponse.json(
        { message: "Forbidden: Students only" },
        { status: 403 },
      );
    }

    const body = await req.json();

    // Fields allowed to be updated
    const allowedFields = [
      "universityName",
      "course",
      "yearOfStudy",
      "studentId",
      "bio",
      "emergencyContact",
      "permanentAddress",
      "profileImage",
    ];

    // Construct the update object specifically for studentProfile
    const updateData = {};

    // Handle top-level fields (if any)
    // For now, we are only updating studentProfile fields

    // Handle studentProfile fields
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        // Handle nested objects like emergencyContact
        if (field === "emergencyContact" && typeof body[field] === "object") {
          updateData[`studentProfile.${field}`] = body[field];
        } else {
          updateData[`studentProfile.${field}`] = body[field];
        }
      }
    }

    // Validation
    if (
      body.emergencyContact?.phoneNumber &&
      !/^\d{10}$/.test(body.emergencyContact.phoneNumber)
    ) {
      return NextResponse.json(
        { message: "Emergency contact phone number must be exactly 10 digits" },
        { status: 400 },
      );
    }

    if (body.bio && body.bio.length > 500) {
      return NextResponse.json(
        { message: "Bio cannot exceed 500 characters" },
        { status: 400 },
      );
    }

    const updatedStudent = await User.findByIdAndUpdate(
      user.id,
      { $set: updateData },
      { new: true, runValidators: true },
    ).select("-password -otp -otpExpiry");

    return NextResponse.json({
      message: "Profile updated successfully",
      profile: updatedStudent,
    });
  } catch (error) {
    console.error("Error updating student profile:", error);

    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return NextResponse.json(
        { message: messages.join(", ") },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
