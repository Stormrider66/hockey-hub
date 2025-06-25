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
exports.deleteDocument = exports.getDocumentById = exports.createDocument = void 0;
const db_1 = __importDefault(require("../db"));
const createDocument = (doc) => __awaiter(void 0, void 0, void 0, function* () {
    const { playerId, title, documentType, filePath, fileSize, mimeType, injuryId, uploadedByUserId, teamId, } = doc;
    const query = `
    INSERT INTO medical_documents (
      player_id, title, document_type,
      file_path, file_size, mime_type,
      injury_id, uploaded_by_user_id, team_id
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *;
  `;
    const params = [
        playerId,
        title,
        documentType,
        filePath,
        fileSize,
        mimeType,
        injuryId || null,
        uploadedByUserId,
        teamId,
    ];
    try {
        const result = yield db_1.default.query(query, params);
        return result.rows[0];
    }
    catch (error) {
        console.error('[DB Error] Failed to create medical document', error);
        throw new Error('Database error while creating medical document.');
    }
});
exports.createDocument = createDocument;
const getDocumentById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield db_1.default.query('SELECT * FROM medical_documents WHERE id = $1', [id]);
        return result.rows[0] || null;
    }
    catch (error) {
        console.error('[DB Error] Failed to fetch medical document', id, error);
        throw new Error('Database error while fetching medical document.');
    }
});
exports.getDocumentById = getDocumentById;
const deleteDocument = (id) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const result = yield db_1.default.query('DELETE FROM medical_documents WHERE id = $1', [id]);
        return ((_a = result.rowCount) !== null && _a !== void 0 ? _a : 0) > 0;
    }
    catch (error) {
        console.error('[DB Error] Failed to delete medical document', id, error);
        throw new Error('Database error while deleting medical document.');
    }
});
exports.deleteDocument = deleteDocument;
