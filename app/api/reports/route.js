import { NextResponse } from "next/server";
import { connectDB } from "@/app/backend/db/connect";
import Report from "@/app/backend/models/Report.model";
import Property from "@/app/backend/models/Property.model";
import User from "@/app/backend/models/User.model";
import { isAuthenticated } from "@/app/lib/auth";

/**
 * POST /api/reports
 * Submit a new report (Authenticated users only)
 *
 * @param {Request} req - The request object
 * @returns {Response} Created report or error
 */
export async function POST(req) {
  try {
    // 1. Authentication Check
    const user = await isAuthenticated(req);

    // 2. Connect to Database
    await connectDB();

    // 3. Parse Request Body
    const {
      reportType,
      reportedProperty,
      reportedUser,
      category,
      description,
    } = await req.json();

    // 4. Validate Required Fields
    if (!reportType) {
      return NextResponse.json(
        { message: "Report type is required" },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { message: "Category is required" },
        { status: 400 }
      );
    }

    if (!description || description.trim() === "") {
      return NextResponse.json(
        { message: "Description is required" },
        { status: 400 }
      );
    }

    // 5. Validate Report Type
    const validReportTypes = ["PROPERTY", "USER"];
    if (!validReportTypes.includes(reportType)) {
      return NextResponse.json(
        {
          message: `Invalid report type. Must be one of: ${validReportTypes.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    // 6. Validate Category
    const validCategories = [
      "SPAM",
      "INAPPROPRIATE_CONTENT",
      "SAFETY_CONCERN",
      "FRAUD",
      "HARASSMENT",
      "OTHER",
    ];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        {
          message: `Invalid category. Must be one of: ${validCategories.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    // 7. Type-Specific Validation
    if (reportType === "PROPERTY") {
      if (!reportedProperty) {
        return NextResponse.json(
          { message: "Property ID is required when reporting a property" },
          { status: 400 }
        );
      }

      // Check if property exists
      const property = await Property.findById(reportedProperty);
      if (!property) {
        return NextResponse.json(
          { message: "Property not found" },
          { status: 404 }
        );
      }
    }

    if (reportType === "USER") {
      if (!reportedUser) {
        return NextResponse.json(
          { message: "User ID is required when reporting a user" },
          { status: 400 }
        );
      }

      // Check if user exists
      const userToReport = await User.findById(reportedUser);
      if (!userToReport) {
        return NextResponse.json(
          { message: "User not found" },
          { status: 404 }
        );
      }

      // Prevent self-reporting
      if (reportedUser === user.id) {
        return NextResponse.json(
          { message: "You cannot report yourself" },
          { status: 400 }
        );
      }
    }

    // 8. Create Report
    const newReport = await Report.create({
      reportedBy: user.id,
      reportType,
      reportedProperty:
        reportType === "PROPERTY" ? reportedProperty : undefined,
      reportedUser: reportType === "USER" ? reportedUser : undefined,
      category,
      description: description.trim(),
      status: "PENDING",
    });

    // 9. Return Success Response
    return NextResponse.json(
      {
        message: "Report submitted successfully",
        reportId: newReport._id,
        status: newReport.status,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/reports error:", error);

    // Handle specific error types
    if (error.kind === "ObjectId") {
      return NextResponse.json(
        { message: "Invalid ID format" },
        { status: 400 }
      );
    }

    if (error.message.includes("Unauthorized")) {
      return NextResponse.json({ message: error.message }, { status: 401 });
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
