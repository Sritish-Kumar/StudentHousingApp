import { NextResponse } from "next/server";
import { connectDB } from "@/app/backend/db/connect";
import Property from "@/app/backend/models/Property.model";
import { isLandlord } from "@/app/lib/auth";

export async function POST(req) {
    try {
        // 1. Authentication Check (Landlord only)
        const user = await isLandlord(req);

        // 2. Parse Body
        const body = await req.json();
        const { title, description, price, gender, amenities, location, college } = body;

        // 3. Validation (Basic)
        if (!title || !price || !location || !college) {
            return NextResponse.json(
                { message: "Missing required fields" },
                { status: 400 }
            );
        }

        // 4. Connect DB
        await connectDB();

        // 5. Create Property with GeoJSON location
        const newProperty = await Property.create({
            title,
            description,
            price,
            gender,
            amenities,
            location: {
                type: 'Point',
                coordinates: [location.lng, location.lat] // GeoJSON format: [longitude, latitude]
            },
            college,
            owner: user.id, // from token payload
            verified: false, // Default
            distance: 0, // Default or calculated
        });

        return NextResponse.json(
            {
                propertyId: newProperty._id,
                verified: newProperty.verified,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("POST /api/properties error:", error);
        if (error.name === "ValidationError") {
            return NextResponse.json({ message: error.message }, { status: 400 });
        }
        if (error.message.includes("Unauthorized") || error.message.includes("Forbidden")) {
            return NextResponse.json({ message: error.message }, { status: 403 });
        }
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function GET(req) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const priceMin = searchParams.get("priceMin");
        const priceMax = searchParams.get("priceMax");
        const gender = searchParams.get("gender");
        const verified = searchParams.get("verified");
        const distance = searchParams.get("distance");
        const college = searchParams.get("college");

        const query = {};

        // Filter by Price
        if (priceMin || priceMax) {
            query.price = {};
            if (priceMin) query.price.$gte = Number(priceMin);
            if (priceMax) query.price.$lte = Number(priceMax);
        }

        // Filter by Gender
        if (gender) {
            query.gender = gender;
        }

        // Filter by Verified
        if (verified === "true") {
            query.verified = true;
        } else if (verified === "false") {
            query.verified = false;
        }

        // Filter by College (Fuzzy search)
        if (college) {
            query.college = { $regex: college, $options: "i" };
        }

        // Filter by Distance (Simple numeric filter on 'distance' field)
        if (distance) {
            query.distance = { $lte: Number(distance) };
        }

        const properties = await Property.find(query).sort({ createdAt: -1 });

        const formattedProperties = properties.map((prop) => ({
            id: prop._id,
            title: prop.title,
            price: prop.price,
            verified: prop.verified,
            distance: `${prop.distance}km`,
        }));

        return NextResponse.json(formattedProperties, { status: 200 });
    } catch (error) {
        console.error("GET /api/properties error:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
