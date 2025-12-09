/**
 * Video Storage Service
 * 
 * Handles video uploads, storage, thumbnail generation, and URL management
 * Supports local files, external URLs, and cloud storage integration
 */

import type {
  VideoSource,
  VideoUpload,
  VideoLibrary,
  VideoMetadata
} from '@/types/tactical/video.types';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  speed: number; // bytes per second
  timeRemaining: number; // seconds
}

export interface StorageConfig {
  maxFileSize: number;
  supportedFormats: string[];
  uploadChunkSize: number;
  generateThumbnails: boolean;
  thumbnailCount: number;
  compressionQuality: number;
  storageProvider: 'local' | 'aws' | 'gcp' | 'azure';
  cdnUrl?: string;
}

export interface ExternalVideoInfo {
  id: string;
  title: string;
  description: string;
  duration: number;
  thumbnailUrl: string;
  embedUrl: string;
  directUrl?: string;
  quality: string;
}

class VideoStorageService {
  private config: StorageConfig = {
    maxFileSize: 500 * 1024 * 1024, // 500MB
    supportedFormats: ['mp4', 'webm', 'mov', 'avi', 'm4v', 'mkv'],
    uploadChunkSize: 1024 * 1024, // 1MB chunks
    generateThumbnails: true,
    thumbnailCount: 5,
    compressionQuality: 0.8,
    storageProvider: 'local'
  };

  private uploads = new Map<string, VideoUpload>();
  private uploadCallbacks = new Map<string, (progress: UploadProgress) => void>();

  /**
   * Initialize service with configuration
   */
  initialize(config?: Partial<StorageConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  /**
   * Validate video file before upload
   */
  validateFile(file: File): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check file size
    if (file.size > this.config.maxFileSize) {
      errors.push(`File size exceeds maximum limit of ${this.formatFileSize(this.config.maxFileSize)}`);
    }

    // Check file format
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !this.config.supportedFormats.includes(extension)) {
      errors.push(`Unsupported format. Supported formats: ${this.config.supportedFormats.join(', ')}`);
    }

