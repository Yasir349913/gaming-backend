import express from "express";
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import onboardingRoutes from "./onboarding.routes.js";
import teamSelectionRoutes from "./teamSelection.routes.js";
import consultantRoutes from "./consultant.routes.js";
import faqRoutes from "./faq.routes.js";
import blogRoutes from "./blog.routes.js";
import forumRoutes from "./forum.routes.js";
import { env } from "../config/index.js";

const router = express.Router();

// Mount routes
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/onboarding", onboardingRoutes);
router.use("/teams", teamSelectionRoutes);
router.use("/consultants", consultantRoutes);
router.use("/faq", faqRoutes);
router.use("/blog", blogRoutes);
router.use("/forum", forumRoutes);


// Health check route
router.get("/health", (req, res) => {
    res.json({
        status: "API is running",
        timestamp: new Date().toISOString(),
        environment: env.NODE_ENV
    });
});

export default router;
