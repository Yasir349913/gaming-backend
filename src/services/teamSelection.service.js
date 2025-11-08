import mongoose from "mongoose";
import TeamSelection from "../models/teamSelection.model.js";
import Consultant from "../models/consultant.model.js";
import { ApiError } from "../utils/index.js";

const msPerDay = 24 * 60 * 60 * 1000;
const msPerWeek = 7 * msPerDay;


const MAX_TEAMS_PER_CLIENT = 3;
const MAX_MEMBERS_PER_TEAM = 3;

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

const getRateForPeriod = (member, consultant, period) => {
    const base = consultant?.baseRate || {};
    if (period === "hourly") {
        return Number(base.hourly || 0);
    }
    if (period === "daily") {
        if (typeof base.daily === "number") return Number(base.daily);
        const hourly = Number(base.hourly || 0);
        return hourly * 8;
    }
    if (period === "weekly") {
        if (typeof base.weekly === "number") return Number(base.weekly);
        const hourly = Number(base.hourly || 0);
        return hourly * 40;
    }
    return 0;
};

const calculatePricingForTeam = async (teamDoc, { taxPercent = 0, discountPercent = 0 } = {}) => {
    const members = Array.isArray(teamDoc.members) ? teamDoc.members : [];
    if (members.length === 0) {
        return {
            currency: teamDoc.totalBudget?.currency || "USD",
            subtotal: 0,
            discount: 0,
            tax: 0,
            total: 0
        };
    }

    // ✅ NORMALIZE CONSULTANT IDs - Handle both string and object formats
    const consultantIds = members.map((m) => {
        const consultant = m.consultant;
        // If consultant is a string, use it directly
        if (typeof consultant === 'string') {
            return consultant;
        }
        // If consultant is an object, extract the _id
        if (consultant && typeof consultant === 'object') {
            return consultant._id || consultant.id;
        }
        return null;
    }).filter(Boolean); // Remove any null values

    const consultants = await Consultant.find({ _id: { $in: consultantIds } }).lean();
    const consMap = new Map(consultants.map((c) => [String(c._id), c]));

    const period = teamDoc.billingPeriod || "hourly";

    // Calculate project duration in days and weeks
    const projectDays = teamDoc.projectDuration?.startDate && teamDoc.projectDuration?.endDate
        ? daysBetweenInclusive(teamDoc.projectDuration.startDate, teamDoc.projectDuration.endDate)
        : (teamDoc.projectDuration?.estimatedHours ? Math.ceil(teamDoc.projectDuration.estimatedHours / 8) : 1);
    const projectWeeks = teamDoc.projectDuration?.startDate && teamDoc.projectDuration?.endDate
        ? weeksBetweenCeil(teamDoc.projectDuration.startDate, teamDoc.projectDuration.endDate)
        : Math.ceil(projectDays / 7);

    let units = 1;
    if (period === "hourly") {
        units =
            Number(teamDoc.projectDuration?.estimatedHours ?? 0) ||
            (teamDoc.projectDuration?.startDate && teamDoc.projectDuration?.endDate
                ? daysBetweenInclusive(teamDoc.projectDuration.startDate, teamDoc.projectDuration.endDate) * 8
                : 1);
    } else if (period === "daily") {
        units = projectDays;
    } else if (period === "weekly") {
        units = projectWeeks;
    }

    let subtotal = 0;
    let currency = teamDoc.totalBudget?.currency || "USD";

    for (const m of members) {
        // ✅ NORMALIZE consultant ID here too for the loop
        const consultant = m.consultant;
        const cid = typeof consultant === 'string'
            ? consultant
            : (consultant?._id || consultant?.id);

        if (!cid) continue; // Skip if no valid consultant ID

        const consultantData = consMap.get(String(cid)) || null;
        const allocationFactor = (typeof m.allocation === "number" ? m.allocation : 100) / 100;
        
        let memberCost = 0;
        
        if (period === "hourly") {
            // For hourly billing: if duration is a week, use hoursPerDay × 7 × hourly rate
            // Otherwise use the standard calculation
            if (projectDays === 7 || projectWeeks === 1) {
                const hoursPerDay = consultantData?.availability?.hoursPerDay || 8;
                const hourlyRate = Number(consultantData?.baseRate?.hourly || 0);
                memberCost = hoursPerDay * 7 * hourlyRate * allocationFactor;
            } else {
                const rawRate = getRateForPeriod(m, consultantData, period);
                const memberUnits = units * allocationFactor;
                memberCost = rawRate * memberUnits;
            }
        } else if (period === "weekly") {
            // For weekly billing: weekly rate × number of weeks
            const weeklyRate = getRateForPeriod(m, consultantData, period);
            memberCost = weeklyRate * units * allocationFactor;
        } else {
            // Daily or other periods use standard calculation
            const rawRate = getRateForPeriod(m, consultantData, period);
            const memberUnits = units * allocationFactor;
            memberCost = rawRate * memberUnits;
        }
        
        subtotal += Number(memberCost || 0);
        if (!teamDoc.totalBudget?.currency && consultantData?.baseRate?.currency) {
            currency = consultantData.baseRate.currency;
        }
    }

    subtotal = Math.round(subtotal * 100) / 100;

    // Apply discount
    const discount = Math.round((subtotal * (Number(discountPercent) || 0) / 100) * 100) / 100;
    const afterDiscount = subtotal - discount;

    const tax = Math.round((afterDiscount * (Number(taxPercent) || 0) / 100) * 100) / 100;
    const total = Math.round((afterDiscount + tax) * 100) / 100;

    return { currency, subtotal, discount, tax, total };
};

