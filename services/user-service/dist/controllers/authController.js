"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordHandler = exports.forgotPasswordHandler = exports.logoutHandler = exports.refreshTokenHandler = exports.loginHandler = exports.registerHandler = void 0;
const authService = __importStar(require("../services/authService"));
const authErrors_1 = require("../errors/authErrors");
const logger_1 = __importDefault(require("../config/logger"));
const response_utils_1 = require("../utils/response.utils");
const types_1 = require("../types");
const registerHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield authService.register(req.body);
        // Exclude password hash before sending response
        const _a = user, { passwordHash } = _a, userResponse = __rest(_a, ["passwordHash"]);
        return (0, response_utils_1.sendSuccess)(res, userResponse, 'User registered successfully', 201);
    }
    catch (error) {
        if (error instanceof authErrors_1.ConflictError) {
            throw new types_1.HttpException(409, error.message, 'USER_ALREADY_EXISTS');
        }
        // Pass other errors to the generic error handler
        next(error);
    }
});
exports.registerHandler = registerHandler;
const loginHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { accessToken, refreshToken, user } = yield authService.login(req.body);
        // Consider setting refreshToken in an HttpOnly cookie for better security
        // res.cookie('refreshToken', refreshToken, {
        //   httpOnly: true,
        //   secure: process.env.NODE_ENV === 'production',
        //   sameSite: 'strict', 
        //   maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        // });
        return (0, response_utils_1.sendSuccess)(res, { accessToken, refreshToken, user }, 'Login successful');
    }
    catch (error) {
        if (error instanceof authErrors_1.UnauthorizedError) {
            throw new types_1.HttpException(401, error.message, 'INVALID_CREDENTIALS');
        }
        next(error);
    }
});
exports.loginHandler = loginHandler;
const refreshTokenHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // Extract refresh token - could be from body or cookie
    const incomingRefreshToken = req.body.refreshToken; // || req.cookies.refreshToken;
    if (!incomingRefreshToken) {
        throw new types_1.HttpException(400, 'Refresh token is required', 'REFRESH_TOKEN_REQUIRED');
    }
    try {
        const { accessToken, refreshToken: newRefreshToken } = yield authService.refreshToken(incomingRefreshToken);
        // Consider setting new refreshToken in an HttpOnly cookie
        // res.cookie('refreshToken', newRefreshToken, { ...cookie options });
        return (0, response_utils_1.sendSuccess)(res, { accessToken, refreshToken: newRefreshToken }, 'Token refreshed successfully');
    }
    catch (error) {
        if (error instanceof authErrors_1.UnauthorizedError) {
            // Clear potentially invalid cookie if using cookies
            // res.clearCookie('refreshToken'); 
            throw new types_1.HttpException(401, error.message, 'INVALID_REFRESH_TOKEN');
        }
        next(error);
    }
});
exports.refreshTokenHandler = refreshTokenHandler;
const logoutHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const incomingRefreshToken = req.body.refreshToken; // || req.cookies.refreshToken;
    if (!incomingRefreshToken) {
        // Even without a token, proceed to clear any potential cookie and return success
        // res.clearCookie('refreshToken');
        return (0, response_utils_1.sendSuccess)(res, null, 'Logged out successfully');
    }
    try {
        yield authService.logout(incomingRefreshToken);
        // Clear cookie if using cookies
        // res.clearCookie('refreshToken'); 
        return (0, response_utils_1.sendSuccess)(res, null, 'Logged out successfully');
    }
    catch (error) {
        // Log error but don't fail the logout process for the client
        logger_1.default.error({ err: error }, 'Error during token revocation on logout');
        // Clear cookie anyway
        // res.clearCookie('refreshToken');
        return (0, response_utils_1.sendSuccess)(res, null, 'Logged out (token revocation may have failed)');
        // Don't pass to next, logout should appear successful to client
    }
});
exports.logoutHandler = logoutHandler;
const forgotPasswordHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield authService.forgotPassword(req.body);
        // Always return success to prevent email enumeration
        return (0, response_utils_1.sendSuccess)(res, null, 'If an account with that email exists, a password reset link has been sent.');
    }
    catch (error) {
        // Log the error but still return success to the client
        logger_1.default.error({ err: error, email: req.body.email }, 'Forgot password error');
        return (0, response_utils_1.sendSuccess)(res, null, 'If an account with that email exists, a password reset link has been sent.');
        // Don't pass to next error handler to avoid revealing internal errors
    }
});
exports.forgotPasswordHandler = forgotPasswordHandler;
const resetPasswordHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield authService.resetPassword(req.body);
        return (0, response_utils_1.sendSuccess)(res, null, 'Password has been reset successfully.');
    }
    catch (error) {
        if (error instanceof authErrors_1.UnauthorizedError) {
            throw new types_1.HttpException(401, error.message, 'INVALID_RESET_TOKEN');
        }
        next(error);
    }
});
exports.resetPasswordHandler = resetPasswordHandler;
//# sourceMappingURL=authController.js.map