import TeamSelectionService from "../services/teamSelection.service.js";
import { ApiResponse, ApiError } from "../utils/index.js";

export const createTeam = async (req, res, next) => {
    try {
        const { name, description, requirements, billingPeriod } = req.body;
        const userId = req.user._id;

        const team = await TeamSelectionService.createTeam({
            userId,
            name,
            description,
            requirements,
            billingPeriod
        });

        res.status(201).json(new ApiResponse(201, team, "Team created successfully"));
    } catch (error) {
        next(error);
    }
};

export const getTeam = async (req, res, next) => {
    try {
        const { teamId } = req.params;
        const userId = req.user._id;

        const team = await TeamSelectionService.getTeam(teamId, userId);

        res.status(200).json(new ApiResponse(200, team, "Team retrieved successfully"));
    } catch (error) {
        next(error);
    }
};

export const listClientTeams = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { page = 1, limit = 10 } = req.query;

        const result = await TeamSelectionService.listClientTeams(userId, {
            page: Number(page),
            limit: Number(limit)
        });

        res.status(200).json(new ApiResponse(200, result, "Teams retrieved successfully"));
    } catch (error) {
        next(error);
    }
};

export const updateTeam = async (req, res, next) => {
    try {
        const { teamId } = req.params;
        const userId = req.user._id;
        const updateData = req.body;

        const team = await TeamSelectionService.updateTeam(teamId, userId, updateData);

        res.status(200).json(new ApiResponse(200, team, "Team updated successfully"));
    } catch (error) {
        next(error);
    }
};

export const addMember = async (req, res, next) => {
    try {
        const { teamId } = req.params;
        const userId = req.user._id;
        const { consultant, role, allocation, startDate, endDate } = req.body;

        const team = await TeamSelectionService.addMember(teamId, userId, {
            consultant,
            role,
            allocation,
            startDate,
            endDate
        });

        res.status(200).json(new ApiResponse(200, team, "Member added successfully"));
    } catch (error) {
        next(error);
    }
};

export const addMultipleMembers = async (req, res, next) => {
    try {
        const { teamId } = req.params;
        const userId = req.user._id;
        const { members } = req.body;

        if (!Array.isArray(members) || members.length === 0) {
            throw new ApiError(400, "Members array is required");
        }

        const team = await TeamSelectionService.addMultipleMembers(teamId, userId, members);

        res.status(200).json(new ApiResponse(200, team, `${members.length} members added successfully`));
    } catch (error) {
        next(error);
    }
};

export const removeMember = async (req, res, next) => {
    try {
        const { teamId, consultantId } = req.params;
        const userId = req.user._id;

        const team = await TeamSelectionService.removeMember(teamId, userId, consultantId);

        res.status(200).json(new ApiResponse(200, team, "Member removed successfully"));
    } catch (error) {
        next(error);
    }
};

export const updateMember = async (req, res, next) => {
    try {
        const { teamId, consultantId } = req.params;
        const userId = req.user._id;
        const { role, allocation, startDate, endDate } = req.body;

        const team = await TeamSelectionService.updateMember(teamId, userId, consultantId, {
            role,
            allocation,
            startDate,
            endDate
        });

        res.status(200).json(new ApiResponse(200, team, "Member updated successfully"));
    } catch (error) {
        next(error);
    }
};

export const getRecommendedConsultants = async (req, res, next) => {
    try {
        const { teamId } = req.params;
        const userId = req.user._id;

        const consultants = await TeamSelectionService.getRecommendedConsultants(teamId, userId);

        res.status(200).json(new ApiResponse(200, consultants, "Recommended consultants retrieved successfully"));
    } catch (error) {
        next(error);
    }
};

export const calculatePricing = async (req, res, next) => {
    try {
        const { teamId } = req.params;
        const userId = req.user._id;
        const { taxPercent = 0, discountPercent = 0 } = req.body;

        const team = await TeamSelectionService.getTeam(teamId, userId);
        const pricing = await TeamSelectionService.calculatePricingForTeam(team, { taxPercent, discountPercent });

        res.status(200).json(new ApiResponse(200, pricing, "Pricing calculated successfully"));
    } catch (error) {
        next(error);
    }
};

export const calculateLivePricing = async (req, res, next) => {
    try {
        const { members, billingPeriod, projectDuration, taxPercent = 0, discountPercent = 0 } = req.body;

        // Create temporary team object for calculation
        const tempTeam = {
            members: members || [],
            billingPeriod: billingPeriod || 'hourly',
            projectDuration: projectDuration || {},
            totalBudget: { currency: 'USD' }
        };

        const pricing = await TeamSelectionService.calculatePricingForTeam(tempTeam, { taxPercent, discountPercent });

        res.status(200).json(new ApiResponse(200, pricing, "Live pricing calculated successfully"));
    } catch (error) {
        next(error);
    }
};

export const generateShareLink = async (req, res, next) => {
    try {
        const { teamId } = req.params;
        const userId = req.user._id;
        const { expiresInDays = 30 } = req.body;

        const shareLink = await TeamSelectionService.generateShareLink(teamId, userId, { expiresInDays });

        res.status(200).json(new ApiResponse(200, shareLink, "Share link generated successfully"));
    } catch (error) {
        next(error);
    }
};

export const getSharedTeam = async (req, res, next) => {
    try {
        const { shareLinkId } = req.params;

        const team = await TeamSelectionService.getSharedTeam(shareLinkId);

        res.status(200).json(new ApiResponse(200, team, "Shared team retrieved successfully"));
    } catch (error) {
        next(error);
    }
};

export const deleteTeam = async (req, res, next) => {
    try {
        const { teamId } = req.params;
        const userId = req.user._id;

        await TeamSelectionService.deleteTeam(teamId, userId);

        res.status(200).json(new ApiResponse(200, null, "Team deleted successfully"));
    } catch (error) {
        next(error);
    }
};

const teamSelectionController = {
    createTeam,
    getTeam,
    listClientTeams,
    updateTeam,
    addMember,
    addMultipleMembers,
    removeMember,
    updateMember,
    getRecommendedConsultants,
    calculatePricing,
    calculateLivePricing,
    generateShareLink,
    getSharedTeam,
    deleteTeam
};

export default teamSelectionController;