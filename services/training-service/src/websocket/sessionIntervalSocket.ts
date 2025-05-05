import { Server } from 'socket.io';
import { findScheduledSessionById } from '../repositories/ScheduledSessionRepository';
import { ScheduledPhysicalSession, SessionSection } from '../types/training';
import jwt from 'jsonwebtoken';
import { AuthenticatedUser } from '../types/auth';

export const initSessionIntervalSocket = (io: Server) => {
    const nsp = io.of('/session-intervals');

    // Authentication middleware similar to comm‑service
    nsp.use((socket, next) => {
        const token = (socket.handshake.auth as any)?.token;
        const publicKey = process.env.JWT_PUBLIC_KEY;
        if (!token || !publicKey) {
            return next(new Error('Authentication required'));
        }
        try {
            const decoded = jwt.verify(publicKey.replace(/\n/g, '\n'), token, { algorithms: ['RS256'] }) as AuthenticatedUser;
            (socket as any).user = decoded;
            next();
        } catch (err) {
            next(new Error('Invalid token'));
        }
    });

    // Map of active session timers
    interface TimerState {
        timer: NodeJS.Timeout;
        intervals: Array<{ phase: 'work' | 'rest'; durationSec: number; sectionName?: string }>;
        currentIdx: number;
        remaining: number;
    }
    const activeTimers: Map<string, TimerState> = new Map();
    const TIMER_TICK_MS = 1000; // 1 second

    nsp.on('connection', async (socket) => {
        const { sessionId } = socket.handshake.query as { sessionId?: string };
        if (!sessionId) {
            socket.disconnect(true);
            return;
        }

        const user = (socket as any).user as AuthenticatedUser;
        console.log(`[Socket] Interval client connected for session ${sessionId}, user ${user?.id}, socket ${socket.id}`);
        socket.join(`session-${sessionId}`);

        // send initial snapshot of intervals
        try {
            const session: ScheduledPhysicalSession | null = await findScheduledSessionById(sessionId);
            if (!session) {
                socket.emit('error', { message: 'Session not found' });
                socket.disconnect(true);
                return;
            }
            const intervals = buildIntervalPayload(session);
            socket.emit('intervals_snapshot', intervals);
            // If timer already running, send current state
            const existing = activeTimers.get(sessionId);
            if (existing) {
                socket.emit('timer_state', {
                    intervalIndex: existing.currentIdx,
                    phase: existing.intervals[existing.currentIdx].phase,
                    secondsRemaining: existing.remaining,
                    sectionName: existing.intervals[existing.currentIdx].sectionName
                });
            }
            // Save intervals as reference on socket for quick access
            (socket as any).intervals = intervals.intervals;
        } catch (err) {
            console.error('[Socket] Failed to fetch session intervals', err);
            socket.emit('error', { message: 'Failed to fetch intervals' });
        }

        socket.on('disconnect', () => {
            console.log(`[Socket] Interval client disconnected ${socket.id} from session ${sessionId}`);
        });

        /**
         * Trainer can broadcast start command to initiate timer.
         * Payload optional: { startAt?: number } to offset seconds.
         */
        const canControl = () => {
            return user && (user.roles.includes('fys_coach') || user.roles.includes('coach') || user.roles.includes('club_admin') || user.roles.includes('admin'));
        };

        socket.on('start_timer', async () => {
            if (!canControl()) {
                socket.emit('error', { message: 'Permission denied' });
                return;
            }
            if (activeTimers.has(sessionId)) {
                // Already running, ignore
                return;
            }

            // Ensure intervals data is available
            let intervals = (socket as any).intervals as Array<{ phase: 'work' | 'rest'; durationSec: number; sectionName?: string }>;
            if (!intervals) {
                try {
                    const session = await findScheduledSessionById(sessionId);
                    if (!session) return;
                    intervals = buildIntervalPayload(session).intervals;
                } catch (err) {
                    return;
                }
            }

            let currentIdx = 0;
            let remaining = intervals[0]?.durationSec || 0;

            // Immediately emit first tick so displays update promptly
            nsp.to(`session-${sessionId}`).emit('timer_tick', {
                intervalIndex: currentIdx,
                phase: intervals[currentIdx].phase,
                secondsRemaining: remaining,
                sectionName: intervals[currentIdx].sectionName
            });

            const timerObj: TimerState = {
                timer: null as unknown as NodeJS.Timeout, // placeholder
                intervals,
                currentIdx,
                remaining
            };

            const tickFn = () => {
                timerObj.remaining -= 1;
                if (timerObj.remaining >= 0) {
                    nsp.to(`session-${sessionId}`).emit('timer_tick', {
                        intervalIndex: timerObj.currentIdx,
                        phase: timerObj.intervals[timerObj.currentIdx].phase,
                        secondsRemaining: timerObj.remaining,
                        sectionName: timerObj.intervals[timerObj.currentIdx].sectionName
                    });
                }

                if (timerObj.remaining <= 0) {
                    timerObj.currentIdx += 1;
                    if (timerObj.currentIdx >= timerObj.intervals.length) {
                        clearInterval(timerObj.timer);
                        activeTimers.delete(sessionId);
                        nsp.to(`session-${sessionId}`).emit('timer_complete');
                    } else {
                        timerObj.remaining = timerObj.intervals[timerObj.currentIdx].durationSec;
                        nsp.to(`session-${sessionId}`).emit('interval_change', {
                            intervalIndex: timerObj.currentIdx,
                            phase: timerObj.intervals[timerObj.currentIdx].phase,
                            durationSec: timerObj.remaining,
                            sectionName: timerObj.intervals[timerObj.currentIdx].sectionName
                        });
                    }
                }
            };

            timerObj.timer = setInterval(tickFn, TIMER_TICK_MS);
            activeTimers.set(sessionId, timerObj);
        });

        socket.on('stop_timer', () => {
            if (!canControl()) {
                socket.emit('error', { message: 'Permission denied' });
                return;
            }
            const state = activeTimers.get(sessionId);
            if (state) {
                clearInterval(state.timer);
                activeTimers.delete(sessionId);
                nsp.to(`session-${sessionId}`).emit('timer_stopped');
            }
        });
    });
};

function buildIntervalPayload(session: ScheduledPhysicalSession) {
    const sections = (session.resolvedSections || []) as SessionSection[];
    const intervals: Array<{ phase: 'work' | 'rest'; durationSec: number; sectionName?: string }> = [];

    sections.forEach((section) => {
        const rounds = section.rounds ?? 1;
        const workTime = section.exercises.reduce((acc, ex) => acc + (ex.duration || 0), 0);
        const restTime = section.restBetweenRounds || 0;

        for (let i = 0; i < rounds; i++) {
            intervals.push({ phase: 'work', durationSec: workTime, sectionName: section.name });
            if (i < rounds - 1 && restTime > 0) {
                intervals.push({ phase: 'rest', durationSec: restTime, sectionName: section.name });
            }
        }
    });

    return { sessionId: session.id, intervals };
} 