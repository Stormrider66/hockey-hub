import { BaseEntity } from '@hockey-hub/shared-lib';
export declare enum ProgressionPeriod {
    WEEKLY = "weekly",
    MONTHLY = "monthly",
    QUARTERLY = "quarterly",
    SEASONAL = "seasonal",
    YEARLY = "yearly"
}
export declare enum PerformanceCategory {
    STRENGTH = "strength",
    SPEED = "speed",
    ENDURANCE = "endurance",
    POWER = "power",
    FLEXIBILITY = "flexibility",
    SKILL = "skill",
    RECOVERY = "recovery",
    OVERALL = "overall"
}
export declare class PlayerProgressionHistory extends BaseEntity {
    playerId: string;
    organizationId: string;
    teamId: string;
    seasonId: string;
    periodType: ProgressionPeriod;
    periodStart: Date;
    periodEnd: Date;
    category: PerformanceCategory;
    ageAtPeriod: number;
    position: string;
    workoutMetrics: {
        totalSessions: number;
        completedSessions: number;
        completionRate: number;
        totalVolume: number;
        averageIntensity: number;
        sessionBreakdown: {
            strength: number;
            cardio: number;
            skill: number;
            recovery: number;
            mixed: number;
        };
        loadProgression: Array<{
            week: number;
            averageLoad: number;
            peakLoad: number;
            totalVolume: number;
        }>;
        adherenceMetrics: {
            onTimeRate: number;
            modificationRate: number;
            missedSessions: number;
            makeupSessions: number;
        };
    };
    performanceMetrics: {
        maxStrength?: {
            squat?: number;
            bench?: number;
            deadlift?: number;
            customExercises?: Record<string, number>;
        };
        speedMetrics?: {
            sprint10m?: number;
            sprint30m?: number;
            acceleration?: number;
            maxVelocity?: number;
        };
        enduranceMetrics?: {
            vo2Max?: number;
            lactateThreshold?: number;
            cooperTest?: number;
            beepTest?: number;
        };
        powerMetrics?: {
            verticalJump?: number;
            broadJump?: number;
            medicineballThrow?: number;
            peakPower?: number;
        };
        onIceMetrics?: {
            blueLineToBlueTime?: number;
            stopsAndStarts?: number;
            edgeWork?: number;
            shotVelocity?: number;
        };
        improvements: Record<string, {
            startValue: number;
            endValue: number;
            percentChange: number;
            percentileRank?: number;
        }>;
    };
    comparisonMetrics: {
        peerComparison: {
            ageGroup: {
                percentile: number;
                totalPeers: number;
                metrics: Record<string, number>;
            };
            position: {
                percentile: number;
                totalPeers: number;
                metrics: Record<string, number>;
            };
            team: {
                rank: number;
                totalPlayers: number;
                metrics: Record<string, number>;
            };
        };
        historicalComparison: {
            previousPeriod?: {
                percentChange: number;
                keyImprovements: string[];
                areasOfDecline: string[];
            };
            yearOverYear?: {
                percentChange: number;
                trendDirection: 'improving' | 'stable' | 'declining';
            };
        };
        benchmarks: {
            eliteLevel: Record<string, number>;
            currentLevel: Record<string, number>;
            gapToElite: Record<string, number>;
        };
    };
    healthMetrics: {
        injuryDays: number;
        illnessDays: number;
        modifiedTrainingDays: number;
        injuryHistory: Array<{
            date: Date;
            type: string;
            severity: string;
            recoveryDays: number;
            affectedTraining: string[];
        }>;
        wellnessScores: {
            averageSleep: number;
            averageStress: number;
            averageRecovery: number;
            averageNutrition: number;
        };
        loadManagement: {
            acuteChronicRatio: number[];
            highLoadDays: number;
            recoveryDays: number;
            optimalLoadDays: number;
        };
    };
    coachingNotes: Array<{
        date: Date;
        coachId: string;
        category: string;
        note: string;
        actionItems?: string[];
    }>;
    goals: {
        periodGoals: Array<{
            goalId: string;
            description: string;
            targetValue: number;
            achievedValue?: number;
            status: 'achieved' | 'partial' | 'missed';
            notes?: string;
        }>;
        nextPeriodGoals: Array<{
            goalId: string;
            description: string;
            targetValue: number;
            priority: 'high' | 'medium' | 'low';
            strategy?: string;
        }>;
    };
    externalData: {
        wearableData?: {
            source: string;
            metrics: Record<string, any>;
            lastSyncDate: Date;
        };
        gamePerformance?: {
            gamesPlayed: number;
            averageMinutes: number;
            performanceRating: number;
            keyStats: Record<string, number>;
        };
        nutritionData?: {
            complianceRate: number;
            averageCalories: number;
            macroBreakdown: Record<string, number>;
        };
    };
    overallProgressionScore: number;
    progressionTrend: 'rapid' | 'steady' | 'slow' | 'plateau' | 'declining';
    recommendations: {
        focusAreas: string[];
        suggestedWorkouts: string[];
        loadAdjustments: string;
        recoveryProtocol?: string;
        nutritionGuidance?: string;
    };
    metadata: {
        calculatedAt: Date;
        dataQuality: 'complete' | 'partial' | 'estimated';
        missingDataPoints?: string[];
        dataSource: string[];
        tags?: string[];
    };
    eventBusMetadata: {
        lastPublishedAt?: Date;
        publishedReports?: string[];
        sharedWithStaff?: string[];
        exportedFormats?: string[];
    };
    version: number;
}
//# sourceMappingURL=PlayerProgressionHistory.d.ts.map