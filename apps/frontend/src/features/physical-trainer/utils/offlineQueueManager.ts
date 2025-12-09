interface QueuedUpdate {
  id: string;
  timestamp: string;
  type: 'workout_update';
  data: any;
  retryCount: number;
}

const STORAGE_KEY = 'workout_broadcast_queue';
const MAX_QUEUE_SIZE = 50;
const MAX_RETRY_COUNT = 3;

export class OfflineQueueManager {
  private queue: QueuedUpdate[] = [];
  
  constructor() {
    this.loadQueue();
  }
  
  private loadQueue() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
        // Clean up old entries (older than 24 hours)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        this.queue = this.queue.filter(item => item.timestamp > oneDayAgo);
        this.saveQueue();
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
      this.queue = [];
    }
  }
  
  private saveQueue() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }
  
  public addToQueue(data: any) {
    const update: QueuedUpdate = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      type: 'workout_update',
      data,
      retryCount: 0
    };
    
    this.queue.push(update);
    
    // Maintain queue size limit
    if (this.queue.length > MAX_QUEUE_SIZE) {
      this.queue = this.queue.slice(-MAX_QUEUE_SIZE);
    }
    
    this.saveQueue();
  }
  
  public getQueue(): QueuedUpdate[] {
    return [...this.queue];
  }
  
  public markAsSent(ids: string[]) {
    this.queue = this.queue.filter(item => !ids.includes(item.id));
    this.saveQueue();
  }
  
  public incrementRetryCount(id: string) {
    const item = this.queue.find(item => item.id === id);
    if (item) {
      item.retryCount++;
      if (item.retryCount >= MAX_RETRY_COUNT) {
        // Remove items that have been retried too many times
        this.queue = this.queue.filter(item => item.id !== id);
      }
      this.saveQueue();
    }
  }
  
  public clear() {
    this.queue = [];
    this.saveQueue();
  }
  
  public getQueueSize(): number {
    return this.queue.length;
  }
}