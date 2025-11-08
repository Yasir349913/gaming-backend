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

export const teamIdParamSchema = Joi.object({
    teamId: Joi.string()
        .custom(objectId)
        .required()
        .messages({
            'string.empty': 'Team ID is required',
            'any.invalid': 'Invalid team ID format'
        })
});

export const consultantIdParamSchema = Joi.object({
    teamId: Joi.string()
        .custom(objectId)
        .required()
        .messages({
            'string.empty': 'Team ID is required',
            'any.invalid': 'Invalid team ID format'
        }),
    consultantId: Joi.string()
        .custom(objectId)
        .required()
        .messages({
            'string.empty': 'Consultant ID is required',
            'any.invalid': 'Invalid consultant ID format'
        })
});

export const shareLinkIdParamSchema = Joi.object({
    shareLinkId: Joi.string()
        .required()
        .messages({
            'string.empty': 'Share link ID is required'
        })
});

// ============================================
// QUERY VALIDATIONS
// ============================================

export const listTeamsQuerySchema = Joi.object({
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
        .default(10)
        .messages({
            'number.base': 'Limit must be a number',
            'number.min': 'Limit must be at least 1',
            'number.max': 'Limit cannot exceed 100'
        })
});

// ============================================
// BODY VALIDATIONS
// ============================================

// Team creation validation
export const createTeamSchema = Joi.object({
    name: Joi.string()
        .trim()
        .min(3)
        .max(100)
        .required()
        .messages({
            'string.empty': 'Team name is required',
            'string.min': 'Team name must be at least 3 characters long',
            'string.max': 'Team name cannot exceed 100 characters'
        }),

    description: Joi.string()
        .trim()
        .max(1000)
        .allow('', null)
        .optional()
        .messages({
            'string.max': 'Description cannot exceed 1000 characters'
        }),

    billingPeriod: Joi.string()
        .valid('hourly', 'daily', 'weekly')
        .default('hourly')
        .messages({
            'any.only': 'Billing period must be either "hourly", "daily", or "weekly"'
        }),

    requirements: Joi.object({
        skills: Joi.array()
            .items(Joi.string().trim())
            .optional()
            .messages({
                'array.base': 'Skills must be an array of strings'
            }),

        minExperience: Joi.number()
            .integer()
            .min(0)
            .optional()
            .messages({
                'number.base': 'Minimum experience must be a number',
                'number.min': 'Minimum experience must be at least 0'
            }),

        preferredTimezone: Joi.string()
            .trim()
            .optional(),

        remote: Joi.boolean()
            .optional(),

        maxHourlyRate: Joi.number()
            .positive()
            .optional()
            .messages({
                'number.base': 'Maximum hourly rate must be a number',
                'number.positive': 'Maximum hourly rate must be positive'
            })
    }).optional()
});

// Team update validation
export const updateTeamSchema = Joi.object({
    name: Joi.string()
        .trim()
        .min(3)
        .max(100)
        .optional()
        .messages({
            'string.min': 'Team name must be at least 3 characters long',
            'string.max': 'Team name cannot exceed 100 characters'
        }),

    description: Joi.string()
        .trim()
        .max(1000)
        .allow('', null)
        .optional()
        .messages({
            'string.max': 'Description cannot exceed 1000 characters'
        }),

    billingPeriod: Joi.string()
        .valid('hourly', 'daily', 'weekly')
        .optional()
        .messages({
            'any.only': 'Billing period must be either "hourly", "daily", or "weekly"'
        }),

    projectDuration: Joi.object({
        startDate: Joi.date()
            .iso()
            .optional()
            .messages({
                'date.format': 'Start date must be a valid ISO date'
            }),

        endDate: Joi.date()
            .iso()
            .min(Joi.ref('startDate'))
            .optional()
            .messages({
                'date.format': 'End date must be a valid ISO date',
                'date.min': 'End date must be after start date'
            }),

        estimatedHours: Joi.number()
            .integer()
            .min(0)
            .optional()
            .messages({
                'number.base': 'Estimated hours must be a number',
                'number.min': 'Estimated hours must be at least 0'
            })
    }).optional(),

    requirements: Joi.object({
        skills: Joi.array()
            .items(Joi.string().trim())
            .optional(),

        minExperience: Joi.number()
            .integer()
            .min(0)
            .optional(),

        preferredTimezone: Joi.string()
            .trim()
            .optional(),

        remote: Joi.boolean()
            .optional(),

        maxHourlyRate: Joi.number()
            .positive()
            .optional()
    }).optional(),

    taxPercent: Joi.number()
        .min(0)
        .max(100)
        .optional()
        .messages({
            'number.min': 'Tax percent must be at least 0',
            'number.max': 'Tax percent cannot exceed 100'
        }),

    discountPercent: Joi.number()
        .min(0)
        .max(100)
        .optional()
        .messages({
            'number.min': 'Discount percent must be at least 0',
            'number.max': 'Discount percent cannot exceed 100'
        })
});

