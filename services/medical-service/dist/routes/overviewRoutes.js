"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const overviewController_1 = require("../controllers/overviewController");
const router = express_1.default.Router();
// GET /teams/:teamId/overview (API Gateway strips /medical prefix)
router.get('/teams/:teamId/overview', overviewController_1.getMedicalOverview);
exports.default = router;
