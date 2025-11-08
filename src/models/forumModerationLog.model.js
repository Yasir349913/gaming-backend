import mongoose from "mongoose";
const { Schema } = mongoose;

const forumModerationLogSchema = new Schema(
    {
        adminId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Admin ID is required"],
            index: true,
        },
        actionType: {
            type: String,
            enum: ["delete", "edit", "lock", "unlock", "pin", "unpin", "adjust_karma"],
            required: [true, "Action type is required"],
        },
        targetId: {
            type: Schema.Types.ObjectId,
            required: [true, "Target ID is required"],
            index: true,
        },
        targetType: {
            type: String,
            enum: ["thread", "comment", "user"],
            required: [true, "Target type is required"],
        },
        reason: {
            type: String,
            trim: true,
            maxlength: [500, "Reason must be less than 500 characters"],
        },
        previousValue: {
            type: Schema.Types.Mixed,
        },
        newValue: {
            type: Schema.Types.Mixed,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
forumModerationLogSchema.index({ adminId: 1, createdAt: -1 });
forumModerationLogSchema.index({ targetId: 1, targetType: 1 });
forumModerationLogSchema.index({ actionType: 1 });
forumModerationLogSchema.index({ createdAt: -1 });

const ForumModerationLog = mongoose.model("ForumModerationLog", forumModerationLogSchema);
export default ForumModerationLog;

