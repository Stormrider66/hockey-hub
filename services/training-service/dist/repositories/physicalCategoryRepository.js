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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.findCategoryById = exports.findCategoriesByOrgId = void 0;
const db_1 = __importDefault(require("../db"));
// TODO: Add validation for inputs
/**
 * Finds physical session categories for a specific organization.
 */
const findCategoriesByOrgId = (organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    const queryText = 'SELECT * FROM physical_session_categories WHERE organization_id = $1 ORDER BY name ASC';
    const params = [organizationId];
    console.log('[DB Query] Finding physical categories by org ID:', queryText, params);
    try {
        const result = yield db_1.default.query(queryText, params);
        console.log(`[DB Success] Found ${result.rows.length} categories for org ${organizationId}`);
        return result.rows;
    }
    catch (error) {
        console.error(`[DB Error] Failed to find categories for org ${organizationId}:`, error);
        throw new Error('Database error while fetching physical categories.');
    }
});
exports.findCategoriesByOrgId = findCategoriesByOrgId;
/**
 * Finds a specific physical session category by its ID.
 * Ensures the category belongs to the specified organization.
 */
const findCategoryById = (id, organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    const queryText = 'SELECT * FROM physical_session_categories WHERE id = $1 AND organization_id = $2';
    const params = [id, organizationId];
    console.log('[DB Query] Finding physical category by ID:', queryText, params);
    try {
        const result = yield db_1.default.query(queryText, params);
        if (result.rows.length === 0) {
            return null;
        }
        console.log(`[DB Success] Found category ${id}`);
        return result.rows[0];
    }
    catch (error) {
        console.error(`[DB Error] Failed to find category ${id}:`, error);
        throw new Error('Database error while fetching category by ID.');
    }
});
exports.findCategoryById = findCategoryById;
/**
 * Creates a new physical session category.
 */
const createCategory = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, createdByUserId, organizationId } = data;
    const queryText = `
        INSERT INTO physical_session_categories (name, created_by_user_id, organization_id)
        VALUES ($1, $2, $3)
        RETURNING *
    `;
    const params = [name, createdByUserId, organizationId];
    console.log('[DB Query] Creating physical category:', queryText, params);
    try {
        const result = yield db_1.default.query(queryText, params);
        console.log('[DB Success] Category created:', result.rows[0]);
        return result.rows[0];
    }
    catch (error) {
        console.error('[DB Error] Failed to create category:', error);
        // Handle potential unique constraint violation on name+orgId if needed
        throw new Error('Database error while creating category.');
    }
});
exports.createCategory = createCategory;
/**
 * Updates an existing physical session category.
 */
const updateCategory = (id, organizationId, data) => __awaiter(void 0, void 0, void 0, function* () {
    const { name } = data;
    if (!name) {
        throw new Error("Missing required field for update: name.");
    }
    const queryText = `
        UPDATE physical_session_categories 
        SET name = $1, updated_at = NOW()
        WHERE id = $2 AND organization_id = $3
        RETURNING *
    `;
    const params = [name, id, organizationId];
    console.log('[DB Query] Updating physical category:', queryText, params);
    try {
        const result = yield db_1.default.query(queryText, params);
        if (result.rows.length === 0) {
            return null; // Not found or not authorized for this org
        }
        console.log('[DB Success] Category updated:', result.rows[0]);
        return result.rows[0];
    }
    catch (error) {
        console.error(`[DB Error] Failed to update category ${id}:`, error);
        throw new Error('Database error while updating category.');
    }
});
exports.updateCategory = updateCategory;
/**
 * Deletes a physical session category.
 */
const deleteCategory = (id, organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    const queryText = 'DELETE FROM physical_session_categories WHERE id = $1 AND organization_id = $2';
    const params = [id, organizationId];
    console.log('[DB Query] Deleting physical category:', queryText, params);
    try {
        const result = yield db_1.default.query(queryText, params);
        const deleted = result.rowCount ? result.rowCount > 0 : false;
        console.log(`[DB Success] Category ${id} deletion attempt result: ${deleted}`);
        // Note: ON DELETE SET NULL is used for templates linking to categories.
        return deleted;
    }
    catch (error) {
        console.error(`[DB Error] Failed to delete category ${id}:`, error);
        throw new Error('Database error while deleting category.');
    }
});
exports.deleteCategory = deleteCategory;
