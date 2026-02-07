import { NextResponse } from "next/server";
import { connectDB } from "@/app/backend/db/connect";
import Message from "@/app/backend/models/Message.model";
import Conversation from "@/app/backend/models/Conversation.model";
import { getUserFromRequest } from "@/app/lib/auth";

// DELETE conversation (soft delete for user)
export async function DELETE(req, { params }) {
    try {
        const user = await getUserFromRequest(req);
        if (!user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = params;

        await connectDB();

        // Verify user is participant
        const conversation = await Conversation.findById(id);
        if (!conversation || !conversation.participants.includes(user.id)) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        // Soft delete all messages for this user
        await Message.updateMany(
            { conversation: id },
            { $addToSet: { deletedFor: user.id } }
        );

        return NextResponse.json(
            { message: "Chat deleted successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("DELETE /api/conversations/[id]/delete error:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
