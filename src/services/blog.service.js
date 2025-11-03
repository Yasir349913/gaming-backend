import Blog from "../models/blog.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiError } from "../utils/index.js";

const createBlog = async (authorId, data, filePath) => {
    const { title, content, tags, isPublished } = data;

    let imageUrl = null;
    if (filePath) {
        const uploadResponse = await uploadOnCloudinary(filePath, { folder: "blogs" });
        imageUrl = uploadResponse.secure_url;
    }

    const blog = await Blog.create({
        title,
        content,
        imageUrl,
        author: authorId,
        tags,
        isPublished
    });

    return blog;
};

const getAllBlogs = async (page = 1, limit = 5) => {
    const skip = (page - 1) * limit;

    const [blogs, total] = await Promise.all([
        Blog.find({ isPublished: true })
            .populate("author", "name email")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Blog.countDocuments({ isPublished: true })
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
        blogs,
        pagination: {
            currentPage: page,
            totalPages,
            totalBlogs: total,
            limit,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
        }
    };
};

const getBlogById = async (id) => {
    const blog = await Blog.findById(id).populate("author", "name email");
    if (!blog) throw new ApiError(404, "Blog not found");
    return blog;
};

const updateBlog = async (id, data, filePath) => {
    const blog = await Blog.findById(id);
    if (!blog) throw new ApiError(404, "Blog not found");

    const { title, content, tags, isPublished } = data;

    // Update image if new file provided
    let imageUrl = blog.imageUrl;
    if (filePath) {
        const uploadResponse = await uploadOnCloudinary(filePath, { folder: "blogs" });
        imageUrl = uploadResponse.secure_url;
    }

    blog.title = title || blog.title;
    blog.content = content || blog.content;
    blog.imageUrl = imageUrl;
    blog.tags = tags || blog.tags;
    blog.isPublished = isPublished !== undefined ? isPublished : blog.isPublished;

    await blog.save();
    return blog;
};

const deleteBlog = async (id) => {
    const blog = await Blog.findById(id);
    if (!blog) throw new ApiError(404, "Blog not found");

    await Blog.findByIdAndDelete(id);
    return { message: "Blog deleted successfully" };
};

const BlogService = {
    createBlog,
    getAllBlogs,
    getBlogById,
    updateBlog,
    deleteBlog
};

export default BlogService;