import { Consultant, TeamSelection } from "../models/index.js";
import { ApiError } from "../utils/index.js";

const searchConsultants = async (requirements = {}, { page = 1, limit = 10, sort = "-createdAt" } = {}) => {
    const { skills, minExperience, preferredTimezone, remote, maxHourlyRate } = requirements;

    // Build filter query
    const filter = { status: "approved" }; // Only show approved consultants

    // Filter by skills
    if (skills && skills.length > 0) {
        filter.skills = { $in: skills };
    }

    // Filter by minimum experience
    if (typeof minExperience === "number" && minExperience > 0) {
        filter.experienceYears = { $gte: minExperience };
    }

    // Filter by timezone preference
    if (preferredTimezone) {
        filter["availability.timezone"] = preferredTimezone;
    }

    // Filter by remote availability
    if (typeof remote === "boolean") {
        filter["availability.remote"] = remote;
    }

    // Filter by maximum hourly rate
    if (typeof maxHourlyRate === "number" && maxHourlyRate > 0) {
        filter["baseRate.hourly"] = { $lte: maxHourlyRate };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query with population
    const consultants = await Consultant.find(filter)
        .populate({
            path: "user",
            select: "name email user_type isVerified"
        })
        .sort(sort)
        .skip(skip)
        .limit(limit);

    const total = await Consultant.countDocuments(filter);

    return {
        consultants,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit)
    };
};

const getConsultantDetails = async (consultantId) => {
    const consultant = await Consultant.findById(consultantId)
        .populate({
            path: "user",
            select: "name email user_type isVerified"
        });

    if (!consultant) throw new ApiError(404, "Consultant not found");
    if (consultant.status != "approved") throw new ApiError(404, "Consultant not available");

    return consultant;
};

const getFeaturedConsultants = async ({ limit = 10 } = {}) => {
    const consultants = await Consultant.find({
        status: "approved",
        visibility: "public"
    })
        .populate({
            path: "user",
            select: "name email user_type isVerified"
        })
        .sort("-experienceYears -createdAt")
        .limit(limit);

    return consultants;
};

const getConsultantsBySkills = async (skills, { limit = 20 } = {}) => {
    if (!skills || skills.length === 0) {
        return await getFeaturedConsultants({ limit });
    }

    const consultants = await Consultant.find({
        status: "approved",
        skills: { $in: skills },
        visibility: "public"
    })
        .populate({
            path: "user",
            select: "name email user_type isVerified"
        })
        .sort("-experienceYears -createdAt")
        .limit(limit);

    return consultants;
};

const getConsultantsByExperience = async (minExperience, { limit = 20 } = {}) => {
    const consultants = await Consultant.find({
        status: "approved",
        experienceYears: { $gte: minExperience },
        visibility: "public"
    })
        .populate({
            path: "user",
            select: "name email user_type isVerified"
        })
        .sort("-experienceYears -createdAt")
        .limit(limit);

    return consultants;
};

const getAllConsultants = async ({ page = 1, limit = 20, sort = "-createdAt" } = {}) => {
    const skip = (page - 1) * limit;

    const consultants = await Consultant.find({
        status: "approved",
        visibility: "public"
    })
        .populate({
            path: "user",
            select: "name email user_type isVerified"
        })
        .sort(sort)
        .skip(skip)
        .limit(limit);

    const total = await Consultant.countDocuments({
        status: "approved",
        visibility: "public"
    });

    return {
        consultants,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit)
    };
};



const adminGetAllConsultants = async ({ page = 1, limit = 20, sort = "-createdAt", status } = {}) => {
    const skip = (page - 1) * limit;

    // Build filter for status
    const filter = {};
    if (status && ['pending', 'approved', 'disapproved'].includes(status)) {
        filter.status = status;
    }

    const consultants = await Consultant.find(filter)
        .populate({
            path: "user",
            select: "name email user_type isVerified"
        })
        .sort(sort)
        .skip(skip)
        .limit(limit);

    const total = await Consultant.countDocuments(filter);

    return {
        consultants,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
        currentFilter: status || 'all'
    };
};


