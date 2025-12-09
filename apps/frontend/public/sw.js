// Hockey Hub Progressive Web App Service Worker
// Version 3.0.0 - Enhanced Physical Trainer Offline Support

const CACHE_VERSION = 'v3';
const CACHE_PREFIX = 'hockey-hub-';
const STATIC_CACHE = `${CACHE_PREFIX}static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `${CACHE_PREFIX}dynamic-${CACHE_VERSION}`;
const API_CACHE = `${CACHE_PREFIX}api-${CACHE_VERSION}`;
const IMAGE_CACHE = `${CACHE_PREFIX}images-${CACHE_VERSION}`;
const WORKOUT_CACHE = `${CACHE_PREFIX}workouts-${CACHE_VERSION}`;
const TEMPLATE_CACHE = `${CACHE_PREFIX}templates-${CACHE_VERSION}`;

// Cache configuration
const CACHE_CONFIG = {
  static: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    maxEntries: 100
  },
  dynamic: {
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    maxEntries: 50
  },
  api: {
    maxAge: 5 * 60 * 1000, // 5 minutes
    maxEntries: 100
  },
  images: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxEntries: 50
  },
  workouts: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxEntries: 200
  },
  templates: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    maxEntries: 100
  }
};

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/offline/player',
  '/offline/coach',
  '/offline/physicaltrainer',
  '/physicaltrainer',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Physical Trainer specific assets
  '/locales/en/physicalTrainer.json',
  '/locales/en/common.json'
];

// API endpoints patterns for caching
const API_PATTERNS = [
  /\/api\/users\/profile/,
  /\/api\/training\/sessions/,
  /\/api\/calendar\/events/,
  /\/api\/communication\/messages/,
  /\/api\/statistics\/player/,
  // Physical Trainer specific endpoints
  /\/api\/training\/exercises/,
  /\/api\/training\/workouts/,
  /\/api\/training\/templates/,
  /\/api\/training\/players/,
  /\/api\/training\/teams/,
  /\/api\/medical\/reports/,
  /\/api\/medical\/restrictions/
];

// Workout-specific patterns that need special handling
const WORKOUT_PATTERNS = [
  /\/api\/training\/workouts\/\d+$/,
  /\/api\/training\/sessions\/\d+$/,
  /\/api\/training\/templates\/\d+$/
];

// Template patterns for long-term caching
const TEMPLATE_PATTERNS = [
  /\/api\/training\/templates$/,
  /\/api\/training\/exercises$/,
  /\/api\/training\/equipment$/
];

// Install event - Cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Pre-caching static assets');
        return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })));
      })
      .then(() => {
        console.log('[SW] Service worker installed successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] Installation failed:', error);
      })
  );
});

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => {
              return cacheName.startsWith(CACHE_PREFIX) && 
                     ![STATIC_CACHE, DYNAMIC_CACHE, API_CACHE, IMAGE_CACHE].includes(cacheName);
            })
            .map(cacheName => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated successfully');
        // Pre-cache important Physical Trainer resources
        return cachePhysicalTrainerResources();
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// Fetch event - Implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle different types of requests with appropriate strategies
  if (url.pathname.startsWith('/api/')) {
    // Check if it's a workout/template request
    if (WORKOUT_PATTERNS.some(pattern => pattern.test(url.pathname))) {
      event.respondWith(handleWorkoutRequest(request));
    } else if (TEMPLATE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
      event.respondWith(handleTemplateRequest(request));
    } else {
      event.respondWith(handleApiRequest(request));
    }
  } else if (request.destination === 'image') {
    event.respondWith(handleImageRequest(request));
  } else if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(handleHtmlRequest(request));
  } else {
    event.respondWith(handleStaticRequest(request));
  }
});

// API requests - Network first, falling back to cache
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      cache.put(request, responseToCache);
      cleanupCache(API_CACHE, CACHE_CONFIG.api);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network request failed, trying cache:', request.url);
    
    // Try cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      // Add header to indicate stale data
      const headers = new Headers(cachedResponse.headers);
      headers.set('X-SW-Cache', 'stale');
      
      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers
      });
    }
    
    // Return offline response
    return createOfflineApiResponse(request);
  }
}

// Image requests - Cache first, falling back to network
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE);
  
  // Try cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    // Fetch in background to update cache (stale-while-revalidate)
    fetchAndCache(request, IMAGE_CACHE).catch(() => {});
    return cachedResponse;
  }
  
  // Try network
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      cache.put(request, responseToCache);
      cleanupCache(IMAGE_CACHE, CACHE_CONFIG.images);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Failed to fetch image:', request.url);
    // Return placeholder image
    return fetch('/images/placeholder.png');
  }
}

// HTML requests - Network first, falling back to offline page
async function handleHtmlRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      cache.put(request, responseToCache);
      cleanupCache(DYNAMIC_CACHE, CACHE_CONFIG.dynamic);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network request failed, checking cache:', request.url);
    
    // Try cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return appropriate offline page
    return routeToOfflinePage(request);
  }
}

// Static assets - Cache first with background update
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE);
  
  // Try cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    // Update cache in background
    fetchAndCache(request, STATIC_CACHE).catch(() => {});
    return cachedResponse;
  }
  
  // Try network
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      cache.put(request, responseToCache);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Failed to fetch static asset:', request.url);
    return new Response('Offline', { status: 503 });
  }
}

// Background fetch and cache
async function fetchAndCache(request, cacheName) {
  const cache = await caches.open(cacheName);
  const response = await fetch(request);
  
  if (response.ok) {
    await cache.put(request, response.clone());
  }
  
  return response;
}

// Route to appropriate offline page
async function routeToOfflinePage(request) {
  const url = new URL(request.url);
  const cache = await caches.open(STATIC_CACHE);
  
  // Determine which offline page to serve
  let offlinePage = '/offline';
  
  if (url.pathname.startsWith('/player')) {
    offlinePage = '/offline/player';
  } else if (url.pathname.startsWith('/coach')) {
    offlinePage = '/offline/coach';
  } else if (url.pathname.startsWith('/physicaltrainer')) {
    offlinePage = '/offline/physicaltrainer';
  }
  
  const cachedOfflinePage = await cache.match(offlinePage);
  if (cachedOfflinePage) {
    return cachedOfflinePage;
  }
  
  // Fallback offline response
  return new Response(
    `<!DOCTYPE html>
    <html>
      <head>
        <title>Offline - Hockey Hub</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: #f5f5f5;
          }
          .offline-container {
            text-align: center;
            padding: 2rem;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            max-width: 400px;
          }
          h1 { color: #333; margin-bottom: 1rem; }
          p { color: #666; margin-bottom: 1.5rem; }
          button {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 4px;
            font-size: 1rem;
            cursor: pointer;
          }
          button:hover { background: #2563eb; }
        </style>
      </head>
      <body>
        <div class="offline-container">
          <h1>You're Offline</h1>
          <p>Please check your internet connection and try again.</p>
          <button onclick="location.reload()">Retry</button>
        </div>
      </body>
    </html>`,
    {
      status: 503,
      headers: { 'Content-Type': 'text/html' }
    }
  );
}

// Create offline API response
function createOfflineApiResponse(request) {
  const url = new URL(request.url);
  const response = {
    error: 'offline',
    message: 'You are currently offline. This data will be synced when you reconnect.',
    timestamp: new Date().toISOString()
  };
  
  return new Response(JSON.stringify(response), {
    status: 503,
    headers: {
      'Content-Type': 'application/json',
      'X-SW-Cache': 'offline'
    }
  });
}

// Cleanup old cache entries
async function cleanupCache(cacheName, config) {
  const cache = await caches.open(cacheName);
  const requests = await cache.keys();
  const now = Date.now();
  
  // Sort by age (if we stored timestamps)
  const deletionPromises = requests
    .slice(config.maxEntries)
    .map(request => cache.delete(request));
  
  await Promise.all(deletionPromises);
}

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-api-requests') {
    event.waitUntil(syncApiRequests());
  } else if (event.tag === 'background-sync-workouts') {
    event.waitUntil(syncWorkoutQueue());
  } else if (event.tag.startsWith('sync-workout-')) {
    const workoutId = event.tag.replace('sync-workout-', '');
    event.waitUntil(syncSpecificWorkout(workoutId));
  }
});

// Sync queued API requests
async function syncApiRequests() {
  const db = await openIndexedDB();
  const tx = db.transaction(['sync-queue'], 'readonly');
  const store = tx.objectStore('sync-queue');
  const requests = await getAllFromStore(store);
  
  console.log(`[SW] Syncing ${requests.length} queued requests`);
  
  for (const queuedRequest of requests) {
    try {
      const response = await fetch(queuedRequest.request);
      
      if (response.ok) {
        // Remove from queue
        await removeFromQueue(queuedRequest.id);
        
        // Notify clients
        await notifyClients('sync-success', {
          id: queuedRequest.id,
          url: queuedRequest.request.url
        });
      }
    } catch (error) {
      console.error('[SW] Sync failed for:', queuedRequest.request.url, error);
    }
  }
}

// IndexedDB helpers
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('hockey-hub-sync', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('sync-queue')) {
        db.createObjectStore('sync-queue', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

function getAllFromStore(store) {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function removeFromQueue(id) {
  const db = await openIndexedDB();
  const tx = db.transaction(['sync-queue'], 'readwrite');
  const store = tx.objectStore('sync-queue');
  await store.delete(id);
}

// Notify all clients
async function notifyClients(type, data = null) {
  const clients = await self.clients.matchAll({ includeUncontrolled: true });
  
  clients.forEach(client => {
    client.postMessage({
      type: `sw-${type}`,
      data
    });
  });
}

// Listen for messages from clients
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'skip-waiting':
      self.skipWaiting();
      break;
      
    case 'clear-cache':
      event.waitUntil(
        caches.keys()
          .then(cacheNames => Promise.all(
            cacheNames
              .filter(name => name.startsWith(CACHE_PREFIX))
              .map(name => caches.delete(name))
          ))
          .then(() => {
            event.ports[0]?.postMessage({ success: true });
          })
      );
      break;
      
    case 'cache-urls':
      event.waitUntil(
        cacheUrls(data.urls, data.cacheName || DYNAMIC_CACHE)
          .then(() => {
            event.ports[0]?.postMessage({ success: true });
          })
          .catch(error => {
            event.ports[0]?.postMessage({ success: false, error: error.message });
          })
      );
      break;
  }
});

// Cache specific URLs on demand
async function cacheUrls(urls, cacheName) {
  const cache = await caches.open(cacheName);
  return cache.addAll(urls);
}

// Push notification support
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Hockey Hub', {
        body: data.body || 'You have a new notification',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        data: data.data,
        actions: data.actions || []
      })
    );
  }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const data = event.notification.data || {};
  const url = data.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        // Check if there's already a window/tab open
        for (const client of windowClients) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window if no existing window found
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

console.log('[SW] Service worker loaded successfully');