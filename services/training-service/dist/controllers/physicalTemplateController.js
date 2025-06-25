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
exports.copyTemplateHandler = exports.deleteTemplateHandler = exports.updateTemplateHandler = exports.createTemplateHandler = exports.getTemplateById = exports.getTemplates = void 0;
const TemplateRepository = __importStar(require("../repositories/PhysicalTemplateRepository"));
// TODO: Add validation, authorization, error handling
const getTemplates = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { categoryId, search, isPublic, page = 1, limit = 20 } = req.query;
    // TODO: Get organizationId from req.user
    const organizationId = 'placeholder-org-id';
    const filters = {
        organizationId,
        categoryId: categoryId,
        searchTerm: search,
        isPublic: isPublic !== undefined ? (isPublic === 'true') : undefined,
    };
    const limitNum = parseInt(limit, 10);
    const offset = (parseInt(page, 10) - 1) * limitNum;
    try {
        const templates = yield TemplateRepository.findTemplates(filters, limitNum, offset);
        const total = yield TemplateRepository.countTemplates(filters);
        res.status(200).json({
            success: true,
            data: templates,
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
exports.getTemplates = getTemplates;
const getTemplateById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    // TODO: Get organizationId from req.user
    const organizationId = 'placeholder-org-id';
    // TODO: Validate ID
    try {
        const template = yield TemplateRepository.findTemplateById(id, organizationId);
        if (!template) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Template not found or not accessible' });
        }
        res.status(200).json({ success: true, data: template });
    }
    catch (error) {
        next(error);
    }
});
exports.getTemplateById = getTemplateById;
const createTemplateHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const templateData = req.body;
    // TODO: Get organizationId and createdByUserId from req.user
    const organizationId = 'placeholder-org-id';
    const createdByUserId = 'placeholder-user-id';
    // TODO: Add robust validation (Zod/Joi), especially for the sections JSON
    if (!templateData.name || !templateData.categoryId || !templateData.sections) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Missing required fields: name, categoryId, sections' });
    }
    try {
        const dataToSave = {
            name: templateData.name,
            description: templateData.description,
            categoryId: templateData.categoryId,
            createdByUserId,
            organizationId,
            sections: templateData.sections, // Assume sections structure is validated
            estimatedDuration: templateData.estimatedDuration,
            isPublic: templateData.isPublic || false
        };
        const newTemplate = yield TemplateRepository.createTemplate(dataToSave);
        res.status(201).json({ success: true, data: newTemplate });
    }
    catch (error) {
        next(error);
    }
});
exports.createTemplateHandler = createTemplateHandler;
const updateTemplateHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const updateData = req.body;
    // TODO: Get organizationId from req.user for authorization check
    const organizationId = 'placeholder-org-id';
    // TODO: Validate ID and updateData (especially sections JSON)
    // TODO: Check user has permission to update this template
    // Prevent changing ownership fields
    delete updateData.organizationId;
    delete updateData.createdByUserId;
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    try {
        const updatedTemplate = yield TemplateRepository.updateTemplate(id, organizationId, updateData);
        if (!updatedTemplate) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Template not found or not accessible' });
        }
        res.status(200).json({ success: true, data: updatedTemplate });
    }
    catch (error) {
        next(error);
    }
});
exports.updateTemplateHandler = updateTemplateHandler;
const deleteTemplateHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    // TODO: Get organizationId from req.user
    const organizationId = 'placeholder-org-id';
    // TODO: Validate ID
    // TODO: Check permissions
    try {
        const deleted = yield TemplateRepository.deleteTemplate(id, organizationId);
        if (!deleted) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Template not found or not accessible' });
        }
        res.status(200).json({ success: true, message: 'Template deleted successfully' });
    }
    catch (error) {
        next(error);
    }
});
exports.deleteTemplateHandler = deleteTemplateHandler;
// TODO: Add handler for copying a template (POST /:id/copy)
const copyTemplateHandler = (req, res, _next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    // TODO: Implement logic to fetch template, modify ownership/name, and create new one
    res.status(501).json({ message: `POST /${id}/copy Not Implemented Yet` });
});
exports.copyTemplateHandler = copyTemplateHandler;
