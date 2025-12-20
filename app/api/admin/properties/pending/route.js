import { connectDB } from "@/app/backend/db/connect";
import Property from "@/app/backend/models/Property.model";
import { isAdmin } from "@/app/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req) {
    try {
        await connectDB();

        // specific check for admin
        try {
            await isAdmin(req);
        } catch (error) {
            return NextResponse.json({ message: error.message }, { status: 403 });
        }

        const pendingProperties = await Property.find({ verified: false })
            .populate("owner", "name email")
            .sort({ createdAt: -1 });

        return NextResponse.json(pendingProperties, { status: 200 });
    } catch (error) {
        console.error("Error fetching pending properties:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