    // Check MIME type
    if (!file.type.startsWith('video/')) {
      errors.push('File must be a video');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Upload video file with progress tracking
   */
  async uploadVideo(
    file: File,
    metadata: Partial<VideoMetadata> = {},
    onProgress?: (progress: UploadProgress) => void
  ): Promise<VideoSource> {
    // Validate file
    const validation = this.validateFile(file);
    if (!validation.isValid) {
      throw new Error(`Upload failed: ${validation.errors.join(', ')}`);
    }

    const uploadId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create upload record
    const upload: VideoUpload = {
      id: uploadId,
      file,
      progress: 0,
      status: 'pending'
    };

    this.uploads.set(uploadId, upload);

    if (onProgress) {
      this.uploadCallbacks.set(uploadId, onProgress);
    }

    try {
      // Start upload
      upload.status = 'uploading';
      const videoSource = await this.performUpload(upload);

      // Generate thumbnails if enabled
      if (this.config.generateThumbnails) {
        videoSource.thumbnailUrl = await this.generateThumbnail(file);
      }

      // Extract video metadata
      const videoMetadata = await this.extractMetadata(file);
      videoSource.metadata = { ...videoMetadata, ...metadata };

      upload.status = 'completed';
      upload.result = videoSource;

      return videoSource;

    } catch (error) {
      upload.status = 'error';
      upload.error = error instanceof Error ? error.message : 'Upload failed';
      throw error;
    } finally {
      // Cleanup
      setTimeout(() => {
        this.uploads.delete(uploadId);
        this.uploadCallbacks.delete(uploadId);
      }, 5000);
    }
  }

  /**
   * Perform the actual file upload
   */
  private async performUpload(upload: VideoUpload): Promise<VideoSource> {
    return new Promise((resolve, reject) => {
      // Simulate chunked upload for large files
      const chunkCount = Math.ceil(upload.file.size / this.config.uploadChunkSize);
      let uploadedChunks = 0;
      const startTime = Date.now();

      const uploadChunk = () => {
        setTimeout(() => {
          uploadedChunks++;
          const progress = (uploadedChunks / chunkCount) * 100;
          
          upload.progress = progress;

          // Calculate upload speed and time remaining
          const elapsed = (Date.now() - startTime) / 1000;
          const speed = (uploadedChunks * this.config.uploadChunkSize) / elapsed;
          const timeRemaining = ((chunkCount - uploadedChunks) * this.config.uploadChunkSize) / speed;

          // Notify progress
          const progressData: UploadProgress = {
            loaded: uploadedChunks * this.config.uploadChunkSize,
            total: upload.file.size,
            percentage: progress,
            speed,
            timeRemaining
          };

          const callback = this.uploadCallbacks.get(upload.id);
          callback?.(progressData);

          if (uploadedChunks >= chunkCount) {
            // Upload complete
            const videoSource: VideoSource = {
              id: `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              url: this.generateVideoUrl(upload.file),
              type: 'upload',
              format: upload.file.name.split('.').pop()?.toLowerCase(),
              quality: 'hd'
            };
            resolve(videoSource);
          } else {
            uploadChunk();
          }
        }, 50 + Math.random() * 100); // Simulate network latency
      };

      uploadChunk();
    });
  }

  /**
   * Generate video URL (in real implementation, this would be actual storage URL)
   */
  private generateVideoUrl(file: File): string {
    // In a real implementation, this would return the actual storage URL
    // For now, create a blob URL for local playback
    return URL.createObjectURL(file);
  }

  /**
   * Generate video thumbnail
   */
  private async generateThumbnail(file: File, timeOffset = 5): Promise<string> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Cannot create canvas context'));
        return;
      }

      video.addEventListener('loadedmetadata', () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      });

      video.addEventListener('seeked', () => {
        ctx.drawImage(video, 0, 0);
        const thumbnailUrl = canvas.toDataURL('image/jpeg', this.config.compressionQuality);
        URL.revokeObjectURL(video.src);
        resolve(thumbnailUrl);
      });

      video.addEventListener('error', () => {
        reject(new Error('Failed to generate thumbnail'));
      });

      video.src = URL.createObjectURL(file);
      video.currentTime = Math.min(timeOffset, 10); // Max 10 seconds in
    });
  }

  /**
   * Generate multiple thumbnails at different timestamps
   */
  async generateMultipleThumbnails(file: File, timestamps?: number[]): Promise<string[]> {
    if (!timestamps) {
      // Generate thumbnails at even intervals
      const duration = await this.getVideoDuration(file);
      timestamps = Array.from(
        { length: this.config.thumbnailCount },
        (_, i) => (duration / (this.config.thumbnailCount + 1)) * (i + 1)
      );
    }

    const thumbnails: string[] = [];
    for (const timestamp of timestamps) {
      try {
        const thumbnail = await this.generateThumbnail(file, timestamp);
        thumbnails.push(thumbnail);
      } catch (error) {
        console.warn(`Failed to generate thumbnail at ${timestamp}s:`, error);
      }
    }

    return thumbnails;
  }

  /**
   * Extract video metadata
   */
  private async extractMetadata(file: File): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');

      video.addEventListener('loadedmetadata', () => {
        const metadata: VideoMetadata = {
          title: file.name.replace(/\.[^/.]+$/, ''),
          uploadedAt: new Date(),
          fileSize: file.size,
          dimensions: {
            width: video.videoWidth,
            height: video.videoHeight
          },
          framerate: 30, // Would need more sophisticated detection
          codec: 'unknown', // Would need file analysis
          tags: []
        };

        URL.revokeObjectURL(video.src);
        resolve(metadata);
      });

      video.addEventListener('error', () => {
        reject(new Error('Failed to extract metadata'));
      });

      video.src = URL.createObjectURL(file);
    });
  }

  /**
   * Get video duration
   */
  private async getVideoDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');

      video.addEventListener('loadedmetadata', () => {
        URL.revokeObjectURL(video.src);
        resolve(video.duration);
      });

      video.addEventListener('error', () => {
        reject(new Error('Failed to get video duration'));
      });

      video.src = URL.createObjectURL(file);
    });
  }

  /**
   * Parse external video URL (YouTube, Vimeo, etc.)
   */
  async parseExternalVideo(url: string): Promise<VideoSource> {
    const videoInfo = await this.getExternalVideoInfo(url);

    return {
      id: videoInfo.id,
      url: videoInfo.directUrl || videoInfo.embedUrl,
      type: this.getVideoType(url),
      format: 'mp4', // Most external sources provide MP4
      quality: videoInfo.quality as VideoSource['quality'],
      thumbnailUrl: videoInfo.thumbnailUrl,
      metadata: {
        title: videoInfo.title,
        description: videoInfo.description,
        uploadedAt: new Date()
      }
    };
  }

  /**
   * Get external video information
   */
  private async getExternalVideoInfo(url: string): Promise<ExternalVideoInfo> {
    const videoType = this.getVideoType(url);

    switch (videoType) {
      case 'youtube':
        return this.getYouTubeInfo(url);
      case 'vimeo':
        return this.getVimeoInfo(url);
      default:
        throw new Error(`Unsupported video URL: ${url}`);
    }
  }

  /**
   * Get YouTube video information
   */
  private async getYouTubeInfo(url: string): Promise<ExternalVideoInfo> {
    const videoId = this.extractYouTubeId(url);
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }

    // In a real implementation, this would use the YouTube API
    // For now, return mock data
    return {
      id: videoId,
      title: 'YouTube Video',
      description: 'Video from YouTube',
      duration: 300,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      quality: 'hd'
    };
  }

  /**
   * Get Vimeo video information
   */
  private async getVimeoInfo(url: string): Promise<ExternalVideoInfo> {
    const videoId = this.extractVimeoId(url);
    if (!videoId) {
      throw new Error('Invalid Vimeo URL');
    }

    // In a real implementation, this would use the Vimeo API
    return {
      id: videoId,
      title: 'Vimeo Video',
      description: 'Video from Vimeo',
      duration: 300,
      thumbnailUrl: `https://vumbnail.com/${videoId}.jpg`,
      embedUrl: `https://player.vimeo.com/video/${videoId}`,
      quality: 'hd'
    };
  }

  /**
   * Determine video type from URL
   */
  private getVideoType(url: string): VideoSource['type'] {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return 'youtube';
    }
    if (url.includes('vimeo.com')) {
      return 'vimeo';
    }
    if (url.startsWith('rtmp://') || url.includes('stream')) {
      return 'stream';
    }
    return 'local';
  }

  /**
   * Extract YouTube video ID
   */
  private extractYouTubeId(url: string): string | null {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[7].length === 11 ? match[7] : null;
  }

  /**
   * Extract Vimeo video ID
   */
  private extractVimeoId(url: string): string | null {
    const regExp = /(?:vimeo)\.com.*(?:videos|video|channels|)\/([\d]+)/i;
    const match = url.match(regExp);
    return match ? match[1] : null;
  }

  /**
   * Delete video
   */
  async deleteVideo(videoId: string): Promise<boolean> {
    try {
      // In a real implementation, this would:
      // 1. Delete the video file from storage
      // 2. Remove database records
      // 3. Clean up thumbnails
      // 4. Revoke CDN URLs

      console.log(`Deleting video: ${videoId}`);
      return true;
    } catch (error) {
      console.error('Failed to delete video:', error);
      return false;
    }
  }

  /**
   * Get upload progress
   */
  getUploadProgress(uploadId: string): VideoUpload | null {
    return this.uploads.get(uploadId) || null;
  }

  /**
   * Cancel upload
   */
  cancelUpload(uploadId: string): boolean {
    const upload = this.uploads.get(uploadId);
    if (upload && upload.status === 'uploading') {
      upload.status = 'error';
      upload.error = 'Upload cancelled by user';
      return true;
    }
    return false;
  }

  /**
   * Get storage statistics
   */
  getStorageStats(): {
    totalVideos: number;
    totalSize: number;
    activeUploads: number;
    quotaUsed: number;
    quotaLimit: number;
  } {
    const activeUploads = Array.from(this.uploads.values())
      .filter(upload => upload.status === 'uploading').length;

    return {
      totalVideos: 0, // Would be fetched from database
      totalSize: 0, // Would be calculated from storage
      activeUploads,
      quotaUsed: 0, // Current storage usage
      quotaLimit: this.config.maxFileSize * 100 // Example quota
    };
  }

  /**
   * Optimize video for web playback
   */
  async optimizeVideo(videoSource: VideoSource): Promise<VideoSource> {
    // In a real implementation, this would:
    // 1. Re-encode video for web optimization
    // 2. Generate multiple quality versions
    // 3. Create adaptive streaming manifests
    // 4. Optimize for mobile playback

    return {
      ...videoSource,
      quality: 'hd',
      metadata: {
        ...videoSource.metadata,
        codec: 'h264'
      }
    };
  }

  /**
   * Create video library/playlist
   */
  async createLibrary(
    name: string,
    description?: string,
    videos: VideoSource[] = []
  ): Promise<VideoLibrary> {
    return {
      id: `library-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      videos,
      clips: [],
      collections: [],
      shared: false,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Format file size for display
   */
  private formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * Clean up resources
   */
  dispose() {
    // Cancel all active uploads
    this.uploads.forEach((upload, id) => {
      if (upload.status === 'uploading') {
        this.cancelUpload(id);
      }
    });

    this.uploads.clear();
    this.uploadCallbacks.clear();
  }
}

// Export singleton instance
export const videoStorageService = new VideoStorageService();

// Export utility functions
export const getSupportedFormats = (): string[] => [
  'mp4', 'webm', 'mov', 'avi', 'm4v', 'mkv'
];

export const getMaxFileSize = (): number => 500 * 1024 * 1024; // 500MB

export const isVideoFile = (file: File): boolean => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  return extension ? getSupportedFormats().includes(extension) : false;
};

export const formatVideoDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

export default videoStorageService;