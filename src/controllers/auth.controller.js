import AuthService from "../services/auth.service.js";
import { ApiResponse, ApiError } from "../utils/index.js";
import { getVerificationSuccessHTML, getVerificationErrorHTML } from "../utils/email.util.js";
import { env } from "../config/index.js";

export const register = async (req, res) => {
    // Safety check for req.body
    if (!req.body || typeof req.body !== 'object') {
        throw new ApiError(400, "Request body is missing or invalid. Please ensure you're sending JSON data with Content-Type: application/json header.");
    }

    const { name, email, password, user_type } = req.body;

    if (!user_type || !["client", "consultant", "admin"].includes(user_type)) {
        throw new ApiError(400, "Invalid user type. Must be either 'client' or 'consultant'. Available options: client (hire consultants), consultant (offer services)");
    }

    try {
        const { user } = await AuthService.registerUser({
            name,
            email,
            password,
            user_type
        });

        const roleDescription = user.user_type === 'client'
            ? 'You can now hire consultants for your projects'
            : 'You can now offer your services as a consultant';

        res.status(201).json(new ApiResponse(201, {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                user_type: user.user_type,
                isVerified: user.isVerified,
                requiresOnboarding: true
            }
        }, `Registration successful as ${user.user_type}. ${roleDescription}. Please verify your email and complete your profile setup.`));
    } catch (err) {
        throw new ApiError(400, err.message);
    }
};

export const verifyEmail = async (req, res) => {
    const { token } = req.query;

    try {
        const user = await AuthService.verifyEmail(token);

        // Option 1: Return HTML page (current approach)
        res.status(200).send(getVerificationSuccessHTML(user.email));

        // Option 2: Redirect to frontend (uncomment if you prefer this)
        // res.redirect(`${env.FRONTEND_URL}/email-verified?success=true&email=${encodeURIComponent(user.email)}`);

    } catch (err) {
        // Option 1: Return HTML error page (current approach)
        res.status(400).send(getVerificationErrorHTML(err.message));

        // Option 2: Redirect to frontend with error (uncomment if you prefer this)
        // res.redirect(`${env.FRONTEND_URL}/email-verified?success=false&error=${encodeURIComponent(err.message)}`);
    }
};

export const login = async (req, res) => {
    // Safety check for req.body
    if (!req.body || typeof req.body !== 'object') {
        throw new ApiError(400, "Request body is missing or invalid. Please ensure you're sending JSON data with Content-Type: application/json header.");
    }

    const { email, password } = req.body;

    try {
        const { user, accessToken, refreshToken } = await AuthService.loginUser({
            email,
            password
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 15 * 60 * 1000
        });

        res.status(200).json(new ApiResponse(200, {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                user_type: user.user_type
            },
            accessToken,
            refreshToken
        }, "Login successful"));
    } catch (err) {
        throw new ApiError(400, err.message);
    }
};

export const googleRegister = async (req, res) => {
    // Safety check for req.body
    if (!req.body || typeof req.body !== 'object') {
        throw new ApiError(400, "Request body is missing or invalid. Please ensure you're sending JSON data with Content-Type: application/json header.");
    }

    const { idToken, user_type } = req.body;

    if (!user_type || !["client", "consultant"].includes(user_type)) {
        throw new ApiError(400, "Invalid user type. Must be either 'client' or 'consultant'. Available options: client (hire consultants), consultant (offer services)");
    }

    try {
        const { user } = await AuthService.registerWithGoogle(idToken, user_type);

        const roleDescription = user.user_type === 'client'
            ? 'You can now hire consultants for your projects'
            : 'You can now offer your services as a consultant';

        res.status(201).json(new ApiResponse(201, {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                user_type: user.user_type,
                isVerified: user.isVerified,
                requiresOnboarding: true
            }
        }, `Google registration successful as ${user.user_type}. ${roleDescription}. Please complete your profile setup.`));
    } catch (err) {
        throw new ApiError(400, err.message);
    }
};

export const checkAuth = async (req, res) => {
    // This endpoint will be called by frontend to check auth status
    // The auth middleware will handle token validation
    res.status(200).json(new ApiResponse(200, {
        user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            user_type: req.user.user_type,
            isVerified: req.user.isVerified
        }
    }, "User is authenticated"));
};

export const googleLogin = async (req, res) => {
    // Safety check for req.body
    if (!req.body || typeof req.body !== 'object') {
        throw new ApiError(400, "Request body is missing or invalid. Please ensure you're sending JSON data with Content-Type: application/json header.");
    }

    const { idToken } = req.body;

    try {
        const { user, accessToken, refreshToken } = await AuthService.loginWithGoogle(idToken);

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 15 * 60 * 1000
        });

        res.status(200).json(new ApiResponse(200, {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                user_type: user.user_type,
                isVerified: user.isVerified,
                requiresOnboarding: false
            },
            accessToken,
            refreshToken
        }, "Google login successful"));
    } catch (err) {
        throw new ApiError(400, err.message);
    }
};

export const refreshToken = async (req, res) => {
    try {
        const refresh = req.cookies?.refreshToken || req.body.refreshToken;
        const { accessToken } = await AuthService.refreshAccessToken(refresh);

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 15 * 60 * 1000
        });

        res.status(200).json(new ApiResponse(200, { accessToken }, "Token refreshed successfully"));
    } catch (err) {
        throw new ApiError(401, err.message);
    }
};

export const logout = async (req, res) => {
    try {
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");

        if (req.user) {
            await AuthService.logout(req.user._id);
        }

        res.status(200).json(new ApiResponse(200, null, "Logged out successfully"));
    } catch (err) {
        throw new ApiError(400, err.message);
    }
};
