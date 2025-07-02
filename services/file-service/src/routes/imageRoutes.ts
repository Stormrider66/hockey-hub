import { Router, Response } from 'express';
import { AuthRequest, authenticate } from '../middleware/auth';
import { uploadToMemory, handleUploadError } from '../middleware/upload';
import { ImageProcessingService } from '../services/ImageProcessingService';
import { S3Service } from '../services/S3Service';
import { validateRequest } from '@hockey-hub/shared-lib';
import { ImageCropDto, ImageResizeDto, ImageConvertDto } from '../dto/image.dto';

const router = Router();

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

// Process and upload image with automatic resizing
router.post(
  '/process',
  authenticate,
  uploadToMemory.single('image'),
  handleUploadError,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image provided' });
      }

      if (!req.file.mimetype.startsWith('image/')) {
        return res.status(400).json({ error: 'File must be an image' });
      }

      const key = s3Service.generateKey(
        `images/${req.user!.id}`,
        req.file.originalname
      );

      const sizes = req.body.sizes ? JSON.parse(req.body.sizes) : undefined;

      const result = await imageProcessingService.processImage(
        req.file.buffer,
        key,
        sizes
      );

      res.json({
        success: true,
        original: result.original,
        variants: result.variants,
      });
    } catch (error: any) {
      console.error('Image processing error:', error);
      res.status(400).json({
        error: 'Image processing failed',
        message: error.message,
      });
    }
  }
);

// Crop image
router.post(
  '/crop',
  authenticate,
  uploadToMemory.single('image'),
  validateRequest(ImageCropDto),
  handleUploadError,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image provided' });
      }

      const cropData = {
        left: parseInt(req.body.left),
        top: parseInt(req.body.top),
        width: parseInt(req.body.width),
        height: parseInt(req.body.height),
      };

      const croppedBuffer = await imageProcessingService.cropImage(
        req.file.buffer,
        cropData
      );

      const key = s3Service.generateKey(
        `images/${req.user!.id}/cropped`,
        req.file.originalname
      );

      await s3Service.upload({
        bucket,
        key,
        body: croppedBuffer,
        contentType: req.file.mimetype,
      });

      res.json({
        success: true,
        key,
        size: croppedBuffer.length,
      });
    } catch (error: any) {
      console.error('Crop error:', error);
      res.status(400).json({
        error: 'Crop failed',
        message: error.message,
      });
    }
  }
);

// Resize image
router.post(
  '/resize',
  authenticate,
  uploadToMemory.single('image'),
  validateRequest(ImageResizeDto),
  handleUploadError,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image provided' });
      }

      const metadata = await imageProcessingService.getMetadata(req.file.buffer);
      
      const resizeOptions = {
        width: parseInt(req.body.width),
        height: parseInt(req.body.height),
        name: 'resized',
        quality: req.body.quality ? parseInt(req.body.quality) : 85,
      };

      const resized = await imageProcessingService.resizeImage(
        req.file.buffer,
        resizeOptions,
        metadata
      );

      const key = s3Service.generateKey(
        `images/${req.user!.id}/resized`,
        req.file.originalname
      );

      await s3Service.upload({
        bucket,
        key,
        body: resized.buffer,
        contentType: resized.contentType,
      });

      res.json({
        success: true,
        key,
        size: resized.buffer.length,
        dimensions: {
          width: resized.width,
          height: resized.height,
        },
      });
    } catch (error: any) {
      console.error('Resize error:', error);
      res.status(400).json({
        error: 'Resize failed',
        message: error.message,
      });
    }
  }
);

// Rotate image
router.post(
  '/rotate',
  authenticate,
  uploadToMemory.single('image'),
  handleUploadError,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image provided' });
      }

      const angle = parseInt(req.body.angle) || 90;
      
      if (![90, 180, 270, -90, -180, -270].includes(angle)) {
        return res.status(400).json({ 
          error: 'Invalid rotation angle',
          message: 'Angle must be 90, 180, 270, -90, -180, or -270',
        });
      }

      const rotatedBuffer = await imageProcessingService.rotateImage(
        req.file.buffer,
        angle
      );

      const key = s3Service.generateKey(
        `images/${req.user!.id}/rotated`,
        req.file.originalname
      );

      await s3Service.upload({
        bucket,
        key,
        body: rotatedBuffer,
        contentType: req.file.mimetype,
      });

      res.json({
        success: true,
        key,
        size: rotatedBuffer.length,
      });
    } catch (error: any) {
      console.error('Rotate error:', error);
      res.status(400).json({
        error: 'Rotate failed',
        message: error.message,
      });
    }
  }
);

// Convert image format
router.post(
  '/convert',
  authenticate,
  uploadToMemory.single('image'),
  validateRequest(ImageConvertDto),
  handleUploadError,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image provided' });
      }

      const targetFormat = req.body.format as 'jpeg' | 'png' | 'webp';
      const quality = req.body.quality ? parseInt(req.body.quality) : 85;

      const converted = await imageProcessingService.convertFormat(
        req.file.buffer,
        targetFormat,
        quality
      );

      const originalName = req.file.originalname;
      const baseName = originalName.substring(0, originalName.lastIndexOf('.'));
      const newName = `${baseName}.${targetFormat}`;

      const key = s3Service.generateKey(
        `images/${req.user!.id}/converted`,
        newName
      );

      await s3Service.upload({
        bucket,
        key,
        body: converted.buffer,
        contentType: converted.contentType,
      });

      res.json({
        success: true,
        key,
        size: converted.buffer.length,
        format: targetFormat,
        contentType: converted.contentType,
      });
    } catch (error: any) {
      console.error('Convert error:', error);
      res.status(400).json({
        error: 'Convert failed',
        message: error.message,
      });
    }
  }
);

// Generate thumbnail
router.post(
  '/thumbnail',
  authenticate,
  uploadToMemory.single('image'),
  handleUploadError,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image provided' });
      }

      const width = req.body.width ? parseInt(req.body.width) : 150;
      const height = req.body.height ? parseInt(req.body.height) : 150;

      const thumbnail = await imageProcessingService.generateThumbnail(
        req.file.buffer,
        width,
        height
      );

      const key = s3Service.generateKey(
        `images/${req.user!.id}/thumbnails`,
        req.file.originalname
      );

      await s3Service.upload({
        bucket,
        key,
        body: thumbnail,
        contentType: 'image/jpeg',
      });

      res.json({
        success: true,
        key,
        size: thumbnail.length,
        dimensions: { width, height },
      });
    } catch (error: any) {
      console.error('Thumbnail error:', error);
      res.status(400).json({
        error: 'Thumbnail generation failed',
        message: error.message,
      });
    }
  }
);

// Get image metadata
router.post(
  '/metadata',
  authenticate,
  uploadToMemory.single('image'),
  handleUploadError,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image provided' });
      }

      const metadata = await imageProcessingService.getMetadata(req.file.buffer);

      res.json({
        filename: req.file.originalname,
        ...metadata,
      });
    } catch (error: any) {
      console.error('Metadata error:', error);
      res.status(400).json({
        error: 'Failed to get metadata',
        message: error.message,
      });
    }
  }
);

export default router;