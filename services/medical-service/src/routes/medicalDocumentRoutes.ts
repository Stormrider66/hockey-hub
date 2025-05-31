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
router.post('/documents', authorize('rehab'), upload.single('file'), uploadDocument);
router.get('/documents/:documentId', authorize('rehab','admin'), downloadDocument);
router.delete('/documents/:documentId', authorize('admin'), deleteDocumentHandler);
router.get('/documents/:documentId/url', authorize('rehab','admin'), getDocumentSignedUrl);

export default router; 