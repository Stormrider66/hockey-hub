"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerTransferSaga = void 0;
class PlayerTransferSaga {
    static definition(userServiceClient) {
        const steps = [
            {
                name: 'validateTransfer',
                execute: async (data, context) => {
                    // Verify player exists and is active
                    const player = await userServiceClient.getUser({
                        userId: data.playerId,
                        includeTeams: true,
                    });
                    if (!player) {
                        throw new Error('Player not found');
                    }
                    // Verify player is member of source team
                    const isInFromTeam = player.teams.some(t => t.teamId === data.fromTeamId);
                    if (!isInFromTeam) {
                        throw new Error('Player is not a member of the source team');
                    }
                    context.metadata.playerData = player;
                },
                compensate: async () => {
                    // No compensation needed for validation
                },
                retryable: true,
                maxRetries: 2,
            },
            {
                name: 'checkMedicalClearance',
                execute: async (data, context) => {
                    // Check medical clearance from medical service
                    console.log('Checking medical clearance for player:', data.playerId);
                    // const clearance = await medicalServiceClient.getPlayerClearance(data.playerId);
                    // For now, assume cleared
                    context.metadata.medicalClearance = true;
                    if (!context.metadata.medicalClearance) {
                        throw new Error('Player does not have medical clearance for transfer');
                    }
                },
                compensate: async () => {
                    // No compensation needed
                },
                retryable: true,
            },
            {
                name: 'removeFromCurrentTeam',
                execute: async (data, context) => {
                    // Get current membership details before removal
                    const teamMembers = await userServiceClient.getTeamMembers(data.fromTeamId);
                    const membership = teamMembers.find(m => m.userId === data.playerId);
                    context.metadata.fromTeamMembership = membership;
                    // Remove from current team
                    await userServiceClient.removeUserFromTeam(data.fromTeamId, data.playerId);
                },
                compensate: async (data, context) => {
                    // Re-add to original team
                    if (context.metadata.fromTeamMembership) {
                        await userServiceClient.addUserToTeam(data.fromTeamId, data.playerId, context.metadata.fromTeamMembership.role, context.metadata.fromTeamMembership.jerseyNumber, context.metadata.fromTeamMembership.position);
                    }
                },
                retryable: true,
                maxRetries: 3,
            },
            {
                name: 'addToNewTeam',
                execute: async (data, _context) => {
                    // Add to new team
                    await userServiceClient.addUserToTeam(data.toTeamId, data.playerId, 'player', data.jerseyNumber, data.position);
                },
                compensate: async (data) => {
                    // Remove from new team
                    try {
                        await userServiceClient.removeUserFromTeam(data.toTeamId, data.playerId);
                    }
                    catch (error) {
                        console.error('Failed to remove player from new team:', error);
                    }
                },
                retryable: true,
                maxRetries: 3,
            },
            {
                name: 'transferTrainingSessions',
                execute: async (data, context) => {
                    // Transfer upcoming training sessions
                    console.log('Transferring training sessions for player:', data.playerId);
                    // const sessions = await trainingServiceClient.transferPlayerSessions({
                    //   playerId: data.playerId,
                    //   fromTeamId: data.fromTeamId,
                    //   toTeamId: data.toTeamId,
                    //   effectiveDate: data.transferDate,
                    // });
                    context.metadata.trainingSessionsTransferred = 5; // Mock value
                },
                compensate: async (_, context) => {
                    // Revert training sessions
                    if (context.metadata.trainingSessionsTransferred > 0) {
                        console.log('Reverting training session transfers');
                        // await trainingServiceClient.revertPlayerSessions({...});
                    }
                },
                retryable: true,
            },
            {
                name: 'updateStatistics',
                execute: async (_data, _context) => {
                    // Update player statistics for new team
                    console.log('Updating statistics for player transfer');
                    // await statisticsServiceClient.recordTransfer({
                    //   playerId: data.playerId,
                    //   fromTeamId: data.fromTeamId,
                    //   toTeamId: data.toTeamId,
                    //   date: data.transferDate,
                    // });
                },
                compensate: async (_) => {
                    // Revert statistics update
                    console.log('Reverting statistics update');
                    // await statisticsServiceClient.revertTransfer({...});
                },
                retryable: true,
            },
            {
                name: 'notifyStakeholders',
                execute: async (_data, _context) => {
                    // Send notifications
                    console.log('Sending transfer notifications');
                    // await communicationServiceClient.sendTransferNotifications({
                    //   playerId: data.playerId,
                    //   playerName: context.metadata.playerData.fullName,
                    //   fromTeamId: data.fromTeamId,
                    //   toTeamId: data.toTeamId,
                    //   reason: data.reason,
                    // });
                },
                compensate: async () => {
                    // Notifications cannot be undone, log for audit
                    console.log('Transfer notifications were sent and cannot be reverted');
                },
                retryable: false, // Don't retry notifications to avoid spam
            },
        ];
        return {
            name: 'playerTransfer',
            steps,
            onSuccess: async (data, context) => {
                console.log('Player transfer completed successfully:', {
                    playerId: data.playerId,
                    fromTeam: data.fromTeamId,
                    toTeam: data.toTeamId,
                    sessionsTransferred: context.metadata.trainingSessionsTransferred,
                });
            },
            onFailure: async (_, context, error) => {
                console.error('Player transfer failed:', error);
                console.log('Completed compensations for steps:', context.completedSteps);
                // Send failure notification
                console.log('Sending transfer failure notification');
                // await communicationServiceClient.sendTransferFailureNotification({...});
            },
        };
    }
}
exports.PlayerTransferSaga = PlayerTransferSaga;
//# sourceMappingURL=PlayerTransferSaga.js.map