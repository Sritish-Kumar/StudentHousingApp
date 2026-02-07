import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
    {
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
        ],
        property: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Property",
            // Not required for group chats if they aren't tied to a property
            required: function () {
                return !this.isGroup;
            },
        },
        isGroup: {
            type: Boolean,
            default: false,
        },
        groupName: {
            type: String,
            trim: true,
        },
        groupImage: {
            type: String,
        },
        admins: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        lastMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
        },
        lastMessageAt: {
            type: Date,
            default: Date.now,
        },
        unreadCount: {
            type: Map,
            of: Number,
            default: {},
        },
        archivedBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
    },
    { timestamps: true }
);

// Indexes for performance
conversationSchema.index({ participants: 1 });
conversationSchema.index({ property: 1 });
conversationSchema.index({ lastMessageAt: -1 });

// Ensure unique conversation per property between two users (only for 1-on-1)
conversationSchema.index(
    { participants: 1, property: 1 },
    { unique: true, partialFilterExpression: { isGroup: false } }
);

const Conversation =
    mongoose.models.Conversation ||
    mongoose.model("Conversation", conversationSchema);

export default Conversation;
