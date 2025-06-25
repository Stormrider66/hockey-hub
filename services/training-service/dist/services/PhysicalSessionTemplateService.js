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
exports.PhysicalSessionTemplateService = void 0;
const PhysicalSessionTemplateRepository_1 = require("../repositories/PhysicalSessionTemplateRepository");
const AppError_1 = require("../utils/AppError");
class PhysicalSessionTemplateService {
    createTemplate(data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!data.name || !data.categoryId || !data.structure || !data.created_by_user_id || !data.organization_id) {
                throw new AppError_1.AppError('VALIDATION_ERROR', 'Missing required fields for template', 400);
            }
            return PhysicalSessionTemplateRepository_1.physicalSessionTemplateRepository.createTemplate(data);
        });
    }
    getAllTemplates(filters, page = 1, limit = 20) {
        return __awaiter(this, void 0, void 0, function* () {
            const offset = (page - 1) * limit;
            const [templates, total] = yield Promise.all([
                PhysicalSessionTemplateRepository_1.physicalSessionTemplateRepository.findTemplates(filters, limit, offset),
                PhysicalSessionTemplateRepository_1.physicalSessionTemplateRepository.countTemplates(filters)
            ]);
            return { templates, total };
        });
    }
    getTemplateById(id, organizationId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!id) {
                throw new AppError_1.AppError('VALIDATION_ERROR', 'Template ID is required', 400);
            }
            const template = yield PhysicalSessionTemplateRepository_1.physicalSessionTemplateRepository.findTemplateById(id, organizationId);
            if (!template) {
                throw new AppError_1.AppError('NOT_FOUND', `Template with ID ${id} not found`, 404);
            }
            return template;
        });
    }
    updateTemplate(id, updates) {
        return __awaiter(this, void 0, void 0, function* () {
            // Prevent changing creator or organization
            delete updates.created_by_user_id;
            delete updates.organization_id;
            const updatedTemplate = yield PhysicalSessionTemplateRepository_1.physicalSessionTemplateRepository.updateTemplate(id, updates);
            if (!updatedTemplate) {
                throw new AppError_1.AppError('NOT_FOUND', `Template with ID ${id} not found`, 404);
            }
            return updatedTemplate;
        });
    }
    deleteTemplate(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const deleted = yield PhysicalSessionTemplateRepository_1.physicalSessionTemplateRepository.deleteTemplate(id);
            if (!deleted) {
                throw new AppError_1.AppError('NOT_FOUND', `Template with ID ${id} not found for deletion`, 404);
            }
        });
    }
}
exports.PhysicalSessionTemplateService = PhysicalSessionTemplateService;
