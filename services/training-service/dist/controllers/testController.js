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
exports.deleteTestResultHandler = exports.updateTestResultHandler = exports.createTestResultHandler = exports.getTestResultById = exports.getTestResults = exports.deleteTestDefinitionHandler = exports.updateTestDefinitionHandler = exports.createTestDefinitionHandler = exports.getTestDefinitionById = exports.getTestDefinitions = void 0;
const TestRepository = __importStar(require("../repositories/TestRepository"));
// TODO: Add validation, authorization, error handling
// --- Test Definition Controllers ---
const getTestDefinitions = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { category, search, isPublic, page = 1, limit = 20 } = req.query;
    const organizationId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId; // Assuming orgId is on user object from auth
    const filters = {
        organizationId,
        category: category,
        searchTerm: search,
        isPublic: isPublic !== undefined ? (isPublic === 'true') : undefined,
    };
    const limitNum = parseInt(limit, 10);
    const offset = (parseInt(page, 10) - 1) * limitNum;
    try {
        const definitions = yield TestRepository.findTestDefinitions(filters, limitNum, offset);
        const total = yield TestRepository.countTestDefinitions(filters);
        res.status(200).json({
            success: true,
            data: definitions,
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
exports.getTestDefinitions = getTestDefinitions;
const getTestDefinitionById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const { id } = req.params;
    const organizationId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.organizationId;
    try {
        const definition = yield TestRepository.findTestDefinitionById(id, organizationId);
        if (!definition) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Test definition not found or not accessible' });
        }
        res.status(200).json({ success: true, data: definition });
    }
    catch (error) {
        next(error);
    }
});
exports.getTestDefinitionById = getTestDefinitionById;
const createTestDefinitionHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _c, _d;
    const data = req.body;
    const organizationId = (_c = req.user) === null || _c === void 0 ? void 0 : _c.organizationId;
    const createdByUserId = (_d = req.user) === null || _d === void 0 ? void 0 : _d.id;
    if (!data.name || !data.category || !data.unit || !data.scoreDirection) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Missing required fields: name, category, unit, scoreDirection' });
    }
    if (!organizationId && !data.isPublic) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Organization ID is required for non-public test definitions.' });
    }
    try {
        const definitionToSave = {
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
        const newDefinition = yield TestRepository.createTestDefinition(definitionToSave);
        res.status(201).json({ success: true, data: newDefinition });
    }
    catch (error) {
        next(error);
    }
});
exports.createTestDefinitionHandler = createTestDefinitionHandler;
const updateTestDefinitionHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const data = req.body;
    // TODO: Add authorization checks (can user update this definition?)
    // Prevent changing ownership fields
    delete data.organizationId;
    delete data.createdByUserId;
    delete data.id;
    delete data.createdAt;
    delete data.updatedAt;
    try {
        const updatedDefinition = yield TestRepository.updateTestDefinition(id, data);
        if (!updatedDefinition) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Test definition not found' });
        }
        res.status(200).json({ success: true, data: updatedDefinition });
    }
    catch (error) {
        next(error);
    }
});
exports.updateTestDefinitionHandler = updateTestDefinitionHandler;
const deleteTestDefinitionHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    // TODO: Add authorization checks
    try {
        const deleted = yield TestRepository.deleteTestDefinition(id);
        if (!deleted) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Test definition not found' });
        }
        res.status(200).json({ success: true, message: 'Test definition deleted successfully' });
    }
    catch (error) {
        next(error);
    }
});
exports.deleteTestDefinitionHandler = deleteTestDefinitionHandler;
// --- Test Result Controllers ---
const getTestResults = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { playerId, testDefinitionId, testBatchId, teamId, dateFrom, dateTo, page = 1, limit = 20 } = req.query;
    // TODO: Add authorization checks (can user see these results? based on team/player relationship)
    const filters = {
        playerId: playerId,
        testDefinitionId: testDefinitionId,
        testBatchId: testBatchId,
        teamId: teamId,
        dateFrom: dateFrom,
        dateTo: dateTo,
    };
    const limitNum = parseInt(limit, 10);
    const offset = (parseInt(page, 10) - 1) * limitNum;
    try {
        // If filtering by teamId, need to get playerIds first (complex, placeholder)
        if (filters.teamId && !filters.playerId) {
            console.warn('[TODO] Filtering test results by teamId requires fetching player list first.');
            // Example: const playerIds = await fetchPlayerIdsForTeam(filters.teamId);
            // Then adjust filters.playerId to be IN (playerIds...)
        }
        const results = yield TestRepository.findTestResults(filters, limitNum, offset);
        const total = yield TestRepository.countTestResults(filters);
        res.status(200).json({
            success: true,
            data: results,
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
exports.getTestResults = getTestResults;
const getTestResultById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    // TODO: Add authorization checks
    try {
        const result = yield TestRepository.findTestResultById(id);
        if (!result) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Test result not found' });
        }
        res.status(200).json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
});
exports.getTestResultById = getTestResultById;
const createTestResultHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _e;
    const data = req.body;
    const administeredByUserId = (_e = req.user) === null || _e === void 0 ? void 0 : _e.id; // Assuming recorder is logged in user
    // TODO: Add robust validation
    if (!data.playerId || !data.testDefinitionId || data.value === undefined || !data.unit || !data.datePerformed) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Missing required fields: playerId, testDefinitionId, value, unit, datePerformed' });
    }
    try {
        const resultToSave = {
            playerId: data.playerId,
            testDefinitionId: data.testDefinitionId,
            testBatchId: data.testBatchId,
            value: data.value,
            unit: data.unit,
            datePerformed: new Date(data.datePerformed),
            administeredByUserId,
            notes: data.notes
        };
        const newResult = yield TestRepository.createTestResult(resultToSave);
        res.status(201).json({ success: true, data: newResult });
    }
    catch (error) {
        next(error);
    }
});
exports.createTestResultHandler = createTestResultHandler;
const updateTestResultHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const data = req.body;
    // TODO: Add authorization checks
    if (data.value === undefined && data.notes === undefined) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Missing fields to update: value or notes' });
    }
    try {
        const updatedResult = yield TestRepository.updateTestResult(id, data);
        if (!updatedResult) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Test result not found' });
        }
        res.status(200).json({ success: true, data: updatedResult });
    }
    catch (error) {
        next(error);
    }
});
exports.updateTestResultHandler = updateTestResultHandler;
const deleteTestResultHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    // TODO: Add authorization checks
    try {
        const deleted = yield TestRepository.deleteTestResult(id);
        if (!deleted) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Test result not found' });
        }
        res.status(200).json({ success: true, message: 'Test result deleted successfully' });
    }
    catch (error) {
        next(error);
    }
});
exports.deleteTestResultHandler = deleteTestResultHandler;
// TODO: Add controllers for Test Batches if needed 
