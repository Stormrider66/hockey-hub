import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { File, FileStatus, FileCategory } from '../entities/File';
import { FileShare, ShareType, SharePermission } from '../entities/FileShare';
import { FileVersion } from '../entities/FileVersion';
import { FileTag } from '../entities/FileTag';
import { S3Service } from './S3Service';
import { ImageProcessingService } from './ImageProcessingService';
import { VirusScanService } from './VirusScanService';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

export interface FileUploadData {
  userId: string;
  organizationId?: string;
  teamId?: string;
  originalName: string;
  mimeType: string;
  size: number;
  category?: FileCategory;
  description?: string;
  buffer: Buffer;
  isPublic?: boolean;
  tags?: string[];
}

export interface FileSearchOptions {
  userId?: string;
  organizationId?: string;
  teamId?: string;
  category?: FileCategory;
  mimeType?: string;
  tags?: string[];
  searchTerm?: string;
  startDate?: Date;
  endDate?: Date;
  minSize?: number;
  maxSize?: number;
  status?: FileStatus;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'size' | 'name' | 'accessCount';
  sortOrder?: 'ASC' | 'DESC';
}

export class FileService {
  private fileRepository: Repository<File>;
  private fileShareRepository: Repository<FileShare>;
  private fileVersionRepository: Repository<FileVersion>;
  private fileTagRepository: Repository<FileTag>;
  private s3Service: S3Service;
  private imageProcessingService: ImageProcessingService;
  private virusScanService: VirusScanService;
  private bucket: string;

  constructor(
    s3Service: S3Service,
    imageProcessingService: ImageProcessingService,
    virusScanService: VirusScanService,
    bucket: string
  ) {
    this.fileRepository = AppDataSource.getRepository(File);
    this.fileShareRepository = AppDataSource.getRepository(FileShare);
    this.fileVersionRepository = AppDataSource.getRepository(FileVersion);
    this.fileTagRepository = AppDataSource.getRepository(FileTag);
    this.s3Service = s3Service;
    this.imageProcessingService = imageProcessingService;
    this.virusScanService = virusScanService;
    this.bucket = bucket;
  }

  async uploadFile(data: FileUploadData): Promise<File> {
    // Create file record with pending status
    const file = this.fileRepository.create({
      userId: data.userId,
      organizationId: data.organizationId,
      teamId: data.teamId,
      originalName: data.originalName,
      mimeType: data.mimeType,
      size: data.size,
      category: data.category || FileCategory.OTHER,
      description: data.description,
      status: FileStatus.PENDING,
      isPublic: data.isPublic || false,
      contentHash: this.calculateHash(data.buffer),
    });

    // Generate storage key
    const prefix = this.getStoragePrefix(file);
    file.storageKey = this.s3Service.generateKey(prefix, data.originalName);

    // Save initial record
    await this.fileRepository.save(file);

    try {
      // Update status to uploading
      file.status = FileStatus.UPLOADED;
      await this.fileRepository.save(file);

      // Scan for viruses if enabled
      if (this.virusScanService.isEnabled()) {
        const scanResult = await this.virusScanService.scanBuffer(data.buffer);
        file.virusScanStatus = scanResult.isInfected ? 'infected' : 'clean';
        file.virusScanDate = scanResult.scannedAt;
        file.virusScanResult = scanResult.virusName;

        if (scanResult.isInfected) {
          file.status = FileStatus.FAILED;
          await this.fileRepository.save(file);
          throw new Error(`File infected with: ${scanResult.virusName}`);
        }
      }

      // Process images
      if (file.isImage) {
        file.status = FileStatus.PROCESSING;
        await this.fileRepository.save(file);

        const processed = await this.imageProcessingService.processImage(
          data.buffer,
          file.storageKey
        );

        file.metadata = {
          ...file.metadata,
          width: processed.original.dimensions.width,
          height: processed.original.dimensions.height,
          thumbnailKey: processed.variants.thumbnail?.key,
          previewKey: processed.variants.medium?.key,
        };
      } else {
        // Upload non-image files directly
        await this.s3Service.upload({
          bucket: this.bucket,
          key: file.storageKey,
          body: data.buffer,
          contentType: data.mimeType,
          metadata: {
            originalName: data.originalName,
            userId: data.userId,
          },
        });
      }

      // Add tags if provided
      if (data.tags && data.tags.length > 0) {
        await this.addTags(file.id, data.tags, data.userId);
      }

      // Update status to ready
      file.status = FileStatus.READY;
      await this.fileRepository.save(file);

      // Create initial version
      await this.createVersion(file, data.buffer, data.userId, 'Initial upload');

      return file;
    } catch (error) {
      // Update status to failed
      file.status = FileStatus.FAILED;
      await this.fileRepository.save(file);
      
      // Clean up S3 if upload was partial
      try {
        await this.s3Service.delete(this.bucket, file.storageKey);
      } catch (cleanupError) {
        console.error('Failed to clean up S3 object:', cleanupError);
      }
      
      throw error;
    }
  }

