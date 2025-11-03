import { ApiError } from "../utils/index.js";

export const validate = (schema, source = 'body') => {
    return (req, res, next) => {
        try {
            // Check if req.body is undefined or null when validating body
            if (source === 'body' && (!req.body || typeof req.body !== 'object')) {
                const error = new ApiError(400, 'Request body is missing or invalid. Please ensure you are sending JSON data with Content-Type: application/json header.');
                return next(error);
            }

            // Get the data to validate
            let dataToValidate = req[source];

            // Parse FormData fields for body validation
            if (source === 'body') {
                if (dataToValidate.tags && typeof dataToValidate.tags === 'string') {
                    dataToValidate.tags = dataToValidate.tags.startsWith('[')
                        ? JSON.parse(dataToValidate.tags)
                        : dataToValidate.tags.split(',').map(t => t.trim()).filter(Boolean);
                }
                if (typeof dataToValidate.isPublished === 'string') {
                    dataToValidate.isPublished = dataToValidate.isPublished === 'true';
                }
            }

            const { error, value } = schema.validate(dataToValidate, {
                abortEarly: false,
                allowUnknown: true,
                stripUnknown: true
            });

            if (error) {
                const errorDetails = error.details.map(detail => ({
                    field: detail.path.join('.'),
                    message: detail.message,
                    value: detail.context?.value
                }));

                const validationError = new ApiError(400, 'Validation Error');
                validationError.details = errorDetails;
                return next(validationError);
            }


            // Only assign validated values to 'body' and 'params'
            if (source === 'body') {
                req.body = value;
            } else if (source === 'params') {
                req.params = value;
            }

            next();
        } catch (err) {
            next(new ApiError(500, `Validation error: ${err.message}`));
        }
    };
};

export const validateBody = (schema) => validate(schema, 'body');
export const validateParams = (schema) => validate(schema, 'params');
export const validateQuery = (schema) => validate(schema, 'query');
export const validateHeaders = (schema) => validate(schema, 'headers');