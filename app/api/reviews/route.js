import { NextResponse } from "next/server";
import { connectDB } from "@/app/backend/db/connect";
import Review from "@/app/backend/models/Review.model";
import Property from "@/app/backend/models/Property.model";
import { isAuthenticated } from "@/app/lib/auth";

export async function POST(req) {
    try {
        // 1. Auth Check
        const user = await isAuthenticated(req);

        // 2. Parse Body
        const { propertyId, rating, comment } = await req.json();

        if (!propertyId || !rating || !comment) {
            return NextResponse.json(
                { message: "Property ID, Rating, and Comment are required" },
                { status: 400 }
            );
        }

        // 3. Connect DB
        await connectDB();

        // 4. Check if Property Exists
        const property = await Property.findById(propertyId);
        if (!property) {
            return NextResponse.json(
                { message: "Property not found" },
                { status: 404 }
            );
        }

        // 5. Create Review
        // Mongoose unique index will prevent duplicates automatically
        const newReview = await Review.create({
            user: user.id,
            property: propertyId,
            rating,
            comment,
        });

        return NextResponse.json(
            { message: "Review submitted successfully", review: newReview },
            { status: 201 }
        );

    } catch (error) {
        console.error("POST /api/reviews error:", error);

        // Handle Duplicate Review
        if (error.code === 11000) {
            return NextResponse.json(
                { message: "You have already reviewed this property" },
                { status: 409 } // Conflict
            );
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
