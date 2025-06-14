import { Request, Response, NextFunction } from 'express';
import * as documentRepo from '../repositories/medicalDocumentRepository';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { uploadToS3, deleteFromS3 } from '../lib/s3';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const uploadDocument = async (req: any, res: Response, next: NextFunction) => {
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
    const key = `${randomUUID()}-${file.originalname}`;
    // Determine buffer from memory or disk
    let fileContent: Buffer;
    if (file.buffer) {
      fileContent = file.buffer;
    } else {
      fileContent = await fs.promises.readFile(file.path);
      fs.unlinkSync(file.path);
    }
    await uploadToS3(key, fileContent, file.mimetype);
    const storedPath = key;

    const created = await documentRepo.createDocument({
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
    const filePath = path.resolve(doc.file_path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'File not found on disk' });
    }
    res.download(filePath, doc.title);
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
    const bucket = process.env.S3_BUCKET;
    if (!bucket) {
      throw new Error('S3_BUCKET environment variable not set');
    }
    const s3 = new S3Client({ region: process.env.AWS_REGION });
    const command = new GetObjectCommand({ Bucket: bucket, Key: doc.file_path });
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    res.status(200).json({ success: true, url });
  } catch (error) {
    next(error);
  }
}; 