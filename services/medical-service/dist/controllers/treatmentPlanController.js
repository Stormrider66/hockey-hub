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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTreatmentPlanHandler = exports.updateTreatmentPlanHandler = exports.addTreatmentPlan = exports.getTreatmentPlans = void 0;
const TreatmentPlanRepository = __importStar(require("../repositories/treatmentPlanRepository"));
const getTreatmentPlans = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { injuryId } = req.params;
    try {
        const plans = yield TreatmentPlanRepository.findPlansByInjuryId(injuryId);
        res.status(200).json({ success: true, data: plans });
    }
    catch (error) {
        next(error);
    }
});
exports.getTreatmentPlans = getTreatmentPlans;
const addTreatmentPlan = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { injuryId } = req.params;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const data = req.body;
    if (!userId) {
        return res.status(403).json({ error: true, code: 'FORBIDDEN', message: 'User context missing.' });
    }
    if (!data.phase || !data.description || data.expectedDuration === undefined || !data.goals) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Missing required fields: phase, description, expectedDuration, goals' });
    }
    try {
        const newPlan = yield TreatmentPlanRepository.createTreatmentPlan({
            injuryId,
            phase: data.phase,
            description: data.description,
            expectedDuration: data.expectedDuration,
            goals: data.goals,
            precautions: data.precautions,
            createdByUserId: userId,
        });
        res.status(201).json({ success: true, data: newPlan });
    }
    catch (error) {
        next(error);
    }
});
exports.addTreatmentPlan = addTreatmentPlan;
const updateTreatmentPlanHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const data = req.body;
    try {
        const updated = yield TreatmentPlanRepository.updateTreatmentPlan(id, {
            phase: data.phase,
            description: data.description,
            expectedDuration: data.expectedDuration,
            goals: data.goals,
            precautions: data.precautions,
        });
        if (!updated) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Treatment plan not found' });
        }
        res.status(200).json({ success: true, data: updated });
    }
    catch (error) {
        next(error);
    }
});
exports.updateTreatmentPlanHandler = updateTreatmentPlanHandler;
const deleteTreatmentPlanHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const deleted = yield TreatmentPlanRepository.deleteTreatmentPlan(id);
        if (!deleted) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Treatment plan not found' });
        }
        res.status(200).json({ success: true, message: 'Treatment plan deleted successfully' });
    }
    catch (error) {
        next(error);
    }
});
exports.deleteTreatmentPlanHandler = deleteTreatmentPlanHandler;
