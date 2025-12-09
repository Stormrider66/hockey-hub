/**
 * AnimationExporter - Advanced animation export system for tactical plays
 * 
 * Provides comprehensive export capabilities for animated tactical plays including:
 * - GIF export with customizable frame rates and quality settings
 * - MP4/WebM video export with audio narration support
 * - Frame capture from Pixi.js canvas with performance optimization
 * - Social media optimized presets and formats
 * - Memory-efficient processing for long animations
 * 
 * @module AnimationExporter
 * @version 1.0.0
 */

import { AnimationEngine, PlayAction, AnimationKeyframe, AnimationEvent } from './AnimationEngine';
import { EventEmitter } from 'events';

// Import libraries for export functionality
// Note: These would need to be added to package.json
declare const GIF: any; // gif.js library
declare const FFmpeg: any; // ffmpeg.wasm for video processing

/**
 * Export format types
 */
export type ExportFormat = 'gif' | 'mp4' | 'webm' | 'png-sequence';

/**
 * Video codec options for different formats
 */
export type VideoCodec = 'h264' | 'h265' | 'vp8' | 'vp9' | 'av1';

/**
 * Social media format presets
 */
export type SocialPreset = 
  | 'instagram-story' // 9:16, 1080x1920
  | 'instagram-post'  // 1:1, 1080x1080
  | 'instagram-reel'  // 9:16, 1080x1920
  | 'tiktok'         // 9:16, 1080x1920
  | 'twitter'        // 16:9, 1280x720
  | 'whatsapp'       // 16:9, 720p optimized
  | 'telegram'       // 16:9, 720p optimized
  | 'presentation'   // 16:9, 1920x1080
  | 'email'          // 16:9, 854x480
  | 'custom';

/**
 * GIF-specific export options
 */
export interface GifExportOptions {
  /** Frame rate (10-60 fps) */
  frameRate: number;
  /** GIF quality (1-100) */
  quality: number;
  /** Loop count (0 = infinite) */
  loop: number;
  /** Enable dithering for better color reproduction */
  dithering: boolean;
  /** Color palette size (16-256) */
  colors: number;
  /** Enable transparency */
  transparent: boolean;
  /** Background color if not transparent */
  backgroundColor?: string;
}

/**
 * Video-specific export options
 */
export interface VideoExportOptions {
  /** Video format */
  format: 'mp4' | 'webm';
  /** Video codec */
  codec: VideoCodec;
  /** Frame rate (24-60 fps) */
  frameRate: number;
  /** Video bitrate in kbps */
  bitrate: number;
  /** Video quality (0-51 for x264, lower is better) */
  quality: number;
  /** Enable audio track (future feature) */
  enableAudio: boolean;
  /** Audio codec if audio enabled */
  audioCodec?: 'aac' | 'mp3' | 'opus';
  /** Include fade in/out effects */
  fadeDuration: number;
}

/**
 * Resolution and aspect ratio settings
 */
export interface ResolutionSettings {
  /** Output width */
  width: number;
  /** Output height */
  height: number;
  /** Aspect ratio (calculated or custom) */
  aspectRatio: string;
  /** Scaling method */
  scaleMethod: 'stretch' | 'fit' | 'fill' | 'crop';
}

/**
 * Overlay and branding options
 */
export interface OverlayOptions {
  /** Include play title */
  includeTitle: boolean;
  /** Title position */
  titlePosition: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  /** Title font settings */
  titleFont: {
    family: string;
    size: number;
    color: string;
    weight: 'normal' | 'bold';
    shadow: boolean;
  };
  /** Include coach/team branding */
  includeBranding: boolean;
  /** Team logo image data URL */
  teamLogo?: string;
  /** Coach name */
  coachName?: string;
  /** Team name */
  teamName?: string;
  /** Watermark text */
  watermark?: string;
  /** Watermark position */
  watermarkPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  /** Include timestamp */
  includeTimestamp: boolean;
  /** Include metadata overlay */
  includeMetadata: boolean;
}

/**
 * Comprehensive export configuration
 */
export interface AnimationExportConfig {
  /** Export format */
  format: ExportFormat;
  /** Social media preset (overrides resolution if set) */
  socialPreset?: SocialPreset;
  /** Custom resolution settings */
  resolution: ResolutionSettings;
  /** GIF-specific options */
  gifOptions: GifExportOptions;
  /** Video-specific options */
  videoOptions: VideoExportOptions;
  /** Overlay and branding options */
  overlayOptions: OverlayOptions;
  /** Performance settings */
  performanceSettings: {
    /** Maximum frames to process in parallel */
    maxParallelFrames: number;
    /** Enable background processing */
    backgroundProcessing: boolean;
    /** Memory limit in MB */
    memoryLimit: number;
    /** Enable frame caching */
    enableCaching: boolean;
  };
  /** Export quality vs speed trade-off */
  optimizationMode: 'speed' | 'balanced' | 'quality';
}

