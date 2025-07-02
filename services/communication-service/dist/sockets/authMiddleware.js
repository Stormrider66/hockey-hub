"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketAuthMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const socketAuthMiddleware = async (socket, next) => {
    try {
        // Get token from handshake auth or query
        const token = socket.handshake.auth?.token || socket.handshake.query?.token;
        if (!token) {
            return next(new Error('Authentication required'));
        }
        // Verify token
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'secret');
        // Attach user info to socket
        socket.userId = decoded.sub;
        socket.user = {
            id: decoded.sub,
            email: decoded.email,
            organizationId: decoded.organizationId,
            roles: decoded.roles || [],
        };
        next();
    }
    catch (error) {
        next(new Error('Invalid token'));
    }
};
exports.socketAuthMiddleware = socketAuthMiddleware;
//# sourceMappingURL=authMiddleware.js.map