const _recalcAndSave = async (team, options = {}) => {
    const snapshot = await calculatePricingForTeam(team, options);
    team.pricingSnapshot = snapshot;
    team.totalBudget = team.totalBudget || {};
    team.totalBudget.currency = team.totalBudget.currency || snapshot.currency;
    team.totalBudget.amount = snapshot.total;
    await team.save();

    // Emit real-time update if socket.io is available
    if (global.io) {
        global.io.to(`team_${team._id}`).emit('pricing_updated', {
            teamId: team._id,
            pricing: snapshot
        });
    }

    return team;
};

const createTeam = async ({ userId, name, description, requirements = {}, billingPeriod = "hourly" }) => {
    if (!name) throw new ApiError(400, "Team name is required");

    // Check if client already has maximum teams
    const existingTeamsCount = await TeamSelection.countDocuments({
        client: new mongoose.Types.ObjectId(userId)
    });

    if (existingTeamsCount >= MAX_TEAMS_PER_CLIENT) {
        throw new ApiError(400, `You can only create up to ${MAX_TEAMS_PER_CLIENT} teams`);
    }

    const team = await TeamSelection.create({
        name,
        description,
        client: new mongoose.Types.ObjectId(userId),
        requirements,
        members: [],
        totalBudget: { currency: "USD", amount: 0 },
        pricingSnapshot: { currency: "USD", subtotal: 0, discount: 0, tax: 0, total: 0 },
        billingPeriod,
    });
    return team;
};

const getTeam = async (teamId, userId) => {
    const team = await TeamSelection.findById(teamId)
        .populate({
            path: "members.consultant",
            populate: {
                path: "user",                        // ← Add nested populate
                select: "name email "  // ← Select the fields you need
            }
        });

    if (!team) throw new ApiError(404, "Team not found");
    if (team.client.toString() !== userId.toString()) throw new ApiError(403, "Access denied");

    return team;
};

const listClientTeams = async (userId, { page = 1, limit = 25 } = {}) => {
    const q = { client: new mongoose.Types.ObjectId(userId) };
    const skip = (Math.max(1, page) - 1) * limit;
    const teams = await TeamSelection.find(q).sort({ updatedAt: -1 }).skip(skip).limit(limit);
    const total = await TeamSelection.countDocuments(q);
    return { teams, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) };
};

