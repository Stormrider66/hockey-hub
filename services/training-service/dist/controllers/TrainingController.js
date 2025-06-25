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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrainingController = void 0;
const ExerciseService_1 = require("../services/ExerciseService");
const PhysicalSessionTemplateService_1 = require("../services/PhysicalSessionTemplateService");
class TrainingController {
    constructor() {
        this.exerciseService = new ExerciseService_1.ExerciseService();
        this.templateService = new PhysicalSessionTemplateService_1.PhysicalSessionTemplateService();
        this.createExercise = this.createExercise.bind(this);
        this.getExercises = this.getExercises.bind(this);
        this.getExerciseById = this.getExerciseById.bind(this);
        this.updateExercise = this.updateExercise.bind(this);
        this.deleteExercise = this.deleteExercise.bind(this);
        this.createTemplate = this.createTemplate.bind(this);
        this.getTemplates = this.getTemplates.bind(this);
        this.getTemplateById = this.getTemplateById.bind(this);
        this.updateTemplate = this.updateTemplate.bind(this);
        this.deleteTemplate = this.deleteTemplate.bind(this);
    }
    createExercise(req, res, next) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const created_by_user_id = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || 'mock-user-id';
                const organization_id = (_b = req.user) === null || _b === void 0 ? void 0 : _b.organizationId;
                const exerciseData = Object.assign(Object.assign({}, req.body), { created_by_user_id, organization_id });
                const exercise = yield this.exerciseService.createExercise(exerciseData);
                res.status(201).json({ success: true, data: exercise });
            }
            catch (error) {
                next(error);
            }
        });
    }
    getExercises(req, res, next) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { category, search, page = '1', limit = '20' } = req.query;
                const organizationId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId;
                const filters = {
                    organizationId,
                    category: category,
                    searchTerm: search
                };
                const { exercises, total } = yield this.exerciseService.getAllExercises(filters, parseInt(page, 10), parseInt(limit, 10));
                res.json({
                    success: true,
                    data: exercises,
                    meta: {
                        pagination: {
                            page: parseInt(page, 10),
                            limit: parseInt(limit, 10),
                            total,
                            pages: Math.ceil(total / parseInt(limit, 10))
                        }
                    }
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    getExerciseById(req, res, next) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const organizationId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId;
                const exercise = yield this.exerciseService.getExerciseById(id, organizationId);
                res.json({ success: true, data: exercise });
            }
            catch (error) {
                next(error);
            }
        });
    }
    updateExercise(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const _a = req.body, { created_by_user_id, organization_id } = _a, updates = __rest(_a, ["created_by_user_id", "organization_id"]);
                const updatedExercise = yield this.exerciseService.updateExercise(id, updates);
                res.json({ success: true, data: updatedExercise });
            }
            catch (error) {
                next(error);
            }
        });
    }
    deleteExercise(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                yield this.exerciseService.deleteExercise(id);
                res.status(204).send();
            }
            catch (error) {
                next(error);
            }
        });
    }
    createTemplate(req, res, next) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const created_by_user_id = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || 'mock-user-id';
                const organization_id = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.organizationId) || 'mock-org-id';
                const templateData = Object.assign(Object.assign({}, req.body), { created_by_user_id, organization_id });
                const template = yield this.templateService.createTemplate(templateData);
                res.status(201).json({ success: true, data: template });
            }
            catch (error) {
                next(error);
            }
        });
    }
    getTemplates(req, res, next) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { categoryId, search, page = '1', limit = '20' } = req.query;
                const organizationId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId;
                const filters = {
                    organizationId,
                    categoryId: categoryId,
                    searchTerm: search
                };
                const { templates, total } = yield this.templateService.getAllTemplates(filters, parseInt(page, 10), parseInt(limit, 10));
                res.json({
                    success: true,
                    data: templates,
                    meta: {
                        pagination: {
                            page: parseInt(page, 10),
                            limit: parseInt(limit, 10),
                            total,
                            pages: Math.ceil(total / parseInt(limit, 10))
                        }
                    }
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    getTemplateById(req, res, next) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const organizationId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId;
                const template = yield this.templateService.getTemplateById(id, organizationId);
                res.json({ success: true, data: template });
            }
            catch (error) {
                next(error);
            }
        });
    }
    updateTemplate(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const _a = req.body, { created_by_user_id, organization_id } = _a, updates = __rest(_a, ["created_by_user_id", "organization_id"]);
                const updatedTemplate = yield this.templateService.updateTemplate(id, updates);
                res.json({ success: true, data: updatedTemplate });
            }
            catch (error) {
                next(error);
            }
        });
    }
    deleteTemplate(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                yield this.templateService.deleteTemplate(id);
                res.status(204).send();
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.TrainingController = TrainingController;
