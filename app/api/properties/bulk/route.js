import { NextResponse } from "next/server";
import { connectDB } from "@/app/backend/db/connect";
import Property from "@/app/backend/models/Property.model";
import { isLandlord } from "@/app/lib/auth";

export async function POST(req) {
    try {
        // 1. Authentication Check (Landlord only)
        const user = await isLandlord(req);

        // 2. Parse Body (Expect Array)
        const body = await req.json();

        if (!Array.isArray(body)) {
            return NextResponse.json(
                { message: "Payload must be an array of properties" },
                { status: 400 }
            );
        }

        // 3. Connect DB
        await connectDB();

        const createdProperties = [];
        const errors = [];

        // 4. Loop and Create
        // Using a loop to handle individual validations if needed, though insertMany is faster
        // We will process them to match the schema structure (converting location)

        for (const [index, item] of body.entries()) {
            const { title, description, price, gender, amenities, location, college } = item;

            if (!title || !price || !location || !college) {
                errors.push({ index, message: "Missing required fields" });
                continue;
            }

            try {
                const newProperty = await Property.create({
                    title,
                    description,
                    price,
                    gender,
                    amenities,
                    location: {
                        type: 'Point',
                        coordinates: [location.lng, location.lat]
                    },
                    college,
                    owner: user.id,
                    verified: false,
                    distance: 0,
                });
                createdProperties.push(newProperty._id);
            } catch (err) {
                errors.push({ index, message: err.message });
            }
        }

        return NextResponse.json(
            {
                message: `Processed ${body.length} items. Created ${createdProperties.length}.`,
                createdIds: createdProperties,
                errors: errors.length > 0 ? errors : undefined
            },
            { status: 201 }
        );

    } catch (error) {
        console.error("POST /api/properties/bulk error:", error);
        if (error.message.includes("Unauthorized") || error.message.includes("Forbidden")) {
            return NextResponse.json({ message: error.message }, { status: 403 });
        }
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
