import { Server } from 'socket.io';
import { findLatestMetricsByTeamId } from '../repositories/LiveMetricsRepository';

export const initLiveMetricsSocket = (io: Server) => {
    const nsp = io.of('/live-metrics');

    // Track active team rooms that have at least one connected client
    const activeTeams = new Set<string>();

    nsp.on('connection', (socket) => {
        const { teamId } = socket.handshake.query as { teamId?: string };
        if (!teamId) {
            socket.disconnect(true);
            return;
        }

        console.log(`[Socket] Client connected to team ${teamId}, socket ${socket.id}`);

        const roomName = `team-${teamId}`;
        socket.join(roomName);
        activeTeams.add(teamId);

        // send initial metrics snapshot
        (async () => {
            try {
                const data = await findLatestMetricsByTeamId(teamId);
                socket.emit('metrics_snapshot', data);
            } catch (err) {
                console.error('[Socket] Failed to fetch initial metrics', err);
            }
        })();

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
    setInterval(async () => {
        for (const teamId of activeTeams) {
            try {
                const data = await findLatestMetricsByTeamId(teamId);
                nsp.to(`team-${teamId}`).emit('metrics_update', data);
            } catch (err) {
                console.error('[LiveMetricsPoller] Error fetching metrics for team', teamId, err);
            }
        }
    }, POLL_INTERVAL_MS);
}; 