import express from "express";
import forumController from "../controllers/forum.controller.js";
import { auth, isAdmin, validateBody, validateParams, validateQuery } from "../middlewares/index.js";
import {
    createThreadSchema,
    updateThreadSchema,
    createCommentSchema,
    updateCommentSchema,
    voteSchema,
    reportContentSchema,
    adjustKarmaSchema,
    threadIdParamSchema,
    commentIdParamSchema,
    listThreadsQuerySchema,
    getReportsQuerySchema,
} from "../validations/forum.validation.js";

const router = express.Router();

// ============================================
// PUBLIC ROUTES (No auth required)
// ============================================

router.get(
    "/threads",
    validateQuery(listThreadsQuerySchema),
    forumController.listThreads
);

router.get(
    "/thread/:id",
    validateParams(threadIdParamSchema),
    forumController.getThread
);

// ============================================
// AUTHENTICATED ROUTES
// ============================================

router.use(auth);

// Thread routes
router.post(
    "/thread",
    validateBody(createThreadSchema),
    forumController.createThread
);

router.put(
    "/thread/:id",
    validateParams(threadIdParamSchema),
    validateBody(updateThreadSchema),
    forumController.updateThread
);

router.delete(
    "/thread/:id",
    validateParams(threadIdParamSchema),
    forumController.deleteThread
);

// Comment routes
router.post(
    "/comment",
    validateBody(createCommentSchema),
    forumController.createComment
);

router.put(
    "/comment/:id",
    validateParams(commentIdParamSchema),
    validateBody(updateCommentSchema),
    forumController.updateComment
);

router.delete(
    "/comment/:id",
    validateParams(commentIdParamSchema),
    forumController.deleteComment
);

// Voting routes
router.post(
    "/vote",
    validateBody(voteSchema),
    forumController.vote
);

// Report routes
router.post(
    "/report",
    validateBody(reportContentSchema),
    forumController.reportContent
);

// ============================================
// ADMIN ROUTES
// ============================================

router.post(
    "/thread/:id/lock",
    isAdmin,
    validateParams(threadIdParamSchema),
    forumController.lockThread
);

router.post(
    "/thread/:id/pin",
    isAdmin,
    validateParams(threadIdParamSchema),
    forumController.pinThread
);

router.get(
    "/reports",
    isAdmin,
    validateQuery(getReportsQuerySchema),
    forumController.getReports
);

router.put(
    "/reputation",
    isAdmin,
    validateBody(adjustKarmaSchema),
    forumController.adjustUserKarma
);

export default router;