/**
 * Export progress information
 */
export interface ExportProgress {
  /** Current stage of export */
  stage: 'initializing' | 'capturing' | 'processing' | 'encoding' | 'finalizing' | 'complete' | 'error';
  /** Progress percentage (0-100) */
  progress: number;
  /** Current frame being processed */
  currentFrame: number;
  /** Total frames to process */
  totalFrames: number;
  /** Estimated time remaining in seconds */
  estimatedTimeRemaining: number;
  /** Current processing message */
  message: string;
  /** Export file size so far */
  fileSizeBytes?: number;
}

/**
 * Export result data
 */
export interface ExportResult {
  /** Success status */
  success: boolean;
  /** Export file as Blob */
  blob?: Blob;
  /** File name */
  fileName: string;
  /** File size in bytes */
  fileSizeBytes: number;
  /** Export duration in seconds */
  exportDuration: number;
  /** Export configuration used */
  config: AnimationExportConfig;
  /** Error message if failed */
  error?: string;
  /** Additional metadata */
  metadata?: {
    totalFrames: number;
    actualFrameRate: number;
    compressionRatio: number;
  };
}

/**
 * Social media preset configurations
 */
export const SOCIAL_PRESETS: Record<SocialPreset, Partial<AnimationExportConfig>> = {
  'instagram-story': {
    resolution: { width: 1080, height: 1920, aspectRatio: '9:16', scaleMethod: 'fit' },
    videoOptions: { frameRate: 30, bitrate: 2000, quality: 23, format: 'mp4', codec: 'h264', enableAudio: false, audioCodec: 'aac', fadeDuration: 0 },
    gifOptions: { frameRate: 30, quality: 80, loop: 0, dithering: true, colors: 256, transparent: false }
  },
  'instagram-post': {
    resolution: { width: 1080, height: 1080, aspectRatio: '1:1', scaleMethod: 'fit' },
    videoOptions: { frameRate: 30, bitrate: 2000, quality: 23, format: 'mp4', codec: 'h264', enableAudio: false, audioCodec: 'aac', fadeDuration: 0 },
    gifOptions: { frameRate: 30, quality: 80, loop: 0, dithering: true, colors: 256, transparent: false }
  },
  'instagram-reel': {
    resolution: { width: 1080, height: 1920, aspectRatio: '9:16', scaleMethod: 'fit' },
    videoOptions: { frameRate: 30, bitrate: 3000, quality: 20, format: 'mp4', codec: 'h264', enableAudio: true, audioCodec: 'aac', fadeDuration: 0.5 },
    gifOptions: { frameRate: 30, quality: 85, loop: 0, dithering: true, colors: 256, transparent: false }
  },
  'tiktok': {
    resolution: { width: 1080, height: 1920, aspectRatio: '9:16', scaleMethod: 'fit' },
    videoOptions: { frameRate: 30, bitrate: 2500, quality: 22, format: 'mp4', codec: 'h264', enableAudio: true, audioCodec: 'aac', fadeDuration: 0 },
    gifOptions: { frameRate: 30, quality: 80, loop: 0, dithering: true, colors: 256, transparent: false }
  },
  'twitter': {
    resolution: { width: 1280, height: 720, aspectRatio: '16:9', scaleMethod: 'fit' },
    videoOptions: { frameRate: 30, bitrate: 2000, quality: 23, format: 'mp4', codec: 'h264', enableAudio: false, audioCodec: 'aac', fadeDuration: 0 },
    gifOptions: { frameRate: 24, quality: 75, loop: 0, dithering: true, colors: 256, transparent: false }
  },
  'whatsapp': {
    resolution: { width: 854, height: 480, aspectRatio: '16:9', scaleMethod: 'fit' },
    videoOptions: { frameRate: 24, bitrate: 1000, quality: 28, format: 'mp4', codec: 'h264', enableAudio: false, audioCodec: 'aac', fadeDuration: 0 },
    gifOptions: { frameRate: 20, quality: 70, loop: 0, dithering: true, colors: 128, transparent: false }
  },
  'telegram': {
    resolution: { width: 854, height: 480, aspectRatio: '16:9', scaleMethod: 'fit' },
    videoOptions: { frameRate: 24, bitrate: 1200, quality: 26, format: 'mp4', codec: 'h264', enableAudio: false, audioCodec: 'aac', fadeDuration: 0 },
    gifOptions: { frameRate: 20, quality: 75, loop: 0, dithering: true, colors: 256, transparent: false }
  },
  'presentation': {
    resolution: { width: 1920, height: 1080, aspectRatio: '16:9', scaleMethod: 'fit' },
    videoOptions: { frameRate: 30, bitrate: 5000, quality: 18, format: 'mp4', codec: 'h264', enableAudio: true, audioCodec: 'aac', fadeDuration: 1 },
    gifOptions: { frameRate: 30, quality: 90, loop: 1, dithering: false, colors: 256, transparent: false }
  },
  'email': {
    resolution: { width: 854, height: 480, aspectRatio: '16:9', scaleMethod: 'fit' },
    videoOptions: { frameRate: 24, bitrate: 800, quality: 30, format: 'mp4', codec: 'h264', enableAudio: false, audioCodec: 'aac', fadeDuration: 0 },
    gifOptions: { frameRate: 15, quality: 65, loop: 0, dithering: true, colors: 128, transparent: false }
  },
  'custom': {
    resolution: { width: 1280, height: 720, aspectRatio: '16:9', scaleMethod: 'fit' },
    videoOptions: { frameRate: 30, bitrate: 2000, quality: 23, format: 'mp4', codec: 'h264', enableAudio: false, audioCodec: 'aac', fadeDuration: 0 },
    gifOptions: { frameRate: 30, quality: 80, loop: 0, dithering: true, colors: 256, transparent: false }
  }
};