const updateTeam = async (teamId, userId, payload) => {
    const team = await TeamSelection.findById(teamId);
    if (!team) throw new ApiError(404, "Team not found");
    if (team.client.toString() !== userId.toString()) throw new ApiError(403, "Access denied");

    const allowed = ["name", "description", "requirements", "projectDuration", "billingPeriod"];
    for (const k of allowed) {
        if (payload[k] !== undefined) team[k] = payload[k];
    }

    await _recalcAndSave(team, { taxPercent: payload.taxPercent ?? 0, discountPercent: payload.discountPercent ?? 0 });
    return team;
};

const addMember = async (teamId, userId, memberPayload) => {
    const team = await TeamSelection.findById(teamId);
    if (!team) throw new ApiError(404, "Team not found");
    if (team.client.toString() !== userId.toString()) throw new ApiError(403, "Access denied");
    if (!memberPayload?.consultant) throw new ApiError(400, "consultant id required");

    // Change this line from 9 to 3
    if (team.members.length >= MAX_MEMBERS_PER_TEAM) {
        throw new ApiError(400, `A team may contain at most ${MAX_MEMBERS_PER_TEAM} consultants`);
    }

    const consultant = await Consultant.findById(memberPayload.consultant);
    if (!consultant) throw new ApiError(404, "Consultant not found");
    if (!consultant.approved) throw new ApiError(400, "Consultant is not approved");

    if (team.members.some((m) => m.consultant.toString() === consultant._id.toString())) {
        throw new ApiError(400, "Consultant already in team");
    }

    const selectedRole = memberPayload.role || (consultant.roles && consultant.roles[0]) || "";

    const member = {
        consultant: consultant._id,
        role: selectedRole,
        allocation: memberPayload.allocation !== undefined ? memberPayload.allocation : 100,
        startDate: memberPayload.startDate,
        endDate: memberPayload.endDate,
    };

    team.members.push(member);
    await _recalcAndSave(team);
    return team;
};


const removeMember = async (teamId, userId, consultantId) => {
    const team = await TeamSelection.findById(teamId);
    if (!team) throw new ApiError(404, "Team not found");
    if (team.client.toString() !== userId.toString()) throw new ApiError(403, "Access denied");

    const before = team.members.length;
    team.members = team.members.filter((m) => m.consultant.toString() !== consultantId.toString());

    if (team.members.length === before) throw new ApiError(404, "Consultant not in team");

    await _recalcAndSave(team);
    return team;
};

const updateMember = async (teamId, userId, consultantId, updatePayload) => {
    const team = await TeamSelection.findById(teamId);
    if (!team) throw new ApiError(404, "Team not found");
    if (team.client.toString() !== userId.toString()) throw new ApiError(403, "Access denied");

    const idx = team.members.findIndex((m) => m.consultant.toString() === consultantId.toString());
    if (idx === -1) throw new ApiError(404, "Consultant not in team");

    const allowed = ["role", "allocation", "startDate", "endDate"];
    for (const k of allowed) {
        if (updatePayload[k] !== undefined) team.members[idx][k] = updatePayload[k];
    }

    await _recalcAndSave(team);
    return team;
};

