import express from "express";
import cors from "cors";
import helmet from "helmet";
import xssClean from "xss-clean";
import mongoSanitize from "express-mongo-sanitize";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";

import { notFoundHandler, errorHandler } from "./middlewares/index.js";
import routes from "./routes/index.js";
import { env } from "./config/index.js";

const app = express();

// Build allowed origins from environment variables
const envOrigins = (env.CORS_ORIGINS || env.CLIENT_URL || env.ADMIN_URL || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

// Default development origins
const defaultOrigins = ["http://localhost:3000", "http://localhost:3001", "https://innovativegaming.vercel.app/","https://gaming-frontend-lemon.vercel.app/","https://gaming-frontend-lemon.vercel.app"];

// Combine and deduplicate
const allowedOrigins = [...new Set([...envOrigins, ...defaultOrigins])];

console.log("CORS allowed origins:", allowedOrigins);

app.use(
    cors({
        origin: (origin, cb) => {
            // Allow requests with no origin (like mobile apps or curl requests)
            if (!origin) return cb(null, true);

            // Check if origin is in allowed list
            if (allowedOrigins.includes(origin)) {
                return cb(null, true);
            }

            // Log blocked origins for debugging
            console.log(`CORS blocked: ${origin} is not in allowlist`);
            console.log("Allowed origins:", allowedOrigins);

            return cb(new Error(`CORS blocked: ${origin} is not in allowlist`));
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    })
);

// CRITICAL: Body parsers MUST come early, before other middleware
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser(env.COOKIE_SECRET));

// helmet → browser protection via headers
app.use(helmet());

// mongoSanitize → block database injection
// app.use(mongoSanitize());

// Morgan for development logging
if (env.NODE_ENV === "development") {
    try {
        const morgan = (await import("morgan")).default;
        app.use(morgan("dev"));
    } catch {
        console.warn("Morgan not installed; skipping logger");
    }
}

// Trust proxy settings
if (env.NODE_ENV === "production" || env.TRUST_PROXY === "1") {
    app.set("trust proxy", 1);
}

// Rate limiting
const limiter = rateLimit({
    windowMs: Number(env.RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000),
    max: Number(env.RATE_LIMIT_MAX_REQUESTS ?? 100),
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests from this IP, please try again later.",
});
app.use("/api/v1", limiter);

// Routes
app.use("/api/v1", routes);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;