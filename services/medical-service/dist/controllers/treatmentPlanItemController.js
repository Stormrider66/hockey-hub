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
exports.deleteTreatmentPlanItemHandler = exports.updateTreatmentPlanItemHandler = exports.addTreatmentPlanItem = exports.getTreatmentPlanItems = void 0;
const TreatmentPlanItemRepository = __importStar(require("../repositories/treatmentPlanItemRepository"));
const getTreatmentPlanItems = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { planId } = req.params;
    try {
        const items = yield TreatmentPlanItemRepository.findItemsByPlanId(planId);
        res.status(200).json({ success: true, data: items });
    }
    catch (error) {
        next(error);
    }
});
exports.getTreatmentPlanItems = getTreatmentPlanItems;
const addTreatmentPlanItem = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { planId } = req.params;
    const data = req.body;
    if (!data.description || data.sequence === undefined) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Missing required fields: description, sequence' });
    }
    try {
        const newItem = yield TreatmentPlanItemRepository.createTreatmentPlanItem({
            planId,
            description: data.description,
            frequency: data.frequency,
            duration: data.duration,
            sets: data.sets,
            reps: data.reps,
            progressionCriteria: data.progressionCriteria,
            exerciseId: data.exerciseId,
            sequence: data.sequence,
        });
        res.status(201).json({ success: true, data: newItem });
    }
    catch (error) {
        next(error);
    }
});
exports.addTreatmentPlanItem = addTreatmentPlanItem;
const updateTreatmentPlanItemHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const data = req.body;
    try {
        const updated = yield TreatmentPlanItemRepository.updateTreatmentPlanItem(id, data);
        if (!updated) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Treatment plan item not found' });
        }
        res.status(200).json({ success: true, data: updated });
    }
    catch (error) {
        next(error);
    }
});
exports.updateTreatmentPlanItemHandler = updateTreatmentPlanItemHandler;
const deleteTreatmentPlanItemHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const deleted = yield TreatmentPlanItemRepository.deleteTreatmentPlanItem(id);
        if (!deleted) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Treatment plan item not found' });
        }
        res.status(200).json({ success: true, message: 'Treatment plan item deleted successfully' });
    }
    catch (error) {
        next(error);
    }
});
exports.deleteTreatmentPlanItemHandler = deleteTreatmentPlanItemHandler;
