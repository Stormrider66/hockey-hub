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
exports.deleteTreatment = exports.updateTreatment = exports.createTreatment = exports.findTreatmentsByInjuryId = void 0;
const db_1 = __importDefault(require("../db"));
const findTreatmentsByInjuryId = (injuryId) => __awaiter(void 0, void 0, void 0, function* () {
    const query = 'SELECT * FROM treatments WHERE injury_id = $1 ORDER BY date DESC';
    const params = [injuryId];
    try {
        const result = yield db_1.default.query(query, params);
        return result.rows;
    }
    catch (error) {
        console.error('[DB Error] Failed to find treatments for injury', injuryId, error);
        throw new Error('Database error while fetching treatments.');
    }
});
exports.findTreatmentsByInjuryId = findTreatmentsByInjuryId;
const createTreatment = (treatment) => __awaiter(void 0, void 0, void 0, function* () {
    const { injuryId, date, treatmentType, notes, durationMinutes, performedByUserId } = treatment;
    const query = `
        INSERT INTO treatments (injury_id, date, treatment_type, notes, duration, performed_by_user_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
    `;
    const params = [injuryId, date, treatmentType, notes || null, durationMinutes || null, performedByUserId];
    try {
        const result = yield db_1.default.query(query, params);
        return result.rows[0];
    }
    catch (error) {
        console.error('[DB Error] Failed to create treatment', error);
        throw new Error('Database error while creating treatment.');
    }
});
exports.createTreatment = createTreatment;
const updateTreatment = (id, data) => __awaiter(void 0, void 0, void 0, function* () {
    const fields = [];
    const params = [];
    let index = 1;
    if (data.date) {
        fields.push(`date = $${index++}`);
        params.push(data.date);
    }
    if (data.treatmentType) {
        fields.push(`treatment_type = $${index++}`);
        params.push(data.treatmentType);
    }
    if (data.notes !== undefined) {
        fields.push(`notes = $${index++}`);
        params.push(data.notes);
    }
    if (data.durationMinutes !== undefined) {
        fields.push(`duration = $${index++}`);
        params.push(data.durationMinutes);
    }
    if (fields.length === 0) {
        throw new Error('No fields provided for treatment update.');
    }
    fields.push('updated_at = NOW()');
    const query = `
        UPDATE treatments SET ${fields.join(', ')} WHERE id = $${index++} RETURNING *;
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
        console.error('[DB Error] Failed to update treatment', id, error);
        throw new Error('Database error while updating treatment.');
    }
});
exports.updateTreatment = updateTreatment;
const deleteTreatment = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield db_1.default.query('DELETE FROM treatments WHERE id = $1', [id]);
        return (result.rowCount || 0) > 0;
    }
    catch (error) {
        console.error('[DB Error] Failed to delete treatment', id, error);
        throw new Error('Database error while deleting treatment.');
    }
});
exports.deleteTreatment = deleteTreatment;