const adminApproveConsultant = async (consultantId, adminId, level) => {
    const consultant = await Consultant.findById(consultantId);
    if (!consultant) throw new ApiError(404, "Consultant not found");

    consultant.approved = true;
    consultant.status = "approved";
    consultant.approvedAt = new Date();
    consultant.approvedBy = adminId;
    if (level) consultant.level = level;

    await consultant.save();

    // ✅ Populate user before returning
    await consultant.populate({
        path: "user",
        select: "name email user_type isVerified"
    });

    return consultant;
};

const adminDisapproveConsultant = async (consultantId, adminId) => {
    const consultant = await Consultant.findById(consultantId);
    if (!consultant) throw new ApiError(404, "Consultant not found");

    consultant.approved = false;
    consultant.status = "disapproved";
    consultant.approvedBy = adminId;

    await consultant.save();

    // ✅ Populate user before returning
    await consultant.populate({
        path: "user",
        select: "name email user_type isVerified"
    });

    return consultant;
};

const adminUpdateLevel = async (consultantId, level, adminId) => {
    const validLevels = ["LV1", "LV2", "LV3", "LV4", "LV5", "LV6"];
    if (!validLevels.includes(level)) {
        throw new ApiError(400, `Invalid level. Must be one of: ${validLevels.join(", ")}`);
    }

    const consultant = await Consultant.findById(consultantId);
    if (!consultant) throw new ApiError(404, "Consultant not found");

    consultant.level = level;
    await consultant.save();

    // ✅ Populate user before returning
    await consultant.populate({
        path: "user",
        select: "name email user_type isVerified"
    });

    return consultant;
};


const getConsultantApprovalStatus = async (userId) => {
    const consultant = await Consultant.findOne({ user: userId });
    if (!consultant) throw new ApiError(404, "Consultant profile not found");

    return {
        status: consultant.status,
        approved: consultant.approved,
        level: consultant.level,
    };
};

