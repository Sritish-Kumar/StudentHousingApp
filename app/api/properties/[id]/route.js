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
            return NextResponse.json({ message: "Property not found" }, { status: 404 });
        }

        return NextResponse.json(property, { status: 200 });
    } catch (error) {
        console.error("GET /api/properties/[id] error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
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
            return NextResponse.json({ message: "Property not found" }, { status: 404 });
        }

        // Check ownership
        if (property.owner.toString() !== user.id) {
            return NextResponse.json({ message: "Unauthorized: You do not own this property" }, { status: 403 });
        }

        // Update fields
        const { title, description, price, gender, amenities, college, location } = body;

        // Update basic fields if provided
        if (title) property.title = title;
        if (description) property.description = description;
        if (price) property.price = price;
        if (gender) property.gender = gender;
        if (amenities) property.amenities = amenities;
        if (college) property.college = college;

        // Update location if provided
        if (location) {
            property.location = {
                type: 'Point',
                coordinates: [location.lng, location.lat]
            };
        }

        // Reset verification status on edit? usually good practice, but keeping simple for now.
        // property.verified = false; 

        await property.save();

        return NextResponse.json(property, { status: 200 });

    } catch (error) {
        console.error("PUT /api/properties/[id] error:", error);
        return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 });
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
            return NextResponse.json({ message: "Property not found" }, { status: 404 });
        }

        // Check ownership
        if (property.owner.toString() !== user.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
        }

        await Property.deleteOne({ _id: id });

        return NextResponse.json({ message: "Property deleted" }, { status: 200 });

    } catch (error) {
        console.error("DELETE /api/properties/[id] error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