  async getFile(fileId: string, userId: string): Promise<File | null> {
    const file = await this.fileRepository.findOne({
      where: { id: fileId },
      relations: ['shares', 'versions', 'tags'],
    });

    if (!file) return null;

    // Check access permissions
    if (!await this.hasAccess(file, userId)) {
      return null;
    }

    // Update access stats
    file.lastAccessedAt = new Date();
    file.accessCount++;
    await this.fileRepository.save(file);

    return file;
  }

  async downloadFile(fileId: string, userId: string): Promise<{
    file: File;
    stream: NodeJS.ReadableStream;
    contentType: string;
  }> {
    const file = await this.getFile(fileId, userId);
    if (!file) {
      throw new Error('File not found or access denied');
    }

    const download = await this.s3Service.download(this.bucket, file.storageKey);

    return {
      file,
      stream: download.body,
      contentType: download.contentType || file.mimeType,
    };
  }

  async deleteFile(fileId: string, userId: string): Promise<void> {
    const file = await this.getFile(fileId, userId);
    if (!file) {
      throw new Error('File not found or access denied');
    }

    // Check delete permission
    if (file.userId !== userId) {
      const share = await this.fileShareRepository.findOne({
        where: {
          fileId: file.id,
          sharedWithId: userId,
        },
      });

      if (!share || !share.hasPermission(SharePermission.DELETE)) {
        throw new Error('No delete permission');
      }
    }

    // Soft delete
    file.deletedAt = new Date();
    file.deletedBy = userId;
    file.status = FileStatus.DELETED;
    await this.fileRepository.save(file);

    // Schedule S3 deletion after retention period
    // In production, this would be handled by a background job
  }

  async searchFiles(options: FileSearchOptions): Promise<{
    files: File[];
    total: number;
  }> {
    const query = this.fileRepository.createQueryBuilder('file');

    // Apply filters
    if (options.userId) {
      query.andWhere('(file.userId = :userId OR file.id IN (SELECT fileId FROM file_shares WHERE sharedWithId = :userId))', 
        { userId: options.userId });
    }

    if (options.organizationId) {
      query.andWhere('file.organizationId = :organizationId', { organizationId: options.organizationId });
    }

    if (options.teamId) {
      query.andWhere('file.teamId = :teamId', { teamId: options.teamId });
    }

    if (options.category) {
      query.andWhere('file.category = :category', { category: options.category });
    }

    if (options.mimeType) {
      query.andWhere('file.mimeType LIKE :mimeType', { mimeType: `${options.mimeType}%` });
    }

    if (options.status) {
      query.andWhere('file.status = :status', { status: options.status });
    }

    if (options.searchTerm) {
      query.andWhere('(file.originalName ILIKE :search OR file.description ILIKE :search)', 
        { search: `%${options.searchTerm}%` });
    }

    if (options.startDate) {
      query.andWhere('file.createdAt >= :startDate', { startDate: options.startDate });
    }

    if (options.endDate) {
      query.andWhere('file.createdAt <= :endDate', { endDate: options.endDate });
    }

    if (options.minSize) {
      query.andWhere('file.size >= :minSize', { minSize: options.minSize });
    }

    if (options.maxSize) {
      query.andWhere('file.size <= :maxSize', { maxSize: options.maxSize });
    }

    if (options.tags && options.tags.length > 0) {
      query.andWhere(
        'file.id IN (SELECT fileId FROM file_tags WHERE tag IN (:...tags))',
        { tags: options.tags }
      );
    }

    // Exclude soft deleted files
    query.andWhere('file.deletedAt IS NULL');

    // Apply sorting
    const sortBy = options.sortBy || 'createdAt';
    const sortOrder = options.sortOrder || 'DESC';
    query.orderBy(`file.${sortBy}`, sortOrder);

    // Apply pagination
    const limit = options.limit || 20;
    const offset = options.offset || 0;
    query.limit(limit).offset(offset);

    const [files, total] = await query.getManyAndCount();

    return { files, total };
  }

