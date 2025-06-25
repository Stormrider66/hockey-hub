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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDocumentSignedUrl = exports.deleteDocumentHandler = exports.downloadDocument = exports.uploadDocument = void 0;
const documentRepo = __importStar(require("../repositories/medicalDocumentRepository"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = require("crypto");
const s3_1 = require("../lib/s3");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const uploadDocument = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const file = req.file;
    if (!file) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'No file uploaded' });
    }
    const { playerId, title, documentType, injuryId } = req.body;
    if (!playerId || !title || !documentType) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Missing required fields' });
    }
    try {
        const user = req.user;
        const uploadedByUserId = user.id;
        const teamId = Array.isArray(user.teamIds) ? user.teamIds[0] : user.teamId;
        // Upload to S3 (support memoryStorage or disk storage)
        const key = `${(0, crypto_1.randomUUID)()}-${file.originalname}`;
        // Determine buffer from memory or disk
        let fileContent;
        if (file.buffer) {
            fileContent = file.buffer;
        }
        else {
            fileContent = yield fs_1.default.promises.readFile(file.path);
            fs_1.default.unlinkSync(file.path);
        }
        yield (0, s3_1.uploadToS3)(key, fileContent, file.mimetype);
        const storedPath = key;
        const created = yield documentRepo.createDocument({
            playerId,
            title,
            documentType,
            filePath: storedPath,
            fileSize: file.size,
            mimeType: file.mimetype,
            injuryId,
            uploadedByUserId,
            teamId,
        });
        res.status(201).json({ success: true, data: created });
    }
    catch (error) {
        next(error);
    }
});
exports.uploadDocument = uploadDocument;
const downloadDocument = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { documentId } = req.params;
    try {
        const doc = yield documentRepo.getDocumentById(documentId);
        if (!doc) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Document not found' });
        }
        const filePath = path_1.default.resolve(doc.file_path);
        if (!fs_1.default.existsSync(filePath)) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'File not found on disk' });
        }
        res.download(filePath, doc.title);
    }
    catch (error) {
        next(error);
    }
});
exports.downloadDocument = downloadDocument;
const deleteDocumentHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { documentId } = req.params;
    try {
        const doc = yield documentRepo.getDocumentById(documentId);
        if (!doc) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Document not found' });
        }
        const deleted = yield documentRepo.deleteDocument(documentId);
        if (!deleted) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Document not found' });
        }
        // Delete object from S3
        yield (0, s3_1.deleteFromS3)(doc.file_path);
        res.status(200).json({ success: true, message: 'Document deleted successfully' });
    }
    catch (error) {
        next(error);
    }
});
exports.deleteDocumentHandler = deleteDocumentHandler;
// Generate a pre-signed URL for downloading a document
const getDocumentSignedUrl = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { documentId } = req.params;
    try {
        const doc = yield documentRepo.getDocumentById(documentId);
        if (!doc) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Document not found' });
        }
        const bucket = process.env.S3_BUCKET;
        if (!bucket) {
            throw new Error('S3_BUCKET environment variable not set');
        }
        const s3 = new client_s3_1.S3Client({ region: process.env.AWS_REGION });
        const command = new client_s3_1.GetObjectCommand({ Bucket: bucket, Key: doc.file_path });
        const url = yield (0, s3_request_presigner_1.getSignedUrl)(s3, command, { expiresIn: 3600 });
        res.status(200).json({ success: true, url });
    }
    catch (error) {
        next(error);
    }
});
exports.getDocumentSignedUrl = getDocumentSignedUrl;
