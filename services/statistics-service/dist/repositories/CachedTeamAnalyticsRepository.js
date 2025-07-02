"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CachedTeamAnalyticsRepository = void 0;
const shared_lib_1 = require("@hockey-hub/shared-lib");
class CachedTeamAnalyticsRepository extends shared_lib_1.CachedRepository {
    constructor(repository, cacheManager) {
        super(repository, cacheManager, 'team_analytics');
    }
    async getTeamSeasonStats(teamId, seasonId) {
        const cacheKey = `team_season:${teamId}:${seasonId || 'current'}`;
        return this.cacheManager.getOrSet(cacheKey, async () => {
            const query = this.repository
                .createQueryBuilder('analytics')
                .where('analytics.teamId = :teamId', { teamId })
                .orderBy('analytics.date', 'DESC');
            if (seasonId) {
                query.andWhere('analytics.seasonId = :seasonId', { seasonId });
            }
            return query.getMany();
        }, 600 // 10 minutes TTL
        );
    }
    async getLeagueStandings(organizationId, seasonId) {
        const cacheKey = `league_standings:${organizationId}:${seasonId || 'current'}`;
        return this.cacheManager.getOrSet(cacheKey, async () => {
            const query = this.repository
                .createQueryBuilder('analytics')
                .select([
                'analytics.teamId',
                'SUM(analytics.wins) as wins',
                'SUM(analytics.losses) as losses',
                'SUM(analytics.ties) as ties',
                'SUM(analytics.goalsFor) as goalsFor',
                'SUM(analytics.goalsAgainst) as goalsAgainst',
                'SUM(analytics.wins) * 2 + SUM(analytics.ties) as points',
                'AVG(analytics.performanceTrend) as performanceTrend'
            ])
                .where('analytics.organizationId = :organizationId', { organizationId })
                .groupBy('analytics.teamId')
                .orderBy('points', 'DESC')
                .addOrderBy('goalsFor - goalsAgainst', 'DESC');
            if (seasonId) {
                query.andWhere('analytics.seasonId = :seasonId', { seasonId });
            }
            return query.getRawMany();
        }, 1800 // 30 minutes TTL for standings
        );
    }
    async getTeamComparison(teamIds, period = 'month') {
        const cacheKey = `team_comparison:${teamIds.sort().join(',')}:${period}`;
        return this.cacheManager.getOrSet(cacheKey, async () => {
            const endDate = new Date();
            const startDate = new Date();
            switch (period) {
                case 'week':
                    startDate.setDate(endDate.getDate() - 7);
                    break;
                case 'month':
                    startDate.setMonth(endDate.getMonth() - 1);
                    break;
                case 'season':
                    startDate.setMonth(endDate.getMonth() - 6);
                    break;
            }
            const stats = await this.repository
                .createQueryBuilder('analytics')
                .where('analytics.teamId IN (:...teamIds)', { teamIds })
                .andWhere('analytics.date >= :startDate', { startDate })
                .andWhere('analytics.date <= :endDate', { endDate })
                .getMany();
            // Group by team and calculate totals
            const teamStats = teamIds.map(teamId => {
                const teamData = stats.filter(s => s.teamId === teamId);
                const totalGames = teamData.reduce((sum, s) => sum + s.wins + s.losses + s.ties, 0);
                return {
                    teamId,
                    games: totalGames,
                    wins: teamData.reduce((sum, s) => sum + s.wins, 0),
                    losses: teamData.reduce((sum, s) => sum + s.losses, 0),
                    ties: teamData.reduce((sum, s) => sum + s.ties, 0),
                    goalsFor: teamData.reduce((sum, s) => sum + s.goalsFor, 0),
                    goalsAgainst: teamData.reduce((sum, s) => sum + s.goalsAgainst, 0),
                    powerPlayPercentage: teamData.reduce((sum, s) => sum + (s.powerPlayPercentage || 0), 0) / teamData.length,
                    penaltyKillPercentage: teamData.reduce((sum, s) => sum + (s.penaltyKillPercentage || 0), 0) / teamData.length,
                    corsiPercentage: teamData.reduce((sum, s) => sum + (s.corsiPercentage || 0), 0) / teamData.length,
                    performanceTrend: teamData.reduce((sum, s) => sum + (s.performanceTrend || 0), 0) / teamData.length
                };
            });
            return {
                period,
                teams: teamStats,
                comparison: {
                    topOffense: teamStats.sort((a, b) => b.goalsFor - a.goalsFor)[0]?.teamId,
                    topDefense: teamStats.sort((a, b) => a.goalsAgainst - b.goalsAgainst)[0]?.teamId,
                    bestRecord: teamStats.sort((a, b) => (b.wins / (b.wins + b.losses + b.ties)) - (a.wins / (a.wins + a.losses + a.ties)))[0]?.teamId
                }
            };
        }, 900 // 15 minutes TTL
        );
    }
    async getAdvancedTeamStats(teamId, gameType = 'regular') {
        const cacheKey = `advanced_stats:${teamId}:${gameType}`;
        return this.cacheManager.getOrSet(cacheKey, async () => {
            const stats = await this.repository.find({
                where: {
                    teamId,
                    gameType
                },
                order: {
                    date: 'DESC'
                },
                take: 20 // Last 20 games
            });
            if (stats.length === 0) {
                return null;
            }
            const totals = stats.reduce((acc, stat) => {
                acc.corsiFor += stat.corsiFor || 0;
                acc.corsiAgainst += stat.corsiAgainst || 0;
                acc.fenwickFor += stat.fenwickFor || 0;
                acc.fenwickAgainst += stat.fenwickAgainst || 0;
                acc.powerPlayGoals += stat.powerPlayGoals;
                acc.powerPlayOpportunities += stat.powerPlayOpportunities;
                acc.penaltyKillOpportunities += stat.penaltyKillOpportunities;
                acc.shortHandedGoals += stat.shortHandedGoals;
                return acc;
            }, {
                corsiFor: 0,
                corsiAgainst: 0,
                fenwickFor: 0,
                fenwickAgainst: 0,
                powerPlayGoals: 0,
                powerPlayOpportunities: 0,
                penaltyKillOpportunities: 0,
                shortHandedGoals: 0
            });
            return {
                gamesSampled: stats.length,
                advanced: {
                    corsiPercentage: totals.corsiFor / (totals.corsiFor + totals.corsiAgainst) * 100,
                    fenwickPercentage: totals.fenwickFor / (totals.fenwickFor + totals.fenwickAgainst) * 100,
                    powerPlayPercentage: totals.powerPlayGoals / totals.powerPlayOpportunities * 100,
                    penaltyKillPercentage: (totals.penaltyKillOpportunities - totals.shortHandedGoals) / totals.penaltyKillOpportunities * 100
                },
                trends: {
                    recent5Games: stats.slice(0, 5),
                    recent10Games: stats.slice(0, 10),
                    momentum: stats.slice(0, 3).reduce((sum, s) => sum + (s.performanceTrend || 0), 0) / 3
                }
            };
        }, 1200 // 20 minutes TTL
        );
    }
    async getLinePerformanceStats(teamId, period = 'week') {
        const cacheKey = `line_performance:${teamId}:${period}`;
        return this.cacheManager.getOrSet(cacheKey, async () => {
            const endDate = new Date();
            const startDate = new Date();
            if (period === 'week') {
                startDate.setDate(endDate.getDate() - 7);
            }
            else {
                startDate.setMonth(endDate.getMonth() - 1);
            }
            const stats = await this.repository
                .createQueryBuilder('analytics')
                .where('analytics.teamId = :teamId', { teamId })
                .andWhere('analytics.date >= :startDate', { startDate })
                .andWhere('analytics.linePerformance IS NOT NULL')
                .getMany();
            // Aggregate line performance data
            const lineStats = new Map();
            stats.forEach(stat => {
                if (stat.linePerformance) {
                    stat.linePerformance.forEach((line) => {
                        if (!lineStats.has(line.lineId)) {
                            lineStats.set(line.lineId, {
                                lineId: line.lineId,
                                lineNumber: line.lineNumber,
                                players: line.playersIds,
                                totalIceTime: 0,
                                totalGoalsFor: 0,
                                totalGoalsAgainst: 0,
                                totalCorsi: 0,
                                games: 0,
                                avgRating: 0
                            });
                        }
                        const existing = lineStats.get(line.lineId);
                        existing.totalIceTime += line.iceTime;
                        existing.totalGoalsFor += line.goalsFor;
                        existing.totalGoalsAgainst += line.goalsAgainst;
                        existing.totalCorsi += line.corsi;
                        existing.avgRating += line.rating;
                        existing.games += 1;
                    });
                }
            });
            // Calculate averages and return sorted by performance
            return Array.from(lineStats.values())
                .map(line => ({
                ...line,
                avgIceTime: line.totalIceTime / line.games,
                avgGoalsFor: line.totalGoalsFor / line.games,
                avgGoalsAgainst: line.totalGoalsAgainst / line.games,
                avgCorsi: line.totalCorsi / line.games,
                avgRating: line.avgRating / line.games,
                plusMinus: line.totalGoalsFor - line.totalGoalsAgainst
            }))
                .sort((a, b) => b.avgRating - a.avgRating);
        }, 1800 // 30 minutes TTL
        );
    }
    async invalidateTeamCache(teamId) {
        const patterns = [
            `team_season:${teamId}:*`,
            `team_comparison:*${teamId}*`,
            `advanced_stats:${teamId}:*`,
            `line_performance:${teamId}:*`
        ];
        await this.cacheManager.deletePattern(patterns);
    }
    async invalidateOrganizationCache(organizationId) {
        const patterns = [
            `league_standings:${organizationId}:*`
        ];
        await this.cacheManager.deletePattern(patterns);
    }
}
exports.CachedTeamAnalyticsRepository = CachedTeamAnalyticsRepository;
//# sourceMappingURL=CachedTeamAnalyticsRepository.js.map