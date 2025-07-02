import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialStatisticsSchema1735500100000 implements MigrationInterface {
  name = 'InitialStatisticsSchema1735500100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create player_performance_stats table
    await queryRunner.query(`
      CREATE TABLE "player_performance_stats" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "playerId" uuid NOT NULL,
        "gameId" uuid,
        "sessionId" uuid,
        "teamId" uuid NOT NULL,
        "organizationId" uuid NOT NULL,
        "date" date NOT NULL,
        "periodType" varchar(50) NOT NULL DEFAULT 'game',
        "goals" integer NOT NULL DEFAULT '0',
        "assists" integer NOT NULL DEFAULT '0',
        "points" integer NOT NULL DEFAULT '0',
        "plusMinus" integer NOT NULL DEFAULT '0',
        "penaltyMinutes" integer NOT NULL DEFAULT '0',
        "shots" integer NOT NULL DEFAULT '0',
        "hits" integer NOT NULL DEFAULT '0',
        "blockedShots" integer NOT NULL DEFAULT '0',
        "faceoffsWon" integer NOT NULL DEFAULT '0',
        "faceoffsTotal" integer NOT NULL DEFAULT '0',
        "powerPlayGoals" integer NOT NULL DEFAULT '0',
        "powerPlayAssists" integer NOT NULL DEFAULT '0',
        "shortHandedGoals" integer NOT NULL DEFAULT '0',
        "shortHandedAssists" integer NOT NULL DEFAULT '0',
        "timeOnIce" decimal(5,2),
        "powerPlayTimeOnIce" decimal(5,2),
        "penaltyKillTimeOnIce" decimal(5,2),
        "shootingPercentage" decimal(5,2),
        "faceoffPercentage" decimal(5,2),
        "corsiFor" integer NOT NULL DEFAULT '0',
        "corsiAgainst" integer NOT NULL DEFAULT '0',
        "corsiPercentage" decimal(5,2),
        "fenwickFor" integer NOT NULL DEFAULT '0',
        "fenwickAgainst" integer NOT NULL DEFAULT '0',
        "fenwickPercentage" decimal(5,2),
        "savePercentage" decimal(5,3),
        "goalsAgainst" integer NOT NULL DEFAULT '0',
        "saves" integer NOT NULL DEFAULT '0',
        "shotsAgainst" integer NOT NULL DEFAULT '0',
        "wins" integer NOT NULL DEFAULT '0',
        "losses" integer NOT NULL DEFAULT '0',
        "overtimeLosses" integer NOT NULL DEFAULT '0',
        "shutouts" integer NOT NULL DEFAULT '0',
        "goalsAgainstAverage" decimal(4,2),
        "wellnessScore" decimal(3,1),
        "sleepHours" decimal(3,1),
        "fatigueLevel" decimal(3,1),
        "hrvScore" decimal(5,1),
        "injuryStatus" varchar(50),
        "trainingLoad" decimal(5,2),
        "acuteLoad" decimal(5,2),
        "chronicLoad" decimal(5,2),
        "acwr" decimal(4,2),
        "performanceScore" decimal(3,1),
        "movementQuality" decimal(3,1),
        "recoveryRate" decimal(3,1),
        "playerPosition" varchar(20),
        "jerseyNumber" integer,
        "opponentId" uuid,
        "opponentName" varchar(100),
        "gameType" varchar(50),
        "gameLocation" varchar(20),
        "gameResult" varchar(10),
        "aggregatedStats" jsonb,
        "metadata" jsonb,
        "status" varchar(50) NOT NULL DEFAULT 'final',
        "createdBy" varchar(255),
        "updatedBy" varchar(255),
        "deletedAt" TIMESTAMP,
        "deletedBy" varchar(255),
        "lastRequestId" varchar(255),
        "lastIpAddress" varchar(45),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_player_performance_stats" PRIMARY KEY ("id")
      )
    `);

    // Create team_analytics table
    await queryRunner.query(`
      CREATE TABLE "team_analytics" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "teamId" uuid NOT NULL,
        "organizationId" uuid NOT NULL,
        "seasonId" uuid,
        "gameId" uuid,
        "date" date NOT NULL,
        "periodType" varchar(50) NOT NULL DEFAULT 'game',
        "gamesPlayed" integer NOT NULL DEFAULT '0',
        "wins" integer NOT NULL DEFAULT '0',
        "losses" integer NOT NULL DEFAULT '0',
        "overtimeLosses" integer NOT NULL DEFAULT '0',
        "ties" integer NOT NULL DEFAULT '0',
        "points" integer NOT NULL DEFAULT '0',
        "winPercentage" decimal(5,2),
        "goalsFor" integer NOT NULL DEFAULT '0',
        "goalsAgainst" integer NOT NULL DEFAULT '0',
        "goalDifferential" integer NOT NULL DEFAULT '0',
        "goalsForPerGame" decimal(5,2),
        "goalsAgainstPerGame" decimal(5,2),
        "shots" integer NOT NULL DEFAULT '0',
        "shotsAgainst" integer NOT NULL DEFAULT '0',
        "shootingPercentage" decimal(5,2),
        "savePercentage" decimal(5,3),
        "powerPlayGoals" integer NOT NULL DEFAULT '0',
        "powerPlayOpportunities" integer NOT NULL DEFAULT '0',
        "powerPlayPercentage" decimal(5,2),
        "penaltyKillPercentage" decimal(5,2),
        "penaltyMinutes" integer NOT NULL DEFAULT '0',
        "hits" integer NOT NULL DEFAULT '0',
        "blockedShots" integer NOT NULL DEFAULT '0',
        "giveaways" integer NOT NULL DEFAULT '0',
        "takeaways" integer NOT NULL DEFAULT '0',
        "faceoffWins" integer NOT NULL DEFAULT '0',
        "faceoffLosses" integer NOT NULL DEFAULT '0',
        "faceoffPercentage" decimal(5,2),
        "corsiFor" integer NOT NULL DEFAULT '0',
        "corsiAgainst" integer NOT NULL DEFAULT '0',
        "corsiPercentage" decimal(5,2),
        "fenwickFor" integer NOT NULL DEFAULT '0',
        "fenwickAgainst" integer NOT NULL DEFAULT '0',
        "fenwickPercentage" decimal(5,2),
        "pdo" decimal(5,1),
        "zoneStartsOffensive" integer NOT NULL DEFAULT '0',
        "zoneStartsDefensive" integer NOT NULL DEFAULT '0',
        "zoneStartsNeutral" integer NOT NULL DEFAULT '0',
        "lineStatistics" jsonb,
        "playerStatistics" jsonb,
        "opponentStatistics" jsonb,
        "specialTeamsStatistics" jsonb,
        "periodStatistics" jsonb,
        "homeRecord" varchar(20),
        "awayRecord" varchar(20),
        "divisionRecord" varchar(20),
        "conferenceRecord" varchar(20),
        "last10Record" varchar(20),
        "streak" varchar(20),
        "currentRank" integer,
        "divisionRank" integer,
        "conferenceRank" integer,
        "metadata" jsonb,
        "status" varchar(50) NOT NULL DEFAULT 'final',
        "createdBy" varchar(255),
        "updatedBy" varchar(255),
        "deletedAt" TIMESTAMP,
        "deletedBy" varchar(255),
        "lastRequestId" varchar(255),
        "lastIpAddress" varchar(45),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_team_analytics" PRIMARY KEY ("id")
      )
    `);

    // Create workload_analytics table
    await queryRunner.query(`
      CREATE TABLE "workload_analytics" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "playerId" uuid NOT NULL,
        "teamId" uuid NOT NULL,
        "organizationId" uuid NOT NULL,
        "date" date NOT NULL,
        "periodType" varchar(50) NOT NULL DEFAULT 'weekly',
        "minutesPlayed" decimal(6,2) NOT NULL DEFAULT '0',
        "gamesPlayed" integer NOT NULL DEFAULT '0',
        "practicesAttended" integer NOT NULL DEFAULT '0',
        "totalSessions" integer NOT NULL DEFAULT '0',
        "weeklyLoad" decimal(8,2) NOT NULL DEFAULT '0',
        "acuteLoad" decimal(8,2) NOT NULL DEFAULT '0',
        "chronicLoad" decimal(8,2) NOT NULL DEFAULT '0',
        "acwr" decimal(4,2),
        "monotony" decimal(4,2),
        "strain" decimal(8,2),
        "fitness" decimal(8,2),
        "fatigue" decimal(8,2),
        "trainingStressBalance" decimal(6,2),
        "injuryRiskScore" decimal(3,1),
        "riskLevel" varchar(20) DEFAULT 'low',
        "physicalReadiness" decimal(3,1),
        "mentalReadiness" decimal(3,1),
        "overallReadiness" decimal(3,1),
        "recoveryScore" decimal(3,1),
        "performanceTrend" varchar(20),
        "performanceChange" decimal(5,2),
        "strengthLoad" decimal(6,2) NOT NULL DEFAULT '0',
        "cardioLoad" decimal(6,2) NOT NULL DEFAULT '0',
        "speedLoad" decimal(6,2) NOT NULL DEFAULT '0',
        "powerLoad" decimal(6,2) NOT NULL DEFAULT '0',
        "skillsLoad" decimal(6,2) NOT NULL DEFAULT '0',
        "totalLoad" decimal(8,2) NOT NULL DEFAULT '0',
        "daysSinceLastOff" integer NOT NULL DEFAULT '0',
        "consecutiveHighLoads" integer NOT NULL DEFAULT '0',
        "loadOptimizationScore" decimal(3,1),
        "loadDistribution" jsonb,
        "wellnessMetrics" jsonb,
        "recommendations" jsonb,
        "alerts" jsonb,
        "status" varchar(50) NOT NULL DEFAULT 'active',
        "metadata" jsonb,
        "createdBy" varchar(255),
        "updatedBy" varchar(255),
        "deletedAt" TIMESTAMP,
        "deletedBy" varchar(255),
        "lastRequestId" varchar(255),
        "lastIpAddress" varchar(45),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_workload_analytics" PRIMARY KEY ("id")
      )
    `);

    // Create training_statistics table
    await queryRunner.query(`
      CREATE TABLE "training_statistics" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "playerId" uuid NOT NULL,
        "teamId" uuid NOT NULL,
        "organizationId" uuid NOT NULL,
        "sessionId" uuid,
        "date" date NOT NULL,
        "trainingType" varchar(50) NOT NULL,
        "completionRate" decimal(5,2) NOT NULL DEFAULT '0',
        "averageIntensity" decimal(5,2),
        "totalWorkload" decimal(5,2),
        "durationMinutes" integer,
        "exercisesCompleted" integer,
        "exercisesTotal" integer,
        "strengthLoad" decimal(5,2),
        "cardioLoad" decimal(5,2),
        "skillsLoad" decimal(5,2),
        "recoveryLoad" decimal(5,2),
        "averageHeartRate" decimal(5,2),
        "maxHeartRate" decimal(5,2),
        "caloriesBurned" decimal(5,2),
        "rpe" decimal(5,2),
        "goalsAchieved" jsonb,
        "overallGoalAchievementRate" decimal(5,2),
        "improvementFromLastSession" decimal(5,2),
        "improvementFromBaseline" decimal(5,2),
        "weeklyImprovementRate" decimal(5,2),
        "exercisePerformance" jsonb,
        "programEffectivenessScore" decimal(5,2),
        "programName" varchar(100),
        "programPhase" varchar(50),
        "attended" boolean NOT NULL DEFAULT true,
        "attendanceRate" decimal(5,2),
        "complianceScore" decimal(5,2),
        "injuryRiskScore" decimal(5,2),
        "recoveryScore" decimal(5,2),
        "fatigueLevel" decimal(5,2),
        "status" varchar(50) NOT NULL DEFAULT 'completed',
        "metadata" jsonb,
        "createdBy" varchar(255),
        "updatedBy" varchar(255),
        "deletedAt" TIMESTAMP,
        "deletedBy" varchar(255),
        "lastRequestId" varchar(255),
        "lastIpAddress" varchar(45),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_training_statistics" PRIMARY KEY ("id")
      )
    `);

    // Create facility_analytics table
    await queryRunner.query(`
      CREATE TABLE "facility_analytics" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "facilityId" uuid NOT NULL,
        "organizationId" uuid NOT NULL,
        "date" date NOT NULL,
        "facilityType" varchar(50) NOT NULL,
        "facilityName" varchar(100) NOT NULL,
        "utilizationRate" decimal(5,2) NOT NULL DEFAULT '0',
        "totalBookings" integer NOT NULL DEFAULT '0',
        "successfulBookings" integer NOT NULL DEFAULT '0',
        "cancelledBookings" integer NOT NULL DEFAULT '0',
        "noShowBookings" integer NOT NULL DEFAULT '0',
        "totalHoursBooked" decimal(5,2) NOT NULL DEFAULT '0',
        "totalHoursAvailable" decimal(5,2) NOT NULL DEFAULT '0',
        "peakHoursUtilization" decimal(5,2) NOT NULL DEFAULT '0',
        "offPeakHoursUtilization" decimal(5,2) NOT NULL DEFAULT '0',
        "hourlyUsage" jsonb,
        "dailyPatterns" jsonb,
        "peakDay" varchar(20),
        "peakHour" integer,
        "totalRevenue" decimal(10,2) NOT NULL DEFAULT '0',
        "revenuePerHour" decimal(10,2) NOT NULL DEFAULT '0',
        "revenuePerBooking" decimal(10,2) NOT NULL DEFAULT '0',
        "revenueCategory" varchar(50),
        "revenueBreakdown" jsonb,
        "costPerHour" decimal(5,2),
        "profitMargin" decimal(5,2),
        "averageBookingDuration" decimal(5,2),
        "averageAdvanceBooking" decimal(5,2),
        "repeatCustomerRate" decimal(5,2) NOT NULL DEFAULT '0',
        "uniqueCustomers" integer NOT NULL DEFAULT '0',
        "customerSatisfactionScore" decimal(5,2) NOT NULL DEFAULT '0',
        "turnoverRate" decimal(5,2),
        "setupTime" decimal(5,2),
        "cleanupTime" decimal(5,2),
        "maintenanceTime" decimal(5,2),
        "downtime" decimal(5,2),
        "optimizationSuggestions" jsonb,
        "unutilizedCapacity" decimal(5,2),
        "revenueOpportunity" decimal(8,2),
        "bookingConflicts" integer NOT NULL DEFAULT '0',
        "doubleBookings" integer NOT NULL DEFAULT '0',
        "overbookings" integer NOT NULL DEFAULT '0',
        "conflictResolutionTime" decimal(5,2) NOT NULL DEFAULT '0',
        "equipmentUsage" jsonb,
        "staffAssignment" jsonb,
        "temperature" decimal(5,2),
        "humidity" decimal(5,2),
        "energyCost" decimal(8,2),
        "energyEfficiency" decimal(5,2),
        "status" varchar(50) NOT NULL DEFAULT 'active',
        "metadata" jsonb,
        "createdBy" varchar(255),
        "updatedBy" varchar(255),
        "deletedAt" TIMESTAMP,
        "deletedBy" varchar(255),
        "lastRequestId" varchar(255),
        "lastIpAddress" varchar(45),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_facility_analytics" PRIMARY KEY ("id")
      )
    `);

    // Create indexes for player_performance_stats
    await queryRunner.query(`CREATE INDEX "IDX_player_performance_stats_playerId_date_periodType" ON "player_performance_stats" ("playerId", "date", "periodType")`);
    await queryRunner.query(`CREATE INDEX "IDX_player_performance_stats_teamId_date_periodType" ON "player_performance_stats" ("teamId", "date", "periodType")`);
    await queryRunner.query(`CREATE INDEX "IDX_player_performance_stats_organizationId_date" ON "player_performance_stats" ("organizationId", "date")`);
    await queryRunner.query(`CREATE INDEX "IDX_player_performance_stats_playerId" ON "player_performance_stats" ("playerId")`);
    await queryRunner.query(`CREATE INDEX "IDX_player_performance_stats_gameId" ON "player_performance_stats" ("gameId")`);
    await queryRunner.query(`CREATE INDEX "IDX_player_performance_stats_teamId" ON "player_performance_stats" ("teamId")`);
    await queryRunner.query(`CREATE INDEX "IDX_player_performance_stats_organizationId" ON "player_performance_stats" ("organizationId")`);
    await queryRunner.query(`CREATE INDEX "IDX_player_performance_stats_date" ON "player_performance_stats" ("date")`);
    await queryRunner.query(`CREATE INDEX "IDX_player_performance_stats_periodType" ON "player_performance_stats" ("periodType")`);
    await queryRunner.query(`CREATE INDEX "IDX_player_performance_stats_status" ON "player_performance_stats" ("status")`);

    // Create indexes for team_analytics
    await queryRunner.query(`CREATE INDEX "IDX_team_analytics_teamId_date_periodType" ON "team_analytics" ("teamId", "date", "periodType")`);
    await queryRunner.query(`CREATE INDEX "IDX_team_analytics_organizationId_date" ON "team_analytics" ("organizationId", "date")`);
    await queryRunner.query(`CREATE INDEX "IDX_team_analytics_teamId" ON "team_analytics" ("teamId")`);
    await queryRunner.query(`CREATE INDEX "IDX_team_analytics_organizationId" ON "team_analytics" ("organizationId")`);
    await queryRunner.query(`CREATE INDEX "IDX_team_analytics_seasonId" ON "team_analytics" ("seasonId")`);
    await queryRunner.query(`CREATE INDEX "IDX_team_analytics_gameId" ON "team_analytics" ("gameId")`);
    await queryRunner.query(`CREATE INDEX "IDX_team_analytics_date" ON "team_analytics" ("date")`);
    await queryRunner.query(`CREATE INDEX "IDX_team_analytics_periodType" ON "team_analytics" ("periodType")`);
    await queryRunner.query(`CREATE INDEX "IDX_team_analytics_status" ON "team_analytics" ("status")`);

    // Create indexes for workload_analytics
    await queryRunner.query(`CREATE INDEX "IDX_workload_analytics_playerId_date_periodType" ON "workload_analytics" ("playerId", "date", "periodType")`);
    await queryRunner.query(`CREATE INDEX "IDX_workload_analytics_teamId_date" ON "workload_analytics" ("teamId", "date")`);
    await queryRunner.query(`CREATE INDEX "IDX_workload_analytics_organizationId_date" ON "workload_analytics" ("organizationId", "date")`);
    await queryRunner.query(`CREATE INDEX "IDX_workload_analytics_playerId" ON "workload_analytics" ("playerId")`);
    await queryRunner.query(`CREATE INDEX "IDX_workload_analytics_teamId" ON "workload_analytics" ("teamId")`);
    await queryRunner.query(`CREATE INDEX "IDX_workload_analytics_organizationId" ON "workload_analytics" ("organizationId")`);
    await queryRunner.query(`CREATE INDEX "IDX_workload_analytics_date" ON "workload_analytics" ("date")`);
    await queryRunner.query(`CREATE INDEX "IDX_workload_analytics_periodType" ON "workload_analytics" ("periodType")`);
    await queryRunner.query(`CREATE INDEX "IDX_workload_analytics_riskLevel" ON "workload_analytics" ("riskLevel")`);
    await queryRunner.query(`CREATE INDEX "IDX_workload_analytics_status" ON "workload_analytics" ("status")`);

    // Create indexes for training_statistics
    await queryRunner.query(`CREATE INDEX "IDX_training_statistics_playerId_sessionId_date" ON "training_statistics" ("playerId", "sessionId", "date")`);
    await queryRunner.query(`CREATE INDEX "IDX_training_statistics_teamId_trainingType_date" ON "training_statistics" ("teamId", "trainingType", "date")`);
    await queryRunner.query(`CREATE INDEX "IDX_training_statistics_organizationId_date" ON "training_statistics" ("organizationId", "date")`);
    await queryRunner.query(`CREATE INDEX "IDX_training_statistics_playerId" ON "training_statistics" ("playerId")`);
    await queryRunner.query(`CREATE INDEX "IDX_training_statistics_teamId" ON "training_statistics" ("teamId")`);
    await queryRunner.query(`CREATE INDEX "IDX_training_statistics_organizationId" ON "training_statistics" ("organizationId")`);
    await queryRunner.query(`CREATE INDEX "IDX_training_statistics_sessionId" ON "training_statistics" ("sessionId")`);
    await queryRunner.query(`CREATE INDEX "IDX_training_statistics_date" ON "training_statistics" ("date")`);
    await queryRunner.query(`CREATE INDEX "IDX_training_statistics_trainingType" ON "training_statistics" ("trainingType")`);
    await queryRunner.query(`CREATE INDEX "IDX_training_statistics_status" ON "training_statistics" ("status")`);

    // Create indexes for facility_analytics
    await queryRunner.query(`CREATE INDEX "IDX_facility_analytics_facilityId_date" ON "facility_analytics" ("facilityId", "date")`);
    await queryRunner.query(`CREATE INDEX "IDX_facility_analytics_organizationId_facilityType_date" ON "facility_analytics" ("organizationId", "facilityType", "date")`);
    await queryRunner.query(`CREATE INDEX "IDX_facility_analytics_date_revenueCategory" ON "facility_analytics" ("date", "revenueCategory")`);
    await queryRunner.query(`CREATE INDEX "IDX_facility_analytics_facilityId" ON "facility_analytics" ("facilityId")`);
    await queryRunner.query(`CREATE INDEX "IDX_facility_analytics_organizationId" ON "facility_analytics" ("organizationId")`);
    await queryRunner.query(`CREATE INDEX "IDX_facility_analytics_date" ON "facility_analytics" ("date")`);
    await queryRunner.query(`CREATE INDEX "IDX_facility_analytics_facilityType" ON "facility_analytics" ("facilityType")`);
    await queryRunner.query(`CREATE INDEX "IDX_facility_analytics_revenueCategory" ON "facility_analytics" ("revenueCategory")`);
    await queryRunner.query(`CREATE INDEX "IDX_facility_analytics_status" ON "facility_analytics" ("status")`);

    // Create partial indexes for soft deletes optimization
    await queryRunner.query(`CREATE INDEX "IDX_player_performance_stats_active" ON "player_performance_stats" ("playerId", "date") WHERE "deletedAt" IS NULL`);
    await queryRunner.query(`CREATE INDEX "IDX_team_analytics_active" ON "team_analytics" ("teamId", "date") WHERE "deletedAt" IS NULL`);
    await queryRunner.query(`CREATE INDEX "IDX_workload_analytics_active" ON "workload_analytics" ("playerId", "date") WHERE "deletedAt" IS NULL`);
    await queryRunner.query(`CREATE INDEX "IDX_training_statistics_active" ON "training_statistics" ("playerId", "date") WHERE "deletedAt" IS NULL`);
    await queryRunner.query(`CREATE INDEX "IDX_facility_analytics_active" ON "facility_analytics" ("facilityId", "date") WHERE "deletedAt" IS NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_facility_analytics_active"`);
    await queryRunner.query(`DROP INDEX "IDX_training_statistics_active"`);
    await queryRunner.query(`DROP INDEX "IDX_workload_analytics_active"`);
    await queryRunner.query(`DROP INDEX "IDX_team_analytics_active"`);
    await queryRunner.query(`DROP INDEX "IDX_player_performance_stats_active"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "facility_analytics"`);
    await queryRunner.query(`DROP TABLE "training_statistics"`);
    await queryRunner.query(`DROP TABLE "workload_analytics"`);
    await queryRunner.query(`DROP TABLE "team_analytics"`);
    await queryRunner.query(`DROP TABLE "player_performance_stats"`);
  }
}