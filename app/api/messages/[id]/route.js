import { NextResponse } from "next/server";
import { connectDB } from "@/app/backend/db/connect";
import Message from "@/app/backend/models/Message.model";
import Conversation from "@/app/backend/models/Conversation.model";
import { getUserFromRequest } from "@/app/lib/auth";

// PATCH: Edit a message
export async function PATCH(req, { params }) {
    try {
        const user = await getUserFromRequest(req);
        if (!user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = params;
        const { content } = await req.json();

        await connectDB();

        const message = await Message.findById(id);
        if (!message) {
            return NextResponse.json({ message: "Message not found" }, { status: 404 });
        }

        // Only sender can edit
        if (message.sender.toString() !== user.id) {
            return NextResponse.json(
                { message: "You can only edit your own messages" },
                { status: 403 }
            );
        }

        // Only text messages can be edited
        if (message.messageType !== "text") {
            return NextResponse.json(
                { message: "Only text messages can be edited" },
                { status: 400 }
            );
        }

        // Check if message is too old (e.g., 15 minutes) - Optional, but good practice
        const timeDiff = (Date.now() - new Date(message.createdAt).getTime()) / 1000 / 60;
        if (timeDiff > 15) {
            return NextResponse.json(
                { message: "Messages can only be edited within 15 minutes" },
                { status: 400 }
            );
        }

        message.content = content;
        message.isEdited = true;
        await message.save();

        const populatedMessage = await message.populate("sender", "name email landlordProfile");

        return NextResponse.json({ message: populatedMessage }, { status: 200 });
    } catch (error) {
        console.error("PATCH /api/messages/[id] error:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}

// DELETE: Delete a message (Delete for Everyone)
// Note: This effectively removes the content but keeps the record
export async function DELETE(req, { params }) {
    try {
        const user = await getUserFromRequest(req);
        if (!user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = params;
        const { deleteForEveryone } = await req.json().catch(() => ({})); // Optional body

        await connectDB();

        const message = await Message.findById(id);
        if (!message) {
            return NextResponse.json({ message: "Message not found" }, { status: 404 });
        }

        if (deleteForEveryone) {
            // Logic for "Delete for Everyone" - Hard delete
            if (message.sender.toString() !== user.id) {
                return NextResponse.json(
                    { message: "You can only delete your own messages for everyone" },
                    { status: 403 }
                );
            }

            // Hard delete - remove message from database
            await Message.findByIdAndDelete(id);

            return NextResponse.json({ message: "Message deleted for everyone" }, { status: 200 });

        } else {
            // Logic for "Delete for Me"
            // Add user to deletedFor array
            if (!message.deletedFor.includes(user.id)) {
                message.deletedFor.push(user.id);
                await message.save();
            }
            return NextResponse.json({ message: "Message deleted for you" }, { status: 200 });
        }

    } catch (error) {
        console.error("DELETE /api/messages/[id] error:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
