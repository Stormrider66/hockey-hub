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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSessionIntervals = exports.getTeamMetrics = void 0;
const LiveMetricsRepository_1 = require("../repositories/LiveMetricsRepository");
const ScheduledSessionRepository_1 = require("../repositories/ScheduledSessionRepository");
/**
 * GET /teams/:teamId/metrics
 * Returns a placeholder array of player metrics (heart rate, watts) for a team.
 */
const getTeamMetrics = (req, res, _next) => __awaiter(void 0, void 0, void 0, function* () {
    const { teamId } = req.params;
    try {
        const metrics = yield (0, LiveMetricsRepository_1.findLatestMetricsByTeamId)(teamId);
        res.json({ success: true, data: { teamId, metrics } });
    }
    catch (err) {
        res.status(500).json({ error: true, message: 'Failed to fetch metrics' });
    }
});
exports.getTeamMetrics = getTeamMetrics;
/**
 * GET /scheduled-sessions/:id/intervals
 * Returns a placeholder set of interval definitions for a scheduled session.
 */
const getSessionIntervals = (req, res, _next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const session = yield (0, ScheduledSessionRepository_1.findScheduledSessionById)(id);
        if (!session) {
            return res.status(404).json({ error: true, message: 'Scheduled session not found' });
        }
        // Build a simple interval summary: treat each section.round as work/rest cycle.
        const intervals = [];
        let totalIntervals = 0;
        let workDurationSec = 0;
        let restDurationSec = 0;
        const sections = (session.resolvedSections || []);
        sections.forEach(section => {
            var _a;
            const rounds = (_a = section.rounds) !== null && _a !== void 0 ? _a : 1;
            const workTime = section.exercises.reduce((acc, ex) => acc + (ex.duration || 0), 0);
            const restTime = section.restBetweenRounds || 0;
            for (let i = 0; i < rounds; i++) {
                intervals.push({ phase: 'work', durationSec: workTime, sectionName: section.name });
                workDurationSec += workTime;
                totalIntervals += 1;
                if (i < rounds - 1 && restTime > 0) {
                    intervals.push({ phase: 'rest', durationSec: restTime, sectionName: section.name });
                    restDurationSec += restTime;
                    totalIntervals += 1;
                }
            }
        });
        res.json({
            success: true,
            data: {
                sessionId: id,
                totalIntervals,
                workDurationSec,
                restDurationSec,
                intervals
            }
        });
    }
    catch (err) {
        console.error('[getSessionIntervals] error', err);
        res.status(500).json({ error: true, message: 'Failed to fetch session intervals' });
    }
});
exports.getSessionIntervals = getSessionIntervals;
