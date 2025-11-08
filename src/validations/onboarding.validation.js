import Joi from "joi";

// Client profile onboarding validation
export const clientProfileSchema = Joi.object({
    companyName: Joi.string()
        .trim()
        .max(100)
        .optional()
        .messages({
            'string.max': 'Company name cannot exceed 100 characters'
        }),

    companyWebsite: Joi.string()
        .uri()
        .trim()
        .optional()
        .messages({
            'string.uri': 'Please provide a valid website URL'
        }),

    billingContactName: Joi.string()
        .trim()
        .max(100)
        .optional()
        .messages({
            'string.max': 'Billing contact name cannot exceed 100 characters'
        }),

    billingContactEmail: Joi.string()
        .email()
        .lowercase()
        .trim()
        .optional()
        .messages({
            'string.email': 'Please provide a valid billing contact email'
        }),

    billingAddress: Joi.object({
        line1: Joi.string().trim().max(100).optional(),
        line2: Joi.string().trim().max(100).optional(),
        city: Joi.string().trim().max(50).optional(),
        region: Joi.string().trim().max(50).optional(),
        postalCode: Joi.string().trim().max(20).optional(),
        country: Joi.string().trim().max(50).optional()
    }).optional(),

    defaultCurrency: Joi.string()
        .valid('USD', 'EUR', 'GBP', 'CAD', 'AUD')
        .default('USD')
        .optional()
        .messages({
            'any.only': 'Currency must be one of: USD, EUR, GBP, CAD, AUD'
        }),

    timezone: Joi.string()
        .trim()
        .default('UTC')
        .optional(),

    languagePreference: Joi.string()
        .valid('english', 'spanish', 'french')
        .default('english')
        .optional()
        .messages({
            'any.only': 'Language preference must be one of: english, spanish, french'
        })
});

export const consultantProfileSchema = Joi.object({
    headline: Joi.string()
        .trim()
        .max(200)
        .optional()
        .messages({
            'string.max': 'Headline cannot exceed 200 characters'
        }),

    bio: Joi.string()
        .trim()
        .max(2000)
        .optional()
        .messages({
            'string.max': 'Bio cannot exceed 2000 characters'
        }),

    roles: Joi.array()
        .items(Joi.string().trim().max(50))
        .max(10)
        .optional()
        .messages({
            'array.max': 'Cannot have more than 10 roles'
        }),

    skills: Joi.array()
        .items(Joi.string().trim().max(50))
        .max(20)
        .optional()
        .messages({
            'array.max': 'Cannot have more than 20 skills'
        }),

    // REMOVED badges from here - only admin can assign


    baseRate: Joi.object({
        currency: Joi.string().valid('USD', 'EUR', 'GBP', 'CAD', 'AUD').default('USD'),
        hourly: Joi.number().min(0).max(10000).default(0),
        daily: Joi.number().min(0).max(50000).optional(),
        weekly: Joi.number().min(0).max(250000).optional()
    }).optional(),

    experienceYears: Joi.number()
        .min(0)
        .max(50)
        .default(0)
        .optional()
        .messages({
            'number.min': 'Experience years cannot be negative',
            'number.max': 'Experience years cannot exceed 50'
        }),

    availability: Joi.object({
        timezone: Joi.string().default('UTC'),
        hoursPerWeek: Joi.number().min(1).max(168).default(40),
        hoursPerDay: Joi.number().min(1).max(24).default(8),
        availableFrom: Joi.date().optional(),
        availableTo: Joi.date().optional(),
        remote: Joi.boolean().default(true)
    }).optional(),

    locations: Joi.array()
        .items(Joi.string().trim().max(100))
        .max(10)
        .optional()
        .messages({
            'array.max': 'Cannot have more than 10 locations'
        }),

    portfolioLinks: Joi.array()
        .items(Joi.string().uri())
        .max(10)
        .optional()
        .messages({
            'array.max': 'Cannot have more than 10 portfolio links',
            'string.uri': 'Portfolio links must be valid URLs'
        }),

    capacity: Joi.object({
        maxHoursPerWeek: Joi.number().min(1).max(168).default(40),
        reservedHoursPerWeek: Joi.number().min(0).max(168).default(0)
    }).optional(),

    visibility: Joi.string()
        .valid('public', 'private', 'unlisted')
        .default('public')
        .optional()
        .messages({
            'any.only': 'Visibility must be one of: public, private, unlisted'
        })
});

// Add new validation schema for admin badge assignment
export const adminLevelSchema = Joi.object({
    level: Joi.string()
        .valid('LV1', 'LV2', 'LV3', 'LV4', 'LV5', 'LV6')
        .required()
        .messages({
            'any.only': 'Level must be one of: LV1, LV2, LV3, LV4, LV5, LV6',
            'any.required': 'Level is required'
        })
});

// Validation schema for updating availability hours per day
export const updateAvailabilityHoursSchema = Joi.object({
    hoursPerDay: Joi.number()
        .min(1)
        .max(24)
        .required()
        .messages({
            'number.min': 'Hours per day must be at least 1',
            'number.max': 'Hours per day cannot exceed 24',
            'any.required': 'hoursPerDay is required'
        })
});
