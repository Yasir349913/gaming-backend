import Joi from "joi";
import { ApiError } from "../utils/index.js";

export const createBlogSchema = Joi.object({
    title: Joi.string().min(3).max(150).required(),
    content: Joi.string().min(10).required(),
    tags: Joi.array().items(Joi.string().trim()).optional(),
    isPublished: Joi.boolean().optional()
});

// Update your validation function
export const validateBlog = (req, res, next) => {
    try {
        // Parse tags if it's a string
        if (req.body.tags && typeof req.body.tags === 'string') {
            req.body.tags = req.body.tags.startsWith('[')
                ? JSON.parse(req.body.tags)
                : req.body.tags.split(',').map(t => t.trim()).filter(Boolean);
        }

        // Parse isPublished
        if (typeof req.body.isPublished === 'string') {
            req.body.isPublished = req.body.isPublished === 'true';
        }

        const { error, value } = createBlogSchema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
        });

        if (error) {
            const details = error.details.map((detail) => ({
                field: detail.path[0],
                message: detail.message,
                value: detail.context.value,
            }));

            throw new ApiError(400, "Validation Error", details);
        }

        req.body = value;
        next();
    } catch (err) {
        next(err);
    }
};