import mongoose from "mongoose";
import ForumThread from "../models/forumThread.model.js";
import ForumComment from "../models/forumComment.model.js";
import ForumVote from "../models/forumVote.model.js";
import ForumModerationLog from "../models/forumModerationLog.model.js";
import ForumReport from "../models/forumReport.model.js";
import User from "../models/user.model.js";
import { ApiError } from "../utils/index.js";

// ============================================
// THREAD OPERATIONS
// ============================================

const createThread = async ({ userId, title, content, tags = [] }) => {
    if (!title || !content) {
        throw new ApiError(400, "Title and content are required");
    }

    const thread = await ForumThread.create({
        title: title.trim(),
        content: content.trim(),
        authorId: new mongoose.Types.ObjectId(userId),
        tags: Array.isArray(tags) ? tags.slice(0, 10).map(t => t.trim()).filter(Boolean) : [],
    });

    return await ForumThread.findById(thread._id)
        .populate("authorId", "name email user_type")
        .lean();
};

const listThreads = async ({ page = 1, limit = 20, tags, status, sortBy = "newest" } = {}) => {
    const skip = (Math.max(1, page) - 1) * limit;
    const query = { isDeleted: false };

    if (tags && Array.isArray(tags) && tags.length > 0) {
        query.tags = { $in: tags };
    }

    if (status) {
        query.status = status;
    }

    let sort = {};
    if (sortBy === "newest") {
        sort = { isPinned: -1, createdAt: -1 };
    } else if (sortBy === "popular") {
        sort = { isPinned: -1, "votes.upvotes": -1, createdAt: -1 };
    } else if (sortBy === "trending") {
        // Trending: combination of votes and recent activity
        sort = { isPinned: -1, createdAt: -1 };
    }

    const threads = await ForumThread.find(query)
        .populate("authorId", "name email user_type karma")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();

    const total = await ForumThread.countDocuments(query);

    // Get comment counts for each thread
    const threadIds = threads.map(t => t._id);
    const commentCounts = await ForumComment.aggregate([
        { $match: { threadId: { $in: threadIds }, isDeleted: false } },
        { $group: { _id: "$threadId", count: { $sum: 1 } } },
    ]);

    const commentCountMap = new Map(commentCounts.map(c => [String(c._id), c.count]));

    const threadsWithCounts = threads.map(thread => ({
        ...thread,
        commentCount: commentCountMap.get(String(thread._id)) || 0,
        netVotes: (thread.votes?.upvotes || 0) - (thread.votes?.downvotes || 0),
    }));

    return {
        threads: threadsWithCounts,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
    };
};

const getThread = async (threadId) => {
    const thread = await ForumThread.findOne({ _id: threadId, isDeleted: false })
        .populate("authorId", "name email user_type karma")
        .lean();

    if (!thread) {
        throw new ApiError(404, "Thread not found");
    }

    const comments = await ForumComment.find({ threadId, isDeleted: false })
        .populate("authorId", "name email user_type karma")
        .sort({ createdAt: 1 })
        .lean();

    const commentIds = comments.map(c => c._id);
    const commentVotes = await ForumVote.find({
        targetId: { $in: commentIds },
        targetType: "comment",
    }).lean();

    const voteMap = new Map();
    commentVotes.forEach(vote => {
        const key = String(vote.targetId);
        if (!voteMap.has(key)) {
            voteMap.set(key, { upvotes: 0, downvotes: 0 });
        }
        const votes = voteMap.get(key);
        if (vote.type === "upvote") votes.upvotes++;
        else votes.downvotes++;
    });

    const commentsWithVotes = comments.map(comment => {
        const votes = voteMap.get(String(comment._id)) || { upvotes: 0, downvotes: 0 };
        return {
            ...comment,
            votes,
            netVotes: votes.upvotes - votes.downvotes,
        };
    });

    return {
        ...thread,
        netVotes: (thread.votes?.upvotes || 0) - (thread.votes?.downvotes || 0),
        comments: commentsWithVotes,
        commentCount: comments.length,
    };
};

const updateThread = async (threadId, userId, updateData, isAdmin = false) => {
    const thread = await ForumThread.findById(threadId);
    if (!thread || thread.isDeleted) {
        throw new ApiError(404, "Thread not found");
    }

    if (!isAdmin && thread.authorId.toString() !== userId.toString()) {
        throw new ApiError(403, "You can only edit your own threads");
    }

    const allowed = ["title", "content", "tags"];
    for (const key of allowed) {
        if (updateData[key] !== undefined) {
            if (key === "tags") {
                thread[key] = Array.isArray(updateData[key])
                    ? updateData[key].slice(0, 10).map(t => t.trim()).filter(Boolean)
                    : thread[key];
            } else {
                thread[key] = updateData[key].trim();
            }
        }
    }

    await thread.save();

    return await ForumThread.findById(thread._id)
        .populate("authorId", "name email user_type karma")
        .lean();
};

