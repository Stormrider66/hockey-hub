// Service Worker for Background Sync
const CACHE_NAME = 'hockey-hub-offline-v1';
const SYNC_TAG = 'background-sync-workouts';

// Install event
self.addEventListener('install', (event) => {
  console.log('Offline sync worker installed');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Offline sync worker activated');
  event.waitUntil(self.clients.claim());
});

// Background sync event
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === SYNC_TAG) {
    event.waitUntil(syncOfflineData());
  }
});

// Sync offline data
async function syncOfflineData() {
  try {
    console.log('Starting background sync...');
    
    // Get offline queue from localStorage
    const offlineQueue = await getOfflineQueue();
    
    if (!offlineQueue || offlineQueue.length === 0) {
      console.log('No offline data to sync');
      return;
    }
    
    console.log(`Syncing ${offlineQueue.length} offline items`);
    
    // Process each queued item
    for (const item of offlineQueue) {
      if (item.status !== 'pending') continue;
      
      try {
        await processQueueItem(item);
        await markItemCompleted(item.id);
        console.log(`Synced item: ${item.id}`);
      } catch (error) {
        console.error(`Failed to sync item ${item.id}:`, error);
        await markItemFailed(item.id, error.message);
      }
    }
    
    // Notify clients of sync completion
    await notifyClients('sync-completed');
    
  } catch (error) {
    console.error('Background sync failed:', error);
    await notifyClients('sync-failed', error.message);
  }
}

// Get offline queue from storage
async function getOfflineQueue() {
  try {
    // Open IndexedDB connection
    const db = await openDB();
    const transaction = db.transaction(['queue'], 'readonly');
    const store = transaction.objectStore('queue');
    return await getAllFromStore(store);
  } catch (error) {
    console.error('Failed to get offline queue:', error);
    return [];
  }
}

// Process individual queue item
async function processQueueItem(item) {
  const { type, action, data } = item;
  
  let url;
  let method;
  
  // Determine API endpoint and method
  switch (type) {
    case 'workout':
      if (action === 'create') {
        url = '/api/training/sessions';
        method = 'POST';
      } else if (action === 'update') {
        url = `/api/training/sessions/${data.id}`;
        method = 'PUT';
      } else if (action === 'delete') {
        url = `/api/training/sessions/${data.id}`;
        method = 'DELETE';
      }
      break;
    case 'session':
      if (action === 'create') {
        url = '/api/training/sessions';
        method = 'POST';
      } else if (action === 'update') {
        url = `/api/training/sessions/${data.id}`;
        method = 'PUT';
      }
      break;
    default:
      throw new Error(`Unknown sync type: ${type}`);
  }
  
  if (!url) {
    throw new Error(`No URL defined for ${type}:${action}`);
  }
  
  // Make API request
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      // Add auth header if available
      'Authorization': await getAuthHeader(),
    },
    body: method !== 'DELETE' ? JSON.stringify(data) : undefined,
  });
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

// Get auth header from storage
async function getAuthHeader() {
  try {
    // Try to get from localStorage via client
    const clients = await self.clients.matchAll();
    if (clients.length > 0) {
      const response = await sendMessageToClient(clients[0], { 
        type: 'get-auth-token' 
      });
      return response ? `Bearer ${response.token}` : '';
    }
    return '';
  } catch (error) {
    console.error('Failed to get auth header:', error);
    return '';
  }
}

// Mark item as completed
async function markItemCompleted(itemId) {
  try {
    const db = await openDB();
    const transaction = db.transaction(['queue'], 'readwrite');
    const store = transaction.objectStore('queue');
    await store.delete(itemId);
  } catch (error) {
    console.error('Failed to mark item completed:', error);
  }
}

// Mark item as failed
async function markItemFailed(itemId, errorMessage) {
  try {
    const db = await openDB();
    const transaction = db.transaction(['queue'], 'readwrite');
    const store = transaction.objectStore('queue');
    
    const item = await store.get(itemId);
    if (item) {
      item.status = 'failed';
      item.error = errorMessage;
      item.retryCount = (item.retryCount || 0) + 1;
      await store.put(item);
    }
  } catch (error) {
    console.error('Failed to mark item failed:', error);
  }
}

// Open IndexedDB connection
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('HockeyHubOffline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('queue')) {
        const store = db.createObjectStore('queue', { keyPath: 'id' });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

// Get all items from IndexedDB store
function getAllFromStore(store) {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Send message to client
function sendMessageToClient(client, message) {
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    
    channel.port1.onmessage = (event) => {
      resolve(event.data);
    };
    
    client.postMessage(message, [channel.port2]);
    
    // Timeout after 5 seconds
    setTimeout(() => resolve(null), 5000);
  });
}

// Notify all clients
async function notifyClients(type, data = null) {
  const clients = await self.clients.matchAll();
  
  clients.forEach(client => {
    client.postMessage({
      type,
      data
    });
  });
}

// Listen for messages from clients
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'schedule-sync':
      // Schedule background sync
      self.registration.sync.register(SYNC_TAG)
        .then(() => {
          event.ports[0]?.postMessage({ success: true });
        })
        .catch(error => {
          event.ports[0]?.postMessage({ success: false, error: error.message });
        });
      break;
      
    case 'get-auth-token':
      // Return auth token from localStorage
      // This would need to be implemented based on your auth system
      event.ports[0]?.postMessage({ token: null });
      break;
      
    default:
      console.log('Unknown message type:', type);
  }
});