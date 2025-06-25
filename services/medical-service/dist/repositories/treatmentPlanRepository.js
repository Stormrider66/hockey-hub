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
exports.deleteTreatmentPlan = exports.updateTreatmentPlan = exports.createTreatmentPlan = exports.findPlansByInjuryId = void 0;
const db_1 = __importDefault(require("../db"));
const findPlansByInjuryId = (injuryId) => __awaiter(void 0, void 0, void 0, function* () {
    const query = 'SELECT * FROM treatment_plans WHERE injury_id = $1 ORDER BY created_at DESC';
    const params = [injuryId];
    try {
        const result = yield db_1.default.query(query, params);
        return result.rows;
    }
    catch (error) {
        console.error('[DB Error] Failed to find treatment plans for injury', injuryId, error);
        throw new Error('Database error while fetching treatment plans.');
    }
});
exports.findPlansByInjuryId = findPlansByInjuryId;
const createTreatmentPlan = (plan) => __awaiter(void 0, void 0, void 0, function* () {
    const { injuryId, phase, description, expectedDuration, goals, precautions, createdByUserId } = plan;
    const query = `
    INSERT INTO treatment_plans (
      injury_id, phase, description, expected_duration,
      goals, precautions, created_by_user_id
    ) VALUES ($1,$2,$3,$4,$5,$6,$7)
    RETURNING *
  `;
    const params = [injuryId, phase, description, expectedDuration, goals, precautions || null, createdByUserId];
    try {
        const result = yield db_1.default.query(query, params);
        return result.rows[0];
    }
    catch (error) {
        console.error('[DB Error] Failed to create treatment plan', error);
        throw new Error('Database error while creating treatment plan.');
    }
});
exports.createTreatmentPlan = createTreatmentPlan;
const updateTreatmentPlan = (id, data) => __awaiter(void 0, void 0, void 0, function* () {
    const fields = [];
    const params = [];
    let index = 1;
    if (data.phase) {
        fields.push(`phase = $${index++}`);
        params.push(data.phase);
    }
    if (data.description) {
        fields.push(`description = $${index++}`);
        params.push(data.description);
    }
    if (data.expectedDuration !== undefined) {
        fields.push(`expected_duration = $${index++}`);
        params.push(data.expectedDuration);
    }
    if (data.goals) {
        fields.push(`goals = $${index++}`);
        params.push(data.goals);
    }
    if (data.precautions !== undefined) {
        fields.push(`precautions = $${index++}`);
        params.push(data.precautions);
    }
    if (fields.length === 0) {
        throw new Error('No fields provided for treatment plan update.');
    }
    fields.push('updated_at = NOW()');
    const query = `
    UPDATE treatment_plans SET ${fields.join(', ')} WHERE id = $${index++} RETURNING *
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
        console.error('[DB Error] Failed to update treatment plan', id, error);
        throw new Error('Database error while updating treatment plan.');
    }
});
exports.updateTreatmentPlan = updateTreatmentPlan;
const deleteTreatmentPlan = (id) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const result = yield db_1.default.query('DELETE FROM treatment_plans WHERE id = $1', [id]);
        return ((_a = result.rowCount) !== null && _a !== void 0 ? _a : 0) > 0;
    }
    catch (error) {
        console.error('[DB Error] Failed to delete treatment plan', id, error);
        throw new Error('Database error while deleting treatment plan.');
    }
});
exports.deleteTreatmentPlan = deleteTreatmentPlan;
