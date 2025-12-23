// @ts-nocheck - Express routes with complex auth types
import { Router, Response, type Router as ExpressRouter } from 'express';
import { AuthRequest, authenticate, requirePermission, optionalAuth } from '../middleware/auth';
import { uploadToMemory, uploadMultiple, handleUploadError } from '../middleware/upload';
import { FileService } from '../services/FileService';
import { S3Service } from '../services/S3Service';
import { ImageProcessingService } from '../services/ImageProcessingService';
import { VirusScanService } from '../services/VirusScanService';
import { FileCategory, FileStatus } from '../entities/File';
import { ShareType, SharePermission } from '../entities/FileShare';
import { validateRequest } from '@hockey-hub/shared-lib';
import { 
  FileUploadDto, 
  FileSearchDto, 
  FileShareDto,
  FileUpdateDto 
} from '../dto/file.dto';

const router: ExpressRouter = Router();

// Initialize services
const s3Config = {
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  endpoint: process.env.S3_ENDPOINT,
};

const bucket = process.env.S3_BUCKET_NAME || 'hockey-hub-files';

const s3Service = new S3Service(s3Config, bucket);
const imageProcessingService = new ImageProcessingService(s3Service, bucket);
const virusScanService = new VirusScanService({
  enabled: process.env.ENABLE_VIRUS_SCAN === 'true',
  host: process.env.CLAM_AV_HOST,
  port: parseInt(process.env.CLAM_AV_PORT || '3310'),
});

const fileService = new FileService(
  s3Service,
  imageProcessingService,
  virusScanService,
  bucket
);

// Upload single file
router.post(
  '/upload',
  authenticate,
  uploadToMemory.single('file'),
  handleUploadError,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      const uploadData = {
        userId: req.user!.id,
        organizationId: req.body.organizationId || req.user!.organizationId,
        teamId: req.body.teamId,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        category: req.body.category || FileCategory.OTHER,
        description: req.body.description,
        buffer: req.file.buffer,
        isPublic: req.body.isPublic === 'true',
        tags: req.body.tags ? req.body.tags.split(',').map((t: string) => t.trim()) : [],
      };

      const file = await fileService.uploadFile(uploadData);

      res.status(201).json({
        success: true,
        file: {
          id: file.id,
          name: file.originalName,
          size: file.size,
          mimeType: file.mimeType,
          category: file.category,
          status: file.status,
          url: file.url,
          thumbnailUrl: file.thumbnailUrl,
          createdAt: file.createdAt,
        },
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      res.status(400).json({ 
        error: 'Upload failed', 
        message: error.message 
      });
    }
  }
);

// Upload multiple files
router.post(
  '/upload/multiple',
  authenticate,
  uploadMultiple('files', 10),
  handleUploadError,
  async (req: AuthRequest, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No files provided' });
      }

      const uploadPromises = files.map(file => 
        fileService.uploadFile({
          userId: req.user!.id,
          organizationId: req.body.organizationId || req.user!.organizationId,
          teamId: req.body.teamId,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          category: req.body.category || FileCategory.OTHER,
          description: req.body.description,
          buffer: file.buffer,
          isPublic: req.body.isPublic === 'true',
          tags: req.body.tags ? req.body.tags.split(',').map((t: string) => t.trim()) : [],
        })
      );

      const uploadedFiles = await Promise.allSettled(uploadPromises);
      
      const successful = uploadedFiles
        .filter(result => result.status === 'fulfilled')
        .map(result => (result as any).value);
      
      const failed = uploadedFiles
        .filter(result => result.status === 'rejected')
        .map((result, index) => ({
          filename: files[index].originalname,
          error: (result as any).reason.message,
        }));

      res.status(201).json({
        success: true,
        uploaded: successful.length,
        failed: failed.length,
        files: successful.map(file => ({
          id: file.id,
          name: file.originalName,
          size: file.size,
          mimeType: file.mimeType,
          status: file.status,
          url: file.url,
        })),
        errors: failed,
      });
    } catch (error: any) {
      console.error('Multiple upload error:', error);
      res.status(400).json({ 
        error: 'Upload failed', 
        message: error.message 
      });
    }
  }
);

// Get file by ID
router.get('/:fileId', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const file = await fileService.getFile(
      req.params.fileId,
      req.user?.id || 'anonymous'
    );

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.json({
      id: file.id,
      name: file.originalName,
      size: file.size,
      mimeType: file.mimeType,
      category: file.category,
      status: file.status,
      description: file.description,
      url: file.url,
      thumbnailUrl: file.thumbnailUrl,
      previewUrl: file.previewUrl,
      isPublic: file.isPublic,
      metadata: file.metadata,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
      accessCount: file.accessCount,
    });
  } catch (error: any) {
    console.error('Get file error:', error);
    res.status(500).json({ 
      error: 'Failed to get file', 
      message: error.message 
    });
  }
});

