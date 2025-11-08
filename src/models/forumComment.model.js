import mongoose from "mongoose";
const { Schema } = mongoose;

const forumCommentSchema = new Schema(
    {
        threadId: {
            type: Schema.Types.ObjectId,
            ref: "ForumThread",
            required: [true, "Thread ID is required"],
            index: true,
        },
        content: {
            type: String,
            required: [true, "Comment content is required"],
            trim: true,
            minlength: [1, "Content must be at least 1 character"],
            maxlength: [5000, "Content must be less than 5000 characters"],
        },
        authorId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Author ID is required"],
            index: true,
        },
        votes: {
            upvotes: {
                type: Number,
                default: 0,
                min: 0,
            },
            downvotes: {
                type: Number,
                default: 0,
                min: 0,
            },
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        deletedAt: {
            type: Date,
        },
        reportCount: {
            type: Number,
            default: 0,
            min: 0,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Indexes
forumCommentSchema.index({ threadId: 1, createdAt: 1 });
forumCommentSchema.index({ authorId: 1 });
forumCommentSchema.index({ createdAt: -1 });
forumCommentSchema.index({ isDeleted: 1 });

// Virtual for net votes
forumCommentSchema.virtual("netVotes").get(function () {
    return (this.votes?.upvotes || 0) - (this.votes?.downvotes || 0);
});

const ForumComment = mongoose.model("ForumComment", forumCommentSchema);
export default ForumComment;

