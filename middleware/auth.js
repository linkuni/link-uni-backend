import jwt from "jsonwebtoken"
import User from "../models/user.model.js";
import dotenv from "dotenv";
dotenv.config();

export const isAuthenticated = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        // const { token } = req.cookies; // Alternative way to extract token
        
        if (!token) {
            return res.status(401).json({ message: "Unauthorized! Please log in to continue" });
        }

        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Fetch user based on decoded token payload
        req.user = await User.findById(decoded.id);
        
        // Proceed to the next middleware if everything is fine
        next();
    } catch (error) {
        // Handle token verification errors
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({ message: "Invalid token! Please log in again." });
        } else if (error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token expired! Please log in again." });
        }

        // Generic error fallback
        res.status(500).json({ message: "An unexpected error occurred!" });
    }
};

// Middleware to check if the user is an admin
export const isAdmin = async (req, res, next) => {
    try {
        // This middleware should be used after isAuthenticated
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized! Please log in to continue" });
        }

        // Check if the user has admin privileges
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: "Access denied! Admin privileges required" });
        }

        // Proceed to the next middleware if the user is an admin
        next();
    } catch (error) {
        res.status(500).json({ message: "An unexpected error occurred!" });
    }
};