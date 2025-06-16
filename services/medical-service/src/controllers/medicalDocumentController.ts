import { Request, Response, NextFunction } from 'express';
import * as documentRepo from '../repositories/medicalDocumentRepository';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { uploadToS3, deleteFromS3 } from '../lib/s3';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Security: Define allowed upload directory
const UPLOAD_BASE_DIR = path.resolve('./uploads');

// Security: Validate and sanitize file paths to prevent path traversal
function validateAndSanitizePath(inputPath: string): string | null {
  try {
    // Remove any directory traversal attempts
    const sanitized = inputPath.replace(/\.\./g, '');
    
    // Resolve the full path
    const fullPath = path.resolve(UPLOAD_BASE_DIR, sanitized);
    
    // Ensure the resolved path is within the allowed directory
    if (!fullPath.startsWith(UPLOAD_BASE_DIR)) {
      console.error(`[Security] Path traversal attempt blocked: ${inputPath}`);
      return null;
    }
    
    return fullPath;
  } catch (error) {
    console.error(`[Security] Path validation failed: ${error}`);
    return null;
  }
}

export const uploadDocument = async (req: any, res: Response, next: NextFunction) => {
  console.log('[Upload Debug] Headers:', req.headers);
  console.log('[Upload Debug] Body:', req.body);
  console.log('[Upload Debug] File:', req.file);
  
  const file = req.file;
  if (!file) {
    console.log('[Upload Debug] No file in request');
    return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'No file uploaded' });
  }

  const { playerId, title, documentType, injuryId } = req.body;
  if (!playerId || !title || !documentType) {
    console.log('[Upload Debug] Missing fields - playerId:', playerId, 'title:', title, 'documentType:', documentType);
    return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Missing required fields' });
  }

  try {
    const user = req.user;
    const uploadedByUserId = user.userId || user.id; // userId is the correct field from JWT

    console.log('[Upload Debug] User:', user);
    console.log('[Upload Debug] uploadedByUserId:', uploadedByUserId);
    console.log('[Upload Debug] S3_BUCKET_NAME:', process.env.S3_BUCKET_NAME);
    console.log('[Upload Debug] AWS_REGION:', process.env.AWS_REGION);

    // Upload to S3 (support memoryStorage or disk storage)
    const key = `${randomUUID()}-${file.originalname}`;
    // Determine buffer from memory or disk
    let fileContent: Buffer;
    if (file.buffer) {
      fileContent = file.buffer;
    } else {
      // Security: Validate file path before reading
      const validatedPath = validateAndSanitizePath(file.path);
      if (!validatedPath) {
        return res.status(400).json({ error: true, code: 'SECURITY_ERROR', message: 'Invalid file path' });
      }
      
      fileContent = await fs.promises.readFile(validatedPath);
      fs.unlinkSync(validatedPath);
    }
    
    let storedPath = key;
    
    // Check if S3 is configured
    if (!process.env.S3_BUCKET_NAME || !process.env.AWS_REGION) {
      console.log('[Upload Debug] S3 not configured, using local storage simulation');
      // For development without S3, just use the key as the path
      storedPath = `local-storage/${key}`;
    } else {
      console.log('[Upload Debug] Attempting S3 upload with key:', key);
      try {
        await uploadToS3(key, fileContent, file.mimetype);
        console.log('[Upload Debug] S3 upload successful');
      } catch (s3Error) {
        console.error('[Upload Debug] S3 upload failed:', s3Error);
        throw s3Error;
      }
    }

    const created = await documentRepo.createDocument({
      playerId,
      title,
      documentType,
      filePath: storedPath,
      fileSize: file.size,
      mimeType: file.mimetype,
      injuryId,
      uploadedByUserId,
    });

    res.status(201).json({ success: true, data: created });
  } catch (error) {
    next(error);
  }
};

export const downloadDocument = async (req: Request, res: Response, next: NextFunction) => {
  const { documentId } = req.params;
  try {
    const doc = await documentRepo.getDocumentById(documentId);
    if (!doc) {
      return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Document not found' });
    }
    
    // Security: Validate file path before access
    const validatedPath = validateAndSanitizePath(doc.file_path);
    if (!validatedPath) {
      return res.status(400).json({ error: true, code: 'SECURITY_ERROR', message: 'Invalid file path' });
    }
    
    if (!fs.existsSync(validatedPath)) {
      return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'File not found on disk' });
    }
    res.download(validatedPath, doc.title);
  } catch (error) {
    next(error);
  }
};

export const deleteDocumentHandler = async (req: Request, res: Response, next: NextFunction) => {
  const { documentId } = req.params;
  try {
    const doc = await documentRepo.getDocumentById(documentId);
    if (!doc) {
      return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Document not found' });
    }
    const deleted = await documentRepo.deleteDocument(documentId);
    if (!deleted) {
      return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Document not found' });
    }
    // Delete object from S3
    await deleteFromS3(doc.file_path);
    res.status(200).json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Generate a pre-signed URL for downloading a document
export const getDocumentSignedUrl = async (req: Request, res: Response, next: NextFunction) => {
  const { documentId } = req.params;
  try {
    const doc = await documentRepo.getDocumentById(documentId);
    if (!doc) {
      return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Document not found' });
    }
    const bucket = process.env.S3_BUCKET_NAME;
    if (!bucket) {
      throw new Error('S3_BUCKET_NAME environment variable not set');
    }
    const s3 = new S3Client({ region: process.env.AWS_REGION });
    const command = new GetObjectCommand({ Bucket: bucket, Key: doc.file_path });
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    res.status(200).json({ success: true, url });
  } catch (error) {
    next(error);
  }
}; 