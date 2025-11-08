// Export all validation schemas
export * from "./auth.validation.js";
export * from "./user.validation.js";
export * from "./onboarding.validation.js";

// Default export for convenience
import * as authValidation from "./auth.validation.js";
import * as userValidation from "./user.validation.js";
import * as onboardingValidation from "./onboarding.validation.js";
import * as teamSelectionValidation from "./teamSelection.validation.js";
import * as forumValidation from "./forum.validation.js";

export default {
    auth: authValidation,
    user: userValidation,
    onboarding: onboardingValidation,
    teamSelection: teamSelectionValidation,
    forum: forumValidation
};
