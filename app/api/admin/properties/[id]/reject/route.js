import { NextResponse } from "next/server";
import { connectDB } from "@/app/backend/db/connect";
import Property from "@/app/backend/models/Property.model";
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

    // Find property
    const property = await Property.findById(id);
    if (!property) {
      return NextResponse.json(
        { message: "Property not found" },
        { status: 404 },
      );
    }

    // Reject property
    property.verified = false;
    property.rejectedAt = new Date();
    property.rejectionReason = reason || "No reason provided";
    property.verifiedAt = undefined;
    property.verifiedBy = undefined;

    await property.save();

    return NextResponse.json(
      {
        message: "Property rejected successfully",
        property: {
          id: property._id,
          title: property.title,
          verified: property.verified,
          rejectedAt: property.rejectedAt,
          rejectionReason: property.rejectionReason,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("POST /api/admin/properties/[id]/reject error:", error);
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
