import { NextResponse } from "next/server";
import { connectDB } from "@/app/backend/db/connect";
import User from "@/app/backend/models/User.model";
import Property from "@/app/backend/models/Property.model";
import { isAdmin } from "@/app/lib/auth";

export async function GET(req) {
  try {
    // Authentication Check (Admin only)
    await isAdmin(req);

    // Connect to database
    await connectDB();

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role"); // STUDENT, LANDLORD, ADMIN
    const suspended = searchParams.get("suspended"); // true, false
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Build query
    const query = {};

    // Filter by role
    if (role) {
      query.role = role;
    }

    // Filter by suspended status
    if (suspended === "true") {
      query.suspended = true;
    } else if (suspended === "false") {
      query.suspended = false;
    }

    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // Get total count
    const total = await User.countDocuments(query);

    // Get users with pagination
    const users = await User.find(query)
      .select("-password") // Exclude password
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Get property counts for each user
    const usersWithCounts = await Promise.all(
      users.map(async (user) => {
        const propertyCount = await Property.countDocuments({
          owner: user._id,
        });
        return {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          suspended: user.suspended,
          suspendedAt: user.suspendedAt,
          suspensionReason: user.suspensionReason,
          propertyCount,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        };
      }),
    );

    return NextResponse.json(
      {
        users: usersWithCounts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/admin/users error:", error);
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
