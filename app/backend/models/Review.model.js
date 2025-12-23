import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        property: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Property",
            required: true,
        },
        rating: {
            type: Number,
            required: [true, "Rating is required"],
            min: [1, "Rating must be at least 1"],
            max: [5, "Rating cannot be more than 5"],
        },
        comment: {
            type: String,
            required: [true, "Comment is required"],
            trim: true,
            maxlength: [500, "Comment cannot be more than 500 characters"],
        },
    },
    { timestamps: true }
);

// Prevent duplicate reviews from the same user for the same property
ReviewSchema.index({ user: 1, property: 1 }, { unique: true });

export default mongoose.models.Review || mongoose.model("Review", ReviewSchema);
