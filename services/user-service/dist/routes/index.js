"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authRoutes_1 = __importDefault(require("./authRoutes"));
const authorizationRoutes_1 = __importDefault(require("./authorizationRoutes"));
const teamRoutes_1 = __importDefault(require("./teamRoutes"));
const parentRoutes_1 = __importDefault(require("./parentRoutes"));
const userRoutes_1 = __importDefault(require("./userRoutes"));
const organizationRoutes_1 = __importDefault(require("./organizationRoutes"));
// import roleRoutes from './roleRoutes'; // Comment out for now
const router = (0, express_1.Router)();
// Mount authentication routes
router.use('/auth', authRoutes_1.default);
// Mount authorization routes
router.use('/authorization', authorizationRoutes_1.default);
// Mount team routes
router.use('/teams', teamRoutes_1.default);
// Mount parent-child link routes
router.use('/parent-child', parentRoutes_1.default);
// Mount user routes
router.use('/users', userRoutes_1.default);
// Mount organization routes
router.use('/organizations', organizationRoutes_1.default);
// Mount role routes
// router.use('/roles', roleRoutes); // Comment out for now
// TODO: Add other routes (e.g., organizations)
// router.use('/organizations', organizationRouter);
exports.default = router;
//# sourceMappingURL=index.js.map