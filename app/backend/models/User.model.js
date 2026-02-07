import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    role: {
      type: String,
      enum: ["STUDENT", "LANDLORD", "ADMIN"],
      default: "STUDENT",
    },
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Property",
        default: [],
      },
    ],
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      select: false,
    },
    otpExpiry: {
      type: Date,
      select: false,
    },
    suspended: {
      type: Boolean,
      default: false,
    },
    suspendedAt: {
      type: Date,
    },
    suspensionReason: {
      type: String,
    },
    // Landlord-specific profile fields
    landlordProfile: {
      companyName: {
        type: String,
        trim: true,
        maxlength: [100, "Company name cannot exceed 100 characters"],
      },
      phoneNumber: {
        type: String,
        trim: true,
        match: [/^\d{10}$/, "Phone number must be exactly 10 digits"],
      },
      bio: {
        type: String,
        trim: true,
        maxlength: [500, "Bio cannot exceed 500 characters"],
      },
      yearsOfExperience: {
        type: Number,
        min: [0, "Years of experience cannot be negative"],
        max: [100, "Years of experience seems unrealistic"],
      },
      businessAddress: {
        type: String,
        trim: true,
        maxlength: [200, "Business address cannot exceed 200 characters"],
      },
      profileImage: {
        type: String,
        trim: true,
      },
      isVerified: {
        type: Boolean,
        default: false,
      },
      verifiedAt: {
        type: Date,
      },
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
