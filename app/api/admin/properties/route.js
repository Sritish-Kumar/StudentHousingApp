import { NextResponse } from "next/server";
import { connectDB } from "@/app/backend/db/connect";
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
    const status = searchParams.get("status"); // all, verified, pending, rejected
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Build query
    const query = {};

    // Filter by status
    if (status === "verified") {
      query.verified = true;
    } else if (status === "pending") {
      query.verified = false;
      query.rejectedAt = { $exists: false };
    } else if (status === "rejected") {
      query.rejectedAt = { $exists: true };
    }

    // Search by title or college
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { college: { $regex: search, $options: "i" } },
      ];
    }

    // Get total count
    const total = await Property.countDocuments(query);

    // Get properties with pagination
    const properties = await Property.find(query)
      .populate("owner", "name email role")
      .populate("verifiedBy", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Format response
    const formattedProperties = properties.map((prop) => ({
      id: prop._id,
      title: prop.title,
      description: prop.description,
      price: prop.price,
      gender: prop.gender,
      college: prop.college,
      images: prop.images,
      verified: prop.verified,
      verifiedAt: prop.verifiedAt,
      verifiedBy: prop.verifiedBy
        ? {
            name: prop.verifiedBy.name,
            email: prop.verifiedBy.email,
          }
        : null,
      rejectedAt: prop.rejectedAt,
      rejectionReason: prop.rejectionReason,
      owner: {
        id: prop.owner._id,
        name: prop.owner.name,
        email: prop.owner.email,
        role: prop.owner.role,
      },
      createdAt: prop.createdAt,
      updatedAt: prop.updatedAt,
    }));

    return NextResponse.json(
      {
        properties: formattedProperties,
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
    console.error("GET /api/admin/properties error:", error);
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
