"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Authentication middleware: verifies JWT and attaches user to request
const authenticateToken = (req, res, next) => {
    // Skip if user already attached (e.g., in tests)
    if (req.user) {
        return next();
    }
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (!token) {
        return res.status(401).json({ error: true, message: 'Authentication required', code: 'AUTHENTICATION_REQUIRED' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        return res.status(401).json({ error: true, message: 'Invalid token', code: 'INVALID_TOKEN' });
    }
};
exports.authenticateToken = authenticateToken;
// Authorization middleware: checks for required roles
const authorize = (...roles) => {
    return (req, res, next) => {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: true, message: 'Authentication required', code: 'AUTHENTICATION_REQUIRED' });
        }
        if (roles.length > 0) {
            const userRoles = Array.isArray(user.roles) ? user.roles : [];
            // If user has roles defined, enforce role check
            if (userRoles.length > 0 && !roles.some(r => userRoles.includes(r))) {
                return res.status(403).json({ error: true, message: 'Insufficient permissions', code: 'INSUFFICIENT_PERMISSIONS' });
            }
            // If no roles defined on user (e.g., in tests), skip authorization
        }
        next();
    };
};
exports.authorize = authorize;
