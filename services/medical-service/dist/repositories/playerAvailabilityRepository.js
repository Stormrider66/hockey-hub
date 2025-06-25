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
exports.createAvailabilityStatus = exports.getCurrentAvailability = void 0;
const db_1 = __importDefault(require("../db"));
const getCurrentAvailability = (playerId) => __awaiter(void 0, void 0, void 0, function* () {
    const query = `
    SELECT *
    FROM player_availability_status
    WHERE player_id = $1
      AND effective_from <= CURRENT_DATE
    ORDER BY effective_from DESC
    LIMIT 1
  `;
    const params = [playerId];
    try {
        const result = yield db_1.default.query(query, params);
        return result.rows[0] || null;
    }
    catch (error) {
        console.error('[DB Error] Failed to fetch availability for player', playerId, error);
        throw new Error('Database error while fetching availability status.');
    }
});
exports.getCurrentAvailability = getCurrentAvailability;
const createAvailabilityStatus = (status) => __awaiter(void 0, void 0, void 0, function* () {
    const { playerId, currentStatus, notes, effectiveFrom, expectedEndDate, injuryId, updatedByUserId, teamId, } = status;
    const query = `
    INSERT INTO player_availability_status (
      player_id, current_status, notes,
      effective_from, expected_end_date, injury_id,
      updated_by_user_id, team_id
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    RETURNING *;
  `;
    const params = [
        playerId,
        currentStatus,
        notes || null,
        effectiveFrom,
        expectedEndDate || null,
        injuryId || null,
        updatedByUserId,
        teamId,
    ];
    try {
        const result = yield db_1.default.query(query, params);
        return result.rows[0];
    }
    catch (error) {
        console.error('[DB Error] Failed to create availability status', error);
        throw new Error('Database error while creating availability status.');
    }
});
exports.createAvailabilityStatus = createAvailabilityStatus;
