import Joi from "joi";
import mongoose from "mongoose";

// Custom Joi validator for MongoDB ObjectId
const objectId = (value, helpers) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error('any.invalid');
    }
    return value;
};

// ============================================
// PARAM VALIDATIONS
// ============================================

export const threadIdParamSchema = Joi.object({
    id: Joi.string()
        .custom(objectId)
        .required()
        .messages({
            'string.empty': 'Thread ID is required',
            'any.invalid': 'Invalid thread ID format'
        })
});

export const commentIdParamSchema = Joi.object({
    id: Joi.string()
        .custom(objectId)
        .required()
        .messages({
            'string.empty': 'Comment ID is required',
            'any.invalid': 'Invalid comment ID format'
        })
});

// ============================================
// QUERY VALIDATIONS
// ============================================

export const listThreadsQuerySchema = Joi.object({
    page: Joi.number()
        .integer()
        .min(1)
        .default(1)
        .messages({
            'number.base': 'Page must be a number',
            'number.min': 'Page must be at least 1'
        }),

    limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .default(20)
        .messages({
            'number.base': 'Limit must be a number',
            'number.min': 'Limit must be at least 1',
            'number.max': 'Limit cannot exceed 100'
        }),

    tags: Joi.alternatives().try(
        Joi.string(),
        Joi.array().items(Joi.string().trim())
    ).optional(),

    status: Joi.string()
        .valid('open', 'locked')
        .optional()
        .messages({
            'any.only': 'Status must be either "open" or "locked"'
        }),

    sortBy: Joi.string()
        .valid('newest', 'popular', 'trending')
        .default('newest')
        .messages({
            'any.only': 'Sort by must be either "newest", "popular", or "trending"'
        })
});

export const getReportsQuerySchema = Joi.object({
    page: Joi.number()
        .integer()
        .min(1)
        .default(1)
        .messages({
            'number.base': 'Page must be a number',
            'number.min': 'Page must be at least 1'
        }),

    limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .default(20)
        .messages({
            'number.base': 'Limit must be a number',
            'number.min': 'Limit must be at least 1',
            'number.max': 'Limit cannot exceed 100'
        }),

    status: Joi.string()
        .valid('pending', 'reviewed', 'resolved', 'dismissed')
        .optional()
        .messages({
            'any.only': 'Status must be one of: "pending", "reviewed", "resolved", "dismissed"'
        })
});

// ============================================
// BODY VALIDATIONS
// ============================================

export const createThreadSchema = Joi.object({
    title: Joi.string()
        .trim()
        .min(3)
        .max(200)
        .required()
        .messages({
            'string.empty': 'Thread title is required',
            'string.min': 'Title must be at least 3 characters long',
            'string.max': 'Title cannot exceed 200 characters'
        }),

    content: Joi.string()
        .trim()
        .min(10)
        .max(10000)
        .required()
        .messages({
            'string.empty': 'Thread content is required',
            'string.min': 'Content must be at least 10 characters long',
            'string.max': 'Content cannot exceed 10000 characters'
        }),

    tags: Joi.array()
        .items(Joi.string().trim())
        .max(10)
        .optional()
        .messages({
            'array.base': 'Tags must be an array',
            'array.max': 'A thread may contain at most 10 tags'
        })
});

export const updateThreadSchema = Joi.object({
    title: Joi.string()
        .trim()
        .min(3)
        .max(200)
        .optional()
        .messages({
            'string.min': 'Title must be at least 3 characters long',
            'string.max': 'Title cannot exceed 200 characters'
        }),

    content: Joi.string()
        .trim()
        .min(10)
        .max(10000)
        .optional()
        .messages({
            'string.min': 'Content must be at least 10 characters long',
            'string.max': 'Content cannot exceed 10000 characters'
        }),

    tags: Joi.array()
        .items(Joi.string().trim())
        .max(10)
        .optional()
        .messages({
            'array.base': 'Tags must be an array',
            'array.max': 'A thread may contain at most 10 tags'
        })
});

export const createCommentSchema = Joi.object({
    threadId: Joi.string()
        .custom(objectId)
        .required()
        .messages({
            'string.empty': 'Thread ID is required',
            'any.invalid': 'Invalid thread ID format'
        }),

    content: Joi.string()
        .trim()
        .min(1)
        .max(5000)
        .required()
        .messages({
            'string.empty': 'Comment content is required',
            'string.min': 'Content must be at least 1 character long',
            'string.max': 'Content cannot exceed 5000 characters'
        })
});

export const updateCommentSchema = Joi.object({
    content: Joi.string()
        .trim()
        .min(1)
        .max(5000)
        .required()
        .messages({
            'string.empty': 'Comment content is required',
            'string.min': 'Content must be at least 1 character long',
            'string.max': 'Content cannot exceed 5000 characters'
        })
});

export const voteSchema = Joi.object({
    targetId: Joi.string()
        .custom(objectId)
        .required()
        .messages({
            'string.empty': 'Target ID is required',
            'any.invalid': 'Invalid target ID format'
        }),

    targetType: Joi.string()
        .valid('thread', 'comment')
        .required()
        .messages({
            'any.only': 'Target type must be either "thread" or "comment"',
            'any.required': 'Target type is required'
        }),

    type: Joi.string()
        .valid('upvote', 'downvote')
        .required()
        .messages({
            'any.only': 'Vote type must be either "upvote" or "downvote"',
            'any.required': 'Vote type is required'
        })
});

export const reportContentSchema = Joi.object({
    targetId: Joi.string()
        .custom(objectId)
        .required()
        .messages({
            'string.empty': 'Target ID is required',
            'any.invalid': 'Invalid target ID format'
        }),

    targetType: Joi.string()
        .valid('thread', 'comment')
        .required()
        .messages({
            'any.only': 'Target type must be either "thread" or "comment"',
            'any.required': 'Target type is required'
        }),

    reason: Joi.string()
        .trim()
        .min(10)
        .max(500)
        .required()
        .messages({
            'string.empty': 'Report reason is required',
            'string.min': 'Reason must be at least 10 characters long',
            'string.max': 'Reason cannot exceed 500 characters'
        })
});

export const adjustKarmaSchema = Joi.object({
    userId: Joi.string()
        .custom(objectId)
        .required()
        .messages({
            'string.empty': 'User ID is required',
            'any.invalid': 'Invalid user ID format'
        }),

    karmaChange: Joi.number()
        .integer()
        .required()
        .messages({
            'number.base': 'Karma change must be a number',
            'any.required': 'Karma change is required'
        }),

    reason: Joi.string()
        .trim()
        .max(500)
        .optional()
        .messages({
            'string.max': 'Reason cannot exceed 500 characters'
        })
});

