/**
 * AI-Powered Player Distribution Service
 * 
 * Implements intelligent algorithms for distributing players across training sessions
 * using k-means clustering, fitness assessment, and load balancing.
 */

import type { PlayerData, TeamData } from '../components/shared/PlayerTeamAssignment';
import type { PlayerReadiness, MedicalRestriction } from '../types';

// Types for AI distribution
export interface FitnessLevel {
  overall: number; // 0-100
  strength: number;
  endurance: number;
  agility: number;
  recovery: number;
}

export interface PlayerAIProfile {
  id: string;
  name: string;
  position: string;
  fitnessLevel: FitnessLevel;
  injuryRisk: number; // 0-100
  currentLoad: number; // 0-120%
  fatigue: number; // 0-100
  availability: number; // 0-100
  medicalRestrictions: MedicalRestriction[];
  historicalPerformance: {
    consistency: number; // 0-100
    improvement: number; // -50 to 50
    compliance: number; // 0-100
  };
}

export interface PlayerCluster {
  id: string;
  name: string;
  centroid: number[];
  players: PlayerAIProfile[];
  characteristics: string[];
  recommendedLoad: number; // 0-100%
}

export interface DistributionStrategy {
  name: string;
  description: string;
  algorithm: 'balanced' | 'fitness-based' | 'position-based' | 'recovery-focused';
  parameters: {
    maxPlayersPerSession?: number;
    minFitnessVariation?: number;
    prioritizeRecovery?: boolean;
    balancePositions?: boolean;
  };
}

export interface DistributionResult {
  sessionGroups: PlayerGroup[];
  reasoning: string[];
  confidenceScore: number; // 0-100
  alternativeOptions: AlternativeDistribution[];
  warnings: string[];
}

export interface PlayerGroup {
  id: string;
  name: string;
  players: PlayerAIProfile[];
  recommendedIntensity: 'low' | 'medium' | 'high';
  estimatedDuration: number; // minutes
  equipment: string[];
  notes: string[];
}

export interface AlternativeDistribution {
  name: string;
  sessionGroups: PlayerGroup[];
  pros: string[];
  cons: string[];
  score: number; // 0-100
}

export class PlayerDistributionAI {
  private readonly K_MEANS_MAX_ITERATIONS = 100;
  private readonly CONVERGENCE_THRESHOLD = 0.001;

  /**
   * Generate AI profiles for players based on historical data
   */
  generatePlayerProfiles(
    players: PlayerData[],
    readinessData?: PlayerReadiness[],
    medicalRestrictions?: MedicalRestriction[]
  ): PlayerAIProfile[] {
    return players.map(player => {
      const readiness = readinessData?.find(r => r.playerId === player.id);
      const restrictions = medicalRestrictions?.filter(r => r.playerId === player.id) || [];
      
      // Simulate fitness assessment based on position and historical data
      const fitnessLevel = this.assessFitnessLevel(player, readiness);
      const injuryRisk = this.calculateInjuryRisk(player, restrictions, readiness);
      const currentLoad = readiness?.load || this.estimateCurrentLoad(player);
      const fatigue = this.calculateFatigue(readiness, currentLoad);
      
      return {
        id: player.id,
        name: player.name,
        position: player.position || 'Unknown',
        fitnessLevel,
        injuryRisk,
        currentLoad,
        fatigue,
        availability: this.calculateAvailability(player, restrictions),
        medicalRestrictions: restrictions,
        historicalPerformance: this.generateHistoricalPerformance(player)
      };
    });
  }

