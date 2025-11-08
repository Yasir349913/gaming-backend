import { ApiResponse, ApiError } from "../utils/index.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import OnboardingService from "../services/onboarding.service.js";


export const completeClientProfile = async (req, res, next) => {
    try {
        const client = await OnboardingService.completeClientProfile(req.user._id, req.body);
        res.status(200).json(new ApiResponse(200, client, "Client profile created/updated"));
    } catch (err) {
        next(err);
    }
};


export const completeConsultantProfile = async (req, res, next) => {
    try {
        let payload = { ...req.body };


        const consultant = await OnboardingService.completeConsultantProfile(req.user._id, payload);
        res.status(200).json(new ApiResponse(200, consultant, "Consultant profile created/updated"));
    } catch (err) {
        next(err);
    }
};


export const getClientProfile = async (req, res, next) => {
    try {
        const client = await OnboardingService.getClientProfile(req.user._id);
        res.status(200).json(new ApiResponse(200, client, "Client profile fetched successfully"));
    } catch (err) {
        next(err);
    }
};


export const getConsultantProfile = async (req, res, next) => {
    try {
        const consultant = await OnboardingService.getConsultantProfile(req.user._id);
        res.status(200).json(new ApiResponse(200, consultant, "Consultant profile fetched successfully"));
    } catch (err) {
        next(err);
    }
};


export const updateClientProfile = async (req, res, next) => {
    try {
        const client = await OnboardingService.updateClientProfile(req.user._id, req.body);
        res.status(200).json(new ApiResponse(200, client, "Client profile updated successfully"));
    } catch (err) {
        next(err);
    }
};


export const updateConsultantProfile = async (req, res, next) => {
    try {
        let payload = { ...req.body };



        const consultant = await OnboardingService.updateConsultantProfile(req.user._id, payload);
        res.status(200).json(new ApiResponse(200, consultant, "Consultant profile updated successfully"));
    } catch (err) {
        next(err);
    }
};