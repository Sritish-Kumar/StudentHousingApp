import { NextResponse } from "next/server";
import { connectDB } from "@/app/backend/db/connect";
import Review from "@/app/backend/models/Review.model";
import "@/app/backend/models/User.model"; // Ensure User model is registered

export async function GET(req, { params }) {
    const { id } = params; // This is the propertyId

    try {
        await connectDB();

        const reviews = await Review.find({ property: id })
            .populate("user", "name") // Only get user name
            .sort({ createdAt: -1 }); // Newest first

        return NextResponse.json(reviews, { status: 200 });

    } catch (error) {
        console.error("GET /api/reviews/[id] error:", error);

        if (error.kind === "ObjectId") {
            return NextResponse.json({ message: "Invalid Property ID" }, { status: 400 });
        }

        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