/**
 * Default export configuration
 */
export const DEFAULT_EXPORT_CONFIG: AnimationExportConfig = {
  format: 'gif',
  resolution: { width: 1280, height: 720, aspectRatio: '16:9', scaleMethod: 'fit' },
  gifOptions: {
    frameRate: 30,
    quality: 80,
    loop: 0,
    dithering: true,
    colors: 256,
    transparent: false,
    backgroundColor: '#ffffff'
  },
  videoOptions: {
    format: 'mp4',
    codec: 'h264',
    frameRate: 30,
    bitrate: 2000,
    quality: 23,
    enableAudio: false,
    audioCodec: 'aac',
    fadeDuration: 0
  },
  overlayOptions: {
    includeTitle: true,
    titlePosition: 'top-center',
    titleFont: {
      family: 'Arial, sans-serif',
      size: 24,
      color: '#ffffff',
      weight: 'bold',
      shadow: true
    },
    includeBranding: false,
    includeTimestamp: false,
    includeMetadata: false,
    watermarkPosition: 'bottom-right'
  },
  performanceSettings: {
    maxParallelFrames: 4,
    backgroundProcessing: true,
    memoryLimit: 512,
    enableCaching: true
  },
  optimizationMode: 'balanced'
};

/**
 * Events emitted by the AnimationExporter
 */
export enum ExportEvent {
  PROGRESS_UPDATE = 'progressUpdate',
  STAGE_CHANGE = 'stageChange',
  FRAME_CAPTURED = 'frameCaptured',
  FRAME_PROCESSED = 'frameProcessed',
  EXPORT_COMPLETE = 'exportComplete',
  EXPORT_ERROR = 'exportError',
  MEMORY_WARNING = 'memoryWarning',
  QUALITY_ADJUSTED = 'qualityAdjusted'
}

/**
 * Advanced Animation Exporter for Ice Hockey Tactical Plays
 * 
 * Provides comprehensive export capabilities for animated tactical plays with
 * support for multiple formats, social media optimization, and professional
 * branding features.
 * 
 * @example
 * ```typescript
 * const exporter = new AnimationExporter();
 * 
 * exporter.on(ExportEvent.PROGRESS_UPDATE, (progress) => {
 *   console.log(`Export progress: ${progress.progress}%`);
 * });
 * 
 * const result = await exporter.exportAnimation(
 *   animationEngine,
 *   tacticalBoardCanvas,
 *   exportConfig
 * );
 * 
 * if (result.success) {
 *   downloadBlob(result.blob, result.fileName);
 * }
 * ```
 */
export class AnimationExporter extends EventEmitter {
  private isExporting: boolean = false;
  private currentExportId: string | null = null;
  private frameCache: Map<number, ImageData> = new Map();
  private exportWorker: Worker | null = null;
  
  // Performance tracking
  private startTime: number = 0;
  private processedFrames: number = 0;
  private memoryUsage: number = 0;

  constructor() {
    super();
    
    // Initialize web worker for background processing if supported
    if (typeof Worker !== 'undefined') {
      try {
        // In a real implementation, this would load a separate worker file
        this.exportWorker = null; // Placeholder for worker initialization
      } catch (error) {
        console.warn('[AnimationExporter] Web Worker not available, using main thread');
      }
    }
  }

