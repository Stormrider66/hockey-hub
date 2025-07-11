"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const CachedWorkoutSessionService_1 = require("../services/CachedWorkoutSessionService");
const shared_lib_1 = require("@hockey-hub/shared-lib");
const shared_lib_2 = require("@hockey-hub/shared-lib");
const index_1 = require("../index");
const router = (0, express_1.Router)();
const workoutService = new CachedWorkoutSessionService_1.CachedWorkoutSessionService();
// Apply authentication to all routes
router.use(shared_lib_1.authenticate);
// Middleware to check database connection
const checkDatabase = (req, res, next) => {
    if (!database_1.AppDataSource.isInitialized) {
        return res.status(503).json({
            success: false,
            error: 'Database service unavailable',
            message: 'Please ensure the database is created and running'
        });
    }
    next();
};
// Get all workout sessions with pagination
router.get('/sessions', (0, shared_lib_1.authorize)(['physical_trainer', 'coach', 'admin', 'player']), checkDatabase, async (req, res) => {
    try {
        const { teamId, playerId, status, date, type } = req.query;
        // Parse pagination parameters
        const paginationParams = (0, shared_lib_1.parsePaginationParams)(req.query, {
            page: 1,
            limit: 20,
            maxLimit: 100
        });
        const filters = {
            teamId: teamId,
            playerId: playerId,
            status: status,
            type: type,
            date: date ? new Date(date) : undefined,
        };
        const result = await workoutService.getWorkoutSessions(filters, paginationParams.page, paginationParams.limit);
        res.json({
            success: true,
            ...result
        });
    }
    catch (error) {
        console.error('Error fetching workout sessions:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch workout sessions' });
    }
});
// Get single workout session
router.get('/sessions/:id', (0, shared_lib_1.authorize)(['physical_trainer', 'coach', 'admin', 'player', 'parent']), checkDatabase, async (req, res) => {
    try {
        const sessionId = req.params.id;
        const session = await workoutService.getWorkoutSessionById(sessionId);
        res.json({ success: true, data: session });
    }
    catch (error) {
        console.error('Error fetching workout session:', error);
        if (error instanceof Error && error.message === 'Workout session not found') {
            res.status(404).json({ success: false, error: 'Workout session not found' });
        }
        else {
            res.status(500).json({ success: false, error: 'Failed to fetch workout session' });
        }
    }
});
// Create workout session
router.post('/sessions', (0, shared_lib_1.authorize)(['physical_trainer', 'coach', 'admin']), (0, shared_lib_1.validationMiddleware)(shared_lib_2.CreateWorkoutSessionDto), checkDatabase, async (req, res) => {
    try {
        const { title, description, type, scheduledDate, location, teamId, playerIds, exercises, playerLoads, settings, estimatedDuration } = req.body;
        const workoutData = {
            title,
            description,
            type,
            scheduledDate: new Date(scheduledDate),
            location,
            teamId,
            playerIds,
            createdBy: req.body.userId || 'system', // Should come from auth middleware
            exercises,
            playerLoads,
            settings,
            estimatedDuration
        };
        const workout = await workoutService.createWorkoutSession(workoutData);
        // Publish workout created event
        try {
            const eventService = (0, index_1.getTrainingEventService)();
            const user = req.user;
            if (user) {
                eventService.setUserContext(user.id, user.organizationId);
            }
            // If this is a workout assignment, publish the event
            // Note: This is a simplified example - in production, you'd create proper WorkoutAssignment entities
            if (workout.id && teamId) {
                await eventService.publishWorkoutCreated({
                    id: workout.id,
                    sessionTemplateId: workout.id,
                    playerId: playerIds?.[0] || 'team',
                    teamId,
                    organizationId: user?.organizationId || teamId,
                    scheduledDate: workout.scheduledDate,
                    completedAt: null,
                    startedAt: null,
                    exercisesCompleted: null,
                    exercisesTotal: workout.exercises?.length || 0
                }, req.headers['x-correlation-id']);
            }
        }
        catch (eventError) {
            console.error('Failed to publish workout created event:', eventError);
            // Don't fail the request if event publishing fails
        }
        res.status(201).json({ success: true, data: workout });
    }
    catch (error) {
        console.error('Error creating workout session:', error);
        res.status(500).json({ success: false, error: 'Failed to create workout session' });
    }
});
// Update workout session
router.put('/sessions/:id', (0, shared_lib_1.authorize)(['physical_trainer', 'coach', 'admin']), (0, shared_lib_1.validationMiddleware)(shared_lib_2.UpdateWorkoutSessionDto), checkDatabase, async (req, res) => {
    try {
        const { title, description, type, scheduledDate, location, status, playerIds, settings, exercises } = req.body;
        const updateData = {
            title,
            description,
            type,
            status,
            scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
            location,
            playerIds,
            settings,
            exercises
        };
        const updatedWorkout = await workoutService.updateWorkoutSession(req.params.id, updateData);
        res.json({ success: true, data: updatedWorkout });
    }
    catch (error) {
        console.error('Error updating workout session:', error);
        if (error instanceof Error && error.message === 'Workout session not found') {
            res.status(404).json({ success: false, error: 'Workout session not found' });
        }
        else {
            res.status(500).json({ success: false, error: 'Failed to update workout session' });
        }
    }
});
// Delete workout session
router.delete('/sessions/:id', (0, shared_lib_1.authorize)(['physical_trainer', 'coach', 'admin']), checkDatabase, async (req, res) => {
    try {
        await workoutService.deleteWorkoutSession(req.params.id);
        res.json({ success: true, message: 'Workout session deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting workout session:', error);
        if (error instanceof Error && error.message === 'Workout session not found') {
            res.status(404).json({ success: false, error: 'Workout session not found' });
        }
        else {
            res.status(500).json({ success: false, error: 'Failed to delete workout session' });
        }
    }
});
// Update player workout load
router.put('/sessions/:sessionId/players/:playerId/load', (0, shared_lib_1.authorize)(['physical_trainer', 'coach', 'admin']), (0, shared_lib_1.validationMiddleware)(shared_lib_2.PlayerLoadDto), checkDatabase, async (req, res) => {
    try {
        const { sessionId, playerId } = req.params;
        const { loadModifier, exerciseModifications, notes } = req.body;
        const savedLoad = await workoutService.updatePlayerWorkoutLoad(sessionId, playerId, {
            loadModifier,
            exerciseModifications,
            notes
        });
        res.json({ success: true, data: savedLoad });
    }
    catch (error) {
        console.error('Error updating player workout load:', error);
        res.status(500).json({ success: false, error: 'Failed to update player workout load' });
    }
});
// Get player workout load
router.get('/sessions/:sessionId/players/:playerId/load', (0, shared_lib_1.authorize)(['physical_trainer', 'coach', 'admin', 'player']), checkDatabase, async (req, res) => {
    try {
        const { sessionId, playerId } = req.params;
        const playerLoad = await workoutService.getPlayerWorkoutLoad(sessionId, playerId);
        if (!playerLoad) {
            return res.status(404).json({ success: false, error: 'Player workout load not found' });
        }
        res.json({ success: true, data: playerLoad });
    }
    catch (error) {
        console.error('Error fetching player workout load:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch player workout load' });
    }
});
// Get upcoming workout sessions for a player
router.get('/sessions/upcoming/:playerId', (0, shared_lib_1.authorize)(['physical_trainer', 'coach', 'admin', 'player', 'parent']), checkDatabase, async (req, res) => {
    try {
        const { playerId } = req.params;
        const { teamId, days = '7' } = req.query;
        const upcomingSessions = await workoutService.getUpcomingWorkoutSessions(playerId, teamId, parseInt(days));
        res.json({ success: true, data: upcomingSessions });
    }
    catch (error) {
        console.error('Error fetching upcoming workout sessions:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch upcoming workout sessions' });
    }
});
// Apply checkDatabase middleware to all routes
router.use(checkDatabase);
exports.default = router;
//# sourceMappingURL=workoutRoutes.js.map