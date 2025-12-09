/**
 * Audio service for interval timer with multiple sound options
 */
export class IntervalTimerAudioService {
  private audioContext: AudioContext | null = null;
  private volume: number = 0.7;
  private preloadedSounds: Map<string, AudioBuffer> = new Map();
  
  // Default sound configurations
  private soundConfigs = {
    start: {
      file: '/sounds/interval-start.mp3',
      fallback: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSx5v+3Y',
      frequency: 880, // A5
      duration: 200
    },
    end: {
      file: '/sounds/interval-end.mp3',
      fallback: 'data:audio/wav;base64,UklGRl4GAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YfoFAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeS',
      frequency: 440, // A4
      duration: 300
    },
    countdown: {
      file: '/sounds/interval-countdown.mp3',
      fallback: 'data:audio/wav;base64,UklGRhwGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2E',
      frequency: 660, // E5
      duration: 100
    },
    warning: {
      file: '/sounds/interval-warning.mp3',
      fallback: null,
      frequency: 520, // C5
      duration: 150
    }
  };

  constructor() {
    // Initialize Web Audio API if available
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      this.audioContext = new AudioContext();
      this.preloadSounds();
    }
  }

  /**
   * Preload sound files
   */
  private async preloadSounds() {
    for (const [key, config] of Object.entries(this.soundConfigs)) {
      if (config.file) {
        try {
          const response = await fetch(config.file);
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
            this.preloadedSounds.set(key, audioBuffer);
          }
        } catch (error) {
          // Silently fail - will use fallback or generated sound
          console.debug(`Failed to preload ${key} sound:`, error);
        }
      }
    }
  }

  /**
   * Play a sound effect
   */
  async playSound(type: 'start' | 'end' | 'countdown' | 'warning') {
    const config = this.soundConfigs[type];
    
    // Try preloaded sound first
    if (this.audioContext && this.preloadedSounds.has(type)) {
      this.playWebAudioSound(this.preloadedSounds.get(type)!);
      return;
    }

    // Try fallback data URI
    if (config.fallback) {
      this.playFallbackSound(config.fallback);
      return;
    }

    // Generate synthetic sound as last resort
    if (this.audioContext) {
      this.generateAndPlaySound(config.frequency, config.duration);
    }
  }

  /**
   * Play sound using Web Audio API
   */
  private playWebAudioSound(buffer: AudioBuffer) {
    if (!this.audioContext) return;

    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();
    
    source.buffer = buffer;
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    gainNode.gain.value = this.volume;
    
    source.start();
  }

  /**
   * Play fallback sound using Audio element
   */
  private playFallbackSound(dataUri: string) {
    const audio = new Audio(dataUri);
    audio.volume = this.volume;
    audio.play().catch(e => console.debug('Audio playback failed:', e));
  }

  /**
   * Generate and play a synthetic beep sound
   */
  private generateAndPlaySound(frequency: number, duration: number) {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    // Create envelope
    const now = this.audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(this.volume, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration / 1000);
    
    oscillator.start(now);
    oscillator.stop(now + duration / 1000);
  }

  /**
   * Set volume (0-1)
   */
  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Get current volume
   */
  getVolume(): number {
    return this.volume;
  }

  /**
   * Resume audio context if suspended (required for some browsers)
   */
  async resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  /**
   * Cleanup resources
   */
  dispose() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.preloadedSounds.clear();
  }
}

// Export singleton instance
export const intervalTimerAudio = new IntervalTimerAudioService();