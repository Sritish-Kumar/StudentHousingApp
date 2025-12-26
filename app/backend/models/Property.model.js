import mongoose from "mongoose";

const PropertySchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Title is required"],
            trim: true,
            maxlength: [100, "Title cannot be more than 100 characters"],
        },
        description: {
            type: String,
            required: [true, "Description is required"],
            maxlength: [1000, "Description cannot be more than 1000 characters"],
        },
        price: {
            type: Number,
            required: [true, "Price is required"],
            min: [0, "Price must be a positive number"],
        },
        gender: {
            type: String,
            enum: ["MALE", "FEMALE", "UNISEX"],
            required: [true, "Gender preference is required"],
        },
        amenities: {
            type: [String],
            default: [],
        },
        location: {
            type: {
                type: String,
                enum: ['Point'],
                required: true
            },
            coordinates: {
                type: [Number],
                required: true
            }
        },
        college: {
            type: String,
            required: [true, "College name is required"],
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        verified: {
            type: Boolean,
            default: false,
        },
        distance: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

// Add 2dsphere index for geospatial queries
PropertySchema.index({ location: '2dsphere' });

export default mongoose.models.Property || mongoose.model("Property", PropertySchema);
