import mongoose from "mongoose";
const { Schema } = mongoose;

const forumVoteSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User ID is required"],
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
        type: {
            type: String,
            enum: ["upvote", "downvote"],
            required: [true, "Vote type is required"],
        },
    },
    {
        timestamps: true,
    }
);

// Compound unique index to prevent duplicate votes
forumVoteSchema.index({ userId: 1, targetId: 1, targetType: 1 }, { unique: true });
forumVoteSchema.index({ targetId: 1, targetType: 1 });
forumVoteSchema.index({ createdAt: -1 });

const ForumVote = mongoose.model("ForumVote", forumVoteSchema);
export default ForumVote;

