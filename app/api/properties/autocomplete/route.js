import { NextResponse } from "next/server";
import { connectDB } from "@/app/backend/db/connect";
import Property from "@/app/backend/models/Property.model";

export async function GET(req) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const query = searchParams.get("q");

        if (!query || query.length < 2) {
            return NextResponse.json([], { status: 200 });
        }

        const regex = new RegExp(query, "i");

        // Search in title, college, and description
        const properties = await Property.find({
            $or: [
                { title: regex },
                { college: regex },
                { description: regex },
                // If address existed, we'd search it here. 
                // For now, description usually contains address-like info.
            ]
        })
        .select("title college _id location")
        .limit(5);

        return NextResponse.json(properties, { status: 200 });

    } catch (error) {
        console.error("Search API Error:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