const getConsultantTeamAssignments = async (userId) => {
    const consultant = await Consultant.findOne({ user: userId });
    if (!consultant) throw new ApiError(404, "Consultant profile not found");

    // Find all teams where this consultant is a member
    const teams = await TeamSelection.find({
        "members.consultant": consultant._id
    })
        .populate({
            path: "client",
            populate: {
                path: "user",
                select: "name email"
            }
        })
        .populate("members.consultant", "headline skills baseRate availability")
        .sort({ createdAt: -1 });

    // Helper functions for date calculations (matching teamSelection.service.js logic)
    const msPerDay = 24 * 60 * 60 * 1000;
    const msPerWeek = 7 * msPerDay;

    const daysBetweenInclusive = (start, end) => {
        if (!start || !end) return 1;
        const s = new Date(start).setHours(0, 0, 0, 0);
        const e = new Date(end).setHours(0, 0, 0, 0);
        const days = Math.round((e - s) / msPerDay) + 1;
        return Math.max(1, days);
    };

    const weeksBetweenCeil = (start, end) => {
        if (!start || !end) return 1;
        const s = new Date(start).getTime();
        const e = new Date(end).getTime();
        const weeks = Math.ceil((e - s + 1) / msPerWeek);
        return Math.max(1, weeks);
    };

    // Calculate payment details for each team
    const assignments = teams.map(team => {
        const member = team.members.find(m =>
            m.consultant && (
                (typeof m.consultant === 'object' && m.consultant._id.toString() === consultant._id.toString()) ||
                (typeof m.consultant === 'string' && m.consultant.toString() === consultant._id.toString())
            )
        );

        if (!member) return null;

        const consultantData = typeof member.consultant === 'object' ? member.consultant : consultant;
        const allocationFactor = (member.allocation || 100) / 100;

        // Calculate project duration (matching calculatePricingForTeam logic)
        const projectDays = team.projectDuration?.startDate && team.projectDuration?.endDate
            ? daysBetweenInclusive(team.projectDuration.startDate, team.projectDuration.endDate)
            : (team.projectDuration?.estimatedHours ? Math.ceil(team.projectDuration.estimatedHours / 8) : 1);

        const projectWeeks = team.projectDuration?.startDate && team.projectDuration?.endDate
            ? weeksBetweenCeil(team.projectDuration.startDate, team.projectDuration.endDate)
            : Math.ceil(projectDays / 7);

        let paymentAmount = 0;
        let paymentBreakdown = {};

        if (team.billingPeriod === "hourly") {
            // For hourly billing: if duration is a week, use hoursPerDay × 7 × hourly rate
            if (projectDays === 7 || projectWeeks === 1) {
                const hoursPerDay = consultantData?.availability?.hoursPerDay || 8;
                const hourlyRate = Number(consultantData?.baseRate?.hourly || 0);
                paymentAmount = hoursPerDay * 7 * hourlyRate * allocationFactor;
                paymentBreakdown = {
                    type: "hourly",
                    hoursPerDay,
                    days: 7,
                    hourlyRate,
                    allocation: member.allocation || 100,
                    calculation: `${hoursPerDay} hours/day × 7 days × $${hourlyRate}/hour × ${allocationFactor} allocation`
                };
            } else {
                const estimatedHours = team.projectDuration?.estimatedHours || (projectDays * 8);
                const hourlyRate = Number(consultantData?.baseRate?.hourly || 0);
                paymentAmount = estimatedHours * hourlyRate * allocationFactor;
                paymentBreakdown = {
                    type: "hourly",
                    hours: estimatedHours,
                    hourlyRate,
                    allocation: member.allocation || 100,
                    calculation: `${estimatedHours} hours × $${hourlyRate}/hour × ${allocationFactor} allocation`
                };
            }
        } else if (team.billingPeriod === "weekly") {
            // For weekly billing: weekly rate × number of weeks
            const weeklyRate = Number(consultantData?.baseRate?.weekly || consultantData?.baseRate?.hourly * 40 || 0);
            paymentAmount = weeklyRate * projectWeeks * allocationFactor;
            paymentBreakdown = {
                type: "weekly",
                weeklyRate,
                weeks: projectWeeks,
                allocation: member.allocation || 100,
                calculation: `$${weeklyRate}/week × ${projectWeeks} weeks × ${allocationFactor} allocation`
            };
        } else if (team.billingPeriod === "daily") {
            const dailyRate = Number(consultantData?.baseRate?.daily || consultantData?.baseRate?.hourly * 8 || 0);
            paymentAmount = dailyRate * projectDays * allocationFactor;
            paymentBreakdown = {
                type: "daily",
                dailyRate,
                days: projectDays,
                allocation: member.allocation || 100,
                calculation: `$${dailyRate}/day × ${projectDays} days × ${allocationFactor} allocation`
            };
        }

        return {
            teamId: team._id,
            teamName: team.name,
            teamDescription: team.description,
            client: team.client,
            billingPeriod: team.billingPeriod,
            projectDuration: {
                ...team.projectDuration,
                totalDays: projectDays,
                totalWeeks: projectWeeks
            },
            role: member.role,
            allocation: member.allocation || 100,
            startDate: member.startDate || team.projectDuration?.startDate,
            endDate: member.endDate || team.projectDuration?.endDate,
            // Rate information
            rate: {
                hourly: consultantData?.baseRate?.hourly || 0,
                daily: consultantData?.baseRate?.daily || consultantData?.baseRate?.hourly * 8 || 0,
                weekly: consultantData?.baseRate?.weekly || consultantData?.baseRate?.hourly * 40 || 0,
                currency: consultantData?.baseRate?.currency || "USD"
            },
            // Payment information
            paymentAmount: Math.round(paymentAmount * 100) / 100,
            paymentBreakdown,
            currency: consultantData?.baseRate?.currency || "USD",
            teamTotalBudget: team.totalBudget,
            teamPricingSnapshot: team.pricingSnapshot,
            createdAt: team.createdAt,
            updatedAt: team.updatedAt
        };
    }).filter(Boolean); // Remove null entries

    return assignments;
};