  /**
   * Perform k-means clustering to group similar players
   */
  clusterPlayers(players: PlayerAIProfile[], k: number = 4): PlayerCluster[] {
    if (players.length < k) {
      // If not enough players, create single cluster
      return [{
        id: 'cluster-1',
        name: 'All Players',
        centroid: this.calculateCentroid(players),
        players,
        characteristics: this.identifyClusterCharacteristics(players),
        recommendedLoad: this.calculateRecommendedLoad(players)
      }];
    }

    // Initialize centroids randomly
    let centroids = this.initializeCentroids(players, k);
    let clusters: PlayerCluster[] = [];
    let iteration = 0;

    while (iteration < this.K_MEANS_MAX_ITERATIONS) {
      // Assign players to nearest centroid
      const newClusters = this.assignPlayersToCluster(players, centroids);
      
      // Calculate new centroids
      const newCentroids = newClusters.map(cluster => 
        this.calculateCentroid(cluster.players)
      );

      // Check for convergence
      if (this.hasConverged(centroids, newCentroids)) {
        clusters = newClusters.map((cluster, index) => ({
          ...cluster,
          id: `cluster-${index + 1}`,
          name: `Group ${index + 1}`,
          characteristics: this.identifyClusterCharacteristics(cluster.players),
          recommendedLoad: this.calculateRecommendedLoad(cluster.players)
        }));
        break;
      }

      centroids = newCentroids;
      clusters = newClusters;
      iteration++;
    }

    return clusters;
  }

  /**
   * Distribute players across sessions using specified strategy
   */
  distributePlayersAcrossSessions(
    players: PlayerAIProfile[],
    strategy: DistributionStrategy,
    sessionCount: number = 2
  ): DistributionResult {
    const clusters = this.clusterPlayers(players, Math.min(players.length, sessionCount + 1));
    
    let sessionGroups: PlayerGroup[];
    let reasoning: string[] = [];
    let warnings: string[] = [];

    switch (strategy.algorithm) {
      case 'balanced':
        sessionGroups = this.createBalancedDistribution(clusters, sessionCount);
        reasoning.push('Players distributed evenly across sessions for balanced training loads');
        break;

      case 'fitness-based':
        sessionGroups = this.createFitnessBasedDistribution(clusters, sessionCount);
        reasoning.push('Players grouped by similar fitness levels for targeted training');
        break;

      case 'position-based':
        sessionGroups = this.createPositionBasedDistribution(players, sessionCount);
        reasoning.push('Players grouped by position for role-specific training');
        break;

      case 'recovery-focused':
        sessionGroups = this.createRecoveryFocusedDistribution(players, sessionCount);
        reasoning.push('Distribution prioritizes player recovery needs');
        warnings.push('Some high-fatigue players may need reduced intensity');
        break;

      default:
        sessionGroups = this.createBalancedDistribution(clusters, sessionCount);
        reasoning.push('Default balanced distribution applied');
    }

    // Apply strategy parameters
    sessionGroups = this.applyStrategyParameters(sessionGroups, strategy.parameters);

    // Generate alternatives
    const alternativeOptions = this.generateAlternativeDistributions(players, sessionCount);

    return {
      sessionGroups,
      reasoning,
      confidenceScore: this.calculateConfidenceScore(sessionGroups, strategy),
      alternativeOptions,
      warnings
    };
  }

  /**
   * Get available distribution strategies
   */
  getAvailableStrategies(): DistributionStrategy[] {
    return [
      {
        name: 'Balanced Distribution',
        description: 'Evenly distribute players across sessions with similar group sizes',
        algorithm: 'balanced',
        parameters: {
          maxPlayersPerSession: 12,
          minFitnessVariation: 20
        }
      },
      {
        name: 'Fitness-Based Grouping',
        description: 'Group players with similar fitness levels for targeted training',
        algorithm: 'fitness-based',
        parameters: {
          maxPlayersPerSession: 10,
          minFitnessVariation: 15
        }
      },
      {
        name: 'Position-Specific Training',
        description: 'Group players by position for role-specific skill development',
        algorithm: 'position-based',
        parameters: {
          maxPlayersPerSession: 8,
          balancePositions: true
        }
      },
      {
        name: 'Recovery-Focused',
        description: 'Prioritize player recovery needs and fatigue management',
        algorithm: 'recovery-focused',
        parameters: {
          maxPlayersPerSession: 15,
          prioritizeRecovery: true
        }
      }
    ];
  }