// Download file
router.get('/:fileId/download', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { file, stream, contentType } = await fileService.downloadFile(
      req.params.fileId,
      req.user?.id || 'anonymous'
    );

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
    res.setHeader('Content-Length', file.size.toString());

    stream.pipe(res);
  } catch (error: any) {
    console.error('Download error:', error);
    res.status(404).json({ 
      error: 'Download failed', 
      message: error.message 
    });
  }
});

// Get signed URL for direct upload/download
router.post('/:fileId/signed-url', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { action = 'download', expiresIn = 3600 } = req.body;

    const url = await fileService.getSignedUrl(
      req.params.fileId,
      req.user!.id,
      action,
      expiresIn
    );

    res.json({
      url,
      expiresIn,
      action,
    });
  } catch (error: any) {
    console.error('Signed URL error:', error);
    res.status(400).json({ 
      error: 'Failed to generate signed URL', 
      message: error.message 
    });
  }
});

// Search files
router.get('/', authenticate, validateRequest(FileSearchDto, 'query'), async (req: AuthRequest, res: Response) => {
  try {
    const searchOptions = {
      userId: req.query.userId as string || req.user!.id,
      organizationId: req.query.organizationId as string,
      teamId: req.query.teamId as string,
      category: req.query.category as FileCategory,
      mimeType: req.query.mimeType as string,
      tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
      searchTerm: req.query.search as string,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      minSize: req.query.minSize ? parseInt(req.query.minSize as string) : undefined,
      maxSize: req.query.maxSize ? parseInt(req.query.maxSize as string) : undefined,
      status: req.query.status as FileStatus,
      limit: parseInt(req.query.limit as string) || 20,
      offset: parseInt(req.query.offset as string) || 0,
      sortBy: req.query.sortBy as any,
      sortOrder: req.query.sortOrder as any,
    };

    const { files, total } = await fileService.searchFiles(searchOptions);

    res.json({
      files: files.map(file => ({
        id: file.id,
        name: file.originalName,
        size: file.size,
        mimeType: file.mimeType,
        category: file.category,
        status: file.status,
        description: file.description,
        url: file.url,
        thumbnailUrl: file.thumbnailUrl,
        createdAt: file.createdAt,
      })),
      total,
      limit: searchOptions.limit,
      offset: searchOptions.offset,
    });
  } catch (error: any) {
    console.error('Search error:', error);
    res.status(500).json({ 
      error: 'Search failed', 
      message: error.message 
    });
  }
});

// Share file
router.post(
  '/:fileId/share',
  authenticate,
  validateRequest(FileShareDto),
  async (req: AuthRequest, res: Response) => {
    try {
      const shareData = {
        sharedWithId: req.body.sharedWithId,
        shareType: req.body.shareType as ShareType,
        permissions: req.body.permissions as SharePermission[],
        expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined,
        maxAccessCount: req.body.maxAccessCount,
        password: req.body.password,
        notes: req.body.notes,
      };

      const share = await fileService.shareFile(
        req.params.fileId,
        req.user!.id,
        shareData
      );

      res.status(201).json({
        id: share.id,
        shareType: share.shareType,
        permissions: share.permissions,
        shareToken: share.shareToken,
        expiresAt: share.expiresAt,
        maxAccessCount: share.maxAccessCount,
        createdAt: share.createdAt,
      });
    } catch (error: any) {
      console.error('Share error:', error);
      res.status(400).json({ 
        error: 'Share failed', 
        message: error.message 
      });
    }
  }
);

// Delete file
router.delete('/:fileId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await fileService.deleteFile(req.params.fileId, req.user!.id);
    res.status(204).send();
  } catch (error: any) {
    console.error('Delete error:', error);
    res.status(400).json({ 
      error: 'Delete failed', 
      message: error.message 
    });
  }
});

// Add tags to file
router.post('/:fileId/tags', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const tags = req.body.tags as string[];
    
    if (!tags || !Array.isArray(tags)) {
      return res.status(400).json({ error: 'Tags must be an array' });
    }

    await fileService.addTags(req.params.fileId, tags, req.user!.id);
    
    res.json({ success: true });
  } catch (error: any) {
    console.error('Add tags error:', error);
    res.status(400).json({ 
      error: 'Failed to add tags', 
      message: error.message 
    });
  }
});

export default router;