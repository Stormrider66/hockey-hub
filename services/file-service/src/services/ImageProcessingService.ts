import sharp from 'sharp';
import { S3Service } from './S3Service';

export interface ImageSize {
  width: number;
  height: number;
  name: string;
  quality?: number;
}

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
  hasAlpha?: boolean;
  orientation?: number;
}

export interface ProcessedImage {
  key: string;
  size: number;
  dimensions: { width: number; height: number };
}

export class ImageProcessingService {
  private s3Service: S3Service;
  private bucket: string;

  private readonly defaultSizes: ImageSize[] = [
    { name: 'thumbnail', width: 150, height: 150, quality: 80 },
    { name: 'small', width: 400, height: 400, quality: 85 },
    { name: 'medium', width: 800, height: 800, quality: 85 },
    { name: 'large', width: 1920, height: 1920, quality: 90 },
  ];

  constructor(s3Service: S3Service, bucket: string) {
    this.s3Service = s3Service;
    this.bucket = bucket;
  }

  async getMetadata(buffer: Buffer): Promise<ImageMetadata> {
    const metadata = await sharp(buffer).metadata();
    
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || 'unknown',
      size: buffer.length,
      hasAlpha: metadata.hasAlpha,
      orientation: metadata.orientation,
    };
  }

  async processImage(
    buffer: Buffer,
    originalKey: string,
    sizes?: ImageSize[]
  ): Promise<{
    original: ProcessedImage;
    variants: Record<string, ProcessedImage>;
  }> {
    const sizesToProcess = sizes || this.defaultSizes;
    const metadata = await this.getMetadata(buffer);
    
    // Auto-rotate based on EXIF orientation
    const orientedBuffer = await sharp(buffer)
      .rotate()
      .toBuffer();

    // Upload original (auto-rotated)
    const originalResult = await this.s3Service.upload({
      bucket: this.bucket,
      key: originalKey,
      body: orientedBuffer,
      contentType: `image/${metadata.format}`,
    });

    const variants: Record<string, ProcessedImage> = {};

    // Process each size variant
    for (const size of sizesToProcess) {
      const processed = await this.resizeImage(orientedBuffer, size, metadata);
      const variantKey = this.generateVariantKey(originalKey, size.name);
      
      await this.s3Service.upload({
        bucket: this.bucket,
        key: variantKey,
        body: processed.buffer,
        contentType: processed.contentType,
      });

      variants[size.name] = {
        key: variantKey,
        size: processed.buffer.length,
        dimensions: {
          width: processed.width,
          height: processed.height,
        },
      };
    }

    return {
      original: {
        key: originalKey,
        size: orientedBuffer.length,
        dimensions: {
          width: metadata.width,
          height: metadata.height,
        },
      },
      variants,
    };
  }

  async resizeImage(
    buffer: Buffer,
    size: ImageSize,
    metadata: ImageMetadata
  ): Promise<{
    buffer: Buffer;
    width: number;
    height: number;
    contentType: string;
  }> {
    let pipeline = sharp(buffer);

    // Only resize if the original is larger than the target size
    if (metadata.width > size.width || metadata.height > size.height) {
      pipeline = pipeline.resize(size.width, size.height, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Apply format-specific optimizations
    let outputBuffer: Buffer;
    let outputFormat = metadata.format;

    switch (metadata.format) {
      case 'jpeg':
      case 'jpg':
        outputBuffer = await pipeline
          .jpeg({ quality: size.quality || 85, progressive: true })
          .toBuffer();
        outputFormat = 'jpeg';
        break;
      
      case 'png':
        outputBuffer = await pipeline
          .png({ quality: size.quality || 90, compressionLevel: 9 })
          .toBuffer();
        break;
      
      case 'webp':
        outputBuffer = await pipeline
          .webp({ quality: size.quality || 85 })
          .toBuffer();
        break;
      
      default:
        // Convert other formats to JPEG
        outputBuffer = await pipeline
          .jpeg({ quality: size.quality || 85, progressive: true })
          .toBuffer();
        outputFormat = 'jpeg';
    }

    const processedMetadata = await sharp(outputBuffer).metadata();

    return {
      buffer: outputBuffer,
      width: processedMetadata.width || 0,
      height: processedMetadata.height || 0,
      contentType: `image/${outputFormat}`,
    };
  }

  async generateThumbnail(
    buffer: Buffer,
    width: number = 150,
    height: number = 150
  ): Promise<Buffer> {
    return sharp(buffer)
      .resize(width, height, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 80, progressive: true })
      .toBuffer();
  }

  async cropImage(
    buffer: Buffer,
    cropData: {
      left: number;
      top: number;
      width: number;
      height: number;
    }
  ): Promise<Buffer> {
    return sharp(buffer)
      .extract({
        left: Math.round(cropData.left),
        top: Math.round(cropData.top),
        width: Math.round(cropData.width),
        height: Math.round(cropData.height),
      })
      .toBuffer();
  }

  async rotateImage(buffer: Buffer, angle: number): Promise<Buffer> {
    return sharp(buffer)
      .rotate(angle)
      .toBuffer();
  }

  async convertFormat(
    buffer: Buffer,
    targetFormat: 'jpeg' | 'png' | 'webp',
    quality: number = 85
  ): Promise<{ buffer: Buffer; contentType: string }> {
    let outputBuffer: Buffer;

    switch (targetFormat) {
      case 'jpeg':
        outputBuffer = await sharp(buffer)
          .jpeg({ quality, progressive: true })
          .toBuffer();
        break;
      
      case 'png':
        outputBuffer = await sharp(buffer)
          .png({ quality, compressionLevel: 9 })
          .toBuffer();
        break;
      
      case 'webp':
        outputBuffer = await sharp(buffer)
          .webp({ quality })
          .toBuffer();
        break;
    }

    return {
      buffer: outputBuffer,
      contentType: `image/${targetFormat}`,
    };
  }

  private generateVariantKey(originalKey: string, sizeName: string): string {
    const parts = originalKey.split('/');
    const filename = parts.pop()!;
    const nameParts = filename.split('.');
    const extension = nameParts.pop();
    const baseName = nameParts.join('.');
    
    parts.push(`${baseName}_${sizeName}.${extension}`);
    return parts.join('/');
  }
}