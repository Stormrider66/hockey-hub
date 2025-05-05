import { Request, Response, NextFunction } from 'express';
import { LiveMetric, findLatestMetricsByTeamId } from '../repositories/LiveMetricsRepository';
import { findScheduledSessionById } from '../repositories/ScheduledSessionRepository';
import { ScheduledPhysicalSession, SessionSection } from '../types/training';

/**
 * GET /teams/:teamId/metrics
 * Returns a placeholder array of player metrics (heart rate, watts) for a team.
 */
export const getTeamMetrics = async (req: Request, res: Response, _next: NextFunction) => {
    const { teamId } = req.params;

    try {
        const metrics: LiveMetric[] = await findLatestMetricsByTeamId(teamId);
        res.json({ success: true, data: { teamId, metrics } });
    } catch (err) {
        res.status(500).json({ error: true, message: 'Failed to fetch metrics' });
    }
};

/**
 * GET /scheduled-sessions/:id/intervals
 * Returns a placeholder set of interval definitions for a scheduled session.
 */
export const getSessionIntervals = async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params;

    try {
        const session: ScheduledPhysicalSession | null = await findScheduledSessionById(id);
        if (!session) {
            return res.status(404).json({ error: true, message: 'Scheduled session not found' });
        }

        // Build a simple interval summary: treat each section.round as work/rest cycle.
        const intervals: Array<{ phase: 'work' | 'rest'; durationSec: number; sectionName?: string }> = [];
        let totalIntervals = 0;
        let workDurationSec = 0;
        let restDurationSec = 0;

        const sections = (session.resolvedSections || []) as SessionSection[];

        sections.forEach(section => {
            const rounds = section.rounds ?? 1;
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
    } catch (err) {
        console.error('[getSessionIntervals] error', err);
        res.status(500).json({ error: true, message: 'Failed to fetch session intervals' });
    }
}; 