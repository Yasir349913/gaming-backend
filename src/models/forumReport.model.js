import mongoose from "mongoose";
const { Schema } = mongoose;

const forumReportSchema = new Schema(
    {
        reporterId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Reporter ID is required"],
            index: true,
        },
        targetId: {
            type: Schema.Types.ObjectId,
            required: [true, "Target ID is required"],
            index: true,
        },
        targetType: {
            type: String,
            enum: ["thread", "comment"],
            required: [true, "Target type is required"],
        },
        reason: {
            type: String,
            required: [true, "Report reason is required"],
            trim: true,
            maxlength: [500, "Reason must be less than 500 characters"],
        },
        status: {
            type: String,
            enum: ["pending", "reviewed", "resolved", "dismissed"],
            default: "pending",
        },
        reviewedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        reviewedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Compound unique index to prevent duplicate reports from same user
forumReportSchema.index({ reporterId: 1, targetId: 1, targetType: 1 }, { unique: true });
forumReportSchema.index({ targetId: 1, targetType: 1 });
forumReportSchema.index({ status: 1, createdAt: -1 });
forumReportSchema.index({ createdAt: -1 });

const ForumReport = mongoose.model("ForumReport", forumReportSchema);
export default ForumReport;

