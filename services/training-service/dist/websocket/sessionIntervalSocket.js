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
exports.initSessionIntervalSocket = void 0;
const ScheduledSessionRepository_1 = require("../repositories/ScheduledSessionRepository");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const initSessionIntervalSocket = (io) => {
    const nsp = io.of('/session-intervals');
    // Authentication middleware similar to comm‑service
    nsp.use((socket, next) => {
        var _a;
        const token = (_a = socket.handshake.auth) === null || _a === void 0 ? void 0 : _a.token;
        const publicKey = process.env.JWT_PUBLIC_KEY;
        if (!token || !publicKey) {
            return next(new Error('Authentication required'));
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(publicKey.replace(/\n/g, '\n'), token, { algorithms: ['RS256'] });
            socket.user = decoded;
            next();
        }
        catch (err) {
            next(new Error('Invalid token'));
        }
    });
    const activeTimers = new Map();
    const TIMER_TICK_MS = 1000; // 1 second
    nsp.on('connection', (socket) => __awaiter(void 0, void 0, void 0, function* () {
        const { sessionId } = socket.handshake.query;
        if (!sessionId) {
            socket.disconnect(true);
            return;
        }
        const user = socket.user;
        console.log(`[Socket] Interval client connected for session ${sessionId}, user ${user === null || user === void 0 ? void 0 : user.id}, socket ${socket.id}`);
        socket.join(`session-${sessionId}`);
        // send initial snapshot of intervals
        try {
            const session = yield (0, ScheduledSessionRepository_1.findScheduledSessionById)(sessionId);
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
            socket.intervals = intervals.intervals;
        }
        catch (err) {
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
        socket.on('start_timer', () => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            if (!canControl()) {
                socket.emit('error', { message: 'Permission denied' });
                return;
            }
            if (activeTimers.has(sessionId)) {
                // Already running, ignore
                return;
            }
            // Ensure intervals data is available
            let intervals = socket.intervals;
            if (!intervals) {
                try {
                    const session = yield (0, ScheduledSessionRepository_1.findScheduledSessionById)(sessionId);
                    if (!session)
                        return;
                    intervals = buildIntervalPayload(session).intervals;
                }
                catch (err) {
                    return;
                }
            }
            let currentIdx = 0;
            let remaining = ((_a = intervals[0]) === null || _a === void 0 ? void 0 : _a.durationSec) || 0;
            // Immediately emit first tick so displays update promptly
            nsp.to(`session-${sessionId}`).emit('timer_tick', {
                intervalIndex: currentIdx,
                phase: intervals[currentIdx].phase,
                secondsRemaining: remaining,
                sectionName: intervals[currentIdx].sectionName
            });
            const timerObj = {
                timer: null, // placeholder
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
                    }
                    else {
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
        }));
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
    }));
};
exports.initSessionIntervalSocket = initSessionIntervalSocket;
function buildIntervalPayload(session) {
    const sections = (session.resolvedSections || []);
    const intervals = [];
    sections.forEach((section) => {
        var _a;
        const rounds = (_a = section.rounds) !== null && _a !== void 0 ? _a : 1;
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
