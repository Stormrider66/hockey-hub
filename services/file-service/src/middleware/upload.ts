// @ts-nocheck - Multer upload middleware with complex types
import multer from 'multer';
import { Request } from 'express';
import path from 'path';
import crypto from 'crypto';
import { promisify } from 'util';
import fs from 'fs';

const mkdir = promisify(fs.mkdir);

// File size limits by type (in bytes)
const FILE_SIZE_LIMITS = {
  image: 10 * 1024 * 1024, // 10MB
  video: 500 * 1024 * 1024, // 500MB
  document: 50 * 1024 * 1024, // 50MB
  default: 52428800, // 50MB default
};

// Allowed MIME types
const ALLOWED_MIME_TYPES = {
  image: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ],
  video: [
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-ms-wmv',
    'video/webm',
  ],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
  ],
};

// Get file type category from MIME type
function getFileCategory(mimeType: string): 'image' | 'video' | 'document' | 'other' {
  if (ALLOWED_MIME_TYPES.image.includes(mimeType)) return 'image';
  if (ALLOWED_MIME_TYPES.video.includes(mimeType)) return 'video';
  if (ALLOWED_MIME_TYPES.document.includes(mimeType)) return 'document';
  return 'other';
}

// Configure storage
const storage = multer.diskStorage({
  destination: async (req: Request, file: Express.Multer.File, cb) => {
    const uploadDir = process.env.UPLOAD_TEMP_DIR || '/tmp/uploads';
    
    try {
      await mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error: any) {
      cb(error, uploadDir);
    }
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    const sanitizedBasename = basename.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${sanitizedBasename}-${uniqueSuffix}${ext}`);
  },
});

// Configure memory storage for direct S3 upload
const memoryStorage = multer.memoryStorage();

// File filter
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || [
    ...ALLOWED_MIME_TYPES.image,
    ...ALLOWED_MIME_TYPES.video,
    ...ALLOWED_MIME_TYPES.document,
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`));
  }
};

// Create multer configurations
export const uploadToDisk = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || String(FILE_SIZE_LIMITS.default)),
  },
});

export const uploadToMemory = multer({
  storage: memoryStorage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || String(FILE_SIZE_LIMITS.default)),
  },
});

// Dynamic upload configuration based on file type
export const dynamicUpload = (fieldName: string = 'file') => {
  return (req: Request, res: any, next: any) => {
    // Get file type from request or headers
    const fileType = req.headers['x-file-type'] as string;
    const category = getFileCategory(fileType || '');
    
    // Set appropriate file size limit
    let maxSize = FILE_SIZE_LIMITS.default;
    if (category === 'image') maxSize = FILE_SIZE_LIMITS.image;
    else if (category === 'video') maxSize = FILE_SIZE_LIMITS.video;
    else if (category === 'document') maxSize = FILE_SIZE_LIMITS.document;

    const upload = multer({
      storage: memoryStorage,
      fileFilter,
      limits: { fileSize: maxSize },
    });

    upload.single(fieldName)(req, res, next);
  };
};

// Multiple file upload
export const uploadMultiple = (fieldName: string = 'files', maxCount: number = 10): ReturnType<typeof multer>['array'] extends (...args: any[]) => infer R ? R : never => {
  return multer({
    storage: memoryStorage,
    fileFilter,
    limits: {
      fileSize: parseInt(process.env.MAX_FILE_SIZE || String(FILE_SIZE_LIMITS.default)),
    },
  }).array(fieldName, maxCount) as any;
};

// Upload fields for different file types
export const uploadFields: ReturnType<ReturnType<typeof multer>['fields']> = multer({
  storage: memoryStorage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || String(FILE_SIZE_LIMITS.default)),
  },
}).fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'documents', maxCount: 10 },
  { name: 'videos', maxCount: 5 },
]) as any;

// Error handler middleware
export const handleUploadError = (error: any, req: Request, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'FILE_TOO_LARGE') {
      return res.status(400).json({
        error: 'File too large',
        message: `File size exceeds the limit of ${process.env.MAX_FILE_SIZE || FILE_SIZE_LIMITS.default} bytes`,
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Too many files',
        message: 'Number of files exceeds the allowed limit',
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: 'Unexpected field',
        message: 'Unexpected file field name',
      });
    }
  }
  
  if (error.message?.includes('File type')) {
    return res.status(400).json({
      error: 'Invalid file type',
      message: error.message,
    });
  }

  next(error);
};