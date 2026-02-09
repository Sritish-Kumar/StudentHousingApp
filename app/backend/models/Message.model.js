import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        conversation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
            required: true,
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        replyTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
        },
        messageType: {
            type: String,
            enum: ["text", "image", "voice", "file", "gif"],
            default: "text",
        },
        content: {
            type: String,
            required: function () {
                return this.messageType === "text";
            },
        },
        fileUrl: {
            type: String,
            required: function () {
                return ["image", "voice", "file", "gif"].includes(this.messageType);
            },
        },
        filePublicId: {
            type: String, // For Cloudinary deletion
        },
        fileName: {
            type: String, // For file attachments
        },
        fileSize: {
            type: Number, // For file attachments in bytes
        },
        duration: {
            type: Number, // Voice message duration in seconds
        },
        isEdited: {
            type: Boolean,
            default: false,
        },
        reactions: [
            {
                emoji: String,
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                },
            },
        ],
        readBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        deletedFor: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
    },
    { timestamps: true }
);

// Indexes
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });

const Message =
    mongoose.models.Message || mongoose.model("Message", messageSchema);

export default Message;
