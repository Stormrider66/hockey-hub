/**
 * Video Recording Service
 * Handles video recording, preview, compression, and encoding
 */

interface VideoConstraints {
  width: { min: number; ideal: number; max: number };
  height: { min: number; ideal: number; max: number };
  facingMode: 'user' | 'environment';
  frameRate: { ideal: number; max: number };
}

interface RecordingOptions {
  maxDuration?: number; // in seconds
  maxFileSize?: number; // in MB
  quality?: 'low' | 'medium' | 'high';
  facingMode?: 'user' | 'environment';
}

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  fileSize: number;
  error: string | null;
}

export class VideoRecordingService {
  private static instance: VideoRecordingService;
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private recordedChunks: Blob[] = [];
  private startTime: number = 0;
  private pauseTime: number = 0;
  private totalPausedTime: number = 0;
  private animationFrameId: number | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private recordingStateCallback: ((state: RecordingState) => void) | null = null;

  private readonly defaultOptions: RecordingOptions = {
    maxDuration: 60, // 1 minute
    maxFileSize: 25, // 25MB
    quality: 'medium',
    facingMode: 'user'
  };

  private readonly qualitySettings = {
    low: { width: 640, height: 480, bitrate: 500000 },
    medium: { width: 1280, height: 720, bitrate: 1000000 },
    high: { width: 1920, height: 1080, bitrate: 2500000 }
  };

  private constructor() {}

  static getInstance(): VideoRecordingService {
    if (!VideoRecordingService.instance) {
      VideoRecordingService.instance = new VideoRecordingService();
    }
    return VideoRecordingService.instance;
  }

  async requestPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Permission denied:', error);
      return false;
    }
  }

  async startRecording(
    options: RecordingOptions = {},
    previewElement?: HTMLVideoElement,
    onStateChange?: (state: RecordingState) => void
  ): Promise<void> {
    const config = { ...this.defaultOptions, ...options };
    this.recordingStateCallback = onStateChange || null;
    this.videoElement = previewElement || null;

    try {
      const quality = this.qualitySettings[config.quality!];
      const constraints: MediaStreamConstraints = {
        video: {
          width: { min: 320, ideal: quality.width, max: quality.width },
          height: { min: 240, ideal: quality.height, max: quality.height },
          facingMode: config.facingMode,
          frameRate: { ideal: 30, max: 30 }
        } as VideoConstraints,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Show preview if video element provided
      if (this.videoElement) {
        this.videoElement.srcObject = this.stream;
        this.videoElement.muted = true; // Mute to prevent echo
        await this.videoElement.play();
      }

      // Set up media recorder
      const mimeType = this.getSupportedMimeType();
      const options: MediaRecorderOptions = {
        mimeType,
        videoBitsPerSecond: quality.bitrate
      };

      this.mediaRecorder = new MediaRecorder(this.stream, options);
      this.recordedChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
          this.updateRecordingState();
        }
      };

      this.mediaRecorder.start(1000); // Collect data every second
      this.startTime = Date.now();
      this.totalPausedTime = 0;
      this.startDurationTracking();
      this.updateRecordingState();

    } catch (error) {
      this.handleError(error as Error);
      throw error;
    }
  }

  private getSupportedMimeType(): string {
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4'
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return '';
  }

  pauseRecording(): void {
    if (this.mediaRecorder?.state === 'recording') {
      this.mediaRecorder.pause();
      this.pauseTime = Date.now();
      this.updateRecordingState();
    }
  }

  resumeRecording(): void {
    if (this.mediaRecorder?.state === 'paused') {
      this.mediaRecorder.resume();
      this.totalPausedTime += Date.now() - this.pauseTime;
      this.updateRecordingState();
    }
  }

  async stopRecording(): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = async () => {
        const blob = new Blob(this.recordedChunks, {
          type: this.mediaRecorder!.mimeType
        });

        // Compress if needed
        const compressedBlob = await this.compressVideo(blob);
        
        this.cleanup();
        resolve(compressedBlob);
      };

      if (this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }

      this.stopDurationTracking();
    });
  }

  cancelRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.cleanup();
  }

  private async compressVideo(blob: Blob): Promise<Blob> {
    // For now, return original blob
    // In production, you might want to use a video compression library
    // or server-side compression
    return blob;
  }

  private cleanup(): void {
    this.stopDurationTracking();
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }

    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.recordingStateCallback = null;
  }

  private startDurationTracking(): void {
    const updateDuration = () => {
      this.updateRecordingState();
      this.animationFrameId = requestAnimationFrame(updateDuration);
    };
    updateDuration();
  }

  private stopDurationTracking(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private updateRecordingState(): void {
    if (!this.recordingStateCallback) return;

    const now = Date.now();
    let duration = 0;

    if (this.mediaRecorder?.state === 'recording') {
      duration = (now - this.startTime - this.totalPausedTime) / 1000;
    } else if (this.mediaRecorder?.state === 'paused') {
      duration = (this.pauseTime - this.startTime - this.totalPausedTime) / 1000;
    }

    const fileSize = this.recordedChunks.reduce((total, chunk) => total + chunk.size, 0) / (1024 * 1024);

    this.recordingStateCallback({
      isRecording: this.mediaRecorder?.state === 'recording',
      isPaused: this.mediaRecorder?.state === 'paused',
      duration: Math.floor(duration),
      fileSize: Math.round(fileSize * 100) / 100,
      error: null
    });

    // Auto-stop if max duration or file size reached
    const options = this.defaultOptions;
    if (duration >= (options.maxDuration || 60) || fileSize >= (options.maxFileSize || 25)) {
      this.stopRecording();
    }
  }

  private handleError(error: Error): void {
    console.error('Video recording error:', error);
    if (this.recordingStateCallback) {
      this.recordingStateCallback({
        isRecording: false,
        isPaused: false,
        duration: 0,
        fileSize: 0,
        error: error.message
      });
    }
    this.cleanup();
  }

  async generateThumbnail(videoBlob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      video.autoplay = true;
      video.muted = true;
      video.src = URL.createObjectURL(videoBlob);

      video.onloadeddata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx?.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const reader = new FileReader();
            reader.onloadend = () => {
              URL.revokeObjectURL(video.src);
              resolve(reader.result as string);
            };
            reader.readAsDataURL(blob);
          } else {
            reject(new Error('Failed to generate thumbnail'));
          }
        }, 'image/jpeg', 0.7);
      };

      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        reject(new Error('Failed to load video'));
      };
    });
  }

  switchCamera(): void {
    // Toggle between user and environment facing cameras
    const currentFacingMode = this.stream?.getVideoTracks()[0]?.getSettings().facingMode;
    const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    
    // Stop current recording and restart with new camera
    this.cancelRecording();
    // The component should handle restarting with new facingMode
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }

  isPaused(): boolean {
    return this.mediaRecorder?.state === 'paused';
  }
}

export const videoRecordingService = VideoRecordingService.getInstance();