import { Repository, Between } from 'typeorm';
import { WellnessEntry } from '../entities/WellnessEntry';
import { AppDataSource } from '../config/database';
import { CacheKeyBuilder, paginate, PaginationQuery, PaginationResult } from '@hockey-hub/shared-lib';
import { BaseCachedRepository } from '../services/BaseCachedRepository';

export class CachedWellnessRepository extends BaseCachedRepository<WellnessEntry> {
  constructor() {
    super(
      AppDataSource.getRepository(WellnessEntry)
    );
  }

  async findByPlayerId(playerId: number, limit = 30): Promise<WellnessEntry[]> {
    const cacheKey = CacheKeyBuilder.build('wellness', 'list', 'player', playerId.toString(), { limit });
    
    return this.cacheQueryResult(
      cacheKey,
      async () => {
        return this.repository.find({
          where: { playerId },
          order: { entryDate: 'DESC' },
          take: limit
        });
      },
      180, // 3 minutes
      ['wellness:list', `player:${playerId}`]
    );
  }

  async findLatestByPlayerId(playerId: number): Promise<WellnessEntry | null> {
    const cacheKey = CacheKeyBuilder.build('wellness', 'detail', 'player', playerId.toString(), 'latest');
    
    return this.cacheQueryResult(
      cacheKey,
      async () => {
        return this.repository.findOne({
          where: { playerId },
          order: { entryDate: 'DESC' }
        });
      },
      60, // 1 minute
      ['wellness:latest', `player:${playerId}`]
    );
  }

  async findByPlayerIdAndDateRange(
    playerId: number, 
    startDate: Date, 
    endDate: Date
  ): Promise<WellnessEntry[]> {
    const cacheKey = CacheKeyBuilder.build(
      'wellness', 
      'list', 
      'player', 
      playerId.toString(),
      'range',
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );
    
    return this.cacheQueryResult(
      cacheKey,
      async () => {
        return this.repository.find({
          where: { 
            playerId,
            entryDate: Between(startDate, endDate)
          },
          order: { entryDate: 'ASC' }
        });
      },
      600, // 10 minutes
      ['wellness:list', `player:${playerId}`]
    );
  }

  async findByPlayerIdPaginated(
    playerId: number,
    paginationParams: PaginationQuery
  ): Promise<PaginationResult<WellnessEntry>> {
    const cacheKey = CacheKeyBuilder.build(
      'wellness', 
      'paginated', 
      'player', 
      playerId.toString(),
      paginationParams.page.toString(),
      paginationParams.limit.toString()
    );
    
    return this.cacheQueryResult(
      cacheKey,
      async () => {
        const queryBuilder = this.repository
          .createQueryBuilder('wellness')
          .where('wellness.playerId = :playerId', { playerId })
          .orderBy('wellness.entryDate', 'DESC');

        return paginate(queryBuilder, paginationParams);
      },
      180, // 3 minutes
      ['wellness:list', `player:${playerId}`]
    );
  }

  async findByPlayerIdAndDateRangePaginated(
    playerId: number,
    startDate: Date,
    endDate: Date,
    paginationParams: PaginationQuery
  ): Promise<PaginationResult<WellnessEntry>> {
    const cacheKey = CacheKeyBuilder.build(
      'wellness', 
      'paginated', 
      'player', 
      playerId.toString(),
      'range',
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0],
      paginationParams.page.toString(),
      paginationParams.limit.toString()
    );
    
    return this.cacheQueryResult(
      cacheKey,
      async () => {
        const queryBuilder = this.repository
          .createQueryBuilder('wellness')
          .where('wellness.playerId = :playerId', { playerId })
          .andWhere('wellness.entryDate BETWEEN :startDate AND :endDate', {
            startDate,
            endDate
          })
          .orderBy('wellness.entryDate', 'ASC');

        return paginate(queryBuilder, paginationParams);
      },
      600, // 10 minutes
      ['wellness:list', `player:${playerId}`]
    );
  }

  async save(wellnessEntry: Partial<WellnessEntry>): Promise<WellnessEntry> {
    const savedEntry = await this.repository.save(wellnessEntry);
    
    // Invalidate player-specific wellness caches
    await this.invalidateTags([
      'wellness:list',
      'wellness:latest',
      'wellness:summary',
      `player:${savedEntry.playerId}`
    ]);
    
    return savedEntry;
  }

  async delete(id: number): Promise<void> {
    const entry = await this.repository.findOne({ where: { id } });
    await this.repository.delete(id);
    
    if (entry) {
      await this.invalidateTags([
        'wellness:list',
        'wellness:latest',
        'wellness:summary',
        `player:${entry.playerId}`
      ]);
    }
  }

  async getTeamWellnessSummary(): Promise<{
    averageSleepHours: number;
    averageSleepQuality: number;
    averageEnergyLevel: number;
    averageStressLevel: number;
    totalEntries: number;
  }> {
    const cacheKey = CacheKeyBuilder.build('wellness', 'summary', 'team');
    
    return this.cacheQueryResult(
      cacheKey,
      async () => {
        const result = await this.repository
          .createQueryBuilder('wellness')
          .select('AVG(wellness.sleepHours)', 'averageSleepHours')
          .addSelect('AVG(wellness.sleepQuality)', 'averageSleepQuality')
          .addSelect('AVG(wellness.energyLevel)', 'averageEnergyLevel')
          .addSelect('AVG(wellness.stressLevel)', 'averageStressLevel')
          .addSelect('COUNT(*)', 'totalEntries')
          .where('wellness.entryDate >= :date', { 
            date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          })
          .getRawOne();

        return {
          averageSleepHours: parseFloat(result.averageSleepHours) || 0,
          averageSleepQuality: parseFloat(result.averageSleepQuality) || 0,
          averageEnergyLevel: parseFloat(result.averageEnergyLevel) || 0,
          averageStressLevel: parseFloat(result.averageStressLevel) || 0,
          totalEntries: parseInt(result.totalEntries) || 0
        };
      },
      300, // 5 minutes
      ['wellness:summary']
    );
  }
}