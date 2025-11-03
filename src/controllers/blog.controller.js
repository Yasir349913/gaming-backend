import BlogService from "../services/blog.service.js";
import { ApiResponse, ApiError } from "../utils/index.js";

export const createBlog = async (req, res) => {
    try {
        const blog = await BlogService.createBlog(req.user._id, req.body, req.file?.path);
        res.status(201).json(new ApiResponse(201, blog, "Blog created successfully"));
    } catch (err) {
        throw new ApiError(400, err.message);
    }
};

export const getAllBlogs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;

        if (page < 1) {
            throw new ApiError(400, "Page number must be greater than 0");
        }
        if (limit < 1 || limit > 50) {
            throw new ApiError(400, "Limit must be between 1 and 50");
        }

        const result = await BlogService.getAllBlogs(page, limit);
        res.status(200).json(
            new ApiResponse(200, result, "Blogs retrieved successfully")
        );
    } catch (err) {
        throw new ApiError(400, err.message);
    }
};

export const getBlogById = async (req, res) => {
    try {
        const blog = await BlogService.getBlogById(req.params.id);
        res.status(200).json(new ApiResponse(200, blog, "Blog details fetched"));
    } catch (err) {
        throw new ApiError(400, err.message);
    }
};

export const updateBlog = async (req, res) => {
    try {
        const blog = await BlogService.updateBlog(req.params.id, req.body, req.file?.path);
        res.status(200).json(new ApiResponse(200, blog, "Blog updated successfully"));
    } catch (err) {
        throw new ApiError(400, err.message);
    }
};

export const deleteBlog = async (req, res) => {
    try {
        await BlogService.deleteBlog(req.params.id);
        res.status(200).json(new ApiResponse(200, null, "Blog deleted successfully"));
    } catch (err) {
        throw new ApiError(400, err.message);
    }
};