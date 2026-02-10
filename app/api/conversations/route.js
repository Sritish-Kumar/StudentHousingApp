import { NextResponse } from "next/server";
import { connectDB } from "@/app/backend/db/connect";
import Conversation from "@/app/backend/models/Conversation.model";
import Message from "@/app/backend/models/Message.model";
import User from "@/app/backend/models/User.model";
import Property from "@/app/backend/models/Property.model";
import { getUserFromRequest } from "@/app/lib/auth";
import mongoose from "mongoose";

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
    let user, landlordId, propertyId; // Declare at function scope for catch block access
    
    try {
        user = await getUserFromRequest(req);

        if (!user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        ({ propertyId, landlordId } = body);

        if (!propertyId || !landlordId) {
            return NextResponse.json(
                { message: "Property ID and Landlord ID are required" },
                { status: 400 }
            );
        }

        // Validate that landlordId is not the same as current user
        if (landlordId === user.id) {
            return NextResponse.json(
                { message: "Cannot create conversation with yourself" },
                { status: 400 }
            );
        }

        // Validate ObjectId formats
        if (!mongoose.Types.ObjectId.isValid(propertyId)) {
            return NextResponse.json(
                { message: "Invalid property ID format" },
                { status: 400 }
            );
        }

        if (!mongoose.Types.ObjectId.isValid(landlordId)) {
            return NextResponse.json(
                { message: "Invalid landlord ID format" },
                { status: 400 }
            );
        }

        await connectDB();

        // Check if conversation already exists between these EXACT two users for this property
        let conversation = await Conversation.findOne({
            participants: { $all: [user.id, landlordId], $size: 2 },
            property: propertyId,
            isGroup: { $ne: true }
        })
            .populate("participants", "name email role landlordProfile")
            .populate("property", "title images address");

        if (conversation) {
            return NextResponse.json({ conversation }, { status: 200 });
        }

        // Create new conversation
        conversation = await Conversation.create({
            participants: [user.id, landlordId],
            property: propertyId,
            isGroup: false,
            unreadCount: {
                [user.id]: 0,
                [landlordId]: 0,
            },
        });

        conversation = await conversation.populate([
            { path: "participants", select: "name email role landlordProfile" },
            { path: "property", select: "title images address" },
        ]);

        return NextResponse.json({ conversation }, { status: 200 });
    } catch (error) {
        console.error("POST /api/conversations error:", error);

        // Handle duplicate key error (shouldn't happen anymore, but keep as safety)
        if (error.code === 11000) {
            try {
                const existingConversation = await Conversation.findOne({
                    participants: { $all: [user.id, landlordId], $size: 2 },
                    property: propertyId,
                    isGroup: { $ne: true }
                })
                    .populate("participants", "name email role landlordProfile")
                    .populate("property", "title images address");

                if (existingConversation) {
                    return NextResponse.json(
                        { conversation: existingConversation },
                        { status: 200 }
                    );
                }
            } catch (fetchError) {
                console.error("Error fetching existing conversation:", fetchError);
            }
        }

        return NextResponse.json(
            { message: "Internal Server Error", error: error.message },
            { status: 500 }
        );
    }
}
