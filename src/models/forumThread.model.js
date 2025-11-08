import mongoose from "mongoose";
const { Schema } = mongoose;

const forumThreadSchema = new Schema(
    {
        title: {
            type: String,
            required: [true, "Thread title is required"],
            trim: true,
            minlength: [3, "Title must be at least 3 characters"],
            maxlength: [200, "Title must be less than 200 characters"],
        },
        content: {
            type: String,
            required: [true, "Thread content is required"],
            trim: true,
            minlength: [10, "Content must be at least 10 characters"],
            maxlength: [10000, "Content must be less than 10000 characters"],
        },
        authorId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Author ID is required"],
            index: true,
        },
        tags: {
            type: [String],
            default: [],
            validate: {
                validator: function (v) {
                    return Array.isArray(v) && v.length <= 10;
                },
                message: "A thread may contain at most 10 tags",
            },
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
        status: {
            type: String,
            enum: ["open", "locked"],
            default: "open",
        },
        isPinned: {
            type: Boolean,
            default: false,
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
forumThreadSchema.index({ authorId: 1 });
forumThreadSchema.index({ createdAt: -1 });
forumThreadSchema.index({ "votes.upvotes": -1 });
forumThreadSchema.index({ isPinned: -1, createdAt: -1 });
forumThreadSchema.index({ tags: 1 });
forumThreadSchema.index({ status: 1 });
forumThreadSchema.index({ isDeleted: 1 });

// Virtual for comment count
forumThreadSchema.virtual("commentCount", {
    ref: "ForumComment",
    localField: "_id",
    foreignField: "threadId",
    count: true,
});

// Virtual for net votes
forumThreadSchema.virtual("netVotes").get(function () {
    return (this.votes?.upvotes || 0) - (this.votes?.downvotes || 0);
});

const ForumThread = mongoose.model("ForumThread", forumThreadSchema);
export default ForumThread;

