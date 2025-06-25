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
exports.deleteTreatmentPlanItem = exports.updateTreatmentPlanItem = exports.createTreatmentPlanItem = exports.findItemsByPlanId = void 0;
const db_1 = __importDefault(require("../db"));
const findItemsByPlanId = (planId) => __awaiter(void 0, void 0, void 0, function* () {
    const query = 'SELECT * FROM treatment_plan_items WHERE treatment_plan_id = $1 ORDER BY sequence';
    const params = [planId];
    try {
        const result = yield db_1.default.query(query, params);
        return result.rows;
    }
    catch (error) {
        console.error('[DB Error] Failed to find treatment plan items for plan', planId, error);
        throw new Error('Database error while fetching treatment plan items.');
    }
});
exports.findItemsByPlanId = findItemsByPlanId;
const createTreatmentPlanItem = (item) => __awaiter(void 0, void 0, void 0, function* () {
    const { planId, description, frequency, duration, sets, reps, progressionCriteria, exerciseId, sequence } = item;
    const query = `
    INSERT INTO treatment_plan_items (
      treatment_plan_id, description, frequency, duration,
      sets, reps, progression_criteria, exercise_id, sequence
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *;
  `;
    const params = [planId, description, frequency, duration, sets || null, reps || null, progressionCriteria || null, exerciseId || null, sequence];
    try {
        const result = yield db_1.default.query(query, params);
        return result.rows[0];
    }
    catch (error) {
        console.error('[DB Error] Failed to create treatment plan item', error);
        throw new Error('Database error while creating treatment plan item.');
    }
});
exports.createTreatmentPlanItem = createTreatmentPlanItem;
const updateTreatmentPlanItem = (id, data) => __awaiter(void 0, void 0, void 0, function* () {
    const fields = [];
    const params = [];
    let index = 1;
    if (data.description) {
        fields.push(`description = $${index++}`);
        params.push(data.description);
    }
    if (data.frequency) {
        fields.push(`frequency = $${index++}`);
        params.push(data.frequency);
    }
    if (data.duration) {
        fields.push(`duration = $${index++}`);
        params.push(data.duration);
    }
    if (data.sets !== undefined) {
        fields.push(`sets = $${index++}`);
        params.push(data.sets);
    }
    if (data.reps !== undefined) {
        fields.push(`reps = $${index++}`);
        params.push(data.reps);
    }
    if (data.progressionCriteria !== undefined) {
        fields.push(`progression_criteria = $${index++}`);
        params.push(data.progressionCriteria);
    }
    if (data.exerciseId !== undefined) {
        fields.push(`exercise_id = $${index++}`);
        params.push(data.exerciseId);
    }
    if (data.sequence !== undefined) {
        fields.push(`sequence = $${index++}`);
        params.push(data.sequence);
    }
    if (fields.length === 0) {
        throw new Error('No fields provided for treatment plan item update.');
    }
    fields.push('updated_at = NOW()');
    const query = `
    UPDATE treatment_plan_items SET ${fields.join(', ')} WHERE id = $${index++} RETURNING *;
  `;
    params.push(id);
    try {
        const result = yield db_1.default.query(query, params);
        if (result.rows.length === 0) {
            return null;
        }
        return result.rows[0];
    }
    catch (error) {
        console.error('[DB Error] Failed to update treatment plan item', id, error);
        throw new Error('Database error while updating treatment plan item.');
    }
});
exports.updateTreatmentPlanItem = updateTreatmentPlanItem;
const deleteTreatmentPlanItem = (id) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const result = yield db_1.default.query('DELETE FROM treatment_plan_items WHERE id = $1', [id]);
        return ((_a = result.rowCount) !== null && _a !== void 0 ? _a : 0) > 0;
    }
    catch (error) {
        console.error('[DB Error] Failed to delete treatment plan item', id, error);
        throw new Error('Database error while deleting treatment plan item.');
    }
});
exports.deleteTreatmentPlanItem = deleteTreatmentPlanItem;
