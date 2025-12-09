// Audio Recording Service for Voice Notes
import { EventEmitter } from 'events';

export interface AudioRecordingOptions {
  mimeType?: string;
  audioBitsPerSecond?: number;
  maxDuration?: number; // in seconds
}

export interface AudioRecordingData {
  blob: Blob;
  duration: number;
  url: string;
  waveform?: number[];
}

export class AudioRecordingService extends EventEmitter {
  private static instance: AudioRecordingService;
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private startTime: number = 0;
  private recordingTimeout: NodeJS.Timeout | null = null;
  private analyser: AnalyserNode | null = null;
  private audioContext: AudioContext | null = null;
  private stream: MediaStream | null = null;

  private constructor() {
    super();
  }

  static getInstance(): AudioRecordingService {
    if (!AudioRecordingService.instance) {
      AudioRecordingService.instance = new AudioRecordingService();
    }
    return AudioRecordingService.instance;
  }

  async checkPermissions(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      return false;
    }
  }

  async startRecording(options: AudioRecordingOptions = {}): Promise<void> {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      throw new Error('Recording already in progress');
    }

    try {
      // Get audio stream
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      // Set up audio analysis for waveform
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = this.audioContext.createMediaStreamSource(this.stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      source.connect(this.analyser);

      // Determine MIME type
      const mimeType = options.mimeType || this.getPreferredMimeType();

      // Create MediaRecorder
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType,
        audioBitsPerSecond: options.audioBitsPerSecond || 128000,
      });

      this.chunks = [];
      this.startTime = Date.now();

      // Set up event handlers
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.chunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.handleRecordingStop();
      };

      this.mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        this.emit('error', event);
        this.stopRecording();
      };

      // Start recording
      this.mediaRecorder.start(100); // Collect data every 100ms
      this.emit('started');

      // Emit level updates for visualization
      this.emitLevelUpdates();

      // Set max duration timeout
      if (options.maxDuration) {
        this.recordingTimeout = setTimeout(() => {
          this.stopRecording();
        }, options.maxDuration * 1000);
      }
    } catch (error) {
      console.error('Failed to start recording:', error);
      this.emit('error', error);
      throw error;
    }
  }

  async stopRecording(): Promise<AudioRecordingData> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        reject(new Error('No recording in progress'));
        return;
      }

      // Clear timeout
      if (this.recordingTimeout) {
        clearTimeout(this.recordingTimeout);
        this.recordingTimeout = null;
      }

      // Store resolve function to use in handleRecordingStop
      this.once('stopped', (data: AudioRecordingData) => {
        resolve(data);
      });

      this.once('error', (error) => {
        reject(error);
      });

      // Stop recording
      this.mediaRecorder.stop();

      // Stop all tracks
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
      }
    });
  }

  async pauseRecording(): Promise<void> {
    if (!this.mediaRecorder || this.mediaRecorder.state !== 'recording') {
      throw new Error('No recording in progress');
    }

    this.mediaRecorder.pause();
    this.emit('paused');
  }

  async resumeRecording(): Promise<void> {
    if (!this.mediaRecorder || this.mediaRecorder.state !== 'paused') {
      throw new Error('Recording not paused');
    }

    this.mediaRecorder.resume();
    this.emit('resumed');
  }

  getRecordingState(): 'inactive' | 'recording' | 'paused' {
    return this.mediaRecorder?.state || 'inactive';
  }

  getRecordingDuration(): number {
    if (!this.startTime) return 0;
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  private handleRecordingStop(): void {
    const duration = this.getRecordingDuration();
    const blob = new Blob(this.chunks, { type: this.mediaRecorder!.mimeType });
    const url = URL.createObjectURL(blob);

    // Generate waveform data
    const waveform = this.generateWaveform();

    // Clean up
    this.cleanup();

    const data: AudioRecordingData = {
      blob,
      duration,
      url,
      waveform,
    };

    this.emit('stopped', data);
  }

  private generateWaveform(): number[] {
    // Generate simplified waveform data for visualization
    // In a real implementation, you'd analyze the audio data
    const waveform: number[] = [];
    const samples = 50; // Number of waveform bars

    for (let i = 0; i < samples; i++) {
      // Generate random values for now (replace with actual audio analysis)
      waveform.push(Math.random() * 0.5 + 0.5);
    }

    return waveform;
  }

  private emitLevelUpdates(): void {
    if (!this.analyser || !this.mediaRecorder || this.mediaRecorder.state !== 'recording') {
      return;
    }

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);

    // Calculate average level
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    const normalizedLevel = Math.min(1, average / 128);

    this.emit('levelUpdate', normalizedLevel);

    // Continue updating
    requestAnimationFrame(() => this.emitLevelUpdates());
  }

  private getPreferredMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg',
      'audio/mp4',
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return 'audio/webm';
  }

  private cleanup(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.analyser = null;
    this.stream = null;
    this.mediaRecorder = null;
    this.chunks = [];
    this.startTime = 0;
  }

  // Convert blob to base64 for sending
  async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Format duration to MM:SS
  static formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}

export default AudioRecordingService.getInstance();