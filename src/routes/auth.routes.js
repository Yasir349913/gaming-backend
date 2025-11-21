import express from "express";
import { authController } from "../controllers/index.js";
import { validateBody, auth } from "../middlewares/index.js";
import { registerSchema, loginSchema, refreshTokenSchema, googleRegisterSchema, googleLoginSchema } from "../validations/index.js";
import { ApiError } from "../utils/index.js";

const router = express.Router();

// Registration and authentication routes  
router.post("/register", validateBody(registerSchema), authController.register);
router.post("/login", validateBody(loginSchema), authController.login);
router.get("/verify-email", authController.verifyEmail);
router.post("/refresh-token", validateBody(refreshTokenSchema), authController.refreshToken);
router.post("/logout", authController.logout);

// Google auth
router.post("/register/google", validateBody(googleRegisterSchema), authController.googleRegister);
router.post("/login/google", validateBody(googleLoginSchema), authController.googleLogin);
// Auth check endpoint
router.get("/check", auth, authController.checkAuth);

export default router;
