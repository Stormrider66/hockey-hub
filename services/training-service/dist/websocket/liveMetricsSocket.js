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
exports.initLiveMetricsSocket = void 0;
const LiveMetricsRepository_1 = require("../repositories/LiveMetricsRepository");
const initLiveMetricsSocket = (io) => {
    const nsp = io.of('/live-metrics');
    // Track active team rooms that have at least one connected client
    const activeTeams = new Set();
    nsp.on('connection', (socket) => {
        const { teamId } = socket.handshake.query;
        if (!teamId) {
            socket.disconnect(true);
            return;
        }
        console.log(`[Socket] Client connected to team ${teamId}, socket ${socket.id}`);
        const roomName = `team-${teamId}`;
        socket.join(roomName);
        activeTeams.add(teamId);
        // send initial metrics snapshot
        (() => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const data = yield (0, LiveMetricsRepository_1.findLatestMetricsByTeamId)(teamId);
                socket.emit('metrics_snapshot', data);
            }
            catch (err) {
                console.error('[Socket] Failed to fetch initial metrics', err);
            }
        }))();
        socket.on('disconnect', () => {
            console.log(`[Socket] Client disconnected ${socket.id} from team ${teamId}`);
            // Remove team from active set if no clients remain
            const room = nsp.adapter.rooms.get(roomName);
            if (!room || room.size === 0) {
                activeTeams.delete(teamId);
            }
        });
    });
    // Poll DB periodically and broadcast updates to each active team room
    const POLL_INTERVAL_MS = 5000; // configurable
    setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
        for (const teamId of activeTeams) {
            try {
                const data = yield (0, LiveMetricsRepository_1.findLatestMetricsByTeamId)(teamId);
                nsp.to(`team-${teamId}`).emit('metrics_update', data);
            }
            catch (err) {
                console.error('[LiveMetricsPoller] Error fetching metrics for team', teamId, err);
            }
        }
    }), POLL_INTERVAL_MS);
};
exports.initLiveMetricsSocket = initLiveMetricsSocket;
