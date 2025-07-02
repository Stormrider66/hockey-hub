"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheTags = exports.CacheKeys = void 0;
exports.CacheKeys = {
    // Injury cache keys
    ALL_INJURIES: 'medical:injuries:all',
    ACTIVE_INJURIES: 'medical:injuries:active',
    INJURY: (id) => `medical:injury:${id}`,
    PLAYER_INJURIES: (playerId) => `medical:player:${playerId}:injuries`,
    INJURY_STATS_BY_BODY_PART: 'medical:injuries:stats:body-part',
    // Treatment cache keys
    ALL_TREATMENTS: 'medical:treatments:all',
    TREATMENT: (id) => `medical:treatment:${id}`,
    INJURY_TREATMENTS: (injuryId) => `medical:injury:${injuryId}:treatments`,
    PLAYER_TREATMENTS: (playerId) => `medical:player:${playerId}:treatments`,
    // Medical Report cache keys
    ALL_REPORTS: 'medical:reports:all',
    REPORT: (id) => `medical:report:${id}`,
    PLAYER_REPORTS: (playerId) => `medical:player:${playerId}:reports`,
    INJURY_REPORTS: (injuryId) => `medical:injury:${injuryId}:reports`,
    // Wellness cache keys
    PLAYER_WELLNESS: (playerId) => `medical:player:${playerId}:wellness`,
    PLAYER_WELLNESS_LATEST: (playerId) => `medical:player:${playerId}:wellness:latest`,
    PLAYER_WELLNESS_RANGE: (playerId, startDate, endDate) => `medical:player:${playerId}:wellness:${startDate}:${endDate}`,
    TEAM_WELLNESS_SUMMARY: 'medical:team:wellness:summary',
    // Player Availability cache keys
    ALL_AVAILABILITY: 'medical:availability:all',
    PLAYER_AVAILABILITY: (playerId) => `medical:player:${playerId}:availability`,
    PLAYER_AVAILABILITY_CURRENT: (playerId) => `medical:player:${playerId}:availability:current`,
    TEAM_AVAILABILITY_SUMMARY: 'medical:team:availability:summary',
    // Medical Overview cache keys
    PLAYER_MEDICAL_OVERVIEW: (playerId) => `medical:player:${playerId}:overview`,
    TEAM_MEDICAL_STATS: 'medical:team:stats',
    // Document cache keys
    ALL_DOCUMENTS: 'medical:documents:all',
    PLAYER_DOCUMENTS: (playerId) => `medical:player:${playerId}:documents`,
};
exports.CacheTags = {
    INJURY: 'medical:injury',
    TREATMENT: 'medical:treatment',
    REPORT: 'medical:report',
    WELLNESS: 'medical:wellness',
    AVAILABILITY: 'medical:availability',
    DOCUMENT: 'medical:document',
    PLAYER: (playerId) => `medical:player:${playerId}`,
    TEAM: 'medical:team',
};
//# sourceMappingURL=cacheKeys.js.map