const addMultipleMembers = async (teamId, userId, membersArray) => {
    const team = await TeamSelection.findById(teamId);
    if (!team) throw new ApiError(404, "Team not found");
    if (team.client.toString() !== userId.toString()) throw new ApiError(403, "Access denied");

    // Change this line from 9 to 3
    if (team.members.length + membersArray.length > MAX_MEMBERS_PER_TEAM) {
        throw new ApiError(400, `Adding these members would exceed the ${MAX_MEMBERS_PER_TEAM} consultant limit`);
    }

    // Validate all consultants exist
    const consultantIds = membersArray.map(m => m.consultant);
    const consultants = await Consultant.find({ _id: { $in: consultantIds }, approved: true });

    if (consultants.length !== consultantIds.length) {
        throw new ApiError(404, "One or more consultants not found or not approved");
    }

    // Check for duplicates
    const existingIds = team.members.map(m => m.consultant.toString());
    const hasDuplicates = consultantIds.some(id => existingIds.includes(id.toString()));

    if (hasDuplicates) {
        throw new ApiError(400, "One or more consultants already in team");
    }

    // Add all members
    membersArray.forEach(memberData => {
        const consultant = consultants.find(c => c._id.toString() === memberData.consultant.toString());
        const selectedRole = memberData.role || consultant?.roles?.[0] || "";

        team.members.push({
            consultant: memberData.consultant,
            role: selectedRole,
            allocation: memberData.allocation !== undefined ? memberData.allocation : 100,
            startDate: memberData.startDate,
            endDate: memberData.endDate
        });
    });

    await _recalcAndSave(team);
    return team;
};

const generateShareLink = async (teamId, userId, { expiresInDays = 30 } = {}) => {
    const team = await TeamSelection.findById(teamId);
    if (!team) throw new ApiError(404, "Team not found");
    if (team.client.toString() !== userId.toString()) throw new ApiError(403, "Access denied");

    const id = `${team._id.toString().slice(-6)}-${Date.now().toString(36).slice(-6)}`;
    team.shareLinkId = id;
    team.isShared = true;
    team.shareExpiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 3600 * 1000) : null;
    await team.save();

    return { shareLinkId: id, shareExpiresAt: team.shareExpiresAt };
};

const getSharedTeam = async (shareLinkId) => {
    const team = await TeamSelection.findOne({ shareLinkId, isShared: true }).populate("members.consultant");
    if (!team) throw new ApiError(404, "Shared team not found");

    // Check if share link is expired
    if (team.shareExpiresAt && new Date() > team.shareExpiresAt) {
        throw new ApiError(403, "Share link has expired");
    }

    return team;
};

const deleteTeam = async (teamId, userId) => {
    const team = await TeamSelection.findById(teamId);
    if (!team) throw new ApiError(404, "Team not found");
    if (team.client.toString() !== userId.toString()) throw new ApiError(403, "Access denied");

    await TeamSelection.findByIdAndDelete(teamId);
    return true;
};

const getRecommendedConsultants = async (teamId, userId) => {
    const team = await TeamSelection.findById(teamId);
    if (!team) throw new ApiError(404, "Team not found");
    if (team.client.toString() !== userId.toString()) throw new ApiError(403, "Access denied");

    // Get current team member IDs to exclude them
    const currentMemberIds = team.members.map(m => m.consultant.toString());

    // Build filter based on team requirements
    const filter = {
        approved: true,
        _id: { $nin: currentMemberIds }
    };

    // Apply requirements filters
    if (team.requirements) {
        const { skills, minExperience, preferredTimezone, remote, maxHourlyRate } = team.requirements;

        if (skills && skills.length > 0) {
            filter.skills = { $in: skills };
        }

        if (typeof minExperience === "number" && minExperience > 0) {
            filter.experienceYears = { $gte: minExperience };
        }

        if (preferredTimezone) {
            filter["availability.timezone"] = preferredTimezone;
        }

        if (typeof remote === "boolean") {
            filter["availability.remote"] = remote;
        }

        if (typeof maxHourlyRate === "number" && maxHourlyRate > 0) {
            filter["baseRate.hourly"] = { $lte: maxHourlyRate };
        }
    }

    // Get recommended consultants
    const consultants = await Consultant.find(filter)
        .populate({
            path: "user",
            select: "name email user_type isVerified"
        })
        .sort("-experienceYears -createdAt")
        .limit(20);

    return consultants;
};

const TeamSelectionService = {
    createTeam,
    getTeam,
    listClientTeams,
    updateTeam,
    addMember,
    removeMember,
    updateMember,
    addMultipleMembers,
    generateShareLink,
    getSharedTeam,
    deleteTeam,
    calculatePricingForTeam,
    getRecommendedConsultants,
};

export default TeamSelectionService;