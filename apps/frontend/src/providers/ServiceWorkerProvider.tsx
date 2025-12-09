import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

interface ServiceWorkerContextType {
  isOffline: boolean;
  updateAvailable: boolean;
  skipWaiting: () => void;
  syncQueue: () => Promise<void>;
  registration: ServiceWorkerRegistration | null;
}

const ServiceWorkerContext = createContext<ServiceWorkerContextType>({
  isOffline: false,
  updateAvailable: false,
  skipWaiting: () => {},
  syncQueue: async () => {},
  registration: null,
});

export const useServiceWorker = () => useContext(ServiceWorkerContext);

interface ServiceWorkerProviderProps {
  children: React.ReactNode;
}

export const ServiceWorkerProvider: React.FC<ServiceWorkerProviderProps> = ({ children }) => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          setRegistration(reg);

          // Check for updates periodically
          setInterval(() => {
            reg.update();
          }, 60 * 60 * 1000); // Every hour

          // Listen for updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });

      // Listen for controller changes
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }

    // Listen for online/offline events
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const skipWaiting = useCallback(() => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }, [registration]);

  const syncQueue = useCallback(async () => {
    if ('sync' in registration!) {
      try {
        await (registration as any).sync.register('sync-queue');
      } catch (error) {
        // Fallback to manual sync
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({ type: 'SYNC_QUEUE' });
        }
      }
    }
  }, [registration]);

  return (
    <ServiceWorkerContext.Provider
      value={{
        isOffline,
        updateAvailable,
        skipWaiting,
        syncQueue,
        registration,
      }}
    >
      {children}
    </ServiceWorkerContext.Provider>
  );
};