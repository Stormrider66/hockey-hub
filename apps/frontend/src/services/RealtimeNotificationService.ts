import { socketService } from './SocketService';
import { toast } from 'sonner';
import { store } from '@/src/store/store';
import { notificationApi } from '@/src/store/api/notificationApi';

export interface RealtimeNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'training' | 'game' | 'medical' | 'equipment' | 'payment';
  title: string;
  message: string;
  userId: string;
  organizationId?: string;
  teamId?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  actionUrl?: string;
  actionText?: string;
  metadata?: Record<string, any>;
  expiresAt?: string;
  createdAt: string;
  sound?: string;
  image?: string;
  persistent?: boolean;
}

export interface NotificationSound {
  id: string;
  name: string;
  file: string;
  category: string;
}

export class RealtimeNotificationService {
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private notificationQueue: RealtimeNotification[] = [];
  private isProcessingQueue = false;
  private soundEnabled = true;
  private soundVolume = 0.7;
  private maxQueueSize = 100;

  // Predefined notification sounds
  private readonly notificationSounds: NotificationSound[] = [
    { id: 'default', name: 'Default', file: '/sounds/notification-default.mp3', category: 'general' },
    { id: 'message', name: 'Message', file: '/sounds/notification-message.mp3', category: 'chat' },
    { id: 'alert', name: 'Alert', file: '/sounds/notification-alert.mp3', category: 'urgent' },
    { id: 'training', name: 'Training', file: '/sounds/notification-training.mp3', category: 'training' },
    { id: 'game', name: 'Game', file: '/sounds/notification-game.mp3', category: 'game' },
    { id: 'medical', name: 'Medical', file: '/sounds/notification-medical.mp3', category: 'medical' },
    { id: 'success', name: 'Success', file: '/sounds/notification-success.mp3', category: 'success' },
    { id: 'warning', name: 'Warning', file: '/sounds/notification-warning.mp3', category: 'warning' },
    { id: 'error', name: 'Error', file: '/sounds/notification-error.mp3', category: 'error' }
  ];

  constructor() {
    this.loadSounds();
    this.setupSocketHandlers();
    this.loadSettings();
  }

  /**
   * Load notification sounds
   */
  private loadSounds(): void {
    this.notificationSounds.forEach(sound => {
      try {
        const audio = new Audio(sound.file);
        audio.preload = 'auto';
        audio.volume = this.soundVolume;
        this.sounds.set(sound.id, audio);
      } catch (error) {
        console.warn(`Failed to load sound: ${sound.file}`, error);
      }
    });
  }

  /**
   * Set up Socket.io event handlers for real-time notifications
   */
  private setupSocketHandlers(): void {
    socketService.setEventHandlers({
      onNotification: (data: RealtimeNotification) => {
        this.handleRealtimeNotification(data);
      },
      onNotificationRead: (data: { notificationId: string; timestamp: string }) => {
        this.handleNotificationRead(data.notificationId);
      }
    });
  }

  /**
   * Load user notification settings
   */
  private loadSettings(): void {
    const settings = localStorage.getItem('notificationSettings');
    if (settings) {
      try {
        const parsed = JSON.parse(settings);
        this.soundEnabled = parsed.soundEnabled ?? true;
        this.soundVolume = parsed.volume ?? 0.7;
        
        // Update sound volumes
        this.sounds.forEach(audio => {
          audio.volume = this.soundVolume;
        });
      } catch (error) {
        console.warn('Failed to load notification settings:', error);
      }
    }
  }

  /**
   * Save user notification settings
   */
  private saveSettings(): void {
    const settings = {
      soundEnabled: this.soundEnabled,
      volume: this.soundVolume
    };
    localStorage.setItem('notificationSettings', JSON.stringify(settings));
  }

  /**
   * Handle incoming real-time notification
   */
  private handleRealtimeNotification(notification: RealtimeNotification): void {
    console.log('📱 Real-time notification received:', notification);

    // Add to queue
    this.addToQueue(notification);

    // Process notification immediately
    this.processNotification(notification);

    // Update Redux store
    this.updateNotificationStore(notification);
  }

  /**
   * Add notification to queue
   */
  private addToQueue(notification: RealtimeNotification): void {
    this.notificationQueue.unshift(notification);
    
    // Limit queue size
    if (this.notificationQueue.length > this.maxQueueSize) {
      this.notificationQueue = this.notificationQueue.slice(0, this.maxQueueSize);
    }
  }

  /**
   * Process individual notification
   */
  private processNotification(notification: RealtimeNotification): void {
    // Play notification sound
    this.playNotificationSound(notification);

    // Show browser notification if supported and permitted
    this.showBrowserNotification(notification);

    // Show toast notification
    this.showToastNotification(notification);

    // Store for offline access
    this.storeNotificationOffline(notification);
  }

  /**
   * Play notification sound
   */
  private playNotificationSound(notification: RealtimeNotification): void {
    if (!this.soundEnabled) return;

    let soundId = 'default';
    
    // Determine sound based on notification type
    switch (notification.type) {
      case 'training':
        soundId = 'training';
        break;
      case 'medical':
        soundId = 'medical';
        break;
      case 'error':
        soundId = 'error';
        break;
      case 'warning':
        soundId = 'warning';
        break;
      case 'success':
        soundId = 'success';
        break;
      default:
        if (notification.priority === 'urgent') {
          soundId = 'alert';
        } else if (notification.category === 'chat') {
          soundId = 'message';
        } else if (notification.category === 'game') {
          soundId = 'game';
        }
        break;
    }

    // Use custom sound if specified
    if (notification.sound) {
      soundId = notification.sound;
    }

    const audio = this.sounds.get(soundId);
    if (audio) {
      audio.currentTime = 0; // Reset to beginning
      audio.play().catch(error => {
        console.warn('Failed to play notification sound:', error);
      });
    }
  }

