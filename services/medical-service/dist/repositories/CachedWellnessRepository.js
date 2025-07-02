"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CachedWellnessRepository = void 0;
const typeorm_1 = require("typeorm");
const WellnessEntry_1 = require("../entities/WellnessEntry");
const database_1 = require("../config/database");
const shared_lib_1 = require("@hockey-hub/shared-lib");
class CachedWellnessRepository extends shared_lib_1.CachedRepository {
    constructor() {
        super(database_1.AppDataSource.getRepository(WellnessEntry_1.WellnessEntry), shared_lib_1.RedisCacheManager.getInstance(), 'wellness');
    }
    async findByPlayerId(playerId, limit = 30) {
        const cacheKey = shared_lib_1.CacheKeyBuilder.build('wellness', 'list', 'player', playerId.toString(), { limit });
        return this.cacheQueryResult(cacheKey, async () => {
            return this.repository.find({
                where: { playerId },
                order: { entryDate: 'DESC' },
                take: limit
            });
        }, 180, // 3 minutes
        ['wellness:list', `player:${playerId}`]);
    }
    async findLatestByPlayerId(playerId) {
        const cacheKey = shared_lib_1.CacheKeyBuilder.build('wellness', 'detail', 'player', playerId.toString(), 'latest');
        return this.cacheQueryResult(cacheKey, async () => {
            return this.repository.findOne({
                where: { playerId },
                order: { entryDate: 'DESC' }
            });
        }, 60, // 1 minute
        ['wellness:latest', `player:${playerId}`]);
    }
    async findByPlayerIdAndDateRange(playerId, startDate, endDate) {
        const cacheKey = shared_lib_1.CacheKeyBuilder.build('wellness', 'list', 'player', playerId.toString(), 'range', startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]);
        return this.cacheQueryResult(cacheKey, async () => {
            return this.repository.find({
                where: {
                    playerId,
                    entryDate: (0, typeorm_1.Between)(startDate, endDate)
                },
                order: { entryDate: 'ASC' }
            });
        }, 600, // 10 minutes
        ['wellness:list', `player:${playerId}`]);
    }
    async save(wellnessEntry) {
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
    async delete(id) {
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
    async getTeamWellnessSummary() {
        const cacheKey = shared_lib_1.CacheKeyBuilder.build('wellness', 'summary', 'team');
        return this.cacheQueryResult(cacheKey, async () => {
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
        }, 300, // 5 minutes
        ['wellness:summary']);
    }
}
exports.CachedWellnessRepository = CachedWellnessRepository;
//# sourceMappingURL=CachedWellnessRepository.js.map