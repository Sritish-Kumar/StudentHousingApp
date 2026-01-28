import { connectDB } from "@/app/backend/db/connect";
import Property from "@/app/backend/models/Property.model";
import { isAdmin } from "@/app/lib/auth";
import { NextResponse } from "next/server";

export async function PATCH(req, { params }) {
  try {
    await connectDB();

    // Check authorization
    const admin = await isAdmin(req);

    const { id } = params;
    const body = await req.json();
    const { verified } = body;

    if (typeof verified !== "boolean") {
      return NextResponse.json(
        { message: "Invalid payload: 'verified' must be a boolean" },
        { status: 400 },
      );
    }

    const updateData = { verified };

    if (verified) {
      updateData.verifiedAt = new Date();
      updateData.verifiedBy = admin.id;
      updateData.rejectedAt = undefined;
      updateData.rejectionReason = undefined;
    }

    const property = await Property.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!property) {
      return NextResponse.json(
        { message: "Property not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        message: `Property ${verified ? "verified" : "unverified"} successfully`,
        property,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error verifying property:", error);
    if (error.message?.includes("Forbidden")) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
