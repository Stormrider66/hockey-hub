import { Repository } from 'typeorm';
import { Injury } from '../entities/Injury';
import { AppDataSource } from '../config/database';
import { CacheKeys, PaginationQuery, PaginationResult, paginate } from '@hockey-hub/shared-lib';
import { BaseCachedRepository } from '../services/BaseCachedRepository';

export class CachedInjuryRepository extends BaseCachedRepository<Injury> {
  constructor() {
    super(AppDataSource.getRepository(Injury));
  }

  async findAll(): Promise<Injury[]> {
    const cacheKey = CacheKeys.list('injury', { type: 'all' });
    
    return this.cacheQueryResult(
      cacheKey,
      async () => {
        return this.repository.find({
          relations: ['treatments', 'medicalReports'],
          order: { injuryDate: 'DESC' }
        });
      },
      120, // 2 minutes
      ['injury:list']
    );
  }

  async findAllPaginated(paginationQuery: PaginationQuery): Promise<PaginationResult<Injury>> {
    const cacheKey = CacheKeys.list('injury', { type: 'paginated', page: paginationQuery.page, limit: paginationQuery.limit });
    
    return this.cacheQueryResult(
      cacheKey,
      async () => {
        const queryBuilder = this.repository
          .createQueryBuilder('injury')
          .leftJoinAndSelect('injury.treatments', 'treatments')
          .leftJoinAndSelect('injury.medicalReports', 'medicalReports')
          .orderBy('injury.injuryDate', 'DESC');
        
        return paginate(queryBuilder, paginationQuery);
      },
      120, // 2 minutes
      ['injury:list']
    );
  }

  async findActiveInjuries(): Promise<Injury[]> {
    const cacheKey = CacheKeys.list('injury', { type: 'active' });
    
    return this.cacheQueryResult(
      cacheKey,
      async () => {
        return this.repository.find({
          where: { 
            recoveryStatus: 'active',
            isActive: true 
          },
          relations: ['treatments', 'medicalReports'],
          order: { injuryDate: 'DESC' }
        });
      },
      60, // 1 minute for active data
      ['injury:list', 'injury:active']
    );
  }

  async findActiveInjuriesPaginated(paginationQuery: PaginationQuery): Promise<PaginationResult<Injury>> {
    const cacheKey = CacheKeys.list('injury', { type: 'active-paginated', page: paginationQuery.page, limit: paginationQuery.limit });
    
    return this.cacheQueryResult(
      cacheKey,
      async () => {
        const queryBuilder = this.repository
          .createQueryBuilder('injury')
          .leftJoinAndSelect('injury.treatments', 'treatments')
          .leftJoinAndSelect('injury.medicalReports', 'medicalReports')
          .where('injury.recoveryStatus = :status', { status: 'active' })
          .andWhere('injury.isActive = true')
          .orderBy('injury.injuryDate', 'DESC');
        
        return paginate(queryBuilder, paginationQuery);
      },
      60, // 1 minute for active data
      ['injury:list', 'injury:active']
    );
  }

  async findByPlayerId(playerId: number): Promise<Injury[]> {
    const cacheKey = CacheKeys.list('injury', { type: 'player', playerId: playerId.toString() });
    
    return this.cacheQueryResult(
      cacheKey,
      async () => {
        return this.repository.find({
          where: { playerId },
          relations: ['treatments', 'medicalReports'],
          order: { injuryDate: 'DESC' }
        });
      },
      300, // 5 minutes
      ['injury:list', `player:${playerId}`]
    );
  }

  async findByPlayerIdPaginated(playerId: number, paginationQuery: PaginationQuery): Promise<PaginationResult<Injury>> {
    const cacheKey = CacheKeys.list('injury', { type: 'player-paginated', playerId: playerId.toString(), page: paginationQuery.page, limit: paginationQuery.limit });
    
    return this.cacheQueryResult(
      cacheKey,
      async () => {
        const queryBuilder = this.repository
          .createQueryBuilder('injury')
          .leftJoinAndSelect('injury.treatments', 'treatments')
          .leftJoinAndSelect('injury.medicalReports', 'medicalReports')
          .where('injury.playerId = :playerId', { playerId })
          .orderBy('injury.injuryDate', 'DESC');
        
        return paginate(queryBuilder, paginationQuery);
      },
      300, // 5 minutes
      ['injury:list', `player:${playerId}`]
    );
  }

  async findById(id: number): Promise<Injury | null> {
    const cacheKey = `injury:${id}`;
    
    return this.cacheQueryResult(
      cacheKey,
      async () => {
        return this.repository.findOne({
          where: { id },
          relations: ['treatments', 'medicalReports']
        });
      },
      600, // 10 minutes
      [`injury:${id}`]
    );
  }

  async save(injury: Partial<Injury>): Promise<Injury> {
    const savedInjury = await this.repository.save(injury);
    
    // Invalidate related caches
    await this.invalidateTags([
      'injury:list',
      'injury:active',
      `player:${savedInjury.playerId}`,
      `injury:${savedInjury.id}`
    ]);
    
    return savedInjury;
  }

  async delete(id: number): Promise<void> {
    const injury = await this.findById(id);
    await this.repository.delete(id);
    
    if (injury) {
      await this.invalidateTags([
        'injury:list',
        'injury:active',
        `player:${injury.playerId}`,
        `injury:${injury.id}`
      ]);
    }
  }

  async countActiveByBodyPart(): Promise<{ bodyPart: string; count: number }[]> {
    const cacheKey = 'injury:stats:body-parts';
    
    return this.cacheQueryResult(
      cacheKey,
      async () => {
        const result = await this.repository
          .createQueryBuilder('injury')
          .select('injury.bodyPart', 'bodyPart')
          .addSelect('COUNT(*)', 'count')
          .where('injury.recoveryStatus = :status', { status: 'active' })
          .andWhere('injury.isActive = true')
          .groupBy('injury.bodyPart')
          .getRawMany();

        return result.map(row => ({
          bodyPart: row.bodyPart,
          count: parseInt(row.count)
        }));
      },
      300, // 5 minutes
      ['injury:stats']
    );
  }
}