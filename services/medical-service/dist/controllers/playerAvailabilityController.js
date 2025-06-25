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
exports.setAvailability = exports.getAvailability = void 0;
const playerAvailabilityRepository = __importStar(require("../repositories/playerAvailabilityRepository"));
const getAvailability = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { playerId } = req.params;
    try {
        const status = yield playerAvailabilityRepository.getCurrentAvailability(playerId);
        if (!status) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Availability status not found' });
        }
        res.status(200).json({ success: true, data: status });
    }
    catch (error) {
        next(error);
    }
});
exports.getAvailability = getAvailability;
const setAvailability = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { playerId } = req.params;
    const data = req.body;
    if (!data.currentStatus) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Missing required field: currentStatus' });
    }
    try {
        const user = req.user;
        const updatedByUserId = user.id;
        const teamId = Array.isArray(user.teamIds) ? user.teamIds[0] : user.teamId;
        const effectiveFrom = data.effectiveFrom || new Date().toISOString().split('T')[0];
        const created = yield playerAvailabilityRepository.createAvailabilityStatus({
            playerId,
            currentStatus: data.currentStatus,
            notes: data.notes,
            effectiveFrom,
            expectedEndDate: data.expectedEndDate,
            injuryId: data.injuryId,
            updatedByUserId,
            teamId,
        });
        res.status(201).json({ success: true, data: created });
    }
    catch (error) {
        next(error);
    }
});
exports.setAvailability = setAvailability;
