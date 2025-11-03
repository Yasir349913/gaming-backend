import Faq from "../models/faq.model.js";
import { ApiError } from "../utils/index.js";

const createFaq = async (userId, data) => {
    const { question, answer } = data;
    return await Faq.create({ question, answer, createdBy: userId });
};

const getAllFaqs = async (page = 1, limit = 5) => {
    const skip = (page - 1) * limit;

    const [faqs, total] = await Promise.all([
        Faq.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Faq.countDocuments()
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
        faqs,
        pagination: {
            currentPage: page,
            totalPages,
            totalFaqs: total,
            limit,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
        }
    };
};

const updateFaq = async (id, data) => {
    const faq = await Faq.findById(id);
    if (!faq) throw new ApiError(404, "FAQ not found");

    const { question, answer } = data;
    faq.question = question || faq.question;
    faq.answer = answer || faq.answer;

    await faq.save();
    return faq;
};

const deleteFaq = async (id) => {
    const faq = await Faq.findById(id);
    if (!faq) throw new ApiError(404, "FAQ not found");

    await Faq.findByIdAndDelete(id);
    return { message: "FAQ deleted successfully" };
};

const FaqService = {
    createFaq,
    getAllFaqs,
    updateFaq,
    deleteFaq
};

export default FaqService;