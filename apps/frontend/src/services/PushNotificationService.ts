// Push Notification Service for Hockey Hub

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

class PushNotificationService {
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private isSupported: boolean;

  constructor() {
    // Only check support on client side
    if (typeof window !== 'undefined') {
      this.isSupported = this.checkSupport();
    } else {
      this.isSupported = false;
    }
  }

  /**
   * Check if push notifications are supported
   */
  private checkSupport(): boolean {
    // Ensure we're on the client side
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return false;
    }
    
    return 'serviceWorker' in navigator && 
           'PushManager' in window && 
           'Notification' in window;
  }

  /**
   * Register the service worker
   */
  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported) {
      console.warn('Push notifications are not supported in this browser');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('Service Worker registered successfully:', registration);
      this.serviceWorkerRegistration = registration;
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }

  /**
   * Get the current notification permission status
   */
  getPermissionStatus(): NotificationPermission {
    if (!this.isSupported) return 'denied';
    return Notification.permission;
  }

  /**
   * Request notification permission from the user
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      throw new Error('Push notifications are not supported');
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  /**
   * Get the current push subscription
   */
  async getSubscription(): Promise<PushSubscription | null> {
    if (!this.serviceWorkerRegistration) {
      await this.registerServiceWorker();
    }

    if (!this.serviceWorkerRegistration) {
      return null;
    }

    try {
      const subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
      return subscription;
    } catch (error) {
      console.error('Failed to get push subscription:', error);
      return null;
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(applicationServerKey: string): Promise<PushSubscriptionData | null> {
    if (!this.isSupported) {
      throw new Error('Push notifications are not supported');
    }

    // Check permission first
    const permission = await this.getPermissionStatus();
    if (permission !== 'granted') {
      const newPermission = await this.requestPermission();
      if (newPermission !== 'granted') {
        throw new Error('Push notification permission denied');
      }
    }

    // Ensure service worker is registered
    if (!this.serviceWorkerRegistration) {
      await this.registerServiceWorker();
    }

    if (!this.serviceWorkerRegistration) {
      throw new Error('Service worker registration failed');
    }

    try {
      // Convert VAPID key from base64 string to Uint8Array
      const convertedVapidKey = this.urlBase64ToUint8Array(applicationServerKey);

      // Subscribe to push service
      const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });

      // Convert subscription to JSON format
      const subscriptionData = this.subscriptionToJSON(subscription);
      return subscriptionData;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<boolean> {
    const subscription = await this.getSubscription();
    
    if (!subscription) {
      return true; // Already unsubscribed
    }

    try {
      const success = await subscription.unsubscribe();
      return success;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  /**
   * Show a local notification (for testing)
   */
  async showLocalNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (!this.isSupported) {
      throw new Error('Notifications are not supported');
    }

    const permission = await this.getPermissionStatus();
    if (permission !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    if (!this.serviceWorkerRegistration) {
      await this.registerServiceWorker();
    }

    if (!this.serviceWorkerRegistration) {
      throw new Error('Service worker not registered');
    }

    await this.serviceWorkerRegistration.showNotification(title, {
      body: options?.body || '',
      icon: options?.icon || '/icons/icon-192x192.png',
      badge: options?.badge || '/icons/badge-72x72.png',
      tag: options?.tag || 'test-notification',
      data: options?.data || {},
      ...options
    });
  }

  /**
   * Convert VAPID key from base64 string to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Convert PushSubscription to JSON format
   */
  private subscriptionToJSON(subscription: PushSubscription): PushSubscriptionData {
    const key = subscription.getKey('p256dh');
    const token = subscription.getKey('auth');

    return {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: key ? this.arrayBufferToBase64(key) : '',
        auth: token ? this.arrayBufferToBase64(token) : ''
      }
    };
  }

  /**
   * Convert ArrayBuffer to base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  /**
   * Send message to service worker
   */
  async sendMessageToServiceWorker(message: any): Promise<void> {
    if (!this.serviceWorkerRegistration || !this.serviceWorkerRegistration.active) {
      console.warn('No active service worker found');
      return;
    }

    this.serviceWorkerRegistration.active.postMessage(message);
  }

  /**
   * Update badge count
   */
  async updateBadgeCount(count: number): Promise<void> {
    if ('setAppBadge' in navigator) {
      try {
        if (count > 0) {
          await (navigator as any).setAppBadge(count);
        } else {
          await (navigator as any).clearAppBadge();
        }
      } catch (error) {
        console.error('Failed to update badge:', error);
      }
    }
  }

  /**
   * Check if push notifications are enabled
   */
  async isEnabled(): Promise<boolean> {
    if (!this.isSupported) return false;
    
    const permission = this.getPermissionStatus();
    if (permission !== 'granted') return false;
    
    const subscription = await this.getSubscription();
    return !!subscription;
  }

  /**
   * Get support status details
   */
  getSupportDetails(): {
    serviceWorker: boolean;
    pushManager: boolean;
    notification: boolean;
    overall: boolean;
  } {
    // Return false for all on server side
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return {
        serviceWorker: false,
        pushManager: false,
        notification: false,
        overall: false
      };
    }
    
    return {
      serviceWorker: 'serviceWorker' in navigator,
      pushManager: 'PushManager' in window,
      notification: 'Notification' in window,
      overall: this.isSupported
    };
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();

// Export type
export type { PushSubscriptionData };