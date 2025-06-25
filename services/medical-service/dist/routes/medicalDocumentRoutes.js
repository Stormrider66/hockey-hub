"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const multer_1 = __importDefault(require("multer"));
const medicalDocumentController_1 = require("../controllers/medicalDocumentController");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
// Medical document endpoints
router.post('/documents', (0, auth_1.authorize)('medical_staff'), upload.single('file'), medicalDocumentController_1.uploadDocument);
router.get('/documents/:documentId', (0, auth_1.authorize)('medical_staff', 'admin'), medicalDocumentController_1.downloadDocument);
router.delete('/documents/:documentId', (0, auth_1.authorize)('admin'), medicalDocumentController_1.deleteDocumentHandler);
router.get('/documents/:documentId/url', (0, auth_1.authorize)('medical_staff', 'admin'), medicalDocumentController_1.getDocumentSignedUrl);
exports.default = router;
