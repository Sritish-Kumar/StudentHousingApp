import mongoose from "mongoose";

const ReportSchema = new mongoose.Schema(
  {
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Reporter is required"],
    },
    reportType: {
      type: String,
      enum: {
        values: ["PROPERTY", "USER"],
        message: "Report type must be either PROPERTY or USER",
      },
      required: [true, "Report type is required"],
    },
    reportedProperty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: function () {
        return this.reportType === "PROPERTY";
      },
    },
    reportedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: function () {
        return this.reportType === "USER";
      },
    },
    category: {
      type: String,
      enum: {
        values: [
          "SPAM",
          "INAPPROPRIATE_CONTENT",
          "SAFETY_CONCERN",
          "FRAUD",
          "HARASSMENT",
          "OTHER",
        ],
        message: "Invalid report category",
      },
      required: [true, "Report category is required"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      maxlength: [1000, "Description cannot exceed 1000 characters"],
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ["PENDING", "REVIEWING", "RESOLVED", "DISMISSED"],
        message: "Invalid status",
      },
      default: "PENDING",
    },
    adminNotes: {
      type: String,
      maxlength: [500, "Admin notes cannot exceed 500 characters"],
      trim: true,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    resolvedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Indexes for better query performance
ReportSchema.index({ reportedBy: 1, createdAt: -1 });
ReportSchema.index({ status: 1, createdAt: -1 });
ReportSchema.index({ reportType: 1, status: 1 });

export default mongoose.models.Report || mongoose.model("Report", ReportSchema);