// Add member validation
export const addMemberSchema = Joi.object({
    consultant: Joi.string()
        .custom(objectId)
        .required()
        .messages({
            'string.empty': 'Consultant ID is required',
            'any.invalid': 'Invalid consultant ID format'
        }),

    role: Joi.string()
        .trim()
        .max(100)
        .optional()
        .messages({
            'string.max': 'Role cannot exceed 100 characters'
        }),

    allocation: Joi.number()
        .integer()
        .min(0)
        .max(100)
        .default(100)
        .messages({
            'number.base': 'Allocation must be a number',
            'number.min': 'Allocation must be at least 0',
            'number.max': 'Allocation cannot exceed 100'
        }),

    startDate: Joi.date()
        .iso()
        .optional()
        .messages({
            'date.format': 'Start date must be a valid ISO date'
        }),

    endDate: Joi.date()
        .iso()
        .min(Joi.ref('startDate'))
        .optional()
        .messages({
            'date.format': 'End date must be a valid ISO date',
            'date.min': 'End date must be after start date'
        })
});

// Add multiple members validation
export const addMultipleMembersSchema = Joi.object({
    members: Joi.array()
        .items(
            Joi.object({
                consultant: Joi.string()
                    .custom(objectId)
                    .required()
                    .messages({
                        'string.empty': 'Consultant ID is required',
                        'any.invalid': 'Invalid consultant ID format'
                    }),

                role: Joi.string()
                    .trim()
                    .max(100)
                    .optional(),

                allocation: Joi.number()
                    .integer()
                    .min(0)
                    .max(100)
                    .default(100),

                startDate: Joi.date()
                    .iso()
                    .optional(),

                endDate: Joi.date()
                    .iso()
                    .min(Joi.ref('startDate'))
                    .optional()
            })
        )
        .min(1)
        .required()
        .messages({
            'array.base': 'Members must be an array',
            'array.min': 'At least one member is required',
            'any.required': 'Members array is required'
        })
});

// Update member validation
export const updateMemberSchema = Joi.object({
    role: Joi.string()
        .trim()
        .max(100)
        .optional()
        .messages({
            'string.max': 'Role cannot exceed 100 characters'
        }),

    allocation: Joi.number()
        .integer()
        .min(0)
        .max(100)
        .optional()
        .messages({
            'number.base': 'Allocation must be a number',
            'number.min': 'Allocation must be at least 0',
            'number.max': 'Allocation cannot exceed 100'
        }),

    startDate: Joi.date()
        .iso()
        .optional()
        .messages({
            'date.format': 'Start date must be a valid ISO date'
        }),

    endDate: Joi.date()
        .iso()
        .optional()
        .messages({
            'date.format': 'End date must be a valid ISO date'
        })
});

// Calculate pricing validation
export const calculatePricingSchema = Joi.object({
    taxPercent: Joi.number()
        .min(0)
        .max(100)
        .default(0)
        .messages({
            'number.min': 'Tax percent must be at least 0',
            'number.max': 'Tax percent cannot exceed 100'
        }),

    discountPercent: Joi.number()
        .min(0)
        .max(100)
        .default(0)
        .messages({
            'number.min': 'Discount percent must be at least 0',
            'number.max': 'Discount percent cannot exceed 100'
        })
});

// Live pricing calculation validation
// Live pricing calculation validation
export const livePricingSchema = Joi.object({
    members: Joi.array()
        .items(
            Joi.object({
                // Accept either string ID or full object with _id
                consultant: Joi.alternatives().try(
                    // String ID format
                    Joi.string().custom(objectId).required(),
                    // Full object format (populated)
                    Joi.object({
                        _id: Joi.string().custom(objectId).required()
                    }).unknown(true) // Allow other fields in the object
                ).required().messages({
                    'alternatives.match': 'Consultant must be either an ID string or an object with _id',
                    'any.required': 'Consultant is required'
                }),

                role: Joi.string()
                    .trim()
                    .max(100)
                    .optional(),

                allocation: Joi.number()
                    .integer()
                    .min(0)
                    .max(100)
                    .default(100),

                startDate: Joi.date()
                    .iso()
                    .optional(),

                endDate: Joi.date()
                    .iso()
                    .optional()
            })
        )
        .optional(),

    billingPeriod: Joi.string()
        .valid('hourly', 'daily', 'weekly')
        .default('hourly'),

    projectDuration: Joi.object({
        startDate: Joi.date()
            .iso()
            .optional(),
        endDate: Joi.date()
            .iso()
            .optional(),
        estimatedHours: Joi.number()
            .integer()
            .min(0)
            .optional()
    }).optional(),

    taxPercent: Joi.number()
        .min(0)
        .max(100)
        .default(0),

    discountPercent: Joi.number()
        .min(0)
        .max(100)
        .default(0)
});

// Generate share link validation
export const generateShareLinkSchema = Joi.object({
    expiresInDays: Joi.number()
        .integer()
        .min(1)
        .max(365)
        .default(30)
        .messages({
            'number.base': 'Expires in days must be a number',
            'number.min': 'Expires in days must be at least 1',
            'number.max': 'Expires in days cannot exceed 365'
        })
});