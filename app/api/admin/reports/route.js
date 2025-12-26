import { NextResponse } from "next/server";
import { connectDB } from "@/app/backend/db/connect";
import Report from "@/app/backend/models/Report.model";
import "@/app/backend/models/User.model";
import "@/app/backend/models/Property.model";
import { isAdmin } from "@/app/lib/auth";

/**
 * GET /api/admin/reports
 * Get all reports with filtering (Admin only)
 *
 * @param {Request} req - The request object
 * @returns {Response} Array of reports or error
 */
export async function GET(req) {
  try {
    // 1. Admin Authorization Check
    await isAdmin(req);

    // 2. Connect to Database
    await connectDB();

    // 3. Get Query Parameters for Filtering
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const reportType = searchParams.get("reportType");
    const category = searchParams.get("category");
    const reportedBy = searchParams.get("reportedBy");

    // 4. Build Query
    const query = {};
    if (status) query.status = status;
    if (reportType) query.reportType = reportType;
    if (category) query.category = category;
    if (reportedBy) query.reportedBy = reportedBy;

    // 5. Fetch Reports with Population
    const reports = await Report.find(query)
      .populate("reportedBy", "name email")
      .populate("reportedProperty", "title owner")
      .populate("reportedUser", "name email")
      .populate("resolvedBy", "name email")
      .sort({ createdAt: -1 });

    // 6. Return Reports
    return NextResponse.json(reports, { status: 200 });
  } catch (error) {
    console.error("GET /api/admin/reports error:", error);

    // Handle specific error types
    if (error.kind === "ObjectId") {
      return NextResponse.json(
        { message: "Invalid ID format in query parameters" },
        { status: 400 }
      );
    }

    if (
      error.message.includes("Forbidden") ||
      error.message.includes("Unauthorized")
    ) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
