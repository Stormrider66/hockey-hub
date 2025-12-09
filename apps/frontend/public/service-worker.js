// Service Worker for Hockey Hub Push Notifications

const CACHE_NAME = 'hockey-hub-v1';
const urlsToCache = [
  '/',
  '/notifications',
];

// Install Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Handle Push Notifications
self.addEventListener('push', event => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.message || data.body,
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/badge-72x72.png',
    vibrate: data.vibrate || [200, 100, 200],
    data: {
      notificationId: data.id,
      url: data.action_url || data.url || '/',
      ...data.data
    },
    actions: data.actions || [
      {
        action: 'view',
        title: 'View',
        icon: '/icons/check.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/cross.png'
      }
    ],
    tag: data.tag || data.id,
    renotify: data.renotify || false,
    requireInteraction: data.priority === 'urgent' || data.priority === 'high',
    silent: data.silent || false,
    timestamp: data.timestamp || Date.now()
  };

  // Add image if provided
  if (data.image) {
    options.image = data.image;
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle Notification Clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();

  const notificationData = event.notification.data;
  let targetUrl = notificationData.url || '/';

  if (event.action === 'view') {
    targetUrl = notificationData.url || '/notifications';
  } else if (event.action === 'dismiss') {
    // Just close the notification
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Check if there's already a window/tab open
        for (const client of clientList) {
          if (client.url === targetUrl && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window if no existing window found
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

// Background Sync for failed notifications
self.addEventListener('sync', event => {
  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications());
  }
});

async function syncNotifications() {
  try {
    const cache = await caches.open('notification-queue');
    const requests = await cache.keys();
    
    for (const request of requests) {
      try {
        const response = await fetch(request);
        if (response.ok) {
          await cache.delete(request);
        }
      } catch (error) {
        console.error('Failed to sync notification:', error);
      }
    }
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

// Handle messages from the app
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'NOTIFICATION_READ') {
    // Handle marking notification as read
    const notificationId = event.data.notificationId;
    // Could update badge count or perform other actions
  }
});