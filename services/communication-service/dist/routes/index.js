"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardRoutes = exports.notificationRoutes = exports.presenceRoutes = exports.messageRoutes = exports.conversationRoutes = void 0;
const conversationRoutes_1 = __importDefault(require("./conversationRoutes"));
exports.conversationRoutes = conversationRoutes_1.default;
const messageRoutes_1 = __importDefault(require("./messageRoutes"));
exports.messageRoutes = messageRoutes_1.default;
const presenceRoutes_1 = __importDefault(require("./presenceRoutes"));
exports.presenceRoutes = presenceRoutes_1.default;
const notificationRoutes_1 = __importDefault(require("./notificationRoutes"));
exports.notificationRoutes = notificationRoutes_1.default;
const dashboardRoutes_1 = __importDefault(require("./dashboardRoutes"));
exports.dashboardRoutes = dashboardRoutes_1.default;
//# sourceMappingURL=index.js.map