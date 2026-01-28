import { NextResponse } from "next/server";
import { connectDB } from "@/app/backend/db/connect";
import Property from "@/app/backend/models/Property.model";
import { isLandlord } from "@/app/lib/auth";

export async function GET(req) {
  try {
    // 1. Auth Check (Landlord only)
    const user = await isLandlord(req);

    // 2. Connect DB
    await connectDB();

    // 3. Find Properties by Owner
    const properties = await Property.find({ owner: user.id }).sort({
      createdAt: -1,
    });

    const formattedProperties = properties.map((prop) => ({
      id: prop._id,
      title: prop.title,
      description: prop.description,
      price: prop.price,
      gender: prop.gender,
      amenities: prop.amenities,
      images: prop.images,
      college: prop.college,
      location: prop.location,
      verified: prop.verified,
      distance: `${prop.distance}km`,
    }));

    return NextResponse.json(formattedProperties, { status: 200 });
  } catch (error) {
    console.error("GET /api/landlord/properties error:", error);
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
