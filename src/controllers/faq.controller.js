import FaqService from "../services/faq.service.js";
import { ApiResponse, ApiError } from "../utils/index.js";

export const createFaq = async (req, res) => {
    try {
        const faq = await FaqService.createFaq(req.user._id, req.body);
        res.status(201).json(new ApiResponse(201, faq, "FAQ created successfully"));
    } catch (err) {
        throw new ApiError(400, err.message);
    }
};

export const getAllFaqs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;

        if (page < 1) {
            throw new ApiError(400, "Page number must be greater than 0");
        }
        if (limit < 1 || limit > 50) {
            throw new ApiError(400, "Limit must be between 1 and 50");
        }

        const result = await FaqService.getAllFaqs(page, limit);
        res.status(200).json(
            new ApiResponse(200, result, "FAQs retrieved successfully")
        );
    } catch (err) {
        throw new ApiError(400, err.message);
    }
};

export const updateFaq = async (req, res) => {
    try {
        const faq = await FaqService.updateFaq(req.params.id, req.body);
        res.status(200).json(new ApiResponse(200, faq, "FAQ updated successfully"));
    } catch (err) {
        throw new ApiError(400, err.message);
    }
};

export const deleteFaq = async (req, res) => {
    try {
        await FaqService.deleteFaq(req.params.id);
        res.status(200).json(new ApiResponse(200, null, "FAQ deleted successfully"));
    } catch (err) {
        throw new ApiError(400, err.message);
    }
};