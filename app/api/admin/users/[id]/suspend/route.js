import { NextResponse } from "next/server";
import { connectDB } from "@/app/backend/db/connect";
import User from "@/app/backend/models/User.model";
import { isAdmin } from "@/app/lib/auth";

export async function POST(req, { params }) {
  try {
    // Authentication Check (Admin only)
    await isAdmin(req);

    // Connect to database
    await connectDB();

    const { id } = params;
    const body = await req.json();
    const { reason } = body;

    // Find user
    const user = await User.findById(id).select("-password");
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Check if user is admin
    if (user.role === "ADMIN") {
      return NextResponse.json(
        { message: "Cannot suspend admin users" },
        { status: 403 },
      );
    }

    // Toggle suspension
    user.suspended = !user.suspended;
    user.suspendedAt = user.suspended ? new Date() : undefined;
    user.suspensionReason = user.suspended
      ? reason || "No reason provided"
      : undefined;

    await user.save();

    return NextResponse.json(
      {
        message: user.suspended
          ? "User suspended successfully"
          : "User unsuspended successfully",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          suspended: user.suspended,
          suspendedAt: user.suspendedAt,
          suspensionReason: user.suspensionReason,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("POST /api/admin/users/[id]/suspend error:", error);
    if (
      error.message.includes("Unauthorized") ||
      error.message.includes("Forbidden")
    ) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
