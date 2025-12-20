import { NextResponse } from "next/server";
import { connectDB } from "@/app/backend/db/connect";
import User from "@/app/backend/models/User.model";
import Property from "@/app/backend/models/Property.model"; // Ensure Property model is registered
import { isAuthenticated } from "@/app/lib/auth";

export async function POST(req) {
    try {
        // 1. Auth Check
        const user = await isAuthenticated(req);

        // 2. Parse payload
        const body = await req.json();
        const { propertyId } = body;

        if (!propertyId) {
            return NextResponse.json(
                { message: "Property ID is required" },
                { status: 400 }
            );
        }

        // 3. Connect DB
        await connectDB();

        // 4. Validate Property Exists
        const propertyParams = await Property.findById(propertyId);
        if (!propertyParams) {
            return NextResponse.json(
                { message: "Property not found" },
                { status: 404 }
            );
        }

        // 5. Add to Wishlist (using $addToSet to prevent duplicates)
        await User.findByIdAndUpdate(user.id, {
            $addToSet: { wishlist: propertyId },
        });

        return NextResponse.json(
            { message: "Property added to wishlist" },
            { status: 200 }
        );
    } catch (error) {
        console.error("POST /api/wishlist error:", error);
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

export async function GET(req) {
    try {
        // 1. Auth Check
        const user = await isAuthenticated(req);

        // 2. Connect DB
        await connectDB();

        // 3. Fetch User with populated wishlist
        const userData = await User.findById(user.id).populate({
            path: "wishlist",
            model: Property, // Explicitly model if needed, though usually inferred from schema
            select: "title price location image verified distance", // Select common fields as needed
        });

        if (!userData) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        return NextResponse.json(userData.wishlist, { status: 200 });
    } catch (error) {
        console.error("GET /api/wishlist error:", error);
        if (error.message.includes("Unauthorized")) {
            return NextResponse.json({ message: error.message }, { status: 401 });
        }
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
