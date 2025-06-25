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
exports.findLatestMetricsByTeamId = void 0;
const db_1 = __importDefault(require("../db"));
/**
 * Fetches the latest metric row per player for a given team.
 * Expects a view or table `live_metrics` containing realtime data.
 */
const findLatestMetricsByTeamId = (teamId) => __awaiter(void 0, void 0, void 0, function* () {
    const query = `
        SELECT lm.player_id   AS "playerId",
               lm.heart_rate  AS "heartRate",
               lm.watts       AS "watts",
               lm.recorded_at AS "recordedAt"
        FROM live_metrics lm
        JOIN players p ON p.id = lm.player_id
        WHERE p.team_id = $1
          AND lm.recorded_at = (
              SELECT MAX(recorded_at)
              FROM live_metrics lm2
              WHERE lm2.player_id = lm.player_id
          );`;
    const params = [teamId];
    try {
        const result = yield db_1.default.query(query, params);
        return result.rows;
    }
    catch (err) {
        console.error('[DB Error] Failed to fetch live metrics:', err);
        throw new Error('Database error fetching live metrics');
    }
});
exports.findLatestMetricsByTeamId = findLatestMetricsByTeamId;
