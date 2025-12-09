/**
 * AI Analysis Caching Service
 * 
 * Intelligent caching system for AI analysis responses with TTL, 
 * invalidation strategies, and storage optimization.
 */

import { PlayAnalysis, AnalysisContext, TacticalPlay } from '../components/tactical/AIAnalysisEngine';
import { AIResponse } from './aiAnalysisService';

export interface CacheEntry {
  key: string;
  data: PlayAnalysis;
  metadata: CacheMetadata;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  size: number; // bytes
}

export interface CacheMetadata {
  playHash: string;
  analysisType: string;
  contextHash: string;
  aiProvider: string;
  confidence: number;
  version: string;
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number; // bytes
  hitRate: number; // percentage
  avgResponseTime: number; // ms
  oldestEntry: number; // timestamp
  newestEntry: number; // timestamp
  providerDistribution: { [provider: string]: number };
  analysisTypeDistribution: { [type: string]: number };
}

export interface CacheConfig {
  maxEntries: number;
  maxSizeBytes: number;
  defaultTTL: number; // minutes
  cleanupInterval: number; // minutes
  hitRateTarget: number; // percentage
  compressionEnabled: boolean;
}

export class AICacheService {
  private cache: Map<string, CacheEntry> = new Map();
  private accessLog: { [key: string]: number[] } = {}; // timestamp arrays
  private hitCount = 0;
  private missCount = 0;
  private config: CacheConfig;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      maxEntries: 500,
      maxSizeBytes: 10 * 1024 * 1024, // 10MB
      defaultTTL: 60, // 1 hour
      cleanupInterval: 15, // 15 minutes
      hitRateTarget: 80, // 80%
      compressionEnabled: true,
      ...config
    };

    this.loadFromStorage();
    this.startCleanupTimer();
  }

  /**
   * Get cached analysis or return null
   */
  async get(key: string): Promise<PlayAnalysis | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.missCount++;
      return null;
    }

    // Check TTL
    const now = Date.now();
    const age = now - entry.timestamp;
    const ttlMs = entry.ttl * 60 * 1000;

    if (age > ttlMs) {
      this.cache.delete(key);
      this.missCount++;
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = now;
    this.logAccess(key);
    this.hitCount++;

    // Move to end (LRU)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.data;
  }

  /**
   * Store analysis in cache
   */
  async set(
    play: TacticalPlay,
    analysisType: string,
    context: AnalysisContext | undefined,
    analysis: PlayAnalysis,
    ttlMinutes?: number
  ): Promise<void> {
    const key = this.generateCacheKey(play, analysisType, context);
    const now = Date.now();
    
    const metadata: CacheMetadata = {
      playHash: this.hashPlay(play),
      analysisType,
      contextHash: context ? this.hashContext(context) : 'no-context',
      aiProvider: analysis.metadata.aiProvider || 'local',
      confidence: analysis.metadata.confidence || 70,
      version: analysis.metadata.version || '2.0.0'
    };

    const serialized = this.serializeAnalysis(analysis);
    const size = this.calculateSize(serialized);

    const entry: CacheEntry = {
      key,
      data: analysis,
      metadata,
      timestamp: now,
      ttl: ttlMinutes || this.getTTLForAnalysis(analysis),
      accessCount: 1,
      lastAccessed: now,
      size
    };

    // Check if we need to make space
    await this.ensureCapacity(size);

    this.cache.set(key, entry);
    this.logAccess(key);

    // Persist to localStorage periodically
    if (this.cache.size % 10 === 0) {
      this.saveToStorage();
    }
  }

  /**
   * Invalidate cache entries based on criteria
   */
  async invalidate(criteria: {
    playId?: string;
    analysisType?: string;
    aiProvider?: string;
    olderThan?: number; // timestamp
    confidence?: { below?: number; above?: number };
  }): Promise<number> {
    let invalidatedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      let shouldInvalidate = false;

      if (criteria.playId && entry.metadata.playHash.includes(criteria.playId)) {
        shouldInvalidate = true;
      }

      if (criteria.analysisType && entry.metadata.analysisType !== criteria.analysisType) {
        shouldInvalidate = true;
      }

      if (criteria.aiProvider && entry.metadata.aiProvider !== criteria.aiProvider) {
        shouldInvalidate = true;
      }

      if (criteria.olderThan && entry.timestamp < criteria.olderThan) {
        shouldInvalidate = true;
      }

      if (criteria.confidence?.below && entry.metadata.confidence < criteria.confidence.below) {
        shouldInvalidate = true;
      }

      if (criteria.confidence?.above && entry.metadata.confidence > criteria.confidence.above) {
        shouldInvalidate = true;
      }

      if (shouldInvalidate) {
        this.cache.delete(key);
        delete this.accessLog[key];
        invalidatedCount++;
      }
    }

    if (invalidatedCount > 0) {
      this.saveToStorage();
    }

    return invalidatedCount;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const now = Date.now();
    const entries = Array.from(this.cache.values());
    const totalRequests = this.hitCount + this.missCount;

    const providerDistribution: { [provider: string]: number } = {};
    const analysisTypeDistribution: { [type: string]: number } = {};
    let totalSize = 0;
    let oldestEntry = now;
    let newestEntry = 0;

    entries.forEach(entry => {
      // Provider distribution
      providerDistribution[entry.metadata.aiProvider] = 
        (providerDistribution[entry.metadata.aiProvider] || 0) + 1;

      // Analysis type distribution  
      analysisTypeDistribution[entry.metadata.analysisType] = 
        (analysisTypeDistribution[entry.metadata.analysisType] || 0) + 1;

      totalSize += entry.size;
      oldestEntry = Math.min(oldestEntry, entry.timestamp);
      newestEntry = Math.max(newestEntry, entry.timestamp);
    });

    return {
      totalEntries: entries.length,
      totalSize,
      hitRate: totalRequests > 0 ? (this.hitCount / totalRequests) * 100 : 0,
      avgResponseTime: this.calculateAvgResponseTime(),
      oldestEntry,
      newestEntry,
      providerDistribution,
      analysisTypeDistribution
    };
  }

  /**
   * Optimize cache performance
   */
  async optimize(): Promise<{
    entriesRemoved: number;
    bytesFreed: number;
    hitRateImprovement: number;
  }> {
    const initialStats = this.getStats();
    
    // Remove low-value entries
    const lowValueEntries = this.identifyLowValueEntries();
    let entriesRemoved = 0;
    let bytesFreed = 0;

    for (const key of lowValueEntries) {
      const entry = this.cache.get(key);
      if (entry) {
        bytesFreed += entry.size;
        this.cache.delete(key);
        delete this.accessLog[key];
        entriesRemoved++;
      }
    }

    // Adjust TTLs based on access patterns
    this.optimizeTTLs();

    // Cleanup expired entries
    await this.cleanup();

    const finalStats = this.getStats();
    const hitRateImprovement = finalStats.hitRate - initialStats.hitRate;

    this.saveToStorage();

    return {
      entriesRemoved,
      bytesFreed,
      hitRateImprovement
    };
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.accessLog = {};
    this.hitCount = 0;
    this.missCount = 0;
    localStorage.removeItem('ai_cache_data');
    localStorage.removeItem('ai_cache_stats');
  }

  /**
   * Export cache for backup
   */
  export(): string {
    const exportData = {
      entries: Array.from(this.cache.entries()),
      accessLog: this.accessLog,
      stats: { hitCount: this.hitCount, missCount: this.missCount },
      timestamp: Date.now(),
      config: this.config
    };

    return JSON.stringify(exportData);
  }

  /**
   * Import cache from backup
   */
  import(data: string): boolean {
    try {
      const importData = JSON.parse(data);
      
      this.clear();
      
      // Restore entries
      for (const [key, entry] of importData.entries) {
        this.cache.set(key, entry);
      }

      this.accessLog = importData.accessLog || {};
      this.hitCount = importData.stats?.hitCount || 0;
      this.missCount = importData.stats?.missCount || 0;

      this.saveToStorage();
      return true;
    } catch (error) {
      console.error('Failed to import cache data:', error);
      return false;
    }
  }

  // Private helper methods

  private generateCacheKey(
    play: TacticalPlay,
    analysisType: string,
    context?: AnalysisContext
  ): string {
    const playHash = this.hashPlay(play);
    const contextHash = context ? this.hashContext(context) : 'no-context';
    return `${playHash}-${analysisType}-${contextHash}`;
  }

  private hashPlay(play: TacticalPlay): string {
    const playData = {
      formation: play.formation.name,
      playerCount: play.formation.players?.length || 0,
      movements: (play.movements || []).length,
      objectives: play.objectives?.join(',') || ''
    };
    return btoa(JSON.stringify(playData)).slice(0, 16);
  }

  private hashContext(context: AnalysisContext): string {
    const contextData = {
      gamePhase: context.gamePhase,
      situation: context.situation,
      scoreState: context.scoreState
    };
    return btoa(JSON.stringify(contextData)).slice(0, 8);
  }

  private serializeAnalysis(analysis: PlayAnalysis): string {
    if (this.config.compressionEnabled) {
      // Simple compression - remove unnecessary whitespace and round numbers
      const compressed = JSON.stringify(analysis, (key, value) => {
        if (typeof value === 'number') {
          return Math.round(value * 100) / 100;
        }
        return value;
      });
      return compressed;
    }
    return JSON.stringify(analysis);
  }

  private calculateSize(serialized: string): number {
    return new Blob([serialized]).size;
  }

  private getTTLForAnalysis(analysis: PlayAnalysis): number {
    // Dynamic TTL based on analysis confidence and provider
    let baseTTL = this.config.defaultTTL;
    const confidence = analysis.metadata.confidence || 70;
    const provider = analysis.metadata.aiProvider;

    // Higher confidence = longer TTL
    if (confidence > 90) baseTTL *= 2;
    else if (confidence > 80) baseTTL *= 1.5;
    else if (confidence < 60) baseTTL *= 0.5;

    // AI provider analyses last longer than local
    if (provider === 'openai' || provider === 'claude') {
      baseTTL *= 1.5;
    }

    return baseTTL;
  }

  private async ensureCapacity(newEntrySize: number): Promise<void> {
    while (this.cache.size >= this.config.maxEntries || 
           this.getCurrentSize() + newEntrySize > this.config.maxSizeBytes) {
      
      // Remove least recently used entry
      const lruKey = this.findLRUEntry();
      if (lruKey) {
        this.cache.delete(lruKey);
        delete this.accessLog[lruKey];
      } else {
        break; // Safety check
      }
    }
  }

  private getCurrentSize(): number {
    return Array.from(this.cache.values())
      .reduce((total, entry) => total + entry.size, 0);
  }

  private findLRUEntry(): string | null {
    let lruKey: string | null = null;
    let lruTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed;
        lruKey = key;
      }
    }

    return lruKey;
  }

  private logAccess(key: string): void {
    const now = Date.now();
    if (!this.accessLog[key]) {
      this.accessLog[key] = [];
    }
    
    this.accessLog[key].push(now);
    
    // Keep only last 50 accesses per key
    if (this.accessLog[key].length > 50) {
      this.accessLog[key] = this.accessLog[key].slice(-50);
    }
  }

  private calculateAvgResponseTime(): number {
    // Mock calculation - would need actual timing data
    const stats = this.getStats();
    return stats.totalEntries > 0 ? 1500 : 0; // 1.5s average
  }

  private identifyLowValueEntries(): string[] {
    const now = Date.now();
    const lowValueKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.timestamp;
      const daysSinceCreated = age / (1000 * 60 * 60 * 24);
      const accessFrequency = entry.accessCount / Math.max(1, daysSinceCreated);

      // Low value criteria
      const isOld = daysSinceCreated > 7;
      const isLowConfidence = entry.metadata.confidence < 60;
      const isRarelyAccessed = accessFrequency < 0.1; // Less than once per 10 days
      const isOversized = entry.size > 50000; // 50KB

      if ((isOld && isRarelyAccessed) || isLowConfidence || isOversized) {
        lowValueKeys.push(key);
      }
    }

    return lowValueKeys;
  }

  private optimizeTTLs(): void {
    for (const [key, entry] of this.cache.entries()) {
      const accesses = this.accessLog[key] || [];
      const recentAccesses = accesses.filter(time => 
        Date.now() - time < 24 * 60 * 60 * 1000 // Last 24 hours
      ).length;

      // Adjust TTL based on recent access patterns
      if (recentAccesses > 5) {
        entry.ttl = Math.min(entry.ttl * 1.2, this.config.defaultTTL * 2);
      } else if (recentAccesses === 0) {
        entry.ttl = Math.max(entry.ttl * 0.8, this.config.defaultTTL * 0.5);
      }
    }
  }

  private async cleanup(): Promise<void> {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.timestamp;
      const ttlMs = entry.ttl * 60 * 1000;

      if (age > ttlMs) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.cache.delete(key);
      delete this.accessLog[key];
    }

    if (expiredKeys.length > 0) {
      console.log(`Cleaned up ${expiredKeys.length} expired cache entries`);
    }
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
      
      // Periodic storage save
      if (Math.random() < 0.1) { // 10% chance
        this.saveToStorage();
      }
    }, this.config.cleanupInterval * 60 * 1000);
  }

  private saveToStorage(): void {
    try {
      const cacheData = {
        entries: Array.from(this.cache.entries()).slice(0, 100), // Limit storage size
        accessLog: Object.fromEntries(
          Object.entries(this.accessLog).slice(0, 100)
        ),
        stats: { 
          hitCount: this.hitCount, 
          missCount: this.missCount 
        },
        timestamp: Date.now()
      };

      localStorage.setItem('ai_cache_data', JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to save cache to localStorage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem('ai_cache_data');
      if (!saved) return;

      const data = JSON.parse(saved);
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      // Only load recent data
      if (now - data.timestamp < maxAge) {
        for (const [key, entry] of data.entries) {
          this.cache.set(key, entry);
        }

        this.accessLog = data.accessLog || {};
        this.hitCount = data.stats?.hitCount || 0;
        this.missCount = data.stats?.missCount || 0;
      }
    } catch (error) {
      console.warn('Failed to load cache from localStorage:', error);
    }
  }

  /**
   * Cleanup on service destruction
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.saveToStorage();
  }
}

// Export singleton instance
export const aiCacheService = new AICacheService();
export default aiCacheService;