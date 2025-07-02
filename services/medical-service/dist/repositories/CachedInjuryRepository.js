"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CachedInjuryRepository = void 0;
const Injury_1 = require("../entities/Injury");
const database_1 = require("../config/database");
const shared_lib_1 = require("@hockey-hub/shared-lib");
class CachedInjuryRepository extends shared_lib_1.CachedRepository {
    constructor() {
        super(database_1.AppDataSource.getRepository(Injury_1.Injury), shared_lib_1.RedisCacheManager.getInstance(), 'injury');
    }
    async findAll() {
        const cacheKey = shared_lib_1.CacheKeyBuilder.build('injury', 'list', 'all');
        return this.cacheQueryResult(cacheKey, async () => {
            return this.repository.find({
                relations: ['treatments', 'medicalReports'],
                order: { injuryDate: 'DESC' }
            });
        }, 120, // 2 minutes
        ['injury:list']);
    }
    async findActiveInjuries() {
        const cacheKey = shared_lib_1.CacheKeyBuilder.build('injury', 'list', 'active');
        return this.cacheQueryResult(cacheKey, async () => {
            return this.repository.find({
                where: {
                    recoveryStatus: 'active',
                    isActive: true
                },
                relations: ['treatments', 'medicalReports'],
                order: { injuryDate: 'DESC' }
            });
        }, 60, // 1 minute for active data
        ['injury:list', 'injury:active']);
    }
    async findByPlayerId(playerId) {
        const cacheKey = shared_lib_1.CacheKeyBuilder.build('injury', 'list', 'player', playerId.toString());
        return this.cacheQueryResult(cacheKey, async () => {
            return this.repository.find({
                where: { playerId },
                relations: ['treatments', 'medicalReports'],
                order: { injuryDate: 'DESC' }
            });
        }, 300, // 5 minutes
        ['injury:list', `player:${playerId}`]);
    }
    async findById(id) {
        const cacheKey = shared_lib_1.CacheKeyBuilder.build('injury', 'detail', id.toString());
        return this.cacheQueryResult(cacheKey, async () => {
            return this.repository.findOne({
                where: { id },
                relations: ['treatments', 'medicalReports']
            });
        }, 600, // 10 minutes
        [`injury:${id}`]);
    }
    async save(injury) {
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
    async delete(id) {
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
    async countActiveByBodyPart() {
        const cacheKey = shared_lib_1.CacheKeyBuilder.build('injury', 'stats', 'body-parts');
        return this.cacheQueryResult(cacheKey, async () => {
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
        }, 300, // 5 minutes
        ['injury:stats']);
    }
}
exports.CachedInjuryRepository = CachedInjuryRepository;
//# sourceMappingURL=CachedInjuryRepository.js.map