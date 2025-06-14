import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
// Mock AWS presigner
jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));
// Mock the medical document repository
jest.mock('../../src/repositories/medicalDocumentRepository', () => ({
  __esModule: true,
  createDocument: jest.fn(),
  getDocumentById: jest.fn(),
  deleteDocument: jest.fn(),
}));
import * as Repo from '../../src/repositories/medicalDocumentRepository';
import medicalDocumentRoutes from '../../src/routes/medicalDocumentRoutes';
// Setup test app
const app = express();
app.use(express.json());
app.use((req: Request, _res: Response, next: NextFunction) => {
  (req as any).user = { id: 'u1', teamIds: ['t1'] };
  next();
});
app.use('/api/v1', medicalDocumentRoutes);

describe('Medical Document Routes', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /api/v1/documents/:documentId/url', () => {
    it('returns signed URL when document exists', async () => {
      const signed = 'https://signed-url';
      (Repo.getDocumentById as jest.Mock).mockResolvedValueOnce({ file_path: 'key' } as any);
      (getSignedUrl as jest.Mock).mockResolvedValueOnce(signed);
      process.env.S3_BUCKET = 'bucket';
      process.env.AWS_REGION = 'us-east-1';

      const res = await request(app)
        .get('/api/v1/documents/d1/url')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.url).toBe(signed);
      expect(getSignedUrl).toHaveBeenCalled();
    });

    it('returns 404 when document not found', async () => {
      (Repo.getDocumentById as jest.Mock).mockResolvedValueOnce(null);
      await request(app)
        .get('/api/v1/documents/d1/url')
        .expect(404);
    });
  });

  // ... existing tests ...
}); 