import { Request, Response, NextFunction } from 'express';
import * as TestRepository from '../repositories/TestRepository';
import { TestDefinition, TestResult } from '../types/test';

// TODO: Add validation, authorization, error handling

// --- Test Definition Controllers ---

export const getTestDefinitions = async (req: Request, res: Response, next: NextFunction) => {
    const { category, search, isPublic, page = 1, limit = 20 } = req.query;
    const organizationId = (req as any).user?.organizationId; // Assuming orgId is on user object from auth

    const filters = {
        organizationId,
        category: category as string | undefined,
        searchTerm: search as string | undefined,
        isPublic: isPublic !== undefined ? (isPublic === 'true') : undefined,
    };
    const limitNum = parseInt(limit as string, 10);
    const offset = (parseInt(page as string, 10) - 1) * limitNum;

    try {
        const definitions = await TestRepository.findTestDefinitions(filters, limitNum, offset);
        const total = await TestRepository.countTestDefinitions(filters);
        res.status(200).json({ 
            success: true, 
            data: definitions,
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

export const getTestDefinitionById = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const organizationId = (req as any).user?.organizationId;
    try {
        const definition = await TestRepository.findTestDefinitionById(id, organizationId);
        if (!definition) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Test definition not found or not accessible' });
        }
        res.status(200).json({ success: true, data: definition });
    } catch (error) {
        next(error);
    }
};

export const createTestDefinitionHandler = async (req: Request, res: Response, next: NextFunction) => {
    const data = req.body as Partial<TestDefinition>;
    const organizationId = (req as any).user?.organizationId;
    const createdByUserId = (req as any).user?.id;

    if (!data.name || !data.category || !data.unit || !data.scoreDirection) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Missing required fields: name, category, unit, scoreDirection' });
    }
    if (!organizationId && !data.isPublic) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Organization ID is required for non-public test definitions.' });
    }

    try {
        const definitionToSave: Omit<TestDefinition, 'id' | 'createdAt' | 'updatedAt'> = {
            name: data.name,
            category: data.category,
            description: data.description,
            protocol: data.protocol,
            unit: data.unit,
            scoreDirection: data.scoreDirection,
            organizationId: data.isPublic ? undefined : organizationId,
            isPublic: data.isPublic || false,
            createdByUserId
        };
        const newDefinition = await TestRepository.createTestDefinition(definitionToSave);
        res.status(201).json({ success: true, data: newDefinition });
    } catch (error) {
        next(error);
    }
};

export const updateTestDefinitionHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const data = req.body as Partial<TestDefinition>;
    // TODO: Add authorization checks (can user update this definition?)

    // Prevent changing ownership fields
    delete data.organizationId;
    delete data.createdByUserId;
    delete data.id;
    delete data.createdAt;
    delete data.updatedAt;

    try {
        const updatedDefinition = await TestRepository.updateTestDefinition(id, data);
        if (!updatedDefinition) {
             return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Test definition not found' });
        }
        res.status(200).json({ success: true, data: updatedDefinition });
    } catch (error) {
        next(error);
    }
};

export const deleteTestDefinitionHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    // TODO: Add authorization checks

    try {
        const deleted = await TestRepository.deleteTestDefinition(id);
        if (!deleted) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Test definition not found' });
        }
        res.status(200).json({ success: true, message: 'Test definition deleted successfully' });
    } catch (error) {
        next(error);
    }
};

// --- Test Result Controllers ---

export const getTestResults = async (req: Request, res: Response, next: NextFunction) => {
    const { playerId, testDefinitionId, testBatchId, teamId, dateFrom, dateTo, page = 1, limit = 20 } = req.query;
    // TODO: Add authorization checks (can user see these results? based on team/player relationship)
    const filters = {
        playerId: playerId as string | undefined,
        testDefinitionId: testDefinitionId as string | undefined,
        testBatchId: testBatchId as string | undefined,
        teamId: teamId as string | undefined,
        dateFrom: dateFrom as string | undefined,
        dateTo: dateTo as string | undefined,
    };
    const limitNum = parseInt(limit as string, 10);
    const offset = (parseInt(page as string, 10) - 1) * limitNum;

    try {
        // If filtering by teamId, need to get playerIds first (complex, placeholder)
        if (filters.teamId && !filters.playerId) {
            console.warn('[TODO] Filtering test results by teamId requires fetching player list first.');
            // Example: const playerIds = await fetchPlayerIdsForTeam(filters.teamId);
            // Then adjust filters.playerId to be IN (playerIds...)
        }

        const results = await TestRepository.findTestResults(filters, limitNum, offset);
        const total = await TestRepository.countTestResults(filters);
        res.status(200).json({ 
            success: true, 
            data: results,
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

export const getTestResultById = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    // TODO: Add authorization checks
    try {
        const result = await TestRepository.findTestResultById(id);
        if (!result) {
             return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Test result not found' });
        }
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const createTestResultHandler = async (req: Request, res: Response, next: NextFunction) => {
    const data = req.body as Partial<TestResult>;
    const administeredByUserId = (req as any).user?.id; // Assuming recorder is logged in user

    // TODO: Add robust validation
    if (!data.playerId || !data.testDefinitionId || data.value === undefined || !data.unit || !data.datePerformed) {
         return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Missing required fields: playerId, testDefinitionId, value, unit, datePerformed' });
    }

    try {
        const resultToSave: Omit<TestResult, 'id' | 'createdAt'> = {
            playerId: data.playerId,
            testDefinitionId: data.testDefinitionId,
            testBatchId: data.testBatchId,
            value: data.value,
            unit: data.unit,
            datePerformed: new Date(data.datePerformed),
            administeredByUserId,
            notes: data.notes
        };
        const newResult = await TestRepository.createTestResult(resultToSave);
         res.status(201).json({ success: true, data: newResult });
    } catch (error) {
        next(error);
    }
};

export const updateTestResultHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const data = req.body as Partial<Pick<TestResult, 'value' | 'notes'> >;
    // TODO: Add authorization checks

    if (data.value === undefined && data.notes === undefined) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Missing fields to update: value or notes' });
    }

    try {
        const updatedResult = await TestRepository.updateTestResult(id, data);
        if (!updatedResult) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Test result not found' });
        }
         res.status(200).json({ success: true, data: updatedResult });
    } catch (error) {
        next(error);
    }
};

export const deleteTestResultHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
     // TODO: Add authorization checks

    try {
        const deleted = await TestRepository.deleteTestResult(id);
        if (!deleted) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Test result not found' });
        }
        res.status(200).json({ success: true, message: 'Test result deleted successfully' });
    } catch (error) {
        next(error);
    }
};

// TODO: Add controllers for Test Batches if needed 