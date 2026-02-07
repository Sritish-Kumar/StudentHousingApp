import { NextResponse } from "next/server";
import { connectDB } from "@/app/backend/db/connect";
import Message from "@/app/backend/models/Message.model";
import { getUserFromRequest } from "@/app/lib/auth";

// POST: Toggle reaction
export async function POST(req, { params }) {
    try {
        const user = await getUserFromRequest(req);
        if (!user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = params;
        const { emoji } = await req.json();

        if (!emoji) {
            return NextResponse.json({ message: "Emoji is required" }, { status: 400 });
        }

        await connectDB();

        const message = await Message.findById(id);
        if (!message) {
            return NextResponse.json({ message: "Message not found" }, { status: 404 });
        }

        // Check if user already reacted with this emoji
        const existingReactionIndex = message.reactions.findIndex(
            (r) => r.user.toString() === user.id && r.emoji === emoji
        );

        if (existingReactionIndex > -1) {
            // Remove reaction (toggle off)
            message.reactions.splice(existingReactionIndex, 1);
        } else {
            // Add reaction
            // Optional: limit to 1 reaction per user per message? Or allow multiple emojis.
            // Let's allow multiple emojis but only one of each kind per user.
            message.reactions.push({
                emoji,
                user: user.id
            });
        }

        await message.save();

        const populatedMessage = await message.populate("sender", "name email landlordProfile");

        return NextResponse.json({ message: populatedMessage }, { status: 200 });
    } catch (error) {
        console.error("POST /api/messages/[id]/react error:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
