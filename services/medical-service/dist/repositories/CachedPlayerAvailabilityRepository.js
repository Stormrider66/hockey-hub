"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CachedPlayerAvailabilityRepository = void 0;
const PlayerAvailability_1 = require("../entities/PlayerAvailability");
const database_1 = require("../config/database");
const shared_lib_1 = require("@hockey-hub/shared-lib");
class CachedPlayerAvailabilityRepository extends shared_lib_1.CachedRepository {
    constructor() {
        super(database_1.AppDataSource.getRepository(PlayerAvailability_1.PlayerAvailability), shared_lib_1.RedisCacheManager.getInstance(), 'availability');
    }
    async findAll() {
        const cacheKey = shared_lib_1.CacheKeyBuilder.build('availability', 'list', 'all');
        return this.cacheQueryResult(cacheKey, async () => {
            return this.repository.find({
                where: { isCurrent: true },
                relations: ['injury'],
                order: { effectiveDate: 'DESC' }
            });
        }, 180, // 3 minutes
        ['availability:list']);
    }
    async findByPlayerId(playerId) {
        const cacheKey = shared_lib_1.CacheKeyBuilder.build('availability', 'list', 'player', playerId.toString());
        return this.cacheQueryResult(cacheKey, async () => {
            return this.repository.find({
                where: { playerId },
                relations: ['injury'],
                order: { effectiveDate: 'DESC' }
            });
        }, 300, // 5 minutes
        ['availability:list', `player:${playerId}`]);
    }
    async findCurrentByPlayerId(playerId) {
        const cacheKey = shared_lib_1.CacheKeyBuilder.build('availability', 'detail', 'player', playerId.toString(), 'current');
        return this.cacheQueryResult(cacheKey, async () => {
            return this.repository.findOne({
                where: {
                    playerId,
                    isCurrent: true
                },
                relations: ['injury']
            });
        }, 120, // 2 minutes
        ['availability:current', `player:${playerId}`]);
    }
    async save(availability) {
        // If this is a new current status, mark others as not current
        if (availability.isCurrent && availability.playerId) {
            await this.repository.update({ playerId: availability.playerId, isCurrent: true }, { isCurrent: false });
        }
        const savedAvailability = await this.repository.save(availability);
        // Invalidate related caches
        await this.invalidateTags([
            'availability:list',
            'availability:current',
            'availability:summary',
            `player:${savedAvailability.playerId}`
        ]);
        return savedAvailability;
    }
    async delete(id) {
        const availability = await this.repository.findOne({ where: { id } });
        await this.repository.delete(id);
        if (availability) {
            await this.invalidateTags([
                'availability:list',
                'availability:current',
                'availability:summary',
                `player:${availability.playerId}`
            ]);
        }
    }
    async getTeamAvailabilitySummary() {
        const cacheKey = shared_lib_1.CacheKeyBuilder.build('availability', 'summary', 'team');
        return this.cacheQueryResult(cacheKey, async () => {
            const statusCounts = await this.repository
                .createQueryBuilder('availability')
                .select('availability.availabilityStatus', 'status')
                .addSelect('COUNT(*)', 'count')
                .where('availability.isCurrent = true')
                .groupBy('availability.availabilityStatus')
                .getRawMany();
            const totalPlayers = statusCounts.reduce((sum, item) => sum + parseInt(item.count), 0);
            const availablePlayers = statusCounts.find(item => item.status === 'available')?.count || 0;
            const injuredPlayers = statusCounts.find(item => item.status === 'injured')?.count || 0;
            const illnessPlayers = statusCounts.find(item => item.status === 'illness')?.count || 0;
            const otherUnavailable = totalPlayers - availablePlayers - injuredPlayers - illnessPlayers;
            return {
                totalPlayers,
                availablePlayers: parseInt(availablePlayers),
                injuredPlayers: parseInt(injuredPlayers),
                illnessPlayers: parseInt(illnessPlayers),
                otherUnavailable,
                availabilityByStatus: statusCounts.map(item => ({
                    status: item.status,
                    count: parseInt(item.count)
                }))
            };
        }, 120, // 2 minutes
        ['availability:summary']);
    }
}
exports.CachedPlayerAvailabilityRepository = CachedPlayerAvailabilityRepository;
//# sourceMappingURL=CachedPlayerAvailabilityRepository.js.map