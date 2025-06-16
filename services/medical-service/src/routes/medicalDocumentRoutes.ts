import { Router } from 'express';
import { authorize } from '../middleware/auth';
import multer from 'multer';
import {
  uploadDocument,
  downloadDocument,
  deleteDocumentHandler,
  getDocumentSignedUrl,
} from '../controllers/medicalDocumentController';

const router: Router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Medical document endpoints
router.post('/documents', authorize('medical_staff'), upload.single('file'), uploadDocument);
router.get('/documents/:documentId', authorize('medical_staff','admin'), downloadDocument);
router.delete('/documents/:documentId', authorize('admin'), deleteDocumentHandler);
router.get('/documents/:documentId/url', authorize('medical_staff','admin'), getDocumentSignedUrl);

export default router; 