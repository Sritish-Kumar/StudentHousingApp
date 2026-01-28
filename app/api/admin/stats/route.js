import { NextResponse } from "next/server";
import { connectDB } from "@/app/backend/db/connect";
import Property from "@/app/backend/models/Property.model";
import User from "@/app/backend/models/User.model";
import { isAdmin } from "@/app/lib/auth";

export async function GET(req) {
  try {
    // Authentication Check (Admin only)
    await isAdmin(req);

    // Connect to database
    await connectDB();

    // Get user statistics
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: "STUDENT" });
    const totalLandlords = await User.countDocuments({ role: "LANDLORD" });
    const totalAdmins = await User.countDocuments({ role: "ADMIN" });
    const suspendedUsers = await User.countDocuments({ suspended: true });

    // Get property statistics
    const totalProperties = await Property.countDocuments();
    const verifiedProperties = await Property.countDocuments({
      verified: true,
    });
    const pendingProperties = await Property.countDocuments({
      verified: false,
      rejectedAt: { $exists: false },
    });
    const rejectedProperties = await Property.countDocuments({
      rejectedAt: { $exists: true },
    });

    // Get recent users (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newUsersThisWeek = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    // Get recent properties (last 7 days)
    const newPropertiesThisWeek = await Property.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    // Get recent activity (last 10 properties)
    const recentProperties = await Property.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("owner", "name email")
      .select("title verified createdAt owner");

    return NextResponse.json(
      {
        users: {
          total: totalUsers,
          students: totalStudents,
          landlords: totalLandlords,
          admins: totalAdmins,
          suspended: suspendedUsers,
          newThisWeek: newUsersThisWeek,
        },
        properties: {
          total: totalProperties,
          verified: verifiedProperties,
          pending: pendingProperties,
          rejected: rejectedProperties,
          newThisWeek: newPropertiesThisWeek,
        },
        recentActivity: recentProperties.map((prop) => ({
          id: prop._id,
          title: prop.title,
          verified: prop.verified,
          createdAt: prop.createdAt,
          owner: {
            name: prop.owner?.name,
            email: prop.owner?.email,
          },
        })),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/admin/stats error:", error);
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
