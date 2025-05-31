/// <reference path="../types/express.d.ts" />
import { Request, Response, NextFunction } from 'express';
import * as SessionRepository from '../repositories/ScheduledSessionRepository';
import * as TemplateRepository from '../repositories/PhysicalTemplateRepository'; // Needed to fetch template
import * as TestResultRepository from '../repositories/TestRepository'; // Re-enable import
import * as TestDefinitionRepository from '../repositories/TestRepository'; // Use same repo for definitions
import { ScheduledPhysicalSession } from '../types/training'; // Removed SessionExercise import
import { TestResult, TestDefinition } from '../types/test'; // Import TestResult
import { resolveSessionIntensity } from '../services/intensityCalculator'; // Assume this service exists

// TODO: Add validation, authorization, error handling

export const getScheduledSessions = async (req: Request, res: Response, next: NextFunction) => {
    const { assignedToUserId, assignedToTeamId, status, dateFrom, dateTo, page = 1, limit = 20 } = req.query;
    // TODO: Add authorization - who can see whose sessions?
    const filters = {
        assignedToUserId: assignedToUserId as string | undefined,
        assignedToTeamId: assignedToTeamId as string | undefined,
        status: status as string | undefined,
        dateFrom: dateFrom as string | undefined,
        dateTo: dateTo as string | undefined,
    };
    const limitNum = parseInt(limit as string, 10);
    const offset = (parseInt(page as string, 10) - 1) * limitNum;

    try {
        const sessions = await SessionRepository.findScheduledSessions(filters, limitNum, offset);
        const total = await SessionRepository.countScheduledSessions(filters);
         res.status(200).json({ 
            success: true, 
            data: sessions,
            meta: {
                pagination: {
                    page: parseInt(page as string, 10),
                    limit: limitNum,
                    total,
                    pages: Math.ceil(total / limitNum)
                }
            }
         });
    } catch (error) {
        next(error);
    }
};

export const getScheduledSessionById = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    // TODO: Add authorization checks
    try {
        const session = await SessionRepository.findScheduledSessionById(id);
        if (!session) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Scheduled session not found' });
        }
        res.status(200).json({ success: true, data: session });
    } catch (error) {
        next(error);
    }
};

export const createScheduledSessionHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { 
        templateId, 
        assignedToUserId, 
        assignedToTeamId, 
        scheduledDate, 
        calendarEventId 
    } = req.body;
    const organizationId = req.user?.organizationId;
    // const createdByUserId = req.user?.id; // Comment out unused variable

    // Basic validation
    if (!scheduledDate || (!assignedToUserId && !assignedToTeamId) || !templateId) {
         return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Missing required fields: scheduledDate, (assignedToUserId or assignedToTeamId), templateId' });
    }
    if (!organizationId) {
         return res.status(403).json({ error: true, code: 'FORBIDDEN', message: 'Organization context missing.' });
    }
    // TODO: Add more validation (date format, UUIDs)
    // TODO: Authorization checks (can user schedule for this player/team?)

    try {
        // 1. Fetch the template
        const template = await TemplateRepository.findTemplateById(templateId, organizationId);
        if (!template || !template.sections) {
             return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Template not found, inaccessible, or has no sections' });
        }
        
        // 2. Resolve intensity 
        // TODO: Handle assignment to teams
        if (!assignedToUserId) {
            return res.status(400).json({ error: true, code: 'NOT_IMPLEMENTED', message: 'Assigning sessions directly to teams without resolving intensity per player is not yet supported.' });
        }
        
        // Find all unique test definition IDs referenced in the template
        const referencedTestDefIds = new Set<string>();
        template.sections.forEach(section => {
            section.exercises.forEach(ex => {
                if (ex.intensityReferenceTestId) {
                    referencedTestDefIds.add(ex.intensityReferenceTestId);
                }
            });
        });

        // Fetch the definitions for those tests
        const testDefinitionsMap = new Map<string, TestDefinition>();
        if (referencedTestDefIds.size > 0) {
            // In a real app, fetch these efficiently (e.g., WHERE id = ANY(...) or batch API call)
            for (const testId of referencedTestDefIds) {
                const def = await TestDefinitionRepository.findTestDefinitionById(testId, organizationId);
                if (def) {
                    testDefinitionsMap.set(testId, def);
                }
            }
        }
        
        // Fetch relevant test results for the user (only for referenced tests)
        const userTestResults: TestResult[] = referencedTestDefIds.size > 0 
            ? await TestResultRepository.findTestResults({ 
                playerId: assignedToUserId, 
                // Add filter for specific testDefinitionIds if supported by repo
                // testDefinitionId: Array.from(referencedTestDefIds) 
              }, 500, 0) // Fetch a decent number of recent results per test type
            : [];
        
        // Filter results to only include those needed by the template
        const relevantTestResults = userTestResults.filter(r => referencedTestDefIds.has(r.testDefinitionId));

        // Call the calculator service
        const resolvedSections = await resolveSessionIntensity(template.sections, relevantTestResults, testDefinitionsMap);

        // 3. Create the scheduled session
        const sessionData: Omit<ScheduledPhysicalSession, 'id' | 'status' | 'completionData' | 'createdAt' | 'updatedAt'> = {
            templateId,
            assignedToUserId,
            assignedToTeamId: assignedToTeamId || null,
            scheduledDate: new Date(scheduledDate),
            calendarEventId: calendarEventId || null,
            resolvedSections // Store the calculated sections
        };

        const newSession = await SessionRepository.createScheduledSession(sessionData);
        res.status(201).json({ success: true, data: newSession });

    } catch (error) {
        next(error);
    }
};

export const updateScheduledSessionHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const data = req.body as Partial<Pick<ScheduledPhysicalSession, 'status' | 'completionData' | 'scheduledDate'> >;
    // TODO: Add authorization checks

    try {
        const updatedSession = await SessionRepository.updateScheduledSession(id, data);
         if (!updatedSession) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Scheduled session not found' });
        }
        res.status(200).json({ success: true, data: updatedSession });
    } catch (error) {
        next(error);
    }
};

export const deleteScheduledSessionHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    // TODO: Add authorization checks

    try {
        const deleted = await SessionRepository.deleteScheduledSession(id);
        if (!deleted) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Scheduled session not found' });
        }
        res.status(200).json({ success: true, message: 'Scheduled session deleted successfully' });
    } catch (error) {
        next(error);
    }
};

// --- Placeholder for Live Session Actions ---

export const startSessionHandler = async (req: Request, res: Response, _next: NextFunction) => { // Prefixed _next
    const { id } = req.params;
    // TODO: Update status to 'active', potentially notify via WebSocket
    res.status(501).json({ message: `POST /${id}/start Not Implemented Yet`});
};

export const completeSessionHandler = async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params;
    const completionData = req.body; // Use the variable
    // TODO: Validate completionData structure
    // TODO: Update status to 'completed' and save completionData
    console.log(`Received completion data for session ${id}:`, completionData); // Use the variable
    // Example: await SessionRepository.updateScheduledSession(id, { status: 'completed', completionData: completionData });
    res.status(501).json({ message: `POST /${id}/complete Not Implemented Yet`});
};

// TODO: Add handler for getting session attendance (GET /:id/attendance) - might involve fetching participants 