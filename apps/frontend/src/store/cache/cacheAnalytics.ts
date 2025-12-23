// Types only used internally, no need for external imports
import { safeLocalStorage } from '@/utils/safeStorage';

export interface CacheMetrics {
  hits: number;
  misses: number;
  updates: number;
  evictions: number;
  avgResponseTime: number;
  avgCacheTime: number;
  totalTimeSaved: number;
  lastUpdated: number;
}

export interface EndpointMetrics extends CacheMetrics {
  endpoint: string;
  slice: string;
  hitRate: number;
  cacheSize: number;
  avgPayloadSize: number;
  lastAccessed: number;
}

export interface CacheAnalytics {
  global: CacheMetrics;
  byEndpoint: Record<string, EndpointMetrics>;
  bySlice: Record<string, CacheMetrics>;
  topEndpoints: EndpointMetrics[];
  lowPerformingEndpoints: EndpointMetrics[];
  timeline: TimelineEntry[];
}

export interface TimelineEntry {
  timestamp: number;
  event: 'hit' | 'miss' | 'update' | 'eviction';
  endpoint: string;
  slice: string;
  responseTime?: number;
  cacheTime?: number;
  payloadSize?: number;
}

class CacheAnalyticsManager {
  private static instance: CacheAnalyticsManager;
  private analytics: CacheAnalytics;
  private readonly MAX_TIMELINE_ENTRIES = 10000;
  private readonly ANALYTICS_STORAGE_KEY = 'hockey-hub-cache-analytics';
  private saveDebounceTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.analytics = this.loadAnalytics();
    this.startPeriodicSave();
  }

  static getInstance(): CacheAnalyticsManager {
    if (!CacheAnalyticsManager.instance) {
      CacheAnalyticsManager.instance = new CacheAnalyticsManager();
    }
    return CacheAnalyticsManager.instance;
  }

  private loadAnalytics(): CacheAnalytics {
    try {
      const stored = safeLocalStorage.getItem(this.ANALYTICS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate and migrate if needed
        return this.validateAnalytics(parsed);
      }
    } catch (error) {
      console.error('Failed to load cache analytics:', error);
    }

    return this.createEmptyAnalytics();
  }

  private createEmptyAnalytics(): CacheAnalytics {
    return {
      global: this.createEmptyMetrics(),
      byEndpoint: {},
      bySlice: {},
      topEndpoints: [],
      lowPerformingEndpoints: [],
      timeline: []
    };
  }

  private createEmptyMetrics(): CacheMetrics {
    return {
      hits: 0,
      misses: 0,
      updates: 0,
      evictions: 0,
      avgResponseTime: 0,
      avgCacheTime: 0,
      totalTimeSaved: 0,
      lastUpdated: Date.now()
    };
  }

  private validateAnalytics(data: any): CacheAnalytics {
    // Basic validation and migration logic
    if (!data.global || !data.byEndpoint || !data.bySlice) {
      return this.createEmptyAnalytics();
    }
    return data;
  }

  recordCacheHit(
    endpoint: string,
    slice: string,
    cacheTime: number,
    payloadSize: number = 0
  ): void {
    const now = Date.now();
    
    // Update global metrics
    this.analytics.global.hits++;
    this.updateAverageTime('cache', cacheTime);
    this.analytics.global.lastUpdated = now;

    // Update endpoint metrics
    this.updateEndpointMetrics(endpoint, slice, 'hit', cacheTime, payloadSize);

    // Update slice metrics
    this.updateSliceMetrics(slice, 'hit');

    // Add to timeline
    this.addTimelineEntry({
      timestamp: now,
      event: 'hit',
      endpoint,
      slice,
      cacheTime,
      payloadSize
    });

    this.scheduleSave();
  }

  recordCacheMiss(
    endpoint: string,
    slice: string,
    responseTime: number,
    payloadSize: number = 0
  ): void {
    const now = Date.now();
    
    // Update global metrics
    this.analytics.global.misses++;
    this.updateAverageTime('response', responseTime);
    this.analytics.global.lastUpdated = now;

    // Update endpoint metrics
    this.updateEndpointMetrics(endpoint, slice, 'miss', responseTime, payloadSize);

    // Update slice metrics
    this.updateSliceMetrics(slice, 'miss');

    // Add to timeline
    this.addTimelineEntry({
      timestamp: now,
      event: 'miss',
      endpoint,
      slice,
      responseTime,
      payloadSize
    });

    this.scheduleSave();
  }

  recordCacheUpdate(endpoint: string, slice: string): void {
    const now = Date.now();
    
    this.analytics.global.updates++;
    this.analytics.global.lastUpdated = now;

    this.updateEndpointMetrics(endpoint, slice, 'update');
    this.updateSliceMetrics(slice, 'update');

    this.addTimelineEntry({
      timestamp: now,
      event: 'update',
      endpoint,
      slice
    });

    this.scheduleSave();
  }

  recordCacheEviction(endpoint: string, slice: string): void {
    const now = Date.now();
    
    this.analytics.global.evictions++;
    this.analytics.global.lastUpdated = now;

    this.updateEndpointMetrics(endpoint, slice, 'eviction');
    this.updateSliceMetrics(slice, 'eviction');

    this.addTimelineEntry({
      timestamp: now,
      event: 'eviction',
      endpoint,
      slice
    });

    this.scheduleSave();
  }

  private updateEndpointMetrics(
    endpoint: string,
    slice: string,
    event: 'hit' | 'miss' | 'update' | 'eviction',
    time?: number,
    payloadSize?: number
  ): void {
    const key = `${slice}:${endpoint}`;
    
    if (!this.analytics.byEndpoint[key]) {
      this.analytics.byEndpoint[key] = {
        ...this.createEmptyMetrics(),
        endpoint,
        slice,
        hitRate: 0,
        cacheSize: 0,
        avgPayloadSize: 0,
        lastAccessed: Date.now()
      };
    }

    const metrics = this.analytics.byEndpoint[key];
    metrics.lastAccessed = Date.now();

    switch (event) {
      case 'hit':
        metrics.hits++;
        if (time !== undefined) {
          metrics.avgCacheTime = this.calculateRunningAverage(
            metrics.avgCacheTime,
            time,
            metrics.hits
          );
          metrics.totalTimeSaved += time;
        }
        break;
      case 'miss':
        metrics.misses++;
        if (time !== undefined) {
          metrics.avgResponseTime = this.calculateRunningAverage(
            metrics.avgResponseTime,
            time,
            metrics.misses
          );
        }
        break;
      case 'update':
        metrics.updates++;
        break;
      case 'eviction':
        metrics.evictions++;
        break;
    }

    // Update hit rate
    const total = metrics.hits + metrics.misses;
    metrics.hitRate = total > 0 ? (metrics.hits / total) * 100 : 0;

    // Update payload size
    if (payloadSize !== undefined && payloadSize > 0) {
      const totalRequests = metrics.hits + metrics.misses;
      metrics.avgPayloadSize = this.calculateRunningAverage(
        metrics.avgPayloadSize,
        payloadSize,
        totalRequests
      );
      metrics.cacheSize = Math.max(metrics.cacheSize, payloadSize);
    }

    this.updateTopEndpoints();
  }

  private updateSliceMetrics(
    slice: string,
    event: 'hit' | 'miss' | 'update' | 'eviction'
  ): void {
    if (!this.analytics.bySlice[slice]) {
      this.analytics.bySlice[slice] = this.createEmptyMetrics();
    }

    const metrics = this.analytics.bySlice[slice];
    
    switch (event) {
      case 'hit':
        metrics.hits++;
        break;
      case 'miss':
        metrics.misses++;
        break;
      case 'update':
        metrics.updates++;
        break;
      case 'eviction':
        metrics.evictions++;
        break;
    }

    metrics.lastUpdated = Date.now();
  }

  private updateAverageTime(type: 'response' | 'cache', time: number): void {
    if (type === 'response') {
      const total = this.analytics.global.misses;
      this.analytics.global.avgResponseTime = this.calculateRunningAverage(
        this.analytics.global.avgResponseTime,
        time,
        total
      );
    } else {
      const total = this.analytics.global.hits;
      this.analytics.global.avgCacheTime = this.calculateRunningAverage(
        this.analytics.global.avgCacheTime,
        time,
        total
      );
      this.analytics.global.totalTimeSaved += time;
    }
  }

  private calculateRunningAverage(
    currentAvg: number,
    newValue: number,
    count: number
  ): number {
    if (count === 0) return newValue;
    return (currentAvg * (count - 1) + newValue) / count;
  }

  private addTimelineEntry(entry: TimelineEntry): void {
    this.analytics.timeline.push(entry);
    
    // Keep timeline size manageable
    if (this.analytics.timeline.length > this.MAX_TIMELINE_ENTRIES) {
      this.analytics.timeline = this.analytics.timeline.slice(-this.MAX_TIMELINE_ENTRIES);
    }
  }

  private updateTopEndpoints(): void {
    const endpoints = Object.values(this.analytics.byEndpoint);
    
    // Sort by hit rate (descending)
    this.analytics.topEndpoints = endpoints
      .sort((a, b) => b.hitRate - a.hitRate)
      .slice(0, 10);
    
    // Sort by hit rate (ascending) for low performing
    this.analytics.lowPerformingEndpoints = endpoints
      .filter(e => e.hits + e.misses > 10) // Only include endpoints with enough data
      .sort((a, b) => a.hitRate - b.hitRate)
      .slice(0, 10);
  }

  getAnalytics(): CacheAnalytics {
    return { ...this.analytics };
  }

  getGlobalMetrics(): CacheMetrics {
    return { ...this.analytics.global };
  }

  getEndpointMetrics(endpoint: string, slice: string): EndpointMetrics | null {
    const key = `${slice}:${endpoint}`;
    return this.analytics.byEndpoint[key] || null;
  }

  getSliceMetrics(slice: string): CacheMetrics | null {
    return this.analytics.bySlice[slice] || null;
  }

  getTimeline(
    startTime?: number,
    endTime?: number,
    slice?: string,
    endpoint?: string
  ): TimelineEntry[] {
    let entries = [...this.analytics.timeline];
    
    if (startTime) {
      entries = entries.filter(e => e.timestamp >= startTime);
    }
    
    if (endTime) {
      entries = entries.filter(e => e.timestamp <= endTime);
    }
    
    if (slice) {
      entries = entries.filter(e => e.slice === slice);
    }
    
    if (endpoint) {
      entries = entries.filter(e => e.endpoint === endpoint);
    }
    
    return entries;
  }

  getCacheSummary(): {
    totalHits: number;
    totalMisses: number;
    overallHitRate: number;
    totalTimeSaved: number;
    estimatedCacheSize: number;
  } {
    const { hits, misses, totalTimeSaved } = this.analytics.global;
    const total = hits + misses;
    const overallHitRate = total > 0 ? (hits / total) * 100 : 0;
    
    // Estimate total cache size
    const estimatedCacheSize = Object.values(this.analytics.byEndpoint)
      .reduce((sum, metrics) => sum + metrics.cacheSize, 0);
    
    return {
      totalHits: hits,
      totalMisses: misses,
      overallHitRate,
      totalTimeSaved,
      estimatedCacheSize
    };
  }

  reset(): void {
    this.analytics = this.createEmptyAnalytics();
    this.save();
  }

  private scheduleSave(): void {
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
    }
    
    this.saveDebounceTimer = setTimeout(() => {
      this.save();
    }, 5000); // Save after 5 seconds of inactivity
  }

  private save(): void {
    try {
      safeLocalStorage.setItem(
        this.ANALYTICS_STORAGE_KEY,
        JSON.stringify(this.analytics)
      );
    } catch (error) {
      console.error('Failed to save cache analytics:', error);
    }
  }

  private startPeriodicSave(): void {
    // Only start periodic save in browser environment
    if (typeof window !== 'undefined') {
      // Save analytics every minute
      setInterval(() => {
        this.save();
      }, 60000);
    }
  }

  exportAnalytics(): string {
    const exportData = {
      ...this.analytics,
      exportedAt: new Date().toISOString(),
      summary: this.getCacheSummary()
    };
    
    return JSON.stringify(exportData, null, 2);
  }
}

export const cacheAnalytics = CacheAnalyticsManager.getInstance();

// Utility functions for easy access
export const recordCacheHit = (
  endpoint: string,
  slice: string,
  cacheTime: number,
  payloadSize?: number
) => cacheAnalytics.recordCacheHit(endpoint, slice, cacheTime, payloadSize);

export const recordCacheMiss = (
  endpoint: string,
  slice: string,
  responseTime: number,
  payloadSize?: number
) => cacheAnalytics.recordCacheMiss(endpoint, slice, responseTime, payloadSize);

export const recordCacheUpdate = (endpoint: string, slice: string) =>
  cacheAnalytics.recordCacheUpdate(endpoint, slice);

export const recordCacheEviction = (endpoint: string, slice: string) =>
  cacheAnalytics.recordCacheEviction(endpoint, slice);

export const getCacheAnalytics = () => cacheAnalytics.getAnalytics();
export const getCacheSummary = () => cacheAnalytics.getCacheSummary();