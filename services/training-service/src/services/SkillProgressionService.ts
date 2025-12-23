// @ts-nocheck - Skill progression service
import { Repository } from 'typeorm';
import { Logger } from '@hockey-hub/shared-lib/dist/utils/Logger';
import { EventBus } from '@hockey-hub/shared-lib/dist/events/EventBus';
import { CachedRepository } from '@hockey-hub/shared-lib/dist/cache/CachedRepository';
import { AppDataSource } from '../config/database';
import { 
  SkillProgressionTracking,
  SkillMeasurement,
  Benchmarks,
  DrillHistory
} from '../entities/SkillProgressionTracking';

export interface CreateSkillTrackingDto {
  playerId: string;
  coachId: string;
  teamId: string;
  skillName: string;
  skillCategory: string;
  measurements: SkillMeasurement[];
  benchmarks?: Benchmarks;
  targetImprovement?: number;
  notes?: string;
}

export interface RecordMeasurementDto {
  value: number;
  unit: string;
  testDate: Date;
  testType: string;
  conditions?: string;
  notes?: string;
}

class SkillProgressionRepository extends CachedRepository<SkillProgressionTracking> {
  constructor() {
    super(AppDataSource.getRepository(SkillProgressionTracking), 'skill-progression', 1800);
  }

  async findByPlayer(playerId: string): Promise<SkillProgressionTracking[]> {
    return this.cacheQueryResult(
      `skill-progression:player:${playerId}`,
      async () => {
        return this.repository
          .createQueryBuilder('sp')
          .where('sp.playerId = :playerId', { playerId })
          .orderBy('sp.skillName', 'ASC')
          .getMany();
      },
      1800,
      [`player:${playerId}`]
    );
  }

  async findBySkill(skillName: string, teamId: string): Promise<SkillProgressionTracking[]> {
    return this.cacheQueryResult(
      `skill-progression:skill:${skillName}:team:${teamId}`,
      async () => {
        return this.repository
          .createQueryBuilder('sp')
          .where('sp.skillName = :skillName', { skillName })
          .andWhere('sp.teamId = :teamId', { teamId })
          .getMany();
      },
      900,
      [`skill:${skillName}`, `team:${teamId}`]
    );
  }
}

export class SkillProgressionService {
  private repository: SkillProgressionRepository;
  private logger: Logger;
  private eventBus: EventBus;

  constructor() {
    this.repository = new SkillProgressionRepository();
    this.logger = new Logger('SkillProgressionService');
    this.eventBus = EventBus.getInstance();
  }

  async createSkillTracking(data: CreateSkillTrackingDto): Promise<SkillProgressionTracking> {
    this.logger.info('Creating skill tracking', { 
      playerId: data.playerId, 
      skillName: data.skillName 
    });

    try {
      const tracking = await this.repository.save({
        ...data,
        drillHistory: [],
        lastUpdated: new Date()
      } as any);

      await this.eventBus.publish('skill-tracking.created', {
        trackingId: tracking.id,
        playerId: data.playerId,
        skillName: data.skillName
      });

      return tracking;
    } catch (error) {
      this.logger.error('Error creating skill tracking', { error: error.message, data });
      throw error;
    }
  }

  async recordMeasurement(
    trackingId: string,
    measurement: RecordMeasurementDto
  ): Promise<SkillProgressionTracking> {
    const tracking = await this.repository.findOne({ where: { id: trackingId } as any });
    if (!tracking) {
      throw new Error('Skill tracking not found');
    }

    const newMeasurement: SkillMeasurement = {
      ...measurement,
      id: `${Date.now()}-${Math.random()}`
    };

    tracking.measurements.push(newMeasurement);
    tracking.lastUpdated = new Date();

    const updated = await this.repository.save(tracking);

    await this.eventBus.publish('skill-measurement.recorded', {
      trackingId,
      playerId: tracking.playerId,
      skillName: tracking.skillName,
      value: measurement.value,
      improvement: this.calculateImprovement(tracking.measurements)
    });

    return updated;
  }

  async getPlayerSkillProgress(playerId: string): Promise<SkillProgressionTracking[]> {
    return this.repository.findByPlayer(playerId);
  }