  /**
   * Show browser notification
   */
  private async showBrowserNotification(notification: RealtimeNotification): Promise<void> {
    if (!('Notification' in window)) return;

    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: notification.image || '/icons/notification-icon.png',
        badge: '/icons/notification-badge.png',
        tag: notification.id,
        requireInteraction: notification.priority === 'urgent',
        silent: !this.soundEnabled,
        data: {
          id: notification.id,
          actionUrl: notification.actionUrl
        }
      });

      browserNotification.onclick = () => {
        if (notification.actionUrl) {
          window.open(notification.actionUrl, '_blank');
        }
        browserNotification.close();
        this.markAsRead(notification.id);
      };

      // Auto-close after 10 seconds unless urgent
      if (notification.priority !== 'urgent') {
        setTimeout(() => {
          browserNotification.close();
        }, 10000);
      }
    }
  }

  /**
   * Show toast notification
   */
  private showToastNotification(notification: RealtimeNotification): void {
    const toastOptions: any = {
      description: notification.message,
      duration: this.getToastDuration(notification.priority),
    };

    if (notification.actionUrl && notification.actionText) {
      toastOptions.action = {
        label: notification.actionText,
        onClick: () => {
          window.open(notification.actionUrl, '_blank');
          this.markAsRead(notification.id);
        }
      };
    }

    // Show appropriate toast type
    switch (notification.type) {
      case 'success':
        toast.success(notification.title, toastOptions);
        break;
      case 'warning':
        toast.warning(notification.title, toastOptions);
        break;
      case 'error':
        toast.error(notification.title, toastOptions);
        break;
      default:
        toast.info(notification.title, toastOptions);
        break;
    }
  }

  /**
   * Get toast duration based on priority
   */
  private getToastDuration(priority: string): number {
    switch (priority) {
      case 'urgent':
        return 15000; // 15 seconds
      case 'high':
        return 10000; // 10 seconds
      case 'medium':
        return 6000;  // 6 seconds
      default:
        return 4000;  // 4 seconds
    }
  }

  /**
   * Store notification for offline access
   */
  private storeNotificationOffline(notification: RealtimeNotification): void {
    try {
      const stored = localStorage.getItem('offlineNotifications');
      const notifications = stored ? JSON.parse(stored) : [];
      
      notifications.unshift(notification);
      
      // Keep only last 50 notifications
      if (notifications.length > 50) {
        notifications.splice(50);
      }
      
      localStorage.setItem('offlineNotifications', JSON.stringify(notifications));
    } catch (error) {
      console.warn('Failed to store notification offline:', error);
    }
  }

  /**
   * Update Redux store with new notification
   */
  private updateNotificationStore(notification: RealtimeNotification): void {
    try {
      // Trigger a refetch of notifications to update the UI
      store.dispatch(notificationApi.util.invalidateTags(['Notification']));
    } catch (error) {
      console.warn('Failed to update notification store:', error);
    }
  }

  /**
   * Handle notification read event
   */
  private handleNotificationRead(notificationId: string): void {
    console.log('👁️ Notification marked as read:', notificationId);
    
    // Update Redux store
    store.dispatch(notificationApi.util.invalidateTags(['Notification']));
    
    // Remove from queue if present
    this.notificationQueue = this.notificationQueue.filter(n => n.id !== notificationId);
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string): void {
    socketService.markNotificationAsRead(notificationId);
  }

  /**
   * Get recent notifications from queue
   */
  getRecentNotifications(limit: number = 10): RealtimeNotification[] {
    return this.notificationQueue.slice(0, limit);
  }

  /**
   * Clear notification queue
   */
  clearQueue(): void {
    this.notificationQueue = [];
  }

  /**
   * Update sound settings
   */
  updateSoundSettings(enabled: boolean, volume: number): void {
    this.soundEnabled = enabled;
    this.soundVolume = Math.max(0, Math.min(1, volume));
    
    // Update audio volumes
    this.sounds.forEach(audio => {
      audio.volume = this.soundVolume;
    });
    
    this.saveSettings();
  }

  /**
   * Test notification sound
   */
  testSound(soundId: string = 'default'): void {
    const audio = this.sounds.get(soundId);
    if (audio && this.soundEnabled) {
      audio.currentTime = 0;
      audio.play().catch(error => {
        console.warn('Failed to test sound:', error);
      });
    }
  }

  /**
   * Get available notification sounds
   */
  getAvailableSounds(): NotificationSound[] {
    return [...this.notificationSounds];
  }

  /**
   * Get current settings
   */
  getSettings() {
    return {
      soundEnabled: this.soundEnabled,
      volume: this.soundVolume,
      queueSize: this.notificationQueue.length
    };
  }

  /**
   * Send a test notification
   */
  sendTestNotification(): void {
    const testNotification: RealtimeNotification = {
      id: `test-${Date.now()}`,
      type: 'info',
      title: 'Test Notification',
      message: 'This is a test of the real-time notification system.',
      userId: 'test-user',
      priority: 'medium',
      category: 'test',
      createdAt: new Date().toISOString()
    };

    this.processNotification(testNotification);
  }
}

// Export singleton instance
export const realtimeNotificationService = new RealtimeNotificationService();