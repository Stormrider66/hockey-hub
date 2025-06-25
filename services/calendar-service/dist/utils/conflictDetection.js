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
exports.hasConflicts = exports.findConflictingEvents = void 0;
const db_1 = __importDefault(require("../db"));
/**
 * Returns a list of conflicting events. The list will be empty when no conflict exists.
 */
function findConflictingEvents(params) {
    return __awaiter(this, void 0, void 0, function* () {
        const { startTime, endTime, resourceIds, teamId, locationId, excludeEventId, } = params;
        const conflicts = [];
        // 1. Resource-based conflicts
        if (resourceIds && resourceIds.length > 0) {
            const resQueryParts = [
                `SELECT DISTINCT e.id, e.title, e.start_time, e.end_time, e.event_type,` +
                    ` 'resource' AS conflict_reason, er.resource_id AS conflict_identifier`,
                'FROM events e',
                'JOIN event_resources er ON er.event_id = e.id',
                'WHERE er.resource_id = ANY($1::uuid[])',
                'AND e.start_time < $2',
                'AND e.end_time > $3',
                "AND e.status != 'canceled'",
            ];
            const resParams = [resourceIds, endTime, startTime];
            if (excludeEventId) {
                resQueryParts.push('AND e.id <> $4');
                resParams.push(excludeEventId);
            }
            const resSql = resQueryParts.join(' ');
            const resResult = yield db_1.default.query(resSql, resParams);
            conflicts.push(...resResult.rows.map((row) => ({
                id: row.id,
                title: row.title,
                start_time: row.start_time,
                end_time: row.end_time,
                event_type: row.event_type,
                conflict_reason: 'resource',
                conflict_identifier: row.conflict_identifier,
            })));
        }
        // 2. Team-based conflicts
        if (teamId) {
            const teamQueryParts = [
                `SELECT e.id, e.title, e.start_time, e.end_time, e.event_type,` +
                    ` 'team' AS conflict_reason, e.team_id AS conflict_identifier`,
                'FROM events e',
                'WHERE e.team_id = $1',
                'AND e.start_time < $2',
                'AND e.end_time > $3',
                "AND e.status != 'canceled'",
            ];
            const teamParams = [teamId, endTime, startTime];
            if (excludeEventId) {
                teamQueryParts.push('AND e.id <> $4');
                teamParams.push(excludeEventId);
            }
            const teamSql = teamQueryParts.join(' ');
            const teamResult = yield db_1.default.query(teamSql, teamParams);
            conflicts.push(...teamResult.rows.map((row) => ({
                id: row.id,
                title: row.title,
                start_time: row.start_time,
                end_time: row.end_time,
                event_type: row.event_type,
                conflict_reason: 'team',
                conflict_identifier: row.conflict_identifier,
            })));
        }
        // 3. Location-based conflicts
        if (locationId) {
            const locQueryParts = [
                `SELECT e.id, e.title, e.start_time, e.end_time, e.event_type,` +
                    ` 'location' AS conflict_reason, e.location_id AS conflict_identifier`,
                'FROM events e',
                'WHERE e.location_id = $1',
                'AND e.start_time < $2',
                'AND e.end_time > $3',
                "AND e.status != 'canceled'",
            ];
            const locParams = [locationId, endTime, startTime];
            if (excludeEventId) {
                locQueryParts.push('AND e.id <> $4');
                locParams.push(excludeEventId);
            }
            const locSql = locQueryParts.join(' ');
            const locResult = yield db_1.default.query(locSql, locParams);
            conflicts.push(...locResult.rows.map((row) => ({
                id: row.id,
                title: row.title,
                start_time: row.start_time,
                end_time: row.end_time,
                event_type: row.event_type,
                conflict_reason: 'location',
                conflict_identifier: row.conflict_identifier,
            })));
        }
        return conflicts;
    });
}
exports.findConflictingEvents = findConflictingEvents;
/** Convenience helper that simply returns true / false */
function hasConflicts(params) {
    return __awaiter(this, void 0, void 0, function* () {
        const results = yield findConflictingEvents(params);
        return results.length > 0;
    });
}
exports.hasConflicts = hasConflicts;
