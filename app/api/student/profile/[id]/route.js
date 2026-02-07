import { NextResponse } from "next/server";
import { connectDB } from "@/app/backend/db/connect";
import User from "@/app/backend/models/User.model";

// GET /api/student/profile/[id]
export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = params;

    const student = await User.findById(id).select("-password -otp -otpExpiry");

    if (!student) {
      return NextResponse.json(
        { message: "Student not found" },
        { status: 404 },
      );
    }

    if (student.role !== "STUDENT") {
      return NextResponse.json(
        { message: "User is not a student" },
        { status: 400 },
      );
    }

    // Return public profile information
    // We might want to restrict some fields, but for now, returning the student profile
    // Landlords need to see contact info to contact applicants
    const publicProfile = {
      id: student._id,
      name: student.name,
      email: student.email,
      universityName: student.studentProfile?.universityName,
      course: student.studentProfile?.course,
      yearOfStudy: student.studentProfile?.yearOfStudy,
      bio: student.studentProfile?.bio,
      profileImage: student.studentProfile?.profileImage,
      memberSince: student.createdAt,
      isVerified: student.isVerified,
    };

    return NextResponse.json({
      message: "Student profile fetched successfully",
      profile: publicProfile,
    });
  } catch (error) {
    console.error("Error fetching public student profile:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
