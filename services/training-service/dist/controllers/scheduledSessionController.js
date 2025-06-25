"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.completeSessionHandler = exports.startSessionHandler = exports.deleteScheduledSessionHandler = exports.updateScheduledSessionHandler = exports.createScheduledSessionHandler = exports.getScheduledSessionById = exports.getScheduledSessions = void 0;
const SessionRepository = __importStar(require("../repositories/ScheduledSessionRepository"));
const TemplateRepository = __importStar(require("../repositories/PhysicalTemplateRepository")); // Needed to fetch template
const TestResultRepository = __importStar(require("../repositories/TestRepository")); // Re-enable import
const TestDefinitionRepository = __importStar(require("../repositories/TestRepository")); // Use same repo for definitions
const intensityCalculator_1 = require("../services/intensityCalculator"); // Assume this service exists
// TODO: Add validation, authorization, error handling
const getScheduledSessions = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { assignedToUserId, assignedToTeamId, status, dateFrom, dateTo, page = 1, limit = 20 } = req.query;
    // TODO: Add authorization - who can see whose sessions?
    const filters = {
        assignedToUserId: assignedToUserId,
        assignedToTeamId: assignedToTeamId,
        status: status,
        dateFrom: dateFrom,
        dateTo: dateTo,
    };
    const limitNum = parseInt(limit, 10);
    const offset = (parseInt(page, 10) - 1) * limitNum;
    try {
        const sessions = yield SessionRepository.findScheduledSessions(filters, limitNum, offset);
        const total = yield SessionRepository.countScheduledSessions(filters);
        res.status(200).json({
            success: true,
            data: sessions,
            meta: {
                pagination: {
                    page: parseInt(page, 10),
                    limit: limitNum,
                    total,
                    pages: Math.ceil(total / limitNum)
                }
            }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getScheduledSessions = getScheduledSessions;
const getScheduledSessionById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    // TODO: Add authorization checks
    try {
        const session = yield SessionRepository.findScheduledSessionById(id);
        if (!session) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Scheduled session not found' });
        }
        res.status(200).json({ success: true, data: session });
    }
    catch (error) {
        next(error);
    }
});
exports.getScheduledSessionById = getScheduledSessionById;
const createScheduledSessionHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { templateId, assignedToUserId, assignedToTeamId, scheduledDate, calendarEventId } = req.body;
    const organizationId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId;
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
        const template = yield TemplateRepository.findTemplateById(templateId, organizationId);
        if (!template || !template.sections) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Template not found, inaccessible, or has no sections' });
        }
        // 2. Resolve intensity 
        // TODO: Handle assignment to teams
        if (!assignedToUserId) {
            return res.status(400).json({ error: true, code: 'NOT_IMPLEMENTED', message: 'Assigning sessions directly to teams without resolving intensity per player is not yet supported.' });
        }
        // Find all unique test definition IDs referenced in the template
        const referencedTestDefIds = new Set();
        template.sections.forEach(section => {
            section.exercises.forEach(ex => {
                if (ex.intensityReferenceTestId) {
                    referencedTestDefIds.add(ex.intensityReferenceTestId);
                }
            });
        });
        // Fetch the definitions for those tests
        const testDefinitionsMap = new Map();
        if (referencedTestDefIds.size > 0) {
            // In a real app, fetch these efficiently (e.g., WHERE id = ANY(...) or batch API call)
            for (const testId of referencedTestDefIds) {
                const def = yield TestDefinitionRepository.findTestDefinitionById(testId, organizationId);
                if (def) {
                    testDefinitionsMap.set(testId, def);
                }
            }
        }
        // Fetch relevant test results for the user (only for referenced tests)
        const userTestResults = referencedTestDefIds.size > 0
            ? yield TestResultRepository.findTestResults({
                playerId: assignedToUserId,
                // Add filter for specific testDefinitionIds if supported by repo
                // testDefinitionId: Array.from(referencedTestDefIds) 
            }, 500, 0) // Fetch a decent number of recent results per test type
            : [];
        // Filter results to only include those needed by the template
        const relevantTestResults = userTestResults.filter(r => referencedTestDefIds.has(r.testDefinitionId));
        // Call the calculator service
        const resolvedSections = yield (0, intensityCalculator_1.resolveSessionIntensity)(template.sections, relevantTestResults, testDefinitionsMap);
        // 3. Create the scheduled session
        const sessionData = {
            templateId,
            assignedToUserId,
            assignedToTeamId: assignedToTeamId || null,
            scheduledDate: new Date(scheduledDate),
            calendarEventId: calendarEventId || null,
            resolvedSections // Store the calculated sections
        };
        const newSession = yield SessionRepository.createScheduledSession(sessionData);
        res.status(201).json({ success: true, data: newSession });
    }
    catch (error) {
        next(error);
    }
});
exports.createScheduledSessionHandler = createScheduledSessionHandler;
const updateScheduledSessionHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const data = req.body;
    // TODO: Add authorization checks
    try {
        const updatedSession = yield SessionRepository.updateScheduledSession(id, data);
        if (!updatedSession) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Scheduled session not found' });
        }
        res.status(200).json({ success: true, data: updatedSession });
    }
    catch (error) {
        next(error);
    }
});
exports.updateScheduledSessionHandler = updateScheduledSessionHandler;
const deleteScheduledSessionHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    // TODO: Add authorization checks
    try {
        const deleted = yield SessionRepository.deleteScheduledSession(id);
        if (!deleted) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Scheduled session not found' });
        }
        res.status(200).json({ success: true, message: 'Scheduled session deleted successfully' });
    }
    catch (error) {
        next(error);
    }
});
exports.deleteScheduledSessionHandler = deleteScheduledSessionHandler;
// --- Placeholder for Live Session Actions ---
const startSessionHandler = (req, res, _next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    // TODO: Update status to 'active', potentially notify via WebSocket
    res.status(501).json({ message: `POST /${id}/start Not Implemented Yet` });
});
exports.startSessionHandler = startSessionHandler;
const completeSessionHandler = (req, res, _next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const completionData = req.body; // Use the variable
    // TODO: Validate completionData structure
    // TODO: Update status to 'completed' and save completionData
    console.log(`Received completion data for session ${id}:`, completionData); // Use the variable
    // Example: await SessionRepository.updateScheduledSession(id, { status: 'completed', completionData: completionData });
    res.status(501).json({ message: `POST /${id}/complete Not Implemented Yet` });
});
exports.completeSessionHandler = completeSessionHandler;
// TODO: Add handler for getting session attendance (GET /:id/attendance) - might involve fetching participants 
