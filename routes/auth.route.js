import express from "express";
import { signup, activation, login, forgotPassword, resetPassword, google, sessionAuth } from "../controllers/auth.controller.js";
import { isAuthenticated } from "../middleware/auth.js";

const router = express.Router();

router.post("/signup", signup);
router.get("/activation/:activation_token", activation);
router.post("/login", login)
router.post("/forgot-password", forgotPassword)
router.post("/reset-password/:token", resetPassword);
router.post("/google", google);
router.get("/",isAuthenticated, sessionAuth);

export default router;