  // Private helper methods

  private assessFitnessLevel(player: PlayerData, readiness?: PlayerReadiness): FitnessLevel {
    // Simulate fitness assessment based on player data
    const baseLevel = 60 + Math.random() * 30; // 60-90 base
    const positionModifier = this.getPositionFitnessModifier(player.position);
    
    return {
      overall: Math.min(100, baseLevel + positionModifier.overall),
      strength: Math.min(100, baseLevel + positionModifier.strength + (Math.random() * 20 - 10)),
      endurance: Math.min(100, baseLevel + positionModifier.endurance + (Math.random() * 20 - 10)),
      agility: Math.min(100, baseLevel + positionModifier.agility + (Math.random() * 20 - 10)),
      recovery: readiness ? (100 - (readiness.fatigue === 'high' ? 80 : readiness.fatigue === 'medium' ? 50 : 20)) : 70
    };
  }

  private getPositionFitnessModifier(position?: string): FitnessLevel {
    const modifiers: Record<string, FitnessLevel> = {
      'Forward': { overall: 5, strength: 0, endurance: 10, agility: 8, recovery: 0 },
      'Defense': { overall: 3, strength: 10, endurance: 5, agility: 2, recovery: 5 },
      'Goalie': { overall: 0, strength: 5, endurance: -5, agility: 12, recovery: 8 },
      'Center': { overall: 8, strength: 2, endurance: 12, agility: 5, recovery: 3 },
      'Winger': { overall: 6, strength: -2, endurance: 8, agility: 10, recovery: 2 }
    };

    return modifiers[position || 'Forward'] || { overall: 0, strength: 0, endurance: 0, agility: 0, recovery: 0 };
  }

  private calculateInjuryRisk(
    player: PlayerData,
    restrictions: MedicalRestriction[],
    readiness?: PlayerReadiness
  ): number {
    let risk = 10; // Base risk

    // Medical restrictions increase risk
    restrictions.forEach(restriction => {
      switch (restriction.severity) {
        case 'severe': risk += 40; break;
        case 'moderate': risk += 25; break;
        case 'minor': risk += 10; break;
      }
    });

    // High fatigue increases risk
    if (readiness?.fatigue === 'high') risk += 20;
    if (readiness?.fatigue === 'medium') risk += 10;

    // High load increases risk
    if (readiness && readiness.load > 100) {
      risk += (readiness.load - 100) * 0.5;
    }

    return Math.min(100, risk);
  }

  private estimateCurrentLoad(player: PlayerData): number {
    // Simulate current load estimation
    return 70 + Math.random() * 40; // 70-110%
  }

  private calculateFatigue(readiness?: PlayerReadiness, currentLoad?: number): number {
    if (readiness) {
      switch (readiness.fatigue) {
        case 'high': return 80 + Math.random() * 20;
        case 'medium': return 40 + Math.random() * 30;
        case 'low': return Math.random() * 30;
      }
    }
    
    // Estimate based on load
    if (currentLoad) {
      return Math.max(0, Math.min(100, (currentLoad - 50) * 1.2 + Math.random() * 20));
    }

    return 30 + Math.random() * 40;
  }

  private calculateAvailability(player: PlayerData, restrictions: MedicalRestriction[]): number {
    let availability = 100;

    if (player.wellness?.status === 'unavailable') return 0;
    if (player.wellness?.status === 'injured') availability -= 60;
    if (player.wellness?.status === 'limited') availability -= 30;

    // Reduce based on restrictions
    restrictions.forEach(restriction => {
      if (restriction.type === 'injury') availability -= 20;
      if (restriction.type === 'illness') availability -= 15;
    });

    return Math.max(0, availability);
  }