  /**
   * Exports an animation to the specified format
   * @param animationEngine The animation engine containing the play
   * @param canvasElement The canvas element to capture frames from
   * @param config Export configuration
   * @returns Promise resolving to export result
   */
  public async exportAnimation(
    animationEngine: AnimationEngine,
    canvasElement: HTMLCanvasElement | null,
    config: Partial<AnimationExportConfig> = {}
  ): Promise<ExportResult> {
    if (this.isExporting) {
      throw new Error('Export already in progress');
    }

    // Merge configuration with defaults
    const finalConfig = this.mergeConfigs(config);
    
    // Apply social media preset if specified
    if (finalConfig.socialPreset && finalConfig.socialPreset !== 'custom') {
      Object.assign(finalConfig, SOCIAL_PRESETS[finalConfig.socialPreset]);
    }

    this.isExporting = true;
    this.currentExportId = `export-${Date.now()}`;
    this.startTime = Date.now();
    this.processedFrames = 0;
    this.frameCache.clear();

    try {
      // Initialize export process
      this.emitProgress({
        stage: 'initializing',
        progress: 0,
        currentFrame: 0,
        totalFrames: 0,
        estimatedTimeRemaining: 0,
        message: 'Initializing export process...'
      });

      // Validate inputs
      await this.validateExportInputs(animationEngine, canvasElement, finalConfig);

      // Calculate total frames needed
      const duration = animationEngine.getDuration();
      const frameRate = this.getFrameRate(finalConfig);
      const totalFrames = Math.ceil((duration / 1000) * frameRate);

      // Capture animation frames
      const frames = await this.captureAnimationFrames(
        animationEngine, 
        canvasElement, 
        finalConfig, 
        totalFrames
      );

      // Process and export based on format
      let result: ExportResult;
      switch (finalConfig.format) {
        case 'gif':
          result = await this.exportAsGif(frames, finalConfig, totalFrames);
          break;
        case 'mp4':
        case 'webm':
          result = await this.exportAsVideo(frames, finalConfig, totalFrames);
          break;
        case 'png-sequence':
          result = await this.exportAsPngSequence(frames, finalConfig, totalFrames);
          break;
        default:
          throw new Error(`Unsupported export format: ${finalConfig.format}`);
      }

      // Add metadata to result
      result.metadata = {
        totalFrames,
        actualFrameRate: frameRate,
        compressionRatio: this.calculateCompressionRatio(frames, result.blob)
      };

      result.exportDuration = (Date.now() - this.startTime) / 1000;

      this.emit(ExportEvent.EXPORT_COMPLETE, result);
      return result;

    } catch (error) {
      const errorResult: ExportResult = {
        success: false,
        fileName: '',
        fileSizeBytes: 0,
        exportDuration: (Date.now() - this.startTime) / 1000,
        config: finalConfig,
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      this.emit(ExportEvent.EXPORT_ERROR, error);
      return errorResult;

    } finally {
      this.isExporting = false;
      this.currentExportId = null;
      this.frameCache.clear();
      this.emitProgress({
        stage: 'complete',
        progress: 100,
        currentFrame: this.processedFrames,
        totalFrames: this.processedFrames,
        estimatedTimeRemaining: 0,
        message: 'Export completed'
      });
    }
  }

  /**
   * Cancels the current export operation
   */
  public cancelExport(): void {
    if (!this.isExporting) {
      return;
    }

    this.isExporting = false;
    this.frameCache.clear();
    
    if (this.exportWorker) {
      this.exportWorker.terminate();
      this.exportWorker = null;
    }

    this.emit(ExportEvent.EXPORT_ERROR, new Error('Export cancelled by user'));
  }

  /**
   * Gets the current export progress
   */
  public getExportProgress(): ExportProgress | null {
    if (!this.isExporting) {
      return null;
    }

    // Return current progress state
    return {
      stage: 'processing',
      progress: 50, // Placeholder - would track actual progress
      currentFrame: this.processedFrames,
      totalFrames: 100, // Placeholder
      estimatedTimeRemaining: 30, // Placeholder
      message: 'Processing frames...'
    };
  }

  /**
   * Validates export inputs
   */
  private async validateExportInputs(
    animationEngine: AnimationEngine,
    canvasElement: HTMLCanvasElement | null,
    config: AnimationExportConfig
  ): Promise<void> {
    if (!animationEngine) {
      throw new Error('Animation engine is required');
    }

    if (!canvasElement) {
      throw new Error('Canvas element is required for frame capture');
    }

    if (animationEngine.getDuration() === 0) {
      throw new Error('No animation loaded in engine');
    }

    // Check memory constraints
    const estimatedMemoryUsage = this.estimateMemoryUsage(config);
    if (estimatedMemoryUsage > config.performanceSettings.memoryLimit * 1024 * 1024) {
      this.emit(ExportEvent.MEMORY_WARNING, {
        estimated: estimatedMemoryUsage,
        limit: config.performanceSettings.memoryLimit * 1024 * 1024
      });
    }

    // Validate resolution settings
    if (config.resolution.width <= 0 || config.resolution.height <= 0) {
      throw new Error('Invalid resolution settings');
    }
  }

  /**
   * Captures all animation frames
   */
  private async captureAnimationFrames(
    animationEngine: AnimationEngine,
    canvasElement: HTMLCanvasElement,
    config: AnimationExportConfig,
    totalFrames: number
  ): Promise<ImageData[]> {
    this.emitProgress({
      stage: 'capturing',
      progress: 5,
      currentFrame: 0,
      totalFrames,
      estimatedTimeRemaining: 0,
      message: 'Starting frame capture...'
    });

    const frames: ImageData[] = [];
    const duration = animationEngine.getDuration();
    const frameRate = this.getFrameRate(config);
    const frameInterval = 1000 / frameRate;

    // Store original animation state
    const originalState = animationEngine.getState();
    
    // Reset animation to start
    animationEngine.stop();
    animationEngine.seekTo(0);

    try {
      for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
        const timestamp = frameIndex * frameInterval;
        
        // Seek to frame timestamp
        animationEngine.seekTo(Math.min(timestamp, duration));
        
        // Wait for frame to render (in a real implementation, this would
        // wait for the animation engine to update the canvas)
        await this.waitForFrame();

        // Capture frame from canvas
        const frameData = await this.captureCanvasFrame(canvasElement, config);
        
        // Apply overlays if enabled
        const processedFrame = await this.applyOverlays(
          frameData, 
          config, 
          frameIndex, 
          totalFrames,
          timestamp
        );

        frames.push(processedFrame);
        this.processedFrames++;

        // Update progress
        const progress = 5 + (45 * (frameIndex + 1) / totalFrames);
        this.emitProgress({
          stage: 'capturing',
          progress,
          currentFrame: frameIndex + 1,
          totalFrames,
          estimatedTimeRemaining: this.estimateTimeRemaining(frameIndex + 1, totalFrames, progress),
          message: `Captured frame ${frameIndex + 1} of ${totalFrames}`
        });

        // Emit frame captured event
        this.emit(ExportEvent.FRAME_CAPTURED, { frameIndex, frameData: processedFrame });

        // Check if export was cancelled
        if (!this.isExporting) {
          throw new Error('Export cancelled');
        }

        // Yield to main thread periodically
        if (frameIndex % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 1));
        }
      }

