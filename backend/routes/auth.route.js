import express from 'express';
import { login, logout, signup, refreshToken, getProfile, googleAuthSuccess, googleAuthFailure } from '../controllers/auth.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';
import passport from '../lib/passport.js';

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.post("/refresh-token", refreshToken);
router.get("/profile", protectRoute, getProfile);

// Google OAuth routes
router.get("/google", 
    passport.authenticate("google", { 
        scope: ["profile", "email"] 
    })
);

router.get("/google/callback",
    passport.authenticate("google", { 
        failureRedirect: "/auth/google/failure",
        session: false 
    }),
    googleAuthSuccess
);

router.get("/google/failure", googleAuthFailure);

export default router;