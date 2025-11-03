import dotenv from "dotenv";

dotenv.config();

export const env = {
    // Environment & Server
    NODE_ENV: process.env.NODE_ENV || "development",
    PORT: process.env.PORT || 8000,

    // Database
    MONGO_URI: process.env.MONGO_URI,

    // JWT Secrets
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || process.env.ACCESS_TOKEN_SECRET,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || process.env.REFRESH_TOKEN_SECRET,
    JWT_EMAIL_VERIFY_SECRET: process.env.JWT_EMAIL_VERIFY_SECRET,
    JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES || process.env.ACCESS_TOKEN_EXPIRY || "15m",
    JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES || process.env.REFRESH_TOKEN_EXPIRY || "7d",

    // Cookie
    COOKIE_SECRET: process.env.COOKIE_SECRET,

    // CORS & Frontend URLs
    CORS_ORIGINS: process.env.CORS_ORIGINS,
    CLIENT_URL: process.env.CLIENT_URL,
    ADMIN_URL: process.env.ADMIN_URL,
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',

    // Email Configuration
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    FROM_EMAIL: process.env.FROM_EMAIL || 'onboarding@resend.dev',
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'support@resend.dev',

    // Google OAuth
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
    RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS,

    CLOUDINARY_NAME: process.env.CLOUDINARY_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,

    // Trust Proxy
    TRUST_PROXY: process.env.TRUST_PROXY,
};