  private generateHistoricalPerformance(player: PlayerData) {
    return {
      consistency: 70 + Math.random() * 30,
      improvement: (Math.random() - 0.5) * 40, // -20 to 20
      compliance: 80 + Math.random() * 20
    };
  }

  private initializeCentroids(players: PlayerAIProfile[], k: number): number[][] {
    const features = players.map(p => this.extractFeatures(p));
    const centroids: number[][] = [];

    // Use k-means++ initialization for better results
    centroids.push(features[Math.floor(Math.random() * features.length)]);

    for (let i = 1; i < k; i++) {
      const distances = features.map(feature => {
        const minDist = Math.min(...centroids.map(centroid => 
          this.euclideanDistance(feature, centroid)
        ));
        return minDist * minDist;
      });

      const totalDist = distances.reduce((sum, dist) => sum + dist, 0);
      const random = Math.random() * totalDist;
      
      let cumulative = 0;
      for (let j = 0; j < distances.length; j++) {
        cumulative += distances[j];
        if (cumulative >= random) {
          centroids.push(features[j]);
          break;
        }
      }
    }

    return centroids;
  }

  private extractFeatures(player: PlayerAIProfile): number[] {
    return [
      player.fitnessLevel.overall,
      player.fitnessLevel.strength,
      player.fitnessLevel.endurance,
      player.fitnessLevel.agility,
      player.injuryRisk,
      player.currentLoad,
      player.fatigue,
      player.availability
    ];
  }

  private assignPlayersToCluster(players: PlayerAIProfile[], centroids: number[][]): PlayerCluster[] {
    const clusters: PlayerCluster[] = centroids.map((centroid, index) => ({
      id: `cluster-${index}`,
      name: `Cluster ${index}`,
      centroid,
      players: [],
      characteristics: [],
      recommendedLoad: 0
    }));

    players.forEach(player => {
      const features = this.extractFeatures(player);
      let minDistance = Infinity;
      let closestCluster = 0;

      centroids.forEach((centroid, index) => {
        const distance = this.euclideanDistance(features, centroid);
        if (distance < minDistance) {
          minDistance = distance;
          closestCluster = index;
        }
      });

      clusters[closestCluster].players.push(player);
    });

    return clusters;
  }

  private calculateCentroid(players: PlayerAIProfile[]): number[] {
    if (players.length === 0) return [];

    const features = players.map(p => this.extractFeatures(p));
    const featureCount = features[0].length;
    const centroid: number[] = new Array(featureCount).fill(0);

    features.forEach(feature => {
      feature.forEach((value, index) => {
        centroid[index] += value;
      });
    });

    return centroid.map(sum => sum / players.length);
  }

  private euclideanDistance(a: number[], b: number[]): number {
    return Math.sqrt(
      a.reduce((sum, val, index) => sum + Math.pow(val - b[index], 2), 0)
    );
  }

  private hasConverged(oldCentroids: number[][], newCentroids: number[][]): boolean {
    return oldCentroids.every((centroid, index) => {
      const distance = this.euclideanDistance(centroid, newCentroids[index]);
      return distance < this.CONVERGENCE_THRESHOLD;
    });
  }