const deleteThread = async (threadId, userId, isAdmin = false) => {
    const thread = await ForumThread.findById(threadId);
    if (!thread || thread.isDeleted) {
        throw new ApiError(404, "Thread not found");
    }

    if (!isAdmin && thread.authorId.toString() !== userId.toString()) {
        throw new ApiError(403, "You can only delete your own threads");
    }

    thread.isDeleted = true;
    thread.deletedAt = new Date();
    await thread.save();

    // Log admin action if admin
    if (isAdmin) {
        await ForumModerationLog.create({
            adminId: new mongoose.Types.ObjectId(userId),
            actionType: "delete",
            targetId: thread._id,
            targetType: "thread",
            reason: "Admin deletion",
        });
    }

    return true;
};

const lockThread = async (threadId, userId) => {
    const thread = await ForumThread.findById(threadId);
    if (!thread || thread.isDeleted) {
        throw new ApiError(404, "Thread not found");
    }

    thread.status = thread.status === "locked" ? "open" : "locked";
    await thread.save();

    await ForumModerationLog.create({
        adminId: new mongoose.Types.ObjectId(userId),
        actionType: thread.status === "locked" ? "lock" : "unlock",
        targetId: thread._id,
        targetType: "thread",
    });

    return await ForumThread.findById(thread._id)
        .populate("authorId", "name email user_type karma")
        .lean();
};

const pinThread = async (threadId, userId) => {
    const thread = await ForumThread.findById(threadId);
    if (!thread || thread.isDeleted) {
        throw new ApiError(404, "Thread not found");
    }

    thread.isPinned = !thread.isPinned;
    await thread.save();

    await ForumModerationLog.create({
        adminId: new mongoose.Types.ObjectId(userId),
        actionType: thread.isPinned ? "pin" : "unpin",
        targetId: thread._id,
        targetType: "thread",
    });

    return await ForumThread.findById(thread._id)
        .populate("authorId", "name email user_type karma")
        .lean();
};

// ============================================
// COMMENT OPERATIONS
// ============================================

const createComment = async ({ userId, threadId, content }) => {
    if (!content || !threadId) {
        throw new ApiError(400, "Content and thread ID are required");
    }

    const thread = await ForumThread.findById(threadId);
    if (!thread || thread.isDeleted) {
        throw new ApiError(404, "Thread not found");
    }

    if (thread.status === "locked") {
        throw new ApiError(403, "Cannot comment on locked thread");
    }

    const comment = await ForumComment.create({
        threadId: new mongoose.Types.ObjectId(threadId),
        content: content.trim(),
        authorId: new mongoose.Types.ObjectId(userId),
    });

    return await ForumComment.findById(comment._id)
        .populate("authorId", "name email user_type karma")
        .lean();
};

const updateComment = async (commentId, userId, updateData, isAdmin = false) => {
    const comment = await ForumComment.findById(commentId);
    if (!comment || comment.isDeleted) {
        throw new ApiError(404, "Comment not found");
    }

    if (!isAdmin && comment.authorId.toString() !== userId.toString()) {
        throw new ApiError(403, "You can only edit your own comments");
    }

    if (updateData.content !== undefined) {
        comment.content = updateData.content.trim();
    }

    await comment.save();

    return await ForumComment.findById(comment._id)
        .populate("authorId", "name email user_type karma")
        .lean();
};

const deleteComment = async (commentId, userId, isAdmin = false) => {
    const comment = await ForumComment.findById(commentId);
    if (!comment || comment.isDeleted) {
        throw new ApiError(404, "Comment not found");
    }

    if (!isAdmin && comment.authorId.toString() !== userId.toString()) {
        throw new ApiError(403, "You can only delete your own comments");
    }

    comment.isDeleted = true;
    comment.deletedAt = new Date();
    await comment.save();

    // Log admin action if admin
    if (isAdmin) {
        await ForumModerationLog.create({
            adminId: new mongoose.Types.ObjectId(userId),
            actionType: "delete",
            targetId: comment._id,
            targetType: "comment",
            reason: "Admin deletion",
        });
    }

    return true;
};

// ============================================
// VOTING OPERATIONS
// ============================================

const vote = async ({ userId, targetId, targetType, voteType }) => {
    if (!["thread", "comment"].includes(targetType)) {
        throw new ApiError(400, "Invalid target type");
    }

    if (!["upvote", "downvote"].includes(voteType)) {
        throw new ApiError(400, "Invalid vote type");
    }

    // Check if target exists
    let target;
    if (targetType === "thread") {
        target = await ForumThread.findById(targetId);
    } else {
        target = await ForumComment.findById(targetId);
    }

    if (!target || target.isDeleted) {
        throw new ApiError(404, "Target not found");
    }

    // Check for existing vote
    const existingVote = await ForumVote.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        targetId: new mongoose.Types.ObjectId(targetId),
        targetType,
    });

    let authorId;
    if (targetType === "thread") {
        authorId = target.authorId;
    } else {
        authorId = target.authorId;
    }

    // If user is voting on their own content, don't allow it
    if (authorId.toString() === userId.toString()) {
        throw new ApiError(400, "You cannot vote on your own content");
    }

    if (existingVote) {
        // If same vote type, remove the vote
        if (existingVote.type === voteType) {
            await ForumVote.findByIdAndDelete(existingVote._id);
            await updateVoteCounts(targetType, targetId);
            // Reverse the karma: if it was upvote, remove +1, if downvote, remove -1 (add +1)
            await updateUserKarma(authorId, existingVote.type === "upvote" ? -1 : 1);
            return { action: "removed", vote: null };
        } else {
            // Change vote type: reverse old vote karma, then apply new vote karma
            const oldKarmaChange = existingVote.type === "upvote" ? -1 : 1; // Remove old vote
            const newKarmaChange = voteType === "upvote" ? 1 : -1; // Add new vote
            const totalKarmaChange = oldKarmaChange + newKarmaChange;

            existingVote.type = voteType;
            await existingVote.save();
            await updateVoteCounts(targetType, targetId);
            await updateUserKarma(authorId, totalKarmaChange);
            return { action: "changed", vote: existingVote };
        }
    } else {
        // Create new vote
        const vote = await ForumVote.create({
            userId: new mongoose.Types.ObjectId(userId),
            targetId: new mongoose.Types.ObjectId(targetId),
            targetType,
            type: voteType,
        });

        await updateVoteCounts(targetType, targetId);
        await updateUserKarma(authorId, voteType === "upvote" ? 1 : -1);

        return { action: "added", vote };
    }
};

const updateVoteCounts = async (targetType, targetId) => {
    const votes = await ForumVote.find({ targetId, targetType }).lean();

    const counts = { upvotes: 0, downvotes: 0 };
    votes.forEach(vote => {
        if (vote.type === "upvote") counts.upvotes++;
        else counts.downvotes++;
    });

    if (targetType === "thread") {
        await ForumThread.findByIdAndUpdate(targetId, { votes: counts });
    } else {
        await ForumComment.findByIdAndUpdate(targetId, { votes: counts });
    }
};

const updateUserKarma = async (userId, karmaChange) => {
    await User.findByIdAndUpdate(userId, {
        $inc: { karma: karmaChange },
    });
};

// ============================================
// REPORT OPERATIONS
// ============================================

const reportContent = async ({ userId, targetId, targetType, reason }) => {
    if (!["thread", "comment"].includes(targetType)) {
        throw new ApiError(400, "Invalid target type");
    }

    // Check if target exists
    let target;
    if (targetType === "thread") {
        target = await ForumThread.findById(targetId);
    } else {
        target = await ForumComment.findById(targetId);
    }

    if (!target || target.isDeleted) {
        throw new ApiError(404, "Target not found");
    }

    // Check for existing report
    const existingReport = await ForumReport.findOne({
        reporterId: new mongoose.Types.ObjectId(userId),
        targetId: new mongoose.Types.ObjectId(targetId),
        targetType,
    });

    if (existingReport) {
        throw new ApiError(400, "You have already reported this content");
    }

    const report = await ForumReport.create({
        reporterId: new mongoose.Types.ObjectId(userId),
        targetId: new mongoose.Types.ObjectId(targetId),
        targetType,
        reason: reason.trim(),
    });

    // Increment report count on target
    if (targetType === "thread") {
        await ForumThread.findByIdAndUpdate(targetId, { $inc: { reportCount: 1 } });
    } else {
        await ForumComment.findByIdAndUpdate(targetId, { $inc: { reportCount: 1 } });
    }

    return report;
};

const getReports = async ({ page = 1, limit = 20, status } = {}) => {
    const skip = (Math.max(1, page) - 1) * limit;
    const query = {};

    if (status) {
        query.status = status;
    }

    const reports = await ForumReport.find(query)
        .populate("reporterId", "name email")
        .populate("reviewedBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    const total = await ForumReport.countDocuments(query);

    return {
        reports,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
    };
};

// ============================================
// ADMIN OPERATIONS
// ============================================

const adjustUserKarma = async (targetUserId, karmaChange, adminId, reason) => {
    const user = await User.findById(targetUserId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const oldKarma = user.karma || 0;
    const newKarma = Math.max(0, oldKarma + karmaChange);

    await User.findByIdAndUpdate(targetUserId, { karma: newKarma });

    await ForumModerationLog.create({
        adminId: new mongoose.Types.ObjectId(adminId),
        actionType: "adjust_karma",
        targetId: targetUserId,
        targetType: "user",
        reason: reason || "Admin karma adjustment",
        previousValue: oldKarma,
        newValue: newKarma,
    });

    return { oldKarma, newKarma };
};

const ForumService = {
    createThread,
    listThreads,
    getThread,
    updateThread,
    deleteThread,
    lockThread,
    pinThread,
    createComment,
    updateComment,
    deleteComment,
    vote,
    reportContent,
    getReports,
    adjustUserKarma,
};

export default ForumService;

