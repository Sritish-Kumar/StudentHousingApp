import { NextResponse } from "next/server";
import { connectDB } from "@/app/backend/db/connect";
import Property from "@/app/backend/models/Property.model";
import { isLandlord, isLandlordOrAdmin } from "@/app/lib/auth";

// GET Single Property
export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = params;

    const property = await Property.findById(id);

    if (!property) {
      return NextResponse.json(
        { message: "Property not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(property, { status: 200 });
  } catch (error) {
    console.error("GET /api/properties/[id] error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// UPDATE Property
export async function PUT(req, { params }) {
  try {
    const user = await isLandlord(req); // Ensure user is landlord
    const { id } = params;
    const body = await req.json();

    await connectDB();
    const property = await Property.findById(id);

    if (!property) {
      return NextResponse.json(
        { message: "Property not found" },
        { status: 404 },
      );
    }

    // Check ownership
    if (property.owner.toString() !== user.id) {
      return NextResponse.json(
        { message: "Unauthorized: You do not own this property" },
        { status: 403 },
      );
    }

    // Update fields
    const {
      title,
      description,
      address,
      price,
      gender,
      amenities,
      college,
      location,
      images,
    } = body;

    // Debug logging
    console.log('PUT /api/properties/[id] - Received address:', address);
    console.log('PUT /api/properties/[id] - Current property address:', property.address);

    // Construct update object
    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (address !== undefined) updateData.address = address;
    if (price) updateData.price = price;
    if (gender) updateData.gender = gender;
    if (amenities) updateData.amenities = amenities;
    if (college) updateData.college = college;

    // Explicitly handle images array checks before update
    if (images !== undefined) {
      if (!Array.isArray(images) || images.length > 10) {
        return NextResponse.json(
          { message: "Images must be an array with maximum 10 URLs" },
          { status: 400 },
        );
      }
      updateData.images = images;
    }

    if (location && location.lat && location.lng) {
      updateData.location = {
        type: "Point",
        coordinates: [location.lng, location.lat],
      };
    }

    console.log('PUT /api/properties/[id] - Update payload:', JSON.stringify(updateData, null, 2));

    const updatedProperty = await Property.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedProperty) {
      return NextResponse.json({ message: "Property not found" }, { status: 404 });
    }

    console.log('PUT /api/properties/[id] - Successfully updated property. New address:', updatedProperty.address);

    return NextResponse.json(
      { message: "Property updated successfully", property: updatedProperty },
      { status: 200 },
    );
  } catch (error) {
    console.error("PUT /api/properties/[id] error:", error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}

// DELETE Property
export async function DELETE(req, { params }) {
  try {
    const user = await isLandlord(req);
    const { id } = params;

    await connectDB();
    const property = await Property.findById(id);

    if (!property) {
      return NextResponse.json(
        { message: "Property not found" },
        { status: 404 },
      );
    }

    // Check ownership
    if (property.owner.toString() !== user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    await Property.deleteOne({ _id: id });

    return NextResponse.json({ message: "Property deleted" }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/properties/[id] error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