const getTeamById = async (userId, teamId) => {
    const consultant = await Consultant.findOne({ user: userId });
    if (!consultant) throw new ApiError(404, "Consultant profile not found");

    // Find the team and check if consultant is a member
    const team = await TeamSelection.findById(teamId)
        .populate({
            path: "client",
            populate: {
                path: "user",
                select: "name email"
            }
        })
        .populate({
            path: "members.consultant",
            select: "headline bio skills roles level baseRate experienceYears availability locations portfolioLinks",
            populate: {
                path: "user",
                select: "name email user_type isVerified"
            }
        });

    if (!team) throw new ApiError(404, "Team not found");

    // Check if consultant is a member of this team
    const isMember = team.members.some(m =>
        m.consultant && (
            (typeof m.consultant === 'object' && m.consultant._id.toString() === consultant._id.toString()) ||
            (typeof m.consultant === 'string' && m.consultant.toString() === consultant._id.toString())
        )
    );

    if (!isMember) {
        throw new ApiError(403, "You are not a member of this team");
    }

    // Find the consultant's member info in the team
    const consultantMember = team.members.find(m =>
        m.consultant && (
            (typeof m.consultant === 'object' && m.consultant._id.toString() === consultant._id.toString()) ||
            (typeof m.consultant === 'string' && m.consultant.toString() === consultant._id.toString())
        )
    );

    // Calculate project duration
    const msPerDay = 24 * 60 * 60 * 1000;
    const msPerWeek = 7 * msPerDay;

    const daysBetweenInclusive = (start, end) => {
        if (!start || !end) return 1;
        const s = new Date(start).setHours(0, 0, 0, 0);
        const e = new Date(end).setHours(0, 0, 0, 0);
        const days = Math.round((e - s) / msPerDay) + 1;
        return Math.max(1, days);
    };

    const weeksBetweenCeil = (start, end) => {
        if (!start || !end) return 1;
        const s = new Date(start).getTime();
        const e = new Date(end).getTime();
        const weeks = Math.ceil((e - s + 1) / msPerWeek);
        return Math.max(1, weeks);
    };

    const projectDays = team.projectDuration?.startDate && team.projectDuration?.endDate
        ? daysBetweenInclusive(team.projectDuration.startDate, team.projectDuration.endDate)
        : (team.projectDuration?.estimatedHours ? Math.ceil(team.projectDuration.estimatedHours / 8) : 1);

    const projectWeeks = team.projectDuration?.startDate && team.projectDuration?.endDate
        ? weeksBetweenCeil(team.projectDuration.startDate, team.projectDuration.endDate)
        : Math.ceil(projectDays / 7);

    // Format team members with additional info
    const formattedMembers = team.members.map(member => {
        const memberConsultant = typeof member.consultant === 'object' ? member.consultant : null;
        const isCurrentConsultant = memberConsultant && memberConsultant._id.toString() === consultant._id.toString();

        return {
            consultant: memberConsultant,
            role: member.role,
            allocation: member.allocation || 100,
            startDate: member.startDate,
            endDate: member.endDate,
            isCurrentConsultant: isCurrentConsultant || false
        };
    });

    return {
        _id: team._id,
        name: team.name,
        description: team.description,
        client: team.client,
        members: formattedMembers,
        billingPeriod: team.billingPeriod,
        projectDuration: {
            ...team.projectDuration,
            totalDays: projectDays,
            totalWeeks: projectWeeks
        },
        totalBudget: team.totalBudget,
        pricingSnapshot: team.pricingSnapshot,
        requirements: team.requirements,
        myRole: consultantMember?.role,
        myAllocation: consultantMember?.allocation || 100,
        myStartDate: consultantMember?.startDate,
        myEndDate: consultantMember?.endDate,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt
    };
};


const ConsultantService = {
    searchConsultants,
    getConsultantDetails,
    getFeaturedConsultants,
    getConsultantsBySkills,
    getConsultantsByExperience,
    getAllConsultants,
    adminGetAllConsultants,
    adminApproveConsultant,
    adminDisapproveConsultant,
    getConsultantApprovalStatus,
    adminUpdateLevel,
    getConsultantTeamAssignments,
    getTeamById
};

export default ConsultantService;
