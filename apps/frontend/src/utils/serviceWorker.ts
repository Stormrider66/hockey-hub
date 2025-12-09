// Service Worker Registration and Management
import React from 'react';

export interface ServiceWorkerAPI {
  register: () => Promise<boolean>;
  unregister: () => Promise<boolean>;
  scheduleSync: () => Promise<boolean>;
  isSupported: () => boolean;
}

class ServiceWorkerManager implements ServiceWorkerAPI {
  private registration: ServiceWorkerRegistration | null = null;
  private isRegistered = false;

  /**
   * Check if service workers are supported
   */
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype;
  }

  /**
   * Register the service worker
   */
  async register(): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn('Service workers or background sync not supported');
      return false;
    }

    if (this.isRegistered && this.registration) {
      return true;
    }

    try {
      console.log('Registering offline sync service worker...');
      
      this.registration = await navigator.serviceWorker.register(
        '/sw.js',
        { scope: '/' }
      );

      console.log('Service worker registered:', this.registration);

      // Listen for service worker updates
      this.registration.addEventListener('updatefound', () => {
        console.log('Service worker update found');
        const newWorker = this.registration!.installing;
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New service worker installed, ready to use');
              // Notify user about update with toast or modal
              this.notifyUpdate();
            }
          });
        }
      });

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
      console.log('Service worker is ready');

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage);

      this.isRegistered = true;
      return true;
    } catch (error) {
      console.error('Service worker registration failed:', error);
      return false;
    }
  }

  /**
   * Unregister the service worker
   */
  async unregister(): Promise<boolean> {
    if (!this.registration) {
      return true;
    }

    try {
      const success = await this.registration.unregister();
      console.log('Service worker unregistered:', success);
      
      this.registration = null;
      this.isRegistered = false;
      
      return success;
    } catch (error) {
      console.error('Service worker unregistration failed:', error);
      return false;
    }
  }

  /**
   * Schedule background sync
   */
  async scheduleSync(): Promise<boolean> {
    if (!this.registration) {
      console.warn('Service worker not registered, cannot schedule sync');
      return false;
    }

    if (!('sync' in this.registration)) {
      console.warn('Background sync not supported');
      return false;
    }

    try {
      await this.registration.sync.register('background-sync-workouts');
      console.log('Background sync scheduled');
      return true;
    } catch (error) {
      console.error('Failed to schedule background sync:', error);
      return false;
    }
  }

  /**
   * Send message to service worker
   */
  async sendMessage(message: any): Promise<any> {
    if (!navigator.serviceWorker.controller) {
      throw new Error('No active service worker');
    }

    return new Promise((resolve, reject) => {
      const channel = new MessageChannel();
      
      channel.port1.onmessage = (event) => {
        if (event.data.error) {
          reject(new Error(event.data.error));
        } else {
          resolve(event.data);
        }
      };

      navigator.serviceWorker.controller.postMessage(message, [channel.port2]);

      // Timeout after 10 seconds
      setTimeout(() => {
        reject(new Error('Service worker message timeout'));
      }, 10000);
    });
  }

  /**
   * Handle messages from service worker
   */
  private handleServiceWorkerMessage = (event: MessageEvent) => {
    const { type, data } = event.data;
    console.log('Service worker message:', type, data);

    switch (type) {
      case 'sync-completed':
        this.notifySync('completed');
        break;
      case 'sync-failed':
        this.notifySync('failed', data);
        break;
      case 'sync-progress':
        this.notifySync('progress', data);
        break;
      default:
        console.log('Unknown service worker message:', type);
    }
  };

  /**
   * Notify about sync status
   */
  private notifySync(status: 'completed' | 'failed' | 'progress', data?: any) {
    // Dispatch custom event for components to listen to
    window.dispatchEvent(new CustomEvent('sw-sync-status', {
      detail: { status, data }
    }));
  }

  /**
   * Notify about service worker update
   */
  private notifyUpdate() {
    window.dispatchEvent(new CustomEvent('sw-update-available', {
      detail: { 
        registration: this.registration,
        message: 'A new version of Hockey Hub is available. Please refresh to update.'
      }
    }));
  }

  /**
   * Skip waiting and activate new service worker
   */
  async skipWaiting(): Promise<void> {
    if (!this.registration?.waiting) {
      return;
    }

    // Tell the waiting service worker to skip waiting
    this.registration.waiting.postMessage({ type: 'skip-waiting' });

    // Reload the page once the new service worker is activated
    await new Promise<void>((resolve) => {
      const onControllerChange = () => {
        navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
        resolve();
      };
      navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    });

    window.location.reload();
  }

  /**
   * Cache specific URLs for offline access
   */
  async cacheUrls(urls: string[]): Promise<boolean> {
    if (!navigator.serviceWorker.controller) {
      console.warn('No active service worker to cache URLs');
      return false;
    }

    try {
      const response = await this.sendMessage({
        type: 'cache-urls',
        urls
      });
      return response.success;
    } catch (error) {
      console.error('Failed to cache URLs:', error);
      return false;
    }
  }

  /**
   * Clear all caches
   */
  async clearAllCaches(): Promise<boolean> {
    if (!navigator.serviceWorker.controller) {
      console.warn('No active service worker to clear caches');
      return false;
    }

    try {
      const response = await this.sendMessage({
        type: 'clear-cache'
      });
      return response.success;
    } catch (error) {
      console.error('Failed to clear caches:', error);
      return false;
    }
  }

  /**
   * Get registration status
   */
  getRegistration(): ServiceWorkerRegistration | null {
    return this.registration;
  }

  /**
   * Check if registered
   */
  getIsRegistered(): boolean {
    return this.isRegistered;
  }
}

// Create singleton instance
export const serviceWorker = new ServiceWorkerManager();

// Hook for React components
export function useServiceWorker() {
  const [isRegistered, setIsRegistered] = React.useState(serviceWorker.getIsRegistered());
  const [isSupported, setIsSupported] = React.useState(serviceWorker.isSupported());
  const [isUpdateAvailable, setIsUpdateAvailable] = React.useState(false);
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    // Register service worker on mount
    serviceWorker.register().then(setIsRegistered);

    // Listen for sync status updates
    const handleSyncStatus = (event: CustomEvent) => {
      console.log('Sync status update:', event.detail);
      // You can add toast notifications here
    };

    const handleUpdateAvailable = (event: CustomEvent) => {
      console.log('Service worker update available:', event.detail.message);
      setIsUpdateAvailable(true);
      // You can show update notification here
    };

    // Listen for online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('sw-sync-status', handleSyncStatus as EventListener);
    window.addEventListener('sw-update-available', handleUpdateAvailable as EventListener);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('sw-sync-status', handleSyncStatus as EventListener);
      window.removeEventListener('sw-update-available', handleUpdateAvailable as EventListener);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isRegistered,
    isSupported,
    isUpdateAvailable,
    isOnline,
    scheduleSync: serviceWorker.scheduleSync.bind(serviceWorker),
    sendMessage: serviceWorker.sendMessage.bind(serviceWorker),
    skipWaiting: serviceWorker.skipWaiting.bind(serviceWorker),
    cacheUrls: serviceWorker.cacheUrls.bind(serviceWorker),
    clearAllCaches: serviceWorker.clearAllCaches.bind(serviceWorker),
  };
}

// Auto-register service worker in production
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  // Register service worker after page load
  window.addEventListener('load', () => {
    serviceWorker.register();
  });
}

export default serviceWorker;