import { NextResponse } from "next/server";
import { connectDB } from "@/app/backend/db/connect";
import Message from "@/app/backend/models/Message.model";
import Conversation from "@/app/backend/models/Conversation.model";
import { getUserFromRequest } from "@/app/lib/auth";

// GET messages for a conversation
export async function GET(req, { params }) {
    try {
        const user = await getUserFromRequest(req);
        if (!user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = params;
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "50");

        await connectDB();

        // Verify user is participant
        const conversation = await Conversation.findById(id);
        if (!conversation || !conversation.participants.includes(user.id)) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        const messages = await Message.find({
            conversation: id,
            deletedFor: { $ne: user.id },
        })
            .populate("sender", "name email landlordProfile")
            .sort({ createdAt: -1 })
            .populate("replyTo", "content messageType sender fileUrl")
            .populate({
                path: "replyTo",
                populate: { path: "sender", select: "name" }
            })
            .skip((page - 1) * limit)
            .limit(limit);

        // Mark messages as read
        await Message.updateMany(
            {
                conversation: id,
                sender: { $ne: user.id },
                readBy: { $ne: user.id },
            },
            { $addToSet: { readBy: user.id } }
        );

        // Reset unread count
        await Conversation.findByIdAndUpdate(id, {
            [`unreadCount.${user.id}`]: 0,
        });

        return NextResponse.json(
            { messages: messages.reverse() },
            { status: 200 }
        );
    } catch (error) {
        console.error("GET /api/conversations/[id]/messages error:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}

// POST send message
export async function POST(req, { params }) {
    try {
        const user = await getUserFromRequest(req);
        if (!user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = params;
        const { messageType, content, fileUrl, filePublicId, duration, replyTo } =
            await req.json();

        await connectDB();

        // Verify user is participant
        const conversation = await Conversation.findById(id);
        if (!conversation || !conversation.participants.includes(user.id)) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        // Create message
        const message = await Message.create({
            conversation: id,
            sender: user.id,
            messageType,
            content,
            fileUrl,
            filePublicId,
            duration,
            replyTo,
            readBy: [user.id],
        });

        // Update conversation
        const otherParticipant = conversation.participants.find(
            (p) => p.toString() !== user.id
        );

        await Conversation.findByIdAndUpdate(id, {
            lastMessage: message._id,
            lastMessageAt: new Date(),
            [`unreadCount.${otherParticipant}`]:
                (conversation.unreadCount.get(otherParticipant.toString()) || 0) + 1,
        });

        const populatedMessage = await message.populate(
            "sender",
            "name email landlordProfile"
        );

        return NextResponse.json({ message: populatedMessage }, { status: 201 });
    } catch (error) {
        console.error("POST /api/conversations/[id]/messages error:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
