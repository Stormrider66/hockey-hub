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
const express_1 = require("express");
const middleware_1 = require("../middleware");
const zod_1 = require("zod");
const authService = __importStar(require("../services/authService"));
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - types provided by default import
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const router = (0, express_1.Router)();
// ----- Validators --------------------------------------------------------- //
const registerSchemaZod = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    firstName: zod_1.z.string().min(1).max(100),
    lastName: zod_1.z.string().min(1).max(100),
    phone: zod_1.z.string().optional(),
    preferredLanguage: zod_1.z.enum(['sv', 'en']).default('sv'),
});
const loginSchemaZod = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
const refreshSchema = zod_1.z.object({ refreshToken: zod_1.z.string() });
const forgotSchema = zod_1.z.object({ email: zod_1.z.string().email() });
const resetSchema = zod_1.z.object({ token: zod_1.z.string(), newPassword: zod_1.z.string().min(8) });
function validate(schema) {
    return (req, _res, next) => {
        try {
            req.body = schema.parse(req.body);
            next();
        }
        catch (err) {
            next(err);
        }
    };
}
// Determine prod mode for secure cookies
const isProd = process.env.NODE_ENV === 'production';
const cookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
};
// --- Authentication Routes --- //
// POST /api/v1/auth/register
router.post('/register', validate(registerSchemaZod), (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield authService.register(req.body);
    res.status(201).json({ success: true, data: user });
})));
// POST /api/v1/auth/login
router.post('/login', validate(loginSchemaZod), (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('=== LOGIN ROUTE HIT ===');
    console.log('Request body:', req.body);
    const result = yield authService.login(req.body);
    // Set cookies
    const accessExpiryMs = 1000 * 60 * 15; // 15m default; keep synced with ACCESS_TOKEN_EXPIRY
    const refreshExpiryMs = 1000 * 60 * 60 * 24 * 7; // 7d default
    res.cookie('accessToken', result.accessToken, Object.assign(Object.assign({}, cookieOptions), { maxAge: accessExpiryMs }));
    res.cookie('refreshToken', result.refreshToken, Object.assign(Object.assign({}, cookieOptions), { maxAge: refreshExpiryMs, path: '/api/v1/auth' }));
    res.json({ success: true, data: { user: result.user } });
})));
// POST /api/v1/auth/test - Test route without asyncHandler
router.post('/test', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('=== TEST ROUTE HIT ===');
        console.log('Body:', req.body);
        res.json({ success: true, message: 'Test route works', body: req.body });
    }
    catch (error) {
        console.error('Test route error:', error);
        next(error);
    }
}));
// POST /api/v1/auth/refresh-token
router.post('/refresh-token', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const tokenFromCookie = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.refreshToken;
    const token = tokenFromCookie || ((_b = req.body) === null || _b === void 0 ? void 0 : _b.refreshToken);
    if (!token) {
        res.status(400).json({ error: true, message: 'Refresh token missing', code: 'REFRESH_TOKEN_REQUIRED' });
        return;
    }
    const tokens = yield authService.refreshToken(token);
    // Rotate cookies
    const accessExpiryMs = 1000 * 60 * 15;
    const refreshExpiryMs = 1000 * 60 * 60 * 24 * 7;
    res.cookie('accessToken', tokens.accessToken, Object.assign(Object.assign({}, cookieOptions), { maxAge: accessExpiryMs }));
    res.cookie('refreshToken', tokens.refreshToken, Object.assign(Object.assign({}, cookieOptions), { maxAge: refreshExpiryMs, path: '/api/v1/auth' }));
    res.json({ success: true });
})));
// POST /api/v1/auth/logout
router.post('/logout', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _c, _d;
    const token = ((_c = req.cookies) === null || _c === void 0 ? void 0 : _c.refreshToken) || ((_d = req.body) === null || _d === void 0 ? void 0 : _d.refreshToken);
    if (token) {
        yield authService.logout(token);
    }
    // Clear cookies
    res.clearCookie('accessToken', Object.assign({}, cookieOptions));
    res.clearCookie('refreshToken', Object.assign(Object.assign({}, cookieOptions), { path: '/api/v1/auth' }));
    res.json({ success: true, message: 'Successfully logged out' });
})));
// POST /api/v1/auth/forgot-password
router.post('/forgot-password', validate(forgotSchema), (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield authService.forgotPassword(req.body);
    res.json({ success: true });
})));
// POST /api/v1/auth/reset-password
router.post('/reset-password', validate(resetSchema), (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield authService.resetPassword(req.body);
    res.json({ success: true });
})));
// GET /api/v1/auth/me - Get current authenticated user's profile
router.get('/me', middleware_1.authenticateToken, 
// Example RBAC usage: allow any authenticated role listed below
(0, middleware_1.checkRole)('admin', 'club_admin', 'coach', 'player', 'parent', 'staff'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user) {
        return res.status(401).json({
            error: true,
            message: 'User not found on request after authentication',
            code: 'AUTH_ERROR'
        });
    }
    const _e = req.user, { permissions } = _e, userProfile = __rest(_e, ["permissions"]);
    return res.status(200).json({
        success: true,
        data: userProfile
    });
}));
exports.default = router;
//# sourceMappingURL=authRoutes.js.map