  async shareFile(
    fileId: string,
    sharedById: string,
    shareData: {
      sharedWithId?: string;
      shareType: ShareType;
      permissions?: SharePermission[];
      expiresAt?: Date;
      maxAccessCount?: number;
      password?: string;
      notes?: string;
    }
  ): Promise<FileShare> {
    const file = await this.getFile(fileId, sharedById);
    if (!file) {
      throw new Error('File not found or access denied');
    }

    // Check if user can share
    if (file.userId !== sharedById) {
      const existingShare = await this.fileShareRepository.findOne({
        where: {
          fileId: file.id,
          sharedWithId: sharedById,
        },
      });

      if (!existingShare || !existingShare.hasPermission(SharePermission.EDIT)) {
        throw new Error('No sharing permission');
      }
    }

    const share = this.fileShareRepository.create({
      fileId: file.id,
      sharedById,
      sharedWithId: shareData.sharedWithId,
      shareType: shareData.shareType,
      permissions: shareData.permissions || [SharePermission.VIEW, SharePermission.DOWNLOAD],
      expiresAt: shareData.expiresAt,
      maxAccessCount: shareData.maxAccessCount,
      password: shareData.password ? await this.hashPassword(shareData.password) : undefined,
      notes: shareData.notes,
      shareToken: shareData.shareType === ShareType.PUBLIC_LINK ? uuidv4() : undefined,
    });

    return this.fileShareRepository.save(share);
  }

  async createVersion(
    file: File,
    buffer: Buffer,
    uploadedBy: string,
    comment?: string
  ): Promise<FileVersion> {
    // Get current version number
    const lastVersion = await this.fileVersionRepository.findOne({
      where: { fileId: file.id },
      order: { versionNumber: 'DESC' },
    });

    const versionNumber = (lastVersion?.versionNumber || 0) + 1;

    // Generate version storage key
    const versionKey = `${file.storageKey}.v${versionNumber}`;

    // Upload version to S3
    await this.s3Service.upload({
      bucket: this.bucket,
      key: versionKey,
      body: buffer,
      contentType: file.mimeType,
    });

    // Create version record
    const version = this.fileVersionRepository.create({
      fileId: file.id,
      versionNumber,
      storageKey: versionKey,
      size: buffer.length,
      contentHash: this.calculateHash(buffer),
      uploadedBy,
      comment,
      isCurrent: true,
    });

    // Mark previous versions as not current
    await this.fileVersionRepository.update(
      { fileId: file.id, isCurrent: true },
      { isCurrent: false }
    );

    return this.fileVersionRepository.save(version);
  }

  async addTags(fileId: string, tags: string[], addedBy: string): Promise<void> {
    const tagEntities = tags.map(tag =>
      this.fileTagRepository.create({
        fileId,
        tag: tag.toLowerCase().trim(),
        addedBy,
      })
    );

    await this.fileTagRepository.save(tagEntities);
  }

  async getSignedUrl(
    fileId: string,
    userId: string,
    action: 'upload' | 'download' = 'download',
    expiresIn: number = 3600
  ): Promise<string> {
    const file = await this.getFile(fileId, userId);
    if (!file) {
      throw new Error('File not found or access denied');
    }

    if (action === 'upload') {
      return this.s3Service.getSignedUploadUrl({
        bucket: this.bucket,
        key: file.storageKey,
        expiresIn,
      });
    } else {
      return this.s3Service.getSignedDownloadUrl({
        bucket: this.bucket,
        key: file.storageKey,
        expiresIn,
        responseContentDisposition: `attachment; filename="${file.originalName}"`,
      });
    }
  }

  private async hasAccess(file: File, userId: string): Promise<boolean> {
    // Owner always has access
    if (file.userId === userId) return true;

    // Public files are accessible to all
    if (file.isPublic) return true;

    // Check shares
    const share = await this.fileShareRepository.findOne({
      where: [
        { fileId: file.id, sharedWithId: userId },
        { fileId: file.id, shareType: ShareType.ORGANIZATION, sharedWithId: file.organizationId },
        { fileId: file.id, shareType: ShareType.TEAM, sharedWithId: file.teamId },
      ],
    });

    return share?.canAccess() || false;
  }

  private getStoragePrefix(file: File): string {
    const parts = [];
    
    if (file.organizationId) parts.push(file.organizationId);
    if (file.teamId) parts.push(file.teamId);
    parts.push(file.userId);
    parts.push(file.category);
    
    return parts.join('/');
  }

  private calculateHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  private async hashPassword(password: string): Promise<string> {
    return crypto.createHash('sha256').update(password).digest('hex');
  }
}