import { NextResponse } from "next/server";
import { connectDB } from "@/app/backend/db/connect";
import Property from "@/app/backend/models/Property.model";
import "@/app/backend/models/User.model";
import { isAuthenticated } from "@/app/lib/auth";

export async function GET(req, { params }) {
    const { id } = params;

    try {
        await connectDB();

        const property = await Property.findById(id).populate("owner", "name email");

        if (!property) {
            return NextResponse.json(
                { message: "Property not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(property, { status: 200 });
    } catch (error) {
        console.error("GET /api/properties/[id] error:", error);
        if (error.kind === "ObjectId") {
            return NextResponse.json({ message: "Invalid Property ID" }, { status: 400 });
        }
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function PUT(req, { params }) {
    const { id } = params;

    try {
        // 1. Auth Check
        const user = await isAuthenticated(req);

        // 2. Connect DB
        await connectDB();

        // 3. Find Property
        const property = await Property.findById(id);
        if (!property) {
            return NextResponse.json(
                { message: "Property not found" },
                { status: 404 }
            );
        }

        // 4. Ownership Check
        if (property.owner.toString() !== user.id) {
            return NextResponse.json(
                { message: "Forbidden: You do not own this property" },
                { status: 403 }
            );
        }

        // 5. Update
        const body = await req.json();
        const { title, description, price, gender, amenities, location, college } = body;

        property.title = title || property.title;
        property.description = description || property.description;
        property.price = price || property.price;
        property.gender = gender || property.gender;
        property.amenities = amenities || property.amenities;

        // Handle location update - convert to GeoJSON if provided
        if (location) {
            if (location.lat && location.lng) {
                property.location = {
                    type: 'Point',
                    coordinates: [location.lng, location.lat]
                };
            } else {
                property.location = location;
            }
        }

        property.college = college || property.college;

        await property.save();

        return NextResponse.json(property, { status: 200 });

    } catch (error) {
        console.error("PUT /api/properties/[id] error:", error);
        if (error.kind === "ObjectId") {
            return NextResponse.json({ message: "Invalid Property ID" }, { status: 400 });
        }
        if (error.name === "ValidationError") {
            return NextResponse.json({ message: error.message }, { status: 400 });
        }
        if (error.message.includes("Unauthorized")) {
            return NextResponse.json({ message: error.message }, { status: 401 });
        }
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function DELETE(req, { params }) {
    const { id } = params;

    try {
        // 1. Auth Check
        const user = await isAuthenticated(req);

        await connectDB();

        const property = await Property.findById(id);
        if (!property) {
            return NextResponse.json(
                { message: "Property not found" },
                { status: 404 }
            );
        }

        // 2. Ownership Check
        if (property.owner.toString() !== user.id) {
            return NextResponse.json(
                { message: "Forbidden: You do not own this property" },
                { status: 403 }
            );
        }

        // 3. Delete
        await Property.findByIdAndDelete(id);

        return NextResponse.json(
            { message: "Property deleted successfully" },
            { status: 200 }
        );

    } catch (error) {
        console.error("DELETE /api/properties/[id] error:", error);
        if (error.kind === "ObjectId") {
            return NextResponse.json({ message: "Invalid Property ID" }, { status: 400 });
        }
        if (error.message.includes("Unauthorized")) {
            return NextResponse.json({ message: error.message }, { status: 401 });
        }
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