  private identifyClusterCharacteristics(players: PlayerAIProfile[]): string[] {
    if (players.length === 0) return [];

    const characteristics: string[] = [];
    const avgFitness = players.reduce((sum, p) => sum + p.fitnessLevel.overall, 0) / players.length;
    const avgFatigue = players.reduce((sum, p) => sum + p.fatigue, 0) / players.length;
    const avgRisk = players.reduce((sum, p) => sum + p.injuryRisk, 0) / players.length;

    if (avgFitness > 80) characteristics.push('High Fitness');
    else if (avgFitness < 60) characteristics.push('Developing Fitness');
    else characteristics.push('Moderate Fitness');

    if (avgFatigue > 70) characteristics.push('High Fatigue');
    else if (avgFatigue < 30) characteristics.push('Well Rested');

    if (avgRisk > 50) characteristics.push('Elevated Injury Risk');

    // Position analysis
    const positions = players.reduce((acc, p) => {
      acc[p.position] = (acc[p.position] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const dominantPosition = Object.entries(positions)
      .sort(([,a], [,b]) => b - a)[0];

    if (dominantPosition && dominantPosition[1] > players.length * 0.6) {
      characteristics.push(`${dominantPosition[0]} Focused`);
    }

    return characteristics;
  }

  private calculateRecommendedLoad(players: PlayerAIProfile[]): number {
    const avgFitness = players.reduce((sum, p) => sum + p.fitnessLevel.overall, 0) / players.length;
    const avgFatigue = players.reduce((sum, p) => sum + p.fatigue, 0) / players.length;
    const avgRisk = players.reduce((sum, p) => sum + p.injuryRisk, 0) / players.length;

    let load = avgFitness * 0.8; // Base on fitness level
    load -= avgFatigue * 0.3; // Reduce for fatigue
    load -= avgRisk * 0.2; // Reduce for injury risk

    return Math.max(40, Math.min(100, load));
  }

  private createBalancedDistribution(clusters: PlayerCluster[], sessionCount: number): PlayerGroup[] {
    const groups: PlayerGroup[] = [];
    const allPlayers = clusters.flatMap(c => c.players);
    const playersPerSession = Math.ceil(allPlayers.length / sessionCount);

    for (let i = 0; i < sessionCount; i++) {
      const startIndex = i * playersPerSession;
      const endIndex = Math.min(startIndex + playersPerSession, allPlayers.length);
      const sessionPlayers = allPlayers.slice(startIndex, endIndex);

      if (sessionPlayers.length > 0) {
        groups.push({
          id: `session-${i + 1}`,
          name: `Session Group ${i + 1}`,
          players: sessionPlayers,
          recommendedIntensity: this.calculateGroupIntensity(sessionPlayers),
          estimatedDuration: 60,
          equipment: this.recommendEquipment(sessionPlayers),
          notes: [`${sessionPlayers.length} players`, 'Balanced distribution']
        });
      }
    }

    return groups;
  }

  private createFitnessBasedDistribution(clusters: PlayerCluster[], sessionCount: number): PlayerGroup[] {
    // Sort clusters by average fitness level
    const sortedClusters = [...clusters].sort((a, b) => {
      const avgA = a.players.reduce((sum, p) => sum + p.fitnessLevel.overall, 0) / a.players.length;
      const avgB = b.players.reduce((sum, p) => sum + p.fitnessLevel.overall, 0) / b.players.length;
      return avgB - avgA; // Highest fitness first
    });

    const groups: PlayerGroup[] = [];
    const clustersPerSession = Math.max(1, Math.floor(sortedClusters.length / sessionCount));

    for (let i = 0; i < sessionCount && i * clustersPerSession < sortedClusters.length; i++) {
      const startIndex = i * clustersPerSession;
      const endIndex = Math.min(startIndex + clustersPerSession, sortedClusters.length);
      const sessionClusters = sortedClusters.slice(startIndex, endIndex);
      const sessionPlayers = sessionClusters.flatMap(c => c.players);

      if (sessionPlayers.length > 0) {
        groups.push({
          id: `fitness-group-${i + 1}`,
          name: `Fitness Group ${i + 1}`,
          players: sessionPlayers,
          recommendedIntensity: this.calculateGroupIntensity(sessionPlayers),
          estimatedDuration: 60,
          equipment: this.recommendEquipment(sessionPlayers),
          notes: [`${sessionPlayers.length} players`, 'Fitness-based grouping']
        });
      }
    }

    return groups;
  }

  private createPositionBasedDistribution(players: PlayerAIProfile[], sessionCount: number): PlayerGroup[] {
    // Group by position
    const positionGroups = players.reduce((acc, player) => {
      const position = player.position || 'Unknown';
      if (!acc[position]) acc[position] = [];
      acc[position].push(player);
      return acc;
    }, {} as Record<string, PlayerAIProfile[]>);

    const groups: PlayerGroup[] = [];
    const positions = Object.keys(positionGroups);
    const positionsPerSession = Math.max(1, Math.ceil(positions.length / sessionCount));

    for (let i = 0; i < sessionCount; i++) {
      const startIndex = i * positionsPerSession;
      const endIndex = Math.min(startIndex + positionsPerSession, positions.length);
      const sessionPositions = positions.slice(startIndex, endIndex);
      const sessionPlayers = sessionPositions.flatMap(pos => positionGroups[pos]);

      if (sessionPlayers.length > 0) {
        groups.push({
          id: `position-group-${i + 1}`,
          name: `${sessionPositions.join('/')} Group`,
          players: sessionPlayers,
          recommendedIntensity: this.calculateGroupIntensity(sessionPlayers),
          estimatedDuration: 60,
          equipment: this.recommendEquipment(sessionPlayers),
          notes: [`${sessionPlayers.length} players`, `Positions: ${sessionPositions.join(', ')}`]
        });
      }
    }

    return groups;
  }

  private createRecoveryFocusedDistribution(players: PlayerAIProfile[], sessionCount: number): PlayerGroup[] {
    // Sort by recovery needs (high fatigue and injury risk first)
    const sortedPlayers = [...players].sort((a, b) => {
      const recoveryNeedA = a.fatigue + a.injuryRisk - a.fitnessLevel.recovery;
      const recoveryNeedB = b.fatigue + b.injuryRisk - b.fitnessLevel.recovery;
      return recoveryNeedB - recoveryNeedA;
    });

    const groups: PlayerGroup[] = [];
    const playersPerSession = Math.ceil(sortedPlayers.length / sessionCount);

    for (let i = 0; i < sessionCount; i++) {
      const startIndex = i * playersPerSession;
      const endIndex = Math.min(startIndex + playersPerSession, sortedPlayers.length);
      const sessionPlayers = sortedPlayers.slice(startIndex, endIndex);

      if (sessionPlayers.length > 0) {
        const avgRecoveryNeed = sessionPlayers.reduce((sum, p) => 
          sum + p.fatigue + p.injuryRisk - p.fitnessLevel.recovery, 0) / sessionPlayers.length;

        groups.push({
          id: `recovery-group-${i + 1}`,
          name: `Recovery Group ${i + 1}`,
          players: sessionPlayers,
          recommendedIntensity: avgRecoveryNeed > 50 ? 'low' : avgRecoveryNeed > 25 ? 'medium' : 'high',
          estimatedDuration: 60,
          equipment: this.recommendEquipment(sessionPlayers),
          notes: [
            `${sessionPlayers.length} players`,
            avgRecoveryNeed > 50 ? 'Focus on recovery' : 'Moderate training load'
          ]
        });
      }
    }

    return groups;
  }

  private calculateGroupIntensity(players: PlayerAIProfile[]): 'low' | 'medium' | 'high' {
    const avgFitness = players.reduce((sum, p) => sum + p.fitnessLevel.overall, 0) / players.length;
    const avgFatigue = players.reduce((sum, p) => sum + p.fatigue, 0) / players.length;
    const avgRisk = players.reduce((sum, p) => sum + p.injuryRisk, 0) / players.length;

    const intensityScore = avgFitness - avgFatigue * 0.5 - avgRisk * 0.3;

    if (intensityScore > 70) return 'high';
    if (intensityScore > 50) return 'medium';
    return 'low';
  }

  private recommendEquipment(players: PlayerAIProfile[]): string[] {
    // Basic equipment recommendations based on group characteristics
    const equipment = ['Cones', 'Stopwatch'];
    
    if (players.length > 8) equipment.push('Bibs');
    if (players.some(p => p.injuryRisk > 50)) equipment.push('Resistance Bands');
    
    return equipment;
  }

  private applyStrategyParameters(
    groups: PlayerGroup[],
    parameters: DistributionStrategy['parameters']
  ): PlayerGroup[] {
    if (parameters.maxPlayersPerSession) {
      // Split groups that exceed max size
      const adjustedGroups: PlayerGroup[] = [];
      
      groups.forEach((group, groupIndex) => {
        if (group.players.length <= parameters.maxPlayersPerSession!) {
          adjustedGroups.push(group);
        } else {
          // Split large group
          const splits = Math.ceil(group.players.length / parameters.maxPlayersPerSession!);
          for (let i = 0; i < splits; i++) {
            const startIndex = i * parameters.maxPlayersPerSession!;
            const endIndex = Math.min(startIndex + parameters.maxPlayersPerSession!, group.players.length);
            const splitPlayers = group.players.slice(startIndex, endIndex);
            
            adjustedGroups.push({
              ...group,
              id: `${group.id}-split-${i + 1}`,
              name: `${group.name} (${i + 1})`,
              players: splitPlayers,
              notes: [...group.notes, `Split from larger group`]
            });
          }
        }
      });
      
      return adjustedGroups;
    }

    return groups;
  }

  private generateAlternativeDistributions(
    players: PlayerAIProfile[],
    sessionCount: number
  ): AlternativeDistribution[] {
    const strategies = this.getAvailableStrategies();
    const alternatives: AlternativeDistribution[] = [];

    strategies.slice(0, 2).forEach((strategy, index) => {
      const result = this.distributePlayersAcrossSessions(players, strategy, sessionCount);
      
      alternatives.push({
        name: strategy.name,
        sessionGroups: result.sessionGroups,
        pros: this.getStrategyPros(strategy),
        cons: this.getStrategyCons(strategy),
        score: result.confidenceScore
      });
    });

    return alternatives;
  }

  private getStrategyPros(strategy: DistributionStrategy): string[] {
    const prosMap: Record<string, string[]> = {
      'balanced': ['Equal group sizes', 'Simple implementation', 'Fair distribution'],
      'fitness-based': ['Targeted training intensity', 'Better progression tracking', 'Reduced injury risk'],
      'position-based': ['Role-specific skills', 'Position-focused drills', 'Team chemistry'],
      'recovery-focused': ['Injury prevention', 'Optimal recovery', 'Sustainable training']
    };

    return prosMap[strategy.algorithm] || [];
  }

  private getStrategyCons(strategy: DistributionStrategy): string[] {
    const consMap: Record<string, string[]> = {
      'balanced': ['May mix fitness levels', 'Less specialized training'],
      'fitness-based': ['Uneven group sizes', 'Less position variety'],
      'position-based': ['Variable fitness levels', 'Potential size imbalances'],
      'recovery-focused': ['Complex to manage', 'May limit high performers']
    };

    return consMap[strategy.algorithm] || [];
  }

  private calculateConfidenceScore(groups: PlayerGroup[], strategy: DistributionStrategy): number {
    let score = 80; // Base confidence

    // Adjust based on group size consistency
    const groupSizes = groups.map(g => g.players.length);
    const avgSize = groupSizes.reduce((sum, size) => sum + size, 0) / groupSizes.length;
    const sizeVariation = groupSizes.reduce((sum, size) => sum + Math.abs(size - avgSize), 0) / groupSizes.length;
    
    if (sizeVariation < 2) score += 10;
    else if (sizeVariation > 5) score -= 15;

    // Adjust based on player availability
    const totalAvailability = groups.reduce((sum, group) => 
      sum + group.players.reduce((playerSum, player) => playerSum + player.availability, 0), 0
    );
    const avgAvailability = totalAvailability / groups.reduce((sum, group) => sum + group.players.length, 0);
    
    if (avgAvailability > 90) score += 10;
    else if (avgAvailability < 70) score -= 20;

    return Math.max(50, Math.min(100, score));
  }
}

export const playerDistributionAI = new PlayerDistributionAI();