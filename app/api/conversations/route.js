import { NextResponse } from "next/server";
import { connectDB } from "@/app/backend/db/connect";
import Conversation from "@/app/backend/models/Conversation.model";
import { getUserFromRequest } from "@/app/lib/auth";

// GET all conversations for current user
export async function GET(req) {
    try {
        const user = await getUserFromRequest(req);
        if (!user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const conversations = await Conversation.find({
            participants: user.id,
        })
            .populate("participants", "name email role landlordProfile")
            .populate("property", "title images address")
            .populate("lastMessage")
            .sort({ lastMessageAt: -1 });

        return NextResponse.json({ conversations }, { status: 200 });
    } catch (error) {
        console.error("GET /api/conversations error:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}

// POST create new conversation
export async function POST(req) {
    try {
        const user = await getUserFromRequest(req);
        console.log("User from request:", user);

        if (!user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        console.log("Request body:", body);

        const { propertyId, landlordId } = body;

        if (!propertyId || !landlordId) {
            return NextResponse.json(
                { message: "Property ID and Landlord ID are required" },
                { status: 400 }
            );
        }

        await connectDB();

        // Check if conversation already exists
        let conversation = await Conversation.findOne({
            participants: { $all: [user.id, landlordId] },
            property: propertyId,
        })
            .populate("participants", "name email role landlordProfile")
            .populate("property", "title images address");

        console.log("Existing conversation:", conversation);

        if (!conversation) {
            // Create new conversation
            console.log("Creating new conversation with:", {
                participants: [user.id, landlordId],
                property: propertyId,
            });

            conversation = await Conversation.create({
                participants: [user.id, landlordId],
                property: propertyId,
                unreadCount: {
                    [user.id]: 0,
                    [landlordId]: 0,
                },
            });

            conversation = await conversation.populate([
                { path: "participants", select: "name email role landlordProfile" },
                { path: "property", select: "title images address" },
            ]);

            console.log("Created conversation:", conversation);
        }

        return NextResponse.json({ conversation }, { status: 200 });
    } catch (error) {
        console.error("POST /api/conversations error:", error);
        console.error("Error stack:", error.stack);
        return NextResponse.json(
            { message: "Internal Server Error", error: error.message },
            { status: 500 }
        );
    }
}
