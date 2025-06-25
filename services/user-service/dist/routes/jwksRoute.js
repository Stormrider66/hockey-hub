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
const express_1 = require("express");
const keyManager_1 = require("../utils/keyManager");
const jose_1 = require("jose");
const logger_1 = __importDefault(require("../config/logger"));
const jwksRouter = (0, express_1.Router)();
let jwkCache = null;
jwksRouter.get('/', (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!jwkCache) {
            const key = yield (0, jose_1.importSPKI)(keyManager_1.jwtPublicKey, 'RS256');
            const jwk = yield (0, jose_1.exportJWK)(key);
            jwk.use = 'sig';
            jwk.alg = 'RS256';
            jwk.kid = 'user-service-rsa';
            jwkCache = { keys: [jwk] };
        }
        res.json(jwkCache);
    }
    catch (err) {
        logger_1.default.error({ err }, 'Failed to produce JWKS');
        res.status(500).json({ error: 'Unable to provide JWKS' });
    }
}));
exports.default = jwksRouter;
//# sourceMappingURL=jwksRoute.js.map