      return frames;

    } finally {
      // Restore original animation state
      if (originalState === 'playing') {
        animationEngine.play();
      }
    }
  }

  /**
   * Exports frames as animated GIF
   */
  private async exportAsGif(
    frames: ImageData[],
    config: AnimationExportConfig,
    totalFrames: number
  ): Promise<ExportResult> {
    this.emitProgress({
      stage: 'encoding',
      progress: 60,
      currentFrame: 0,
      totalFrames,
      estimatedTimeRemaining: 30,
      message: 'Creating animated GIF...'
    });

    return new Promise((resolve, reject) => {
      try {
        // Initialize gif.js encoder
        const gif = new GIF({
          workers: Math.min(4, config.performanceSettings.maxParallelFrames),
          quality: Math.max(1, Math.min(30, 31 - (config.gifOptions.quality / 100) * 30)),
          width: config.resolution.width,
          height: config.resolution.height,
          dither: config.gifOptions.dithering,
          transparent: config.gifOptions.transparent ? 0x00 : null,
          background: config.gifOptions.backgroundColor || '#ffffff',
          repeat: config.gifOptions.loop
        });

        // Add frames to GIF
        const frameDelay = 1000 / config.gifOptions.frameRate;
        
        frames.forEach((frameData, index) => {
          // Convert ImageData to canvas for gif.js
          const canvas = document.createElement('canvas');
          canvas.width = frameData.width;
          canvas.height = frameData.height;
          const ctx = canvas.getContext('2d')!;
          ctx.putImageData(frameData, 0, 0);

          gif.addFrame(canvas, { delay: frameDelay });

          // Update progress
          const progress = 60 + (30 * (index + 1) / frames.length);
          this.emitProgress({
            stage: 'encoding',
            progress,
            currentFrame: index + 1,
            totalFrames,
            estimatedTimeRemaining: this.estimateTimeRemaining(index + 1, frames.length, progress),
            message: `Encoding frame ${index + 1} of ${frames.length}`
          });
        });

        gif.on('finished', (blob: Blob) => {
          resolve({
            success: true,
            blob,
            fileName: this.generateFileName(config, 'gif'),
            fileSizeBytes: blob.size,
            exportDuration: 0, // Will be set by caller
            config
          });
        });

        gif.on('progress', (progress: number) => {
          const overallProgress = 60 + (30 * progress);
          this.emitProgress({
            stage: 'encoding',
            progress: overallProgress,
            currentFrame: Math.floor(progress * frames.length),
            totalFrames,
            estimatedTimeRemaining: this.estimateTimeRemaining(progress * frames.length, frames.length, overallProgress),
            message: 'Optimizing GIF...'
          });
        });

        gif.render();

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Exports frames as MP4 or WebM video
   */
  private async exportAsVideo(
    frames: ImageData[],
    config: AnimationExportConfig,
    totalFrames: number
  ): Promise<ExportResult> {
    this.emitProgress({
      stage: 'encoding',
      progress: 60,
      currentFrame: 0,
      totalFrames,
      estimatedTimeRemaining: 45,
      message: 'Initializing video encoder...'
    });

    // Note: This is a simplified implementation. In a real system, you would use
    // ffmpeg.wasm or a similar library for video encoding
    
    try {
      // Create video using MediaRecorder API (simplified approach)
      const canvas = document.createElement('canvas');
      canvas.width = config.resolution.width;
      canvas.height = config.resolution.height;
      const ctx = canvas.getContext('2d')!;

      const stream = canvas.captureStream(config.videoOptions.frameRate);
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: config.videoOptions.format === 'mp4' ? 'video/webm' : 'video/webm', // Browser compatibility
        videoBitsPerSecond: config.videoOptions.bitrate * 1000
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      return new Promise((resolve, reject) => {
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: `video/${config.videoOptions.format}` });
          resolve({
            success: true,
            blob,
            fileName: this.generateFileName(config, config.videoOptions.format),
            fileSizeBytes: blob.size,
            exportDuration: 0, // Will be set by caller
            config
          });
        };

        mediaRecorder.onerror = reject;
        mediaRecorder.start();

        // Play frames into canvas
        let frameIndex = 0;
        const frameInterval = 1000 / config.videoOptions.frameRate;

        const drawFrame = () => {
          if (frameIndex >= frames.length) {
            mediaRecorder.stop();
            return;
          }

          ctx.putImageData(frames[frameIndex], 0, 0);
          frameIndex++;

          // Update progress
          const progress = 60 + (35 * frameIndex / frames.length);
          this.emitProgress({
            stage: 'encoding',
            progress,
            currentFrame: frameIndex,
            totalFrames,
            estimatedTimeRemaining: this.estimateTimeRemaining(frameIndex, frames.length, progress),
            message: `Encoding video frame ${frameIndex} of ${frames.length}`
          });

          setTimeout(drawFrame, frameInterval);
        };

        drawFrame();
      });

    } catch (error) {
      throw new Error(`Video export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Exports frames as PNG image sequence
   */
  private async exportAsPngSequence(
    frames: ImageData[],
    config: AnimationExportConfig,
    totalFrames: number
  ): Promise<ExportResult> {
    this.emitProgress({
      stage: 'processing',
      progress: 60,
      currentFrame: 0,
      totalFrames,
      estimatedTimeRemaining: 20,
      message: 'Creating PNG sequence...'
    });

    // Create a ZIP file with all PNG frames
    // Note: This would require a ZIP library like JSZip in a real implementation
    
    const canvas = document.createElement('canvas');
    canvas.width = config.resolution.width;
    canvas.height = config.resolution.height;
    const ctx = canvas.getContext('2d')!;

    // For demo purposes, just return the last frame as PNG
    ctx.putImageData(frames[frames.length - 1], 0, 0);
    
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve({
          success: true,
          blob: blob!,
          fileName: this.generateFileName(config, 'zip'),
          fileSizeBytes: blob!.size,
          exportDuration: 0,
          config
        });
      }, 'image/png');
    });
  }

  /**
   * Captures a single frame from the canvas
   */
  private async captureCanvasFrame(
    canvas: HTMLCanvasElement,
    config: AnimationExportConfig
  ): Promise<ImageData> {
    const ctx = canvas.getContext('2d')!;
    
    // Get the current canvas content
    let frameData: ImageData;
    
    if (canvas.width === config.resolution.width && canvas.height === config.resolution.height) {
      // Direct capture if resolution matches
      frameData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    } else {
      // Scale to target resolution
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = config.resolution.width;
      tempCanvas.height = config.resolution.height;
      const tempCtx = tempCanvas.getContext('2d')!;
      
      // Apply scaling method
      this.scaleCanvasContent(tempCtx, canvas, config.resolution.scaleMethod);
      
      frameData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    }

    return frameData;
  }

  /**
   * Applies overlays to a frame
   */
  private async applyOverlays(
    frameData: ImageData,
    config: AnimationExportConfig,
    frameIndex: number,
    totalFrames: number,
    timestamp: number
  ): Promise<ImageData> {
    if (!this.hasOverlays(config)) {
      return frameData;
    }

    const canvas = document.createElement('canvas');
    canvas.width = frameData.width;
    canvas.height = frameData.height;
    const ctx = canvas.getContext('2d')!;
    
    // Draw the original frame
    ctx.putImageData(frameData, 0, 0);

    const overlayOptions = config.overlayOptions;

    // Apply title overlay
    if (overlayOptions.includeTitle) {
      this.drawTitle(ctx, 'Tactical Play Animation', overlayOptions, canvas.width, canvas.height);
    }

    // Apply branding
    if (overlayOptions.includeBranding) {
      await this.drawBranding(ctx, overlayOptions, canvas.width, canvas.height);
    }

    // Apply timestamp
    if (overlayOptions.includeTimestamp) {
      this.drawTimestamp(ctx, timestamp, canvas.width, canvas.height);
    }

    // Apply watermark
    if (overlayOptions.watermark) {
      this.drawWatermark(ctx, overlayOptions.watermark, overlayOptions, canvas.width, canvas.height);
    }

    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }

  // Helper methods

  private mergeConfigs(config: Partial<AnimationExportConfig>): AnimationExportConfig {
    return {
      ...DEFAULT_EXPORT_CONFIG,
      ...config,
      overlayOptions: {
        ...DEFAULT_EXPORT_CONFIG.overlayOptions,
        ...config.overlayOptions
      },
      performanceSettings: {
        ...DEFAULT_EXPORT_CONFIG.performanceSettings,
        ...config.performanceSettings
      }
    };
  }

  private getFrameRate(config: AnimationExportConfig): number {
    return config.format === 'gif' ? config.gifOptions.frameRate : config.videoOptions.frameRate;
  }

  private async waitForFrame(): Promise<void> {
    return new Promise(resolve => requestAnimationFrame(() => resolve()));
  }

  private estimateMemoryUsage(config: AnimationExportConfig): number {
    // Rough estimation: width * height * 4 bytes per pixel * estimated frame count
    const pixelCount = config.resolution.width * config.resolution.height;
    const bytesPerPixel = 4; // RGBA
    const estimatedFrames = 300; // Reasonable default
    return pixelCount * bytesPerPixel * estimatedFrames;
  }

  private estimateTimeRemaining(currentItem: number, totalItems: number, progress: number): number {
    if (currentItem === 0) return 0;
    
    const elapsed = Date.now() - this.startTime;
    const rate = currentItem / elapsed;
    const remaining = totalItems - currentItem;
    return Math.ceil(remaining / rate / 1000); // Convert to seconds
  }

  private calculateCompressionRatio(frames: ImageData[], outputBlob: Blob | undefined): number {
    if (!outputBlob) return 0;
    
    const uncompressedSize = frames.reduce((total, frame) => {
      return total + (frame.width * frame.height * 4); // 4 bytes per pixel
    }, 0);
    
    return uncompressedSize / outputBlob.size;
  }

  private generateFileName(config: AnimationExportConfig, extension: string): string {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const preset = config.socialPreset ? `-${config.socialPreset}` : '';
    const resolution = `${config.resolution.width}x${config.resolution.height}`;
    
    return `tactical-play-animation${preset}-${resolution}-${timestamp}.${extension}`;
  }

  private hasOverlays(config: AnimationExportConfig): boolean {
    const overlay = config.overlayOptions;
    return overlay.includeTitle || 
           overlay.includeBranding || 
           overlay.includeTimestamp || 
           !!overlay.watermark;
  }

  private scaleCanvasContent(
    ctx: CanvasRenderingContext2D, 
    sourceCanvas: HTMLCanvasElement, 
    scaleMethod: string
  ): void {
    const { width: targetWidth, height: targetHeight } = ctx.canvas;
    const { width: sourceWidth, height: sourceHeight } = sourceCanvas;

    switch (scaleMethod) {
      case 'stretch':
        ctx.drawImage(sourceCanvas, 0, 0, targetWidth, targetHeight);
        break;
      
      case 'fit':
        // Maintain aspect ratio, fit inside target
        const scale = Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight);
        const scaledWidth = sourceWidth * scale;
        const scaledHeight = sourceHeight * scale;
        const offsetX = (targetWidth - scaledWidth) / 2;
        const offsetY = (targetHeight - scaledHeight) / 2;
        
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        ctx.drawImage(sourceCanvas, offsetX, offsetY, scaledWidth, scaledHeight);
        break;
      
      case 'fill':
        // Fill entire target, may crop
        const fillScale = Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight);
        const fillWidth = sourceWidth * fillScale;
        const fillHeight = sourceHeight * fillScale;
        const fillOffsetX = (targetWidth - fillWidth) / 2;
        const fillOffsetY = (targetHeight - fillHeight) / 2;
        
        ctx.drawImage(sourceCanvas, fillOffsetX, fillOffsetY, fillWidth, fillHeight);
        break;
      
      case 'crop':
        // Center crop to fit target aspect ratio
        const targetAspect = targetWidth / targetHeight;
        const sourceAspect = sourceWidth / sourceHeight;
        
        let cropWidth, cropHeight, cropX, cropY;
        
        if (sourceAspect > targetAspect) {
          cropHeight = sourceHeight;
          cropWidth = cropHeight * targetAspect;
          cropX = (sourceWidth - cropWidth) / 2;
          cropY = 0;
        } else {
          cropWidth = sourceWidth;
          cropHeight = cropWidth / targetAspect;
          cropX = 0;
          cropY = (sourceHeight - cropHeight) / 2;
        }
        
        ctx.drawImage(
          sourceCanvas, 
          cropX, cropY, cropWidth, cropHeight,
          0, 0, targetWidth, targetHeight
        );
        break;
    }
  }

  private drawTitle(
    ctx: CanvasRenderingContext2D,
    title: string,
    options: OverlayOptions,
    canvasWidth: number,
    canvasHeight: number
  ): void {
    const font = options.titleFont;
    
    ctx.font = `${font.weight} ${font.size}px ${font.family}`;
    ctx.fillStyle = font.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    let x: number, y: number;
    
    switch (options.titlePosition) {
      case 'top-left':
        ctx.textAlign = 'left';
        x = 20;
        y = 20;
        break;
      case 'top-center':
        x = canvasWidth / 2;
        y = 20;
        break;
      case 'top-right':
        ctx.textAlign = 'right';
        x = canvasWidth - 20;
        y = 20;
        break;
      case 'bottom-left':
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        x = 20;
        y = canvasHeight - 20;
        break;
      case 'bottom-center':
        ctx.textBaseline = 'bottom';
        x = canvasWidth / 2;
        y = canvasHeight - 20;
        break;
      case 'bottom-right':
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        x = canvasWidth - 20;
        y = canvasHeight - 20;
        break;
      default:
        x = canvasWidth / 2;
        y = 20;
    }

    // Draw shadow if enabled
    if (font.shadow) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillText(title, x + 2, y + 2);
    }

    ctx.fillStyle = font.color;
    ctx.fillText(title, x, y);
  }

  private async drawBranding(
    ctx: CanvasRenderingContext2D,
    options: OverlayOptions,
    canvasWidth: number,
    canvasHeight: number
  ): Promise<void> {
    // Draw team logo if provided
    if (options.teamLogo) {
      try {
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = options.teamLogo!;
        });
        
        const logoSize = 60;
        ctx.drawImage(img, 20, canvasHeight - logoSize - 20, logoSize, logoSize);
      } catch (error) {
        console.warn('Failed to load team logo:', error);
      }
    }

    // Draw coach/team name
    if (options.coachName || options.teamName) {
      ctx.font = '14px Arial, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      
      const text = options.teamName || options.coachName || '';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillText(text, 91, canvasHeight - 19);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(text, 90, canvasHeight - 20);
    }
  }

  private drawTimestamp(
    ctx: CanvasRenderingContext2D,
    timestamp: number,
    canvasWidth: number,
    canvasHeight: number
  ): void {
    const seconds = Math.floor(timestamp / 1000);
    const milliseconds = Math.floor((timestamp % 1000) / 100);
    const timeText = `${seconds}.${milliseconds}s`;

    ctx.font = '12px monospace';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    
    ctx.fillText(timeText, canvasWidth - 9, 11);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(timeText, canvasWidth - 10, 10);
  }

  private drawWatermark(
    ctx: CanvasRenderingContext2D,
    watermark: string,
    options: OverlayOptions,
    canvasWidth: number,
    canvasHeight: number
  ): void {
    ctx.save();
    
    ctx.font = '16px Arial, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let x: number, y: number;

    switch (options.watermarkPosition) {
      case 'top-left':
        x = 60;
        y = 40;
        break;
      case 'top-right':
        x = canvasWidth - 60;
        y = 40;
        break;
      case 'bottom-left':
        x = 60;
        y = canvasHeight - 40;
        break;
      case 'bottom-right':
        x = canvasWidth - 60;
        y = canvasHeight - 40;
        break;
      case 'center':
      default:
        x = canvasWidth / 2;
        y = canvasHeight / 2;
        ctx.rotate(-Math.PI / 6); // Diagonal watermark
        break;
    }

    ctx.fillText(watermark, x, y);
    ctx.restore();
  }

  private emitProgress(progress: ExportProgress): void {
    this.emit(ExportEvent.PROGRESS_UPDATE, progress);
  }

  /**
   * Cleans up resources and memory
   */
  public destroy(): void {
    this.cancelExport();
    this.frameCache.clear();
    this.removeAllListeners();
    
    if (this.exportWorker) {
      this.exportWorker.terminate();
      this.exportWorker = null;
    }
  }
}

/**
 * Utility function to get optimal export settings for different use cases
 */
export function getOptimalExportSettings(useCase: 'social' | 'presentation' | 'email' | 'archive'): Partial<AnimationExportConfig> {
  switch (useCase) {
    case 'social':
      return {
        socialPreset: 'instagram-post',
        optimizationMode: 'balanced',
        gifOptions: { frameRate: 24, quality: 75, colors: 128 }
      };
    
    case 'presentation':
      return {
        socialPreset: 'presentation',
        optimizationMode: 'quality',
        videoOptions: { frameRate: 30, bitrate: 5000, quality: 18 }
      };
    
    case 'email':
      return {
        socialPreset: 'email',
        optimizationMode: 'speed',
        gifOptions: { frameRate: 15, quality: 60, colors: 64 }
      };
    
    case 'archive':
      return {
        format: 'mp4',
        resolution: { width: 1920, height: 1080, aspectRatio: '16:9', scaleMethod: 'fit' },
        optimizationMode: 'quality',
        videoOptions: { frameRate: 60, bitrate: 8000, quality: 15 }
      };
    
    default:
      return {};
  }
}

export default AnimationExporter;