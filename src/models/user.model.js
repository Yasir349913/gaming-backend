import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { env } from "../config/index.js";
import {
    hashPassword,
    comparePassword,
    hashRefreshToken,
    compareRefreshToken,
} from "../helper/auth.helper.js";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [6, "Password must be at least 6 characters"],
            select: false,
        },
        refreshToken: {
            type: String,
            default: null,
            select: false,
        },
        user_type: {
            type: String,
            enum: ["client", "consultant", "admin"],
            default: "client",
        },

        language_preference: {
            type: String,
            enum: ["english", "spanish", "french"],
            default: "english",
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        oauthProvider: {
            type: String,
            enum: ["local", "google"],
            default: "local",
        },
        oauthId: {
            type: String,
            index: true,
        },
        oauthEmailVerified: {
            type: Boolean,
            default: false,
        },
        oauthAvatar: {
            type: String,
            trim: true,
        },
        karma: {
            type: Number,
            default: 0,
            min: 0,
        },
    },
    { timestamps: true }
);

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await hashPassword(this.password);
    next();
});

userSchema.methods.comparePassword = function (candidatePassword) {
    return comparePassword(candidatePassword, this.password);
};

userSchema.methods.generateAccessToken = function () {
    return jwt.sign({ id: this._id, role: this.user_type }, env.JWT_ACCESS_SECRET, {
        expiresIn: env.JWT_ACCESS_EXPIRES || "15m",
    });
};

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign({ id: this._id }, env.JWT_REFRESH_SECRET, {
        expiresIn: env.JWT_REFRESH_EXPIRES || "7d",
    });
};

userSchema.methods.setHashedRefreshToken = async function (token) {
    this.refreshToken = await hashRefreshToken(token);
    await this.save();
};

userSchema.methods.compareRefreshToken = function (token) {
    if (!this.refreshToken) return false;
    return compareRefreshToken(token, this.refreshToken);
};

const User = mongoose.model("User", userSchema);
export default User;