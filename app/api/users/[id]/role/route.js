import { NextResponse } from "next/server";
import { connectDB } from "@/app/backend/db/connect";
import User from "@/app/backend/models/User.model";
import { isAdmin } from "@/app/lib/auth";

/**
 * PATCH /api/users/:id/role
 * Update user role (Admin only)
 *
 * @param {Request} req - The request object
 * @param {Object} params - Route parameters
 * @param {string} params.id - User ID to update
 *
 * @returns {Response} Updated user object or error
 */
export async function PATCH(req, { params }) {
  try {
    // 1. Admin Authorization Check
    const admin = await isAdmin(req);

    // 2. Connect to Database
    await connectDB();

    // 3. Extract and Validate Request Body
    const { role } = await req.json();

    // Validate role field exists
    if (!role) {
      return NextResponse.json(
        { message: "Role field is required" },
        { status: 400 }
      );
    }

    // Validate role value
    const allowedRoles = ["STUDENT", "LANDLORD", "ADMIN"];
    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        { message: `Invalid role. Allowed values: ${allowedRoles.join(", ")}` },
        { status: 400 }
      );
    }

    // 4. Get User ID from params
    const { id } = params;

    // 5. Find and Update User
    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Prevent admin from demoting themselves
    if (user._id.toString() === admin.id && role !== "ADMIN") {
      return NextResponse.json(
        { message: "Cannot change your own admin role" },
        { status: 403 }
      );
    }

    // Update the role
    user.role = role;
    await user.save();

    // 6. Return Success Response (exclude password)
    return NextResponse.json(
      {
        message: `User role updated to ${role} successfully`,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          updatedAt: user.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH /api/users/[id]/role error:", error);

    // Handle specific error types
    if (error.kind === "ObjectId") {
      return NextResponse.json(
        { message: "Invalid user ID format" },
        { status: 400 }
      );
    }

    if (
      error.message.includes("Unauthorized") ||
      error.message.includes("Forbidden")
    ) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }

    if (error.name === "ValidationError") {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
