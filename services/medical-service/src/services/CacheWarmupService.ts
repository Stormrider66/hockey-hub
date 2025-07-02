import { getCacheManager } from '@hockey-hub/shared-lib';
import { CachedInjuryRepository } from '../repositories/CachedInjuryRepository';
import { CachedWellnessRepository } from '../repositories/CachedWellnessRepository';
import { CachedPlayerAvailabilityRepository } from '../repositories/CachedPlayerAvailabilityRepository';

export class CacheWarmupService {
  private injuryRepo: CachedInjuryRepository;
  private wellnessRepo: CachedWellnessRepository;
  private availabilityRepo: CachedPlayerAvailabilityRepository;

  constructor() {
    this.injuryRepo = new CachedInjuryRepository();
    this.wellnessRepo = new CachedWellnessRepository();
    this.availabilityRepo = new CachedPlayerAvailabilityRepository();
  }

  /**
   * Warm up frequently accessed medical data
   */
  async warmupCache(): Promise<void> {
    console.log('🔥 Starting cache warmup for medical service...');
    
    try {
      // Check if cache is available
      const cache = getCacheManager();
      await cache.set('warmup:test', 'ok', 1);
      
      // Warm up active injuries (most frequently accessed)
      console.log('🔥 Warming up active injuries...');
      await this.injuryRepo.findActiveInjuries();
      
      // Warm up injury statistics
      console.log('🔥 Warming up injury statistics...');
      await this.injuryRepo.countActiveByBodyPart();
      
      // Warm up recent wellness submissions for active players
      console.log('🔥 Warming up recent wellness data...');
      await this.warmupRecentWellnessData();
      
      // Warm up current player availability
      console.log('🔥 Warming up player availability...');
      await this.availabilityRepo.getCurrentAvailability();
      
      // Warm up availability statistics
      console.log('🔥 Warming up availability statistics...');
      await this.availabilityRepo.getAvailabilityStats();
      
      console.log('✅ Cache warmup completed successfully');
    } catch (error) {
      console.error('❌ Cache warmup failed:', error);
      // Don't throw error - continue without cache warmup
    }
  }

  /**
   * Warm up recent wellness data for the last 7 days
   */
  private async warmupRecentWellnessData(): Promise<void> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7); // Last 7 days
      
      // This will cache the recent wellness submissions
      await this.wellnessRepo.findByDateRange(startDate, endDate);
      
      // Cache wellness statistics for the last week
      await this.wellnessRepo.getWellnessStats(startDate, endDate);
    } catch (error) {
      console.error('Error warming up wellness data:', error);
    }
  }

  /**
   * Periodically refresh cache for hot data
   */
  startPeriodicWarmup(intervalMs: number = 300000): void { // 5 minutes default
    console.log(`🔄 Starting periodic cache warmup every ${intervalMs / 1000} seconds`);
    
    setInterval(async () => {
      try {
        console.log('🔄 Refreshing hot cache data...');
        
        // Refresh active injuries (changes frequently)
        await this.injuryRepo.findActiveInjuries();
        
        // Refresh today's wellness submissions
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        await this.wellnessRepo.findByDateRange(today, tomorrow);
        
        // Refresh current availability (changes during the day)
        await this.availabilityRepo.getCurrentAvailability();
        
        console.log('✅ Hot cache data refreshed');
      } catch (error) {
        console.error('❌ Periodic cache warmup failed:', error);
      }
    }, intervalMs);
  }

  /**
   * Cache statistics for dashboard displays
   */
  async warmupDashboardData(): Promise<void> {
    try {
      console.log('📊 Warming up dashboard data...');
      
      // Overall injury statistics
      await this.injuryRepo.countActiveByBodyPart();
      
      // Wellness trends for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      await this.wellnessRepo.getWellnessStats(thirtyDaysAgo, new Date());
      
      // Availability overview
      await this.availabilityRepo.getAvailabilityStats();
      
      console.log('✅ Dashboard data warmed up');
    } catch (error) {
      console.error('❌ Dashboard data warmup failed:', error);
    }
  }
}