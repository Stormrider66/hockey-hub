"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CachedMedicalService = void 0;
const repositories_1 = require("../repositories");
class CachedMedicalService {
    constructor() {
        this.injuryRepository = new repositories_1.CachedInjuryRepository();
        this.wellnessRepository = new repositories_1.CachedWellnessRepository();
        this.availabilityRepository = new repositories_1.CachedPlayerAvailabilityRepository();
    }
    // Player Medical Overview - Combines multiple data sources
    async getPlayerMedicalOverview(playerId) {
        // Since this combines multiple data sources, we don't use repository caching here
        // Instead, we rely on the individual repository methods being cached
        // Fetch data from multiple sources
        const [injuries, currentAvailability, latestWellness] = await Promise.all([
            this.injuryRepository.findByPlayerId(playerId),
            this.availabilityRepository.findCurrentByPlayerId(playerId),
            this.wellnessRepository.findLatestByPlayerId(playerId)
        ]);
        const currentInjuries = injuries.filter(injury => injury.recoveryStatus === 'active');
        const injuryHistory = injuries.filter(injury => injury.recoveryStatus === 'recovered');
        return {
            playerId,
            currentInjuries,
            injuryHistory,
            currentAvailability,
            latestWellness,
            medicalClearance: currentAvailability?.availabilityStatus === 'available',
            lastAssessmentDate: latestWellness?.entryDate || null,
            riskFactors: this.calculateRiskFactors(currentInjuries, latestWellness),
            recommendations: this.generateRecommendations(currentInjuries, latestWellness)
        };
    }
    // Team Medical Statistics
    async getTeamMedicalStats() {
        // Rely on individual repository method caching
        const [activeInjuries, availabilitySummary, wellnessSummary, injuryStatsByBodyPart] = await Promise.all([
            this.injuryRepository.findActiveInjuries(),
            this.availabilityRepository.getTeamAvailabilitySummary(),
            this.wellnessRepository.getTeamWellnessSummary(),
            this.injuryRepository.countActiveByBodyPart()
        ]);
        return {
            totalActiveInjuries: activeInjuries.length,
            playersOnInjuryList: availabilitySummary.injuredPlayers,
            availabilityBreakdown: availabilitySummary.availabilityByStatus,
            injuryTypesByBodyPart: injuryStatsByBodyPart,
            teamWellnessMetrics: wellnessSummary,
            averageRecoveryTime: this.calculateAverageRecoveryTime(activeInjuries),
            highRiskPlayers: await this.identifyHighRiskPlayers()
        };
    }
    // Submit wellness data with validation and caching
    async submitWellnessEntry(wellnessData) {
        // Validate wellness data
        this.validateWellnessEntry(wellnessData);
        // Set entry date if not provided
        if (!wellnessData.entryDate) {
            wellnessData.entryDate = new Date();
        }
        const savedEntry = await this.wellnessRepository.save(wellnessData);
        // Update player availability if needed
        await this.updatePlayerAvailabilityFromWellness(savedEntry);
        return savedEntry;
    }
    // Create injury with automatic availability update
    async createInjury(injuryData) {
        const savedInjury = await this.injuryRepository.save(injuryData);
        // Automatically update player availability
        if (savedInjury.playerId && savedInjury.recoveryStatus === 'active') {
            await this.availabilityRepository.save({
                playerId: savedInjury.playerId,
                availabilityStatus: 'injured',
                injuryId: savedInjury.id,
                effectiveDate: savedInjury.injuryDate,
                expectedReturnDate: savedInjury.expectedReturnDate,
                medicalClearanceRequired: true,
                isCurrent: true
            });
        }
        return savedInjury;
    }
    // Update injury with availability status changes
    async updateInjury(injuryId, updates) {
        const existingInjury = await this.injuryRepository.findById(injuryId);
        if (!existingInjury) {
            throw new Error('Injury not found');
        }
        const updatedInjury = await this.injuryRepository.save({
            ...existingInjury,
            ...updates,
            id: injuryId
        });
        // Update availability if recovery status changed
        if (updates.recoveryStatus && updates.recoveryStatus !== existingInjury.recoveryStatus) {
            if (updates.recoveryStatus === 'recovered') {
                await this.availabilityRepository.save({
                    playerId: updatedInjury.playerId,
                    availabilityStatus: 'available',
                    effectiveDate: new Date(),
                    isCurrent: true
                });
            }
        }
        return updatedInjury;
    }
    // Private helper methods
    calculateRiskFactors(injuries, wellness) {
        const risks = [];
        if (injuries.length > 0) {
            risks.push('Active injury');
        }
        if (wellness) {
            if (wellness.sleepHours < 7)
                risks.push('Insufficient sleep');
            if (wellness.stressLevel > 7)
                risks.push('High stress levels');
            if (wellness.sorenessLevel > 7)
                risks.push('High muscle soreness');
            if (wellness.energyLevel < 4)
                risks.push('Low energy levels');
        }
        return risks;
    }
    generateRecommendations(injuries, wellness) {
        const recommendations = [];
        if (injuries.length > 0) {
            recommendations.push('Follow prescribed treatment plan');
            recommendations.push('Regular check-ins with medical staff');
        }
        if (wellness) {
            if (wellness.sleepHours < 7)
                recommendations.push('Increase sleep duration to 7-9 hours');
            if (wellness.stressLevel > 7)
                recommendations.push('Consider stress management techniques');
            if (wellness.hydrationLevel < 6)
                recommendations.push('Increase daily water intake');
        }
        return recommendations;
    }
    calculateAverageRecoveryTime(injuries) {
        const recoveredInjuries = injuries.filter(injury => injury.recoveryStatus === 'recovered' && injury.expectedReturnDate);
        if (recoveredInjuries.length === 0)
            return 0;
        const totalDays = recoveredInjuries.reduce((sum, injury) => {
            const injuryDate = new Date(injury.injuryDate);
            const returnDate = new Date(injury.expectedReturnDate);
            const diffTime = Math.abs(returnDate.getTime() - injuryDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return sum + diffDays;
        }, 0);
        return Math.round(totalDays / recoveredInjuries.length);
    }
    async identifyHighRiskPlayers() {
        // Simple algorithm to identify players at higher injury risk
        // In a real implementation, this could use ML models
        const activeInjuries = await this.injuryRepository.findActiveInjuries();
        return activeInjuries
            .filter(injury => injury.severityLevel >= 3)
            .map(injury => injury.playerId);
    }
    validateWellnessEntry(data) {
        if (!data.playerId)
            throw new Error('Player ID is required');
        const validateRange = (value, min, max, field) => {
            if (value !== undefined && (value < min || value > max)) {
                throw new Error(`${field} must be between ${min} and ${max}`);
            }
        };
        validateRange(data.sleepQuality, 1, 10, 'Sleep quality');
        validateRange(data.energyLevel, 1, 10, 'Energy level');
        validateRange(data.stressLevel, 1, 10, 'Stress level');
        validateRange(data.sorenessLevel, 1, 10, 'Soreness level');
    }
    async updatePlayerAvailabilityFromWellness(wellness) {
        // Auto-flag players with concerning wellness metrics
        const concerningFactors = [];
        if (wellness.sleepHours < 5)
            concerningFactors.push('severe sleep deprivation');
        if (wellness.stressLevel > 8)
            concerningFactors.push('extreme stress');
        if (wellness.sorenessLevel > 8)
            concerningFactors.push('severe soreness');
        if (concerningFactors.length > 1) {
            // Create a load management availability entry
            await this.availabilityRepository.save({
                playerId: wellness.playerId,
                availabilityStatus: 'load_management',
                effectiveDate: wellness.entryDate,
                reason: `Wellness concerns: ${concerningFactors.join(', ')}`,
                isCurrent: true
            });
        }
    }
}
exports.CachedMedicalService = CachedMedicalService;
//# sourceMappingURL=CachedMedicalService.js.map