"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtPublicKey = exports.jwtPrivateKey = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = __importDefault(require("../config/logger"));
// Directory where key files will live (relative to project root)
const KEY_DIR = process.env.JWT_KEY_DIR || path_1.default.join(__dirname, '../../keys');
const PRIVATE_KEY_PATH = path_1.default.join(KEY_DIR, 'jwt_private.pem');
const PUBLIC_KEY_PATH = path_1.default.join(KEY_DIR, 'jwt_public.pem');
function generateKeyPair() {
    logger_1.default.warn('Generating new RSA key-pair for JWTs (development mode)');
    const { publicKey, privateKey } = crypto_1.default.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
        }
    });
    return { privateKey, publicKey };
}
function ensureKeyFiles() {
    // Production first: allow env vars to override file loading completely
    if (process.env.JWT_PRIVATE_KEY && process.env.JWT_PUBLIC_KEY) {
        return {
            privateKey: process.env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n'),
            publicKey: process.env.JWT_PUBLIC_KEY.replace(/\\n/g, '\n'),
        };
    }
    // Dev / docker-volume path
    // Ensure key dir exists
    if (!fs_1.default.existsSync(KEY_DIR)) {
        fs_1.default.mkdirSync(KEY_DIR, { recursive: true });
    }
    const privateExists = fs_1.default.existsSync(PRIVATE_KEY_PATH);
    const publicExists = fs_1.default.existsSync(PUBLIC_KEY_PATH);
    if (privateExists && publicExists) {
        return {
            privateKey: fs_1.default.readFileSync(PRIVATE_KEY_PATH, 'utf8'),
            publicKey: fs_1.default.readFileSync(PUBLIC_KEY_PATH, 'utf8'),
        };
    }
    const { privateKey, publicKey } = generateKeyPair();
    fs_1.default.writeFileSync(PRIVATE_KEY_PATH, privateKey, { mode: 0o600 });
    fs_1.default.writeFileSync(PUBLIC_KEY_PATH, publicKey, { mode: 0o644 });
    logger_1.default.info({ keyDir: KEY_DIR }, 'RSA key-pair generated and saved');
    return { privateKey, publicKey };
}
// Singleton key-pair
const KEYS = ensureKeyFiles();
exports.jwtPrivateKey = KEYS.privateKey;
exports.jwtPublicKey = KEYS.publicKey;
//# sourceMappingURL=keyManager.js.map