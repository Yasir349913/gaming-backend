import { Client, Consultant } from "../models/index.js";
import { ApiError } from "../utils/index.js";


// --- COMPLETE CLIENT PROFILE ---
const completeClientProfile = async (userId, payload) => {
    let client = await Client.findOne({ user: userId });
    if (!client) client = new Client({ user: userId });

    const allowed = [
        "companyName",
        "companyWebsite",
        "billingContactName",
        "billingContactEmail",
        "billingAddress",
        "defaultCurrency",
        "timezone",
        "languagePreference"
    ];

    for (const key of allowed) {
        if (payload[key] !== undefined) client[key] = payload[key];
    }

    await client.save();
    return client;
};

// --- COMPLETE CONSULTANT PROFILE ---
const completeConsultantProfile = async (userId, payload) => {
    let consultant = await Consultant.findOne({ user: userId });
    if (!consultant) consultant = new Consultant({ user: userId });

    const allowed = [
        "headline",
        "bio",
        "roles",
        "skills",
        "baseRate",
        "experienceYears",
        "locations",
        "portfolioLinks"
    ];

    for (const key of allowed) {
        if (payload[key] !== undefined) consultant[key] = payload[key];
    }

    // Handle availability separately to ensure hoursPerDay is set
    if (payload.availability && typeof payload.availability === 'object') {
        // Initialize availability if it doesn't exist
        if (!consultant.availability) {
            consultant.availability = {};
        }
        // Merge availability data, ensuring hoursPerDay defaults to 8 if not provided
        consultant.availability = {
            ...consultant.availability,
            ...payload.availability,
            hoursPerDay: payload.availability.hoursPerDay !== undefined && payload.availability.hoursPerDay !== null
                ? payload.availability.hoursPerDay
                : (consultant.availability.hoursPerDay || 8)
        };
    } else if (!consultant.availability) {
        // If availability is not provided and doesn't exist, initialize with default hoursPerDay
        consultant.availability = { hoursPerDay: 8 };
    }

    // Don't auto-approve consultants
    consultant.approved = false;

    await consultant.save();
    return consultant;
};

// --- GET CLIENT PROFILE ---
const getClientProfile = async (userId) => {
    const client = await Client.findOne({ user: userId });
    if (!client) throw new ApiError(404, "Client profile not found");
    return client;
};

// --- GET CONSULTANT PROFILE ---
const getConsultantProfile = async (userId) => {
    const consultant = await Consultant.findOne({ user: userId });
    if (!consultant) throw new ApiError(404, "Consultant profile not found");
    return consultant;
};

// --- UPDATE CLIENT PROFILE (VALIDATED) ---
const updateClientProfile = async (userId, payload) => {
    const allowed = [
        "companyName",
        "companyWebsite",
        "billingContactName",
        "billingContactEmail",
        "billingAddress",
    ];

    const updateData = {};
    for (const key of allowed) {
        if (payload[key] !== undefined) updateData[key] = payload[key];
    }

    if (Object.keys(updateData).length === 0) {
        throw new ApiError(400, "No valid fields provided for update");
    }

    const client = await Client.findOneAndUpdate({ user: userId }, updateData, { new: true, runValidators: true });
    if (!client) throw new ApiError(404, "Client profile not found");
    return client;
};

// --- UPDATE CONSULTANT PROFILE (VALIDATED) ---
const updateConsultantProfile = async (userId, payload) => {
    const allowed = [
        "headline",
        "bio",
        "roles",
        "skills",
        // "badges",
        // "level",
        "baseRate",
        "experienceYears",
        "availability",
        "locations",
        "portfolioLinks"
    ];

    const updateData = {};
    for (const key of allowed) {
        if (payload[key] !== undefined) updateData[key] = payload[key];
    }

    // Handle availability separately to preserve existing hoursPerDay if not provided in update
    if (updateData.availability && typeof updateData.availability === 'object') {
        const existingConsultant = await Consultant.findOne({ user: userId });
        const existingAvailability = existingConsultant?.availability || {};

        // Check if hoursPerDay is being updated
        const isHoursPerDayUpdated = updateData.availability.hoursPerDay !== undefined &&
            updateData.availability.hoursPerDay !== null &&
            updateData.availability.hoursPerDay !== existingAvailability.hoursPerDay;

        // Merge availability, preserving existing hoursPerDay if not provided in update
        updateData.availability = {
            ...existingAvailability,
            ...updateData.availability,
            hoursPerDay: updateData.availability.hoursPerDay !== undefined && updateData.availability.hoursPerDay !== null
                ? updateData.availability.hoursPerDay
                : (existingAvailability.hoursPerDay || 8)
        };

        // If hoursPerDay is updated, optionally update hoursPerWeek (assuming 5 working days)
        if (isHoursPerDayUpdated) {
            const newHoursPerDay = updateData.availability.hoursPerDay;
            // Only auto-update hoursPerWeek if it's the default (40) or undefined
            if (updateData.availability.hoursPerWeek === undefined ||
                updateData.availability.hoursPerWeek === 40 ||
                updateData.availability.hoursPerWeek === existingAvailability.hoursPerWeek) {
                updateData.availability.hoursPerWeek = newHoursPerDay * 5;
            }
        }
    }

    if (Object.keys(updateData).length === 0) {
        throw new ApiError(400, "No valid fields provided for update");
    }

    const consultant = await Consultant.findOneAndUpdate({ user: userId }, updateData, { new: true, runValidators: true });
    if (!consultant) throw new ApiError(404, "Consultant profile not found");
    return consultant;
};

const OnboardingService = {
    completeClientProfile,
    completeConsultantProfile,
    getClientProfile,
    getConsultantProfile,
    updateClientProfile,
    updateConsultantProfile
};

export default OnboardingService;