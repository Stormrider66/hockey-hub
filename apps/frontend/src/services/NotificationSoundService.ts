// Notification Sound Service for Hockey Hub

export interface SoundSettings {
  enabled: boolean;
  volume: number; // 0-100
  soundType: 'default' | 'chime' | 'bell' | 'ping' | 'pop' | 'custom';
  customSoundUrl?: string;
  playForTypes: {
    message: boolean;
    mention: boolean;
    urgent: boolean;
    calendar: boolean;
    training: boolean;
    medical: boolean;
    equipment: boolean;
    general: boolean;
  };
}

class NotificationSoundService {
  private audioContext: AudioContext | null = null;
  private soundCache: Map<string, AudioBuffer> = new Map();
  private settings: SoundSettings;
  private isInitialized: boolean = false;

  // Default sound URLs (in production, these would be hosted assets)
  private readonly soundUrls = {
    default: '/sounds/notification-default.mp3',
    chime: '/sounds/notification-chime.mp3',
    bell: '/sounds/notification-bell.mp3',
    ping: '/sounds/notification-ping.mp3',
    pop: '/sounds/notification-pop.mp3',
  };

  constructor() {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('notificationSoundSettings');
    this.settings = savedSettings ? JSON.parse(savedSettings) : this.getDefaultSettings();
  }

  /**
   * Get default sound settings
   */
  private getDefaultSettings(): SoundSettings {
    return {
      enabled: true,
      volume: 70,
      soundType: 'default',
      playForTypes: {
        message: true,
        mention: true,
        urgent: true,
        calendar: true,
        training: false,
        medical: true,
        equipment: false,
        general: false,
      },
    };
  }

  /**
   * Initialize the audio context
   */
  private async initializeAudioContext(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Resume context if suspended (required for some browsers)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      throw error;
    }
  }

  /**
   * Load and cache a sound file
   */
  private async loadSound(url: string): Promise<AudioBuffer> {
    // Check cache first
    if (this.soundCache.has(url)) {
      return this.soundCache.get(url)!;
    }

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
      
      // Cache the decoded audio
      this.soundCache.set(url, audioBuffer);
      
      return audioBuffer;
    } catch (error) {
      console.error('Failed to load sound:', url, error);
      throw error;
    }
  }

  /**
   * Play a notification sound
   */
  async playNotificationSound(notificationType?: string): Promise<void> {
    if (!this.settings.enabled) return;

    // Check if we should play sound for this notification type
    if (notificationType) {
      const typeCategory = this.getNotificationCategory(notificationType);
      if (!this.settings.playForTypes[typeCategory]) return;
    }

    try {
      // Initialize audio context if needed
      await this.initializeAudioContext();
      
      // Get sound URL
      const soundUrl = this.settings.soundType === 'custom' && this.settings.customSoundUrl
        ? this.settings.customSoundUrl
        : this.soundUrls[this.settings.soundType] || this.soundUrls.default;
      
      // Load the sound
      const audioBuffer = await this.loadSound(soundUrl);
      
      // Create audio source
      const source = this.audioContext!.createBufferSource();
      source.buffer = audioBuffer;
      
      // Create gain node for volume control
      const gainNode = this.audioContext!.createGain();
      gainNode.gain.value = this.settings.volume / 100;
      
      // Connect nodes
      source.connect(gainNode);
      gainNode.connect(this.audioContext!.destination);
      
      // Play the sound
      source.start(0);
    } catch (error) {
      console.error('Failed to play notification sound:', error);
    }
  }

  /**
   * Get notification category from type
   */
  private getNotificationCategory(type: string): keyof SoundSettings['playForTypes'] {
    const categoryMap: Record<string, keyof SoundSettings['playForTypes']> = {
      // Messages
      'message_received': 'message',
      'mention': 'mention',
      'reaction_added': 'message',
      
      // Urgent
      'system_alert': 'urgent',
      'schedule_conflict': 'urgent',
      'payment_due': 'urgent',
      
      // Calendar
      'event_reminder': 'calendar',
      'event_created': 'calendar',
      'event_updated': 'calendar',
      'event_cancelled': 'calendar',
      'rsvp_request': 'calendar',
      
      // Training
      'training_assigned': 'training',
      'training_completed': 'training',
      'training_overdue': 'training',
      
      // Medical
      'medical_appointment': 'medical',
      'injury_update': 'medical',
      'medical_clearance': 'medical',
      
      // Equipment
      'equipment_due': 'equipment',
      'equipment_ready': 'equipment',
      'maintenance_required': 'equipment',
      
      // General
      'announcement': 'general',
      'team_update': 'general',
    };
    
    return categoryMap[type] || 'general';
  }

  /**
   * Update sound settings
   */
  updateSettings(settings: Partial<SoundSettings>): void {
    this.settings = { ...this.settings, ...settings };
    localStorage.setItem('notificationSoundSettings', JSON.stringify(this.settings));
  }

  /**
   * Get current settings
   */
  getSettings(): SoundSettings {
    return { ...this.settings };
  }

  /**
   * Test a specific sound
   */
  async testSound(soundType?: string): Promise<void> {
    const originalSoundType = this.settings.soundType;
    const originalEnabled = this.settings.enabled;
    
    // Temporarily enable sound and set type if provided
    this.settings.enabled = true;
    if (soundType) {
      this.settings.soundType = soundType as any;
    }
    
    try {
      await this.playNotificationSound();
    } finally {
      // Restore original settings
      this.settings.soundType = originalSoundType;
      this.settings.enabled = originalEnabled;
    }
  }

  /**
   * Preload all sounds
   */
  async preloadSounds(): Promise<void> {
    await this.initializeAudioContext();
    
    const soundUrls = Object.values(this.soundUrls);
    if (this.settings.soundType === 'custom' && this.settings.customSoundUrl) {
      soundUrls.push(this.settings.customSoundUrl);
    }
    
    await Promise.all(soundUrls.map(url => this.loadSound(url).catch(() => {})));
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.soundCache.clear();
    this.isInitialized = false;
  }
}

// Export singleton instance
export const notificationSoundService = new NotificationSoundService();

// Export type
export type { SoundSettings };