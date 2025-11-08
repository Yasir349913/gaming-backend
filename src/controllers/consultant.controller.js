import { ConsultantService } from "../services/index.js";
import { ApiResponse, ApiError } from "../utils/index.js";

export const searchConsultants = async (req, res) => {
    try {
        const { skills, minExperience, preferredTimezone, remote, maxHourlyRate } = req.query;
        const { page = 1, limit = 10, sort = "-createdAt" } = req.query;

        // Parse skills if provided as comma-separated string
        const skillsArray = skills ? skills.split(',').map(s => s.trim()) : undefined;

        const requirements = {
            skills: skillsArray,
            minExperience: minExperience ? Number(minExperience) : undefined,
            preferredTimezone,
            remote: remote ? remote === 'true' : undefined,
            maxHourlyRate: maxHourlyRate ? Number(maxHourlyRate) : undefined
        };

        const result = await ConsultantService.searchConsultants(requirements, {
            page: Number(page),
            limit: Number(limit),
            sort
        });

        res.status(200).json(new ApiResponse(200, result, "Consultants retrieved successfully"));
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message);
    }
};

export const getAllConsultants = async (req, res) => {
    try {
        const { page = 1, limit = 20, sort = "-createdAt" } = req.query;

        const result = await ConsultantService.getAllConsultants({
            page: Number(page),
            limit: Number(limit),
            sort
        });

        res.status(200).json(new ApiResponse(200, result, "All consultants retrieved successfully"));
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message);
    }
};

export const getConsultantDetails = async (req, res) => {
    try {
        const { consultantId } = req.params;

        const consultant = await ConsultantService.getConsultantDetails(consultantId);

        res.status(200).json(new ApiResponse(200, consultant, "Consultant details retrieved successfully"));
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message);
    }
};

export const getFeaturedConsultants = async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const consultants = await ConsultantService.getFeaturedConsultants({
            limit: Number(limit)
        });

        res.status(200).json(new ApiResponse(200, consultants, "Featured consultants retrieved successfully"));
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message);
    }
};

export const getConsultantsBySkills = async (req, res) => {
    try {
        const { skills } = req.query;
        const { limit = 20 } = req.query;

        // Parse skills if provided as comma-separated string
        const skillsArray = skills ? skills.split(',').map(s => s.trim()) : [];

        const consultants = await ConsultantService.getConsultantsBySkills(skillsArray, {
            limit: Number(limit)
        });

        res.status(200).json(new ApiResponse(200, consultants, "Consultants by skills retrieved successfully"));
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message);
    }
};

export const getConsultantsByExperience = async (req, res) => {
    try {
        const { minExperience } = req.query;
        const { limit = 20 } = req.query;

        if (!minExperience) {
            throw new ApiError(400, "minExperience parameter is required");
        }

        const consultants = await ConsultantService.getConsultantsByExperience(Number(minExperience), {
            limit: Number(limit)
        });

        res.status(200).json(new ApiResponse(200, consultants, "Consultants by experience retrieved successfully"));
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message);
    }
};



export const adminGetAllConsultants = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, sort = "-createdAt", status } = req.query;

        const result = await ConsultantService.adminGetAllConsultants({
            page: Number(page),
            limit: Number(limit),
            sort,
            status // NEW: filter by status
        });

        res.status(200).json(new ApiResponse(200, result, "All consultants fetched successfully"));
    } catch (error) {
        next(error);
    }
};


export const adminApproveConsultant = async (req, res, next) => {
    try {
        const { consultantId } = req.params;
        const { level } = req.body;
        const consultant = await ConsultantService.adminApproveConsultant(consultantId, req.user._id, level);
        res.status(200).json(new ApiResponse(200, consultant, "Consultant approved successfully"));
    } catch (error) {
        next(error);
    }
};

export const adminDisapproveConsultant = async (req, res, next) => {
    try {
        const { consultantId } = req.params;
        const consultant = await ConsultantService.adminDisapproveConsultant(consultantId, req.user._id);
        res.status(200).json(new ApiResponse(200, consultant, "Consultant disapproved successfully"));
    } catch (error) {
        next(error);
    }
};

export const getConsultantApprovalStatus = async (req, res, next) => {
    try {
        const status = await ConsultantService.getConsultantApprovalStatus(req.user._id);
        res.status(200).json(new ApiResponse(200, status, "Approval status fetched successfully"));
    } catch (error) {
        next(error);
    }
};

export const adminUpdateLevel = async (req, res, next) => {
    try {
        const { consultantId } = req.params;
        const { level } = req.body;

        if (!level) {
            throw new ApiError(400, "Level is required");
        }

        const consultant = await ConsultantService.adminUpdateLevel(
            consultantId,
            level,
            req.user._id
        );

        res.status(200).json(
            new ApiResponse(200, consultant, "Level updated successfully")
        );
    } catch (error) {
        next(error);
    }
};

export const getMyTeamAssignments = async (req, res, next) => {
    try {
        const assignments = await ConsultantService.getConsultantTeamAssignments(req.user._id);

        res.status(200).json(
            new ApiResponse(200, assignments, "Team assignments retrieved successfully")
        );
    } catch (error) {
        next(error);
    }
};

export const getTeamById = async (req, res, next) => {
    try {
        const { teamId } = req.params;
        const team = await ConsultantService.getTeamById(req.user._id, teamId);

        res.status(200).json(
            new ApiResponse(200, team, "Team details retrieved successfully")
        );
    } catch (error) {
        next(error);
    }
};

// make sure to export them in the default export:
const consultantController = {
    searchConsultants,
    getAllConsultants,
    getConsultantDetails,
    getFeaturedConsultants,
    getConsultantsBySkills,
    getConsultantsByExperience,
    adminGetAllConsultants,
    adminApproveConsultant,
    adminDisapproveConsultant,
    getConsultantApprovalStatus,
    adminUpdateLevel,
    getMyTeamAssignments,
    getTeamById
};

export default consultantController;
