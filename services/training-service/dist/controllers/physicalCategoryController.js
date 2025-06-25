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
exports.deleteCategoryHandler = exports.updateCategoryHandler = exports.createCategoryHandler = exports.getCategoryById = exports.getCategories = void 0;
const CategoryRepository = __importStar(require("../repositories/PhysicalCategoryRepository"));
// TODO: Add validation, authorization, error handling
const getCategories = (_req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // TODO: Get organizationId from req.user
    const organizationId = 'placeholder-org-id';
    try {
        const categories = yield CategoryRepository.findCategoriesByOrgId(organizationId);
        res.status(200).json({ success: true, data: categories });
    }
    catch (error) {
        next(error);
    }
});
exports.getCategories = getCategories;
const getCategoryById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    // TODO: Get organizationId from req.user
    const organizationId = 'placeholder-org-id';
    // TODO: Validate ID
    try {
        const category = yield CategoryRepository.findCategoryById(id, organizationId);
        if (!category) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Category not found or not accessible' });
        }
        res.status(200).json({ success: true, data: category });
    }
    catch (error) {
        next(error);
    }
});
exports.getCategoryById = getCategoryById;
const createCategoryHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { name } = req.body;
    // TODO: Get organizationId and createdByUserId from req.user
    const organizationId = 'placeholder-org-id';
    const createdByUserId = 'placeholder-user-id';
    if (!name) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Missing required field: name' });
    }
    try {
        const categoryData = {
            name,
            organizationId,
            createdByUserId
        };
        const newCategory = yield CategoryRepository.createCategory(categoryData);
        res.status(201).json({ success: true, data: newCategory });
    }
    catch (error) {
        // TODO: Handle potential unique constraint errors (name per org)
        next(error);
    }
});
exports.createCategoryHandler = createCategoryHandler;
const updateCategoryHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { name } = req.body;
    // TODO: Get organizationId from req.user
    const organizationId = 'placeholder-org-id';
    // TODO: Validate ID and name
    if (!name) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Missing required field: name' });
    }
    try {
        const updatedCategory = yield CategoryRepository.updateCategory(id, organizationId, { name });
        if (!updatedCategory) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Category not found or not accessible' });
        }
        res.status(200).json({ success: true, data: updatedCategory });
    }
    catch (error) {
        next(error);
    }
});
exports.updateCategoryHandler = updateCategoryHandler;
const deleteCategoryHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    // TODO: Get organizationId from req.user
    const organizationId = 'placeholder-org-id';
    // TODO: Validate ID
    try {
        const deleted = yield CategoryRepository.deleteCategory(id, organizationId);
        if (!deleted) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Category not found or not accessible' });
        }
        res.status(200).json({ success: true, message: 'Category deleted successfully' });
    }
    catch (error) {
        next(error);
    }
});
exports.deleteCategoryHandler = deleteCategoryHandler;
