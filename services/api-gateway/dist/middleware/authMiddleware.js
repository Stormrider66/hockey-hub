"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jose_1 = require("jose");
const logger_1 = __importDefault(require("../utils/logger"));
const JWKS_URI = process.env.JWKS_URI || 'http://localhost:3001/.well-known/jwks.json';
const ISSUER = 'user-service';
const AUDIENCE = 'hockeyhub-internal';
// Cache the remote set instance.
const remoteJWKS = (0, jose_1.createRemoteJWKSet)(new URL(JWKS_URI));
function authenticate(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`[Auth Middleware] ${req.method} ${req.url}`);
        console.log(`[Auth Middleware] Headers:`, req.headers);
        // Try to get token from Authorization header first
        const authHeader = req.headers.authorization;
        let token = authHeader && authHeader.startsWith('Bearer ')
            ? authHeader.split(' ')[1]
            : null;
        console.log(`[Auth Middleware] Bearer token:`, token ? 'Found' : 'Not found');
        // If no Bearer token, try to get from cookies
        if (!token && req.headers.cookie) {
            console.log(`[Auth Middleware] Raw cookies:`, req.headers.cookie);
            const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
                const [key, value] = cookie.trim().split('=');
                acc[key] = value;
                return acc;
            }, {});
            console.log(`[Auth Middleware] Parsed cookies:`, Object.keys(cookies));
            token = cookies.accessToken;
            console.log(`[Auth Middleware] Access token from cookies:`, token ? 'Found' : 'Not found');
        }
        if (!token) {
            console.log(`[Auth Middleware] No token found, returning 401`);
            return res.status(401).json({ error: 'Authentication required' });
        }
        try {
            const { payload } = yield (0, jose_1.jwtVerify)(token, remoteJWKS, {
                issuer: ISSUER,
                audience: AUDIENCE,
            });
            const typed = payload;
            req.user = {
                userId: typed.userId,
                email: typed.email,
                roles: typed.roles || [],
                permissions: typed.permissions || [],
                organizationId: typed.organizationId,
                teamIds: typed.teamIds || [],
                lang: typed.lang || 'en',
            };
            console.log(`[Auth Middleware] Authentication successful for user:`, typed.email);
            // If token is close to expiry (<60s), send header so client can refresh.
            if (typed.exp && Date.now() / 1000 > typed.exp - 60) {
                res.setHeader('X-Token-Expiring-Soon', 'true');
            }
            next();
        }
        catch (err) {
            console.log(`[Auth Middleware] JWT verification failed:`, err);
            logger_1.default.warn({ err }, 'JWT verification failed');
            return res.status(401).json({ error: 'Invalid token' });
        }
    });
}
exports.authenticate = authenticate;
