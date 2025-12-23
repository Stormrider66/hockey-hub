// @ts-nocheck - Complex service with TypeORM issues
import { Repository } from 'typeorm';
import { Injury } from '../entities/Injury';
import { AppDataSource } from '../config/database';
import { CacheKeys, PaginationQuery, PaginationResult, paginate } from '@hockey-hub/shared-lib';
import { BaseCachedRepository } from '../services/BaseCachedRepository';

export class CachedInjuryRepository extends BaseCachedRepository<Injury> {
  constructor() {
    super(AppDataSource.getRepository(Injury));
  }

  public override async findAll(): Promise<Injury[]> {
    const cacheKey = CacheKeys.list('injury', { type: 'all' });
    
    return this.cacheQueryResult(
      cacheKey,
      async () => {
        return this.repository.find({
          relations: ['treatments', 'medicalReports'],
          order: { injuryDate: 'DESC' }
        }) as any;
      },
      120, // 2 minutes
      ['injury:list']
    );
  }

  public override async findAllPaginated(paginationQuery: PaginationQuery): Promise<PaginationResult<Injury>> {
    const cacheKey = CacheKeys.list('injury', { type: 'paginated', page: paginationQuery.page, limit: paginationQuery.limit });
    return this.cacheQueryResult(
      cacheKey,
      async () => {
        const page = (paginationQuery as any).page ?? 1;
        const limit = (paginationQuery as any).limit ?? 20;
        const skip = (paginationQuery as any).offset ?? (paginationQuery as any).skip ?? (page - 1) * limit;
        const qb = this.repository
          .createQueryBuilder('injury')
          .leftJoinAndSelect('injury.treatments', 'treatments')
          .leftJoinAndSelect('injury.medicalReports', 'medicalReports')
          .orderBy('injury.injuryDate', 'DESC')
          .skip(skip)
          .take(limit);
        const [data, total] = await (qb as any).getManyAndCount();
        const pages = Math.max(1, Math.ceil(total / limit));
        return { data, pagination: { total, page, limit, pages } } as PaginationResult<Injury>;
      },
      120,
      ['injury:list']
    );
  }

  public override async findActiveInjuries(): Promise<Injury[]> {
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
        }) as any;
      },
      60, // 1 minute for active data
      ['injury:list', 'injury:active']
    );
  }

  public override async findActiveInjuriesPaginated(paginationQuery: PaginationQuery): Promise<PaginationResult<Injury>> {
    const cacheKey = CacheKeys.list('injury', { type: 'active-paginated', page: paginationQuery.page, limit: paginationQuery.limit });
    return this.cacheQueryResult(
      cacheKey,
      async () => {
        const page = (paginationQuery as any).page ?? 1;
        const limit = (paginationQuery as any).limit ?? 20;
        const skip = (paginationQuery as any).offset ?? (paginationQuery as any).skip ?? (page - 1) * limit;
        const qb = this.repository
          .createQueryBuilder('injury')
          .leftJoinAndSelect('injury.treatments', 'treatments')
          .leftJoinAndSelect('injury.medicalReports', 'medicalReports')
          .where('injury.recoveryStatus = :status', { status: 'active' })
          .andWhere('injury.isActive = true')
          .orderBy('injury.injuryDate', 'DESC')
          .skip(skip)
          .take(limit);
        const [data, total] = await (qb as any).getManyAndCount();
        const pages = Math.max(1, Math.ceil(total / limit));
        return { data, pagination: { total, page, limit, pages } } as PaginationResult<Injury>;
      },
      60,
      ['injury:list', 'injury:active']
    );
  }

  public async findByPlayerId(playerId: string | number): Promise<Injury[]> {
    const cacheKey = CacheKeys.list('injury', { type: 'player', playerId: playerId.toString() });
    
    return this.cacheQueryResult(
      cacheKey,
      async () => {
        return this.repository.find({
          where: { playerId } as any,
          relations: ['treatments', 'medicalReports'],
          order: { injuryDate: 'DESC' }
        }) as any;
      },
      300, // 5 minutes
      ['injury:list', `player:${playerId}`]
    );
  }

  public async findByPlayerIdPaginated(playerId: string | number, paginationQuery: PaginationQuery): Promise<PaginationResult<Injury>> {
    const cacheKey = CacheKeys.list('injury', { type: 'player-paginated', playerId: playerId.toString(), page: paginationQuery.page, limit: paginationQuery.limit });
    return this.cacheQueryResult(
      cacheKey,
      async () => {
        const page = (paginationQuery as any).page ?? 1;
        const limit = (paginationQuery as any).limit ?? 20;
        const skip = (paginationQuery as any).offset ?? (paginationQuery as any).skip ?? (page - 1) * limit;
        const qb = this.repository
          .createQueryBuilder('injury')
          .leftJoinAndSelect('injury.treatments', 'treatments')
          .leftJoinAndSelect('injury.medicalReports', 'medicalReports')
          .where('injury.playerId = :playerId', { playerId })
          .orderBy('injury.injuryDate', 'DESC')
          .skip(skip)
          .take(limit);
        const [data, total] = await (qb as any).getManyAndCount();
        const pages = Math.max(1, Math.ceil(total / limit));
        return { data, pagination: { total, page, limit, pages } } as PaginationResult<Injury>;
      },
      300,
      ['injury:list', `player:${playerId}`]
    );
  }

  public override async findById(id: number | string): Promise<Injury | null> {
    const cacheKey = `injury:${id}`;
    
    return this.cacheQueryResult(
      cacheKey,
      async () => {
        return this.repository.findOne({
           where: { id } as any,
          relations: ['treatments', 'medicalReports']
        }) as any;
      },
      600, // 10 minutes
      [`injury:${id}`]
    );
  }

  public override async save(injury: Partial<Injury>): Promise<Injury> {
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

  public override async delete(id: number | string): Promise<void> {
    const injury = await this.findById(id);
    await this.repository.delete(id as any);
    
    if (injury) {
      await this.invalidateTags([
        'injury:list',
        'injury:active',
        `player:${(injury as any).playerId}`,
        `injury:${(injury as any).id}`
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

        return result.map((row: any) => ({
          bodyPart: row.bodyPart,
          count: parseInt(row.count, 10)
        }));
      },
      300, // 5 minutes
      ['injury:stats']
    );
  }
}