  async getTeamSkillComparison(
    teamId: string,
    skillName: string
  ): Promise<{
    skill: string;
    playerComparisons: Array<{
      playerId: string;
      latestValue: number;
      improvement: number;
      trend: 'improving' | 'declining' | 'stable';
      ranking: number;
    }>;
    teamAverage: number;
    topPerformers: string[];
  }> {
    const trackings = await this.repository.findBySkill(skillName, teamId);
    
    const comparisons = trackings.map(tracking => {
      const measurements = tracking.measurements.sort(
        (a, b) => new Date(b.testDate).getTime() - new Date(a.testDate).getTime()
      );
      
      const latestValue = measurements[0]?.value || 0;
      const improvement = this.calculateImprovement(measurements);
      const trend = this.determineTrend(measurements);

      return {
        playerId: tracking.playerId,
        latestValue,
        improvement,
        trend
      };
    }).sort((a, b) => b.latestValue - a.latestValue);

    // Add rankings
    const playerComparisons = comparisons.map((comp, index) => ({
      ...comp,
      ranking: index + 1
    }));

    const teamAverage = comparisons.length > 0
      ? comparisons.reduce((sum, comp) => sum + comp.latestValue, 0) / comparisons.length
      : 0;

    const topPerformers = comparisons.slice(0, 3).map(comp => comp.playerId);

    return {
      skill: skillName,
      playerComparisons,
      teamAverage,
      topPerformers
    };
  }

  async addDrillResult(
    trackingId: string,
    drillResult: {
      drillName: string;
      date: Date;
      result: number;
      notes?: string;
    }
  ): Promise<SkillProgressionTracking> {
    const tracking = await this.repository.findOne({ where: { id: trackingId } as any });
    if (!tracking) {
      throw new Error('Skill tracking not found');
    }

    const drillHistory: DrillHistory = {
      id: `${Date.now()}-${Math.random()}`,
      ...drillResult
    };

    tracking.drillHistory.push(drillHistory);
    tracking.lastUpdated = new Date();

    return this.repository.save(tracking);
  }

  async getSkillProgressReport(
    playerId: string,
    skillNames?: string[]
  ): Promise<{
    totalSkills: number;
    improvingSkills: number;
    decliningSkills: number;
    stableSkills: number;
    skillDetails: Array<{
      skillName: string;
      currentValue: number;
      improvement: number;
      trend: string;
      measurementCount: number;
      lastTested: Date;
    }>;
  }> {
    let trackings = await this.repository.findByPlayer(playerId);
    
    if (skillNames) {
      trackings = trackings.filter(t => skillNames.includes(t.skillName));
    }

    let improvingSkills = 0;
    let decliningSkills = 0;
    let stableSkills = 0;

    const skillDetails = trackings.map(tracking => {
      const measurements = tracking.measurements.sort(
        (a, b) => new Date(b.testDate).getTime() - new Date(a.testDate).getTime()
      );
      
      const currentValue = measurements[0]?.value || 0;
      const improvement = this.calculateImprovement(measurements);
      const trend = this.determineTrend(measurements);
      
      if (trend === 'improving') improvingSkills++;
      else if (trend === 'declining') decliningSkills++;
      else stableSkills++;

      return {
        skillName: tracking.skillName,
        currentValue,
        improvement,
        trend,
        measurementCount: measurements.length,
        lastTested: measurements[0]?.testDate || new Date()
      };
    });

    return {
      totalSkills: trackings.length,
      improvingSkills,
      decliningSkills,
      stableSkills,
      skillDetails
    };
  }

  private calculateImprovement(measurements: SkillMeasurement[]): number {
    if (measurements.length < 2) return 0;
    
    const sorted = measurements.sort(
      (a, b) => new Date(a.testDate).getTime() - new Date(b.testDate).getTime()
    );
    
    const first = sorted[0].value;
    const latest = sorted[sorted.length - 1].value;
    
    return ((latest - first) / first) * 100;
  }

  private determineTrend(measurements: SkillMeasurement[]): 'improving' | 'declining' | 'stable' {
    if (measurements.length < 3) return 'stable';
    
    const recent = measurements
      .sort((a, b) => new Date(b.testDate).getTime() - new Date(a.testDate).getTime())
      .slice(0, 3);
    
    const values = recent.map(m => m.value);
    const avgRecent = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    const older = measurements.slice(3, 6);
    if (older.length === 0) return 'stable';
    
    const avgOlder = older.reduce((sum, m) => sum + m.value, 0) / older.length;
    
    const improvement = ((avgRecent - avgOlder) / avgOlder) * 100;
    
    if (improvement > 5) return 'improving';
    if (improvement < -5) return 'declining';
    return 'stable';
  }
}