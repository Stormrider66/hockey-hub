"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pino_1 = __importDefault(require("pino"));
const isDevelopment = process.env.NODE_ENV === 'development';
// Configure pino-pretty for development
const transport = isDevelopment ? {
    target: 'pino-pretty',
    options: {
        colorize: true,
        levelFirst: true,
        translateTime: 'SYS:standard',
    }
} : undefined;
const logger = (0, pino_1.default)(Object.assign({ level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info') }, (transport && { transport })));
exports.default = logger;
//# sourceMappingURL=logger.js.map