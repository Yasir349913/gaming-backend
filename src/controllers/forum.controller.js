import ForumService from "../services/forum.service.js";
import { ApiResponse, ApiError } from "../utils/index.js";

// ============================================
// THREAD CONTROLLERS
// ============================================

export const createThread = async (req, res, next) => {
    try {
        const { title, content, tags } = req.body;
        const userId = req.user._id;

        const thread = await ForumService.createThread({
            userId,
            title,
            content,
            tags,
        });

        res.status(201).json(new ApiResponse(201, thread, "Thread created successfully"));
    } catch (error) {
        next(error);
    }
};

export const listThreads = async (req, res, next) => {
    try {
        const { page, limit, tags, status, sortBy } = req.query;

        const result = await ForumService.listThreads({
            page: Number(page) || 1,
            limit: Number(limit) || 20,
            tags: tags ? (Array.isArray(tags) ? tags : tags.split(",")) : undefined,
            status,
            sortBy,
        });

        res.status(200).json(new ApiResponse(200, result, "Threads retrieved successfully"));
    } catch (error) {
        next(error);
    }
};

export const getThread = async (req, res, next) => {
    try {
        const { id } = req.params;

        const thread = await ForumService.getThread(id);

        res.status(200).json(new ApiResponse(200, thread, "Thread retrieved successfully"));
    } catch (error) {
        next(error);
    }
};

export const updateThread = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const isAdmin = req.user.user_type === "admin";
        const updateData = req.body;

        const thread = await ForumService.updateThread(id, userId, updateData, isAdmin);

        res.status(200).json(new ApiResponse(200, thread, "Thread updated successfully"));
    } catch (error) {
        next(error);
    }
};

export const deleteThread = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const isAdmin = req.user.user_type === "admin";

        await ForumService.deleteThread(id, userId, isAdmin);

        res.status(200).json(new ApiResponse(200, null, "Thread deleted successfully"));
    } catch (error) {
        next(error);
    }
};

export const lockThread = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const thread = await ForumService.lockThread(id, userId);

        res.status(200).json(new ApiResponse(200, thread, "Thread status updated successfully"));
    } catch (error) {
        next(error);
    }
};

export const pinThread = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const thread = await ForumService.pinThread(id, userId);

        res.status(200).json(new ApiResponse(200, thread, "Thread pin status updated successfully"));
    } catch (error) {
        next(error);
    }
};

// ============================================
// COMMENT CONTROLLERS
// ============================================

export const createComment = async (req, res, next) => {
    try {
        const { threadId, content } = req.body;
        const userId = req.user._id;

        const comment = await ForumService.createComment({
            userId,
            threadId,
            content,
        });

        res.status(201).json(new ApiResponse(201, comment, "Comment created successfully"));
    } catch (error) {
        next(error);
    }
};

export const updateComment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const isAdmin = req.user.user_type === "admin";
        const { content } = req.body;

        const comment = await ForumService.updateComment(id, userId, { content }, isAdmin);

        res.status(200).json(new ApiResponse(200, comment, "Comment updated successfully"));
    } catch (error) {
        next(error);
    }
};

export const deleteComment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const isAdmin = req.user.user_type === "admin";

        await ForumService.deleteComment(id, userId, isAdmin);

        res.status(200).json(new ApiResponse(200, null, "Comment deleted successfully"));
    } catch (error) {
        next(error);
    }
};

// ============================================
// VOTING CONTROLLERS
// ============================================

export const vote = async (req, res, next) => {
    try {
        const { targetId, targetType, type } = req.body;
        const userId = req.user._id;

        const result = await ForumService.vote({
            userId,
            targetId,
            targetType,
            voteType: type,
        });

        res.status(200).json(new ApiResponse(200, result, "Vote processed successfully"));
    } catch (error) {
        next(error);
    }
};

// ============================================
// REPORT CONTROLLERS
// ============================================

export const reportContent = async (req, res, next) => {
    try {
        const { targetId, targetType, reason } = req.body;
        const userId = req.user._id;

        const report = await ForumService.reportContent({
            userId,
            targetId,
            targetType,
            reason,
        });

        res.status(201).json(new ApiResponse(201, report, "Content reported successfully"));
    } catch (error) {
        next(error);
    }
};

export const getReports = async (req, res, next) => {
    try {
        const { page, limit, status } = req.query;

        const result = await ForumService.getReports({
            page: Number(page) || 1,
            limit: Number(limit) || 20,
            status,
        });

        res.status(200).json(new ApiResponse(200, result, "Reports retrieved successfully"));
    } catch (error) {
        next(error);
    }
};

// ============================================
// ADMIN CONTROLLERS
// ============================================

export const adjustUserKarma = async (req, res, next) => {
    try {
        const { userId, karmaChange, reason } = req.body;
        const adminId = req.user._id;

        if (!userId || karmaChange === undefined) {
            throw new ApiError(400, "User ID and karma change are required");
        }

        const result = await ForumService.adjustUserKarma(userId, karmaChange, adminId, reason);

        res.status(200).json(new ApiResponse(200, result, "User karma adjusted successfully"));
    } catch (error) {
        next(error);
    }
};

const forumController = {
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

export default forumController;

