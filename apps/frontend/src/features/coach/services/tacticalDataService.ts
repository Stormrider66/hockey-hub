/**
 * Tactical Data Service
 * Abstraction layer for tactical data that can switch between mock and real data sources
 * based on feature flags configuration
 */

import { featureFlags } from '@/config/featureFlags';
import { tacticalStatisticsService } from './tacticalStatisticsService';
import type {
  PlayUsageStats,
  PlayEffectivenessMetrics,
  FormationAnalytics,
  PlayerTacticalRating,
  TacticalTrendAnalysis,
  OpponentAnalysis,
  GameTacticalAnalysis,
} from './tacticalStatisticsService';

/**
 * Tactical play data structure
 */
export interface TacticalPlay {
  id: string;
  name: string;
  description?: string;
  category: 'offensive' | 'defensive' | 'special_teams' | 'neutral_zone';
  formation: string;
  players: Array<{
    position: string;
    role: string;
    x: number;
    y: number;
  }>;
  success_rate?: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  teamId?: string;
}

/**
 * Formation data structure
 */
export interface Formation {
  id: string;
  name: string;
  description?: string;
  type: 'offensive' | 'defensive' | 'transition' | 'special_teams';
  positions: Array<{
    role: string;
    x: number;
    y: number;
    zone: 'offensive' | 'defensive' | 'neutral';
  }>;
  strengths: string[];
  weaknesses: string[];
  situational_use: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Game situation context
 */
export interface GameSituation {
  type: 'even_strength' | 'power_play' | 'penalty_kill' | 'empty_net';
  period: number;
  time_remaining: string;
  score_differential: number;
  zone: 'offensive' | 'defensive' | 'neutral';
  players_on_ice: number;
  context?: string;
}

/**
 * Real-time tactical data
 */
export interface RealTimeTacticalData {
  current_play?: TacticalPlay;
  active_formation?: Formation;
  situation: GameSituation;
  player_positions: Array<{
    player_id: string;
    position: string;
    x: number;
    y: number;
    timestamp: string;
  }>;
  metrics: {
    possession_time: number;
    pass_completion: number;
    zone_entries: number;
    scoring_chances: number;
  };
  timestamp: string;
}

/**
 * Mock data for development and demo purposes
 */
const mockTacticalPlays: TacticalPlay[] = [
  {
    id: 'play_1',
    name: 'Power Play Umbrella',
    description: 'Classic umbrella formation for power play situations',
    category: 'special_teams',
    formation: 'umbrella_pp',
    players: [
      { position: 'C', role: 'Quarterback', x: 50, y: 15 },
      { position: 'LW', role: 'Net Front', x: 85, y: 50 },
      { position: 'RW', role: 'Flanker', x: 75, y: 25 },
      { position: 'LD', role: 'Point', x: 25, y: 25 },
      { position: 'RD', role: 'Point', x: 25, y: 75 },
    ],
    success_rate: 78.5,
    difficulty: 'intermediate',
    tags: ['power-play', 'umbrella', 'perimeter'],
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-01-20T14:30:00Z',
    createdBy: 'coach_1',
    teamId: 'team_1',
  },
  {
    id: 'play_2',
    name: 'Breakout Left Wing',
    description: 'Quick breakout play through the left wing',
    category: 'offensive',
    formation: 'breakout_lw',
    players: [
      { position: 'LD', role: 'Puck Carrier', x: 15, y: 25 },
      { position: 'LW', role: 'Support', x: 35, y: 15 },
      { position: 'C', role: 'Center Support', x: 50, y: 50 },
      { position: 'RW', role: 'Stretch', x: 75, y: 75 },
      { position: 'RD', role: 'Stay Home', x: 15, y: 75 },
    ],
    success_rate: 85.2,
    difficulty: 'beginner',
    tags: ['breakout', 'speed', 'transition'],
    createdAt: '2025-01-10T09:15:00Z',
    updatedAt: '2025-01-18T11:20:00Z',
    createdBy: 'coach_1',
    teamId: 'team_1',
  },
  {
    id: 'play_3',
    name: 'Defensive Zone Trap',
    description: 'Neutral zone trap to slow down opponent attack',
    category: 'defensive',
    formation: 'nz_trap',
    players: [
      { position: 'C', role: 'Forechecker', x: 65, y: 50 },
      { position: 'LW', role: 'Left Support', x: 45, y: 25 },
      { position: 'RW', role: 'Right Support', x: 45, y: 75 },
      { position: 'LD', role: 'Gap Control', x: 25, y: 35 },
      { position: 'RD', role: 'Gap Control', x: 25, y: 65 },
    ],
    success_rate: 72.1,
    difficulty: 'advanced',
    tags: ['trap', 'defensive', 'neutral-zone'],
    createdAt: '2025-01-08T16:45:00Z',
    updatedAt: '2025-01-19T13:10:00Z',
    createdBy: 'coach_1',
    teamId: 'team_1',
  },
  {
    id: 'play_4',
    name: '2-on-1 Cycle Low',
    description: 'Cycle play in the offensive zone with low support',
    category: 'offensive',
    formation: 'cycle_low',
    players: [
      { position: 'LW', role: 'Cycle', x: 90, y: 25 },
      { position: 'RW', role: 'Cycle Support', x: 85, y: 75 },
      { position: 'C', role: 'High Support', x: 65, y: 50 },
      { position: 'LD', role: 'Point', x: 35, y: 35 },
      { position: 'RD', role: 'Point', x: 35, y: 65 },
    ],
    success_rate: 68.9,
    difficulty: 'intermediate',
    tags: ['cycle', 'possession', 'offensive-zone'],
    createdAt: '2025-01-12T14:20:00Z',
    updatedAt: '2025-01-20T09:45:00Z',
    createdBy: 'coach_1',
    teamId: 'team_1',
  },
];

const mockFormations: Formation[] = [
  {
    id: 'formation_1',
    name: '1-2-2 Offensive',
    description: 'Aggressive offensive formation with high forwards',
    type: 'offensive',
    positions: [
      { role: 'Center', x: 75, y: 50, zone: 'offensive' },
      { role: 'Left Wing', x: 85, y: 25, zone: 'offensive' },
      { role: 'Right Wing', x: 85, y: 75, zone: 'offensive' },
      { role: 'Left Defense', x: 45, y: 35, zone: 'neutral' },
      { role: 'Right Defense', x: 45, y: 65, zone: 'neutral' },
    ],
    strengths: ['Offensive pressure', 'Scoring chances', 'Zone control'],
    weaknesses: ['Defensive gaps', 'Counterattack vulnerability'],
    situational_use: ['Power play', 'Trailing in game', 'Offensive zone draws'],
    createdAt: '2025-01-05T08:30:00Z',
    updatedAt: '2025-01-15T12:00:00Z',
  },
  {
    id: 'formation_2',
    name: '1-3-1 Neutral Zone',
    description: 'Balanced formation for neutral zone control',
    type: 'transition',
    positions: [
      { role: 'Center', x: 60, y: 50, zone: 'neutral' },
      { role: 'Left Wing', x: 50, y: 25, zone: 'neutral' },
      { role: 'Right Wing', x: 50, y: 75, zone: 'neutral' },
      { role: 'Left Defense', x: 30, y: 35, zone: 'defensive' },
      { role: 'Right Defense', x: 30, y: 65, zone: 'defensive' },
    ],
    strengths: ['Zone control', 'Transition play', 'Balanced coverage'],
    weaknesses: ['Limited offense', 'Requires discipline'],
    situational_use: ['Even strength', 'Protecting lead', 'Neutral zone play'],
    createdAt: '2025-01-07T10:45:00Z',
    updatedAt: '2025-01-18T15:20:00Z',
  },
];

/**
 * Interface for data source adapters
 */
interface TacticalDataAdapter {
  getTacticalPlays(options?: { teamId?: string; category?: string }): Promise<TacticalPlay[]>;
  getTacticalPlay(id: string): Promise<TacticalPlay>;
  createTacticalPlay(play: Omit<TacticalPlay, 'id' | 'createdAt' | 'updatedAt'>): Promise<TacticalPlay>;
  updateTacticalPlay(id: string, updates: Partial<TacticalPlay>): Promise<TacticalPlay>;
  deleteTacticalPlay(id: string): Promise<void>;
  
  getFormations(options?: { type?: string }): Promise<Formation[]>;
  getFormation(id: string): Promise<Formation>;
  
  getPlayUsageStats(options?: any): Promise<PlayUsageStats[]>;
  getPlayEffectivenessMetrics(playId: string, options?: any): Promise<PlayEffectivenessMetrics>;
  getFormationAnalytics(options?: any): Promise<FormationAnalytics[]>;
  getPlayerTacticalRatings(options?: any): Promise<PlayerTacticalRating[]>;
  getTacticalTrends(options: any): Promise<TacticalTrendAnalysis>;
  getOpponentAnalysis(opponentId: string, options?: any): Promise<OpponentAnalysis>;
  generateGameTacticalReport(gameId: string): Promise<GameTacticalAnalysis>;
  
  getRealTimeData(): Promise<RealTimeTacticalData>;
  subscribeToRealTimeUpdates(callback: (data: RealTimeTacticalData) => void): () => void;
}

/**
 * Mock data adapter
 */
class MockTacticalDataAdapter implements TacticalDataAdapter {
  private realTimeSubscribers: Set<(data: RealTimeTacticalData) => void> = new Set();
  private realTimeInterval?: NodeJS.Timeout;

  async getTacticalPlays(options: { teamId?: string; category?: string } = {}): Promise<TacticalPlay[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    let plays = [...mockTacticalPlays];
    
    if (options.teamId) {
      plays = plays.filter(play => play.teamId === options.teamId);
    }
    
    if (options.category) {
      plays = plays.filter(play => play.category === options.category);
    }
    
    return plays;
  }

  async getTacticalPlay(id: string): Promise<TacticalPlay> {
    await new Promise(resolve => setTimeout(resolve, 50));
    const play = mockTacticalPlays.find(p => p.id === id);
    if (!play) {
      throw new Error(`Tactical play with id ${id} not found`);
    }
    return { ...play };
  }

  async createTacticalPlay(play: Omit<TacticalPlay, 'id' | 'createdAt' | 'updatedAt'>): Promise<TacticalPlay> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const newPlay: TacticalPlay = {
      ...play,
      id: `play_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockTacticalPlays.push(newPlay);
    return { ...newPlay };
  }

  async updateTacticalPlay(id: string, updates: Partial<TacticalPlay>): Promise<TacticalPlay> {
    await new Promise(resolve => setTimeout(resolve, 150));
    const index = mockTacticalPlays.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error(`Tactical play with id ${id} not found`);
    }
    
    mockTacticalPlays[index] = {
      ...mockTacticalPlays[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    return { ...mockTacticalPlays[index] };
  }

  async deleteTacticalPlay(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100));
    const index = mockTacticalPlays.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error(`Tactical play with id ${id} not found`);
    }
    mockTacticalPlays.splice(index, 1);
  }

  async getFormations(options: { type?: string } = {}): Promise<Formation[]> {
    await new Promise(resolve => setTimeout(resolve, 80));
    let formations = [...mockFormations];
    
    if (options.type) {
      formations = formations.filter(f => f.type === options.type);
    }
    
    return formations;
  }

  async getFormation(id: string): Promise<Formation> {
    await new Promise(resolve => setTimeout(resolve, 50));
    const formation = mockFormations.find(f => f.id === id);
    if (!formation) {
      throw new Error(`Formation with id ${id} not found`);
    }
    return { ...formation };
  }

  // Delegate statistics methods to existing service
  async getPlayUsageStats(options?: any): Promise<PlayUsageStats[]> {
    return tacticalStatisticsService.getPlayUsageStats(options);
  }

  async getPlayEffectivenessMetrics(playId: string, options?: any): Promise<PlayEffectivenessMetrics> {
    return tacticalStatisticsService.getPlayEffectivenessMetrics(playId, options);
  }

  async getFormationAnalytics(options?: any): Promise<FormationAnalytics[]> {
    return tacticalStatisticsService.getFormationAnalytics(options);
  }

  async getPlayerTacticalRatings(options?: any): Promise<PlayerTacticalRating[]> {
    return tacticalStatisticsService.getPlayerTacticalRatings(options);
  }

  async getTacticalTrends(options: any): Promise<TacticalTrendAnalysis> {
    return tacticalStatisticsService.getTacticalTrends(options);
  }

  async getOpponentAnalysis(opponentId: string, options?: any): Promise<OpponentAnalysis> {
    return tacticalStatisticsService.getOpponentAnalysis(opponentId, options);
  }

  async generateGameTacticalReport(gameId: string): Promise<GameTacticalAnalysis> {
    return tacticalStatisticsService.generateGameTacticalReport(gameId);
  }

  async getRealTimeData(): Promise<RealTimeTacticalData> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return {
      current_play: mockTacticalPlays[0],
      active_formation: mockFormations[0],
      situation: {
        type: 'even_strength',
        period: 2,
        time_remaining: '12:45',
        score_differential: 0,
        zone: 'neutral',
        players_on_ice: 6,
        context: 'Face-off in neutral zone',
      },
      player_positions: [
        { player_id: 'p1', position: 'C', x: 50, y: 50, timestamp: new Date().toISOString() },
        { player_id: 'p2', position: 'LW', x: 45, y: 25, timestamp: new Date().toISOString() },
        { player_id: 'p3', position: 'RW', x: 45, y: 75, timestamp: new Date().toISOString() },
        { player_id: 'p4', position: 'LD', x: 25, y: 35, timestamp: new Date().toISOString() },
        { player_id: 'p5', position: 'RD', x: 25, y: 65, timestamp: new Date().toISOString() },
        { player_id: 'g1', position: 'G', x: 5, y: 50, timestamp: new Date().toISOString() },
      ],
      metrics: {
        possession_time: 45.2,
        pass_completion: 78.5,
        zone_entries: 12,
        scoring_chances: 3,
      },
      timestamp: new Date().toISOString(),
    };
  }

  subscribeToRealTimeUpdates(callback: (data: RealTimeTacticalData) => void): () => void {
    this.realTimeSubscribers.add(callback);
    
    if (!this.realTimeInterval) {
      this.realTimeInterval = setInterval(async () => {
        const data = await this.getRealTimeData();
        this.realTimeSubscribers.forEach(cb => cb(data));
      }, 2000);
    }
    
    return () => {
      this.realTimeSubscribers.delete(callback);
      if (this.realTimeSubscribers.size === 0 && this.realTimeInterval) {
        clearInterval(this.realTimeInterval);
        this.realTimeInterval = undefined;
      }
    };
  }
}

/**
 * Real API data adapter with offline support and local storage integration
 */
class ApiTacticalDataAdapter implements TacticalDataAdapter {
  private baseUrl: string;
  private tacticalApiClient: any;
  private tacticalStorageService: any;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    // Lazy load dependencies to avoid circular imports
    this.initializeServices();
  }

  private async initializeServices() {
    try {
      const { tacticalApiClient } = await import('../api/tacticalApi');
      const { tacticalStorageService } = await import('./tacticalStorageService');
      
      this.tacticalApiClient = tacticalApiClient;
      this.tacticalStorageService = tacticalStorageService;
    } catch (error) {
      console.error('Failed to initialize tactical services:', error);
    }
  }

  private async withOfflineSupport<T>(
    onlineOperation: () => Promise<T>,
    offlineOperation: () => T | null,
    cacheKey?: string
  ): Promise<T> {
    if (!navigator.onLine) {
      const offlineResult = offlineOperation();
      if (offlineResult !== null) {
        return offlineResult;
      }
      throw new Error('Operation not available offline');
    }

    try {
      const result = await onlineOperation();
      
      // Cache successful results for offline access
      if (cacheKey && this.tacticalStorageService) {
        // This would cache the result - implementation depends on cache strategy
      }
      
      return result;
    } catch (error) {
      console.warn('Online operation failed, falling back to offline data:', error);
      
      const offlineResult = offlineOperation();
      if (offlineResult !== null) {
        return offlineResult;
      }
      
      throw error;
    }
  }

  async getTacticalPlays(options: { teamId?: string; category?: string } = {}): Promise<TacticalPlay[]> {
    return this.withOfflineSupport(
      async () => {
        if (!this.tacticalApiClient) await this.initializeServices();
        const response = await this.tacticalApiClient.getTacticalPlays(options);
        return response.items || response; // Handle both paginated and direct array responses
      },
      () => {
        if (!this.tacticalStorageService) return null;
        const storedPlays = this.tacticalStorageService.getTacticalPlays();
        
        // Apply filters
        let filteredPlays = storedPlays.filter(play => !play.isDraft);
        
        if (options.teamId) {
          filteredPlays = filteredPlays.filter(play => play.teamId === options.teamId);
        }
        
        if (options.category) {
          filteredPlays = filteredPlays.filter(play => play.category === options.category);
        }
        
        return filteredPlays;
      },
      `tactical_plays_${JSON.stringify(options)}`
    );
  }

  async getTacticalPlay(id: string): Promise<TacticalPlay> {
    return this.withOfflineSupport(
      async () => {
        if (!this.tacticalApiClient) await this.initializeServices();
        return this.tacticalApiClient.getTacticalPlay(id);
      },
      () => {
        if (!this.tacticalStorageService) return null;
        const storedPlay = this.tacticalStorageService.getTacticalPlay(id);
        return storedPlay && !storedPlay.isDraft ? storedPlay : null;
      },
      `tactical_play_${id}`
    );
  }

  async createTacticalPlay(play: Omit<TacticalPlay, 'id' | 'createdAt' | 'updatedAt'>): Promise<TacticalPlay> {
    if (!navigator.onLine) {
      // Create locally and queue for sync
      if (!this.tacticalStorageService) await this.initializeServices();
      
      const newPlay: TacticalPlay = {
        ...play,
        id: '', // Will be assigned by server
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      await this.tacticalStorageService.saveTacticalPlay(newPlay, false);
      return newPlay;
    }

    try {
      if (!this.tacticalApiClient) await this.initializeServices();
      const result = await this.tacticalApiClient.createTacticalPlay(play);
      
      // Cache the created play locally
      if (this.tacticalStorageService) {
        await this.tacticalStorageService.saveTacticalPlay(result, false);
      }
      
      return result;
    } catch (error) {
      // If online request fails, save locally for later sync
      if (this.tacticalStorageService) {
        const newPlay: TacticalPlay = {
          ...play,
          id: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        await this.tacticalStorageService.saveTacticalPlay(newPlay, false);
        return newPlay;
      }
      
      throw error;
    }
  }

  async updateTacticalPlay(id: string, updates: Partial<TacticalPlay>): Promise<TacticalPlay> {
    if (!navigator.onLine) {
      // Update locally and queue for sync
      if (!this.tacticalStorageService) await this.initializeServices();
      
      const existingPlay = this.tacticalStorageService.getTacticalPlay(id);
      if (!existingPlay) {
        throw new Error(`Tactical play ${id} not found locally`);
      }
      
      const updatedPlay = {
        ...existingPlay,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      
      await this.tacticalStorageService.saveTacticalPlay(updatedPlay, false);
      return updatedPlay;
    }

    try {
      if (!this.tacticalApiClient) await this.initializeServices();
      const result = await this.tacticalApiClient.updateTacticalPlay(id, updates);
      
      // Update local cache
      if (this.tacticalStorageService) {
        await this.tacticalStorageService.saveTacticalPlay(result, false);
      }
      
      return result;
    } catch (error) {
      // If online request fails, update locally for later sync
      if (this.tacticalStorageService) {
        const existingPlay = this.tacticalStorageService.getTacticalPlay(id);
        if (existingPlay) {
          const updatedPlay = {
            ...existingPlay,
            ...updates,
            updatedAt: new Date().toISOString(),
          };
          
          await this.tacticalStorageService.saveTacticalPlay(updatedPlay, false);
          return updatedPlay;
        }
      }
      
      throw error;
    }
  }

  async deleteTacticalPlay(id: string): Promise<void> {
    if (!navigator.onLine) {
      // Delete locally and queue for sync
      if (!this.tacticalStorageService) await this.initializeServices();
      await this.tacticalStorageService.deleteTacticalPlay(id);
      return;
    }

    try {
      if (!this.tacticalApiClient) await this.initializeServices();
      await this.tacticalApiClient.deleteTacticalPlay(id);
      
      // Remove from local cache
      if (this.tacticalStorageService) {
        await this.tacticalStorageService.deleteTacticalPlay(id);
      }
    } catch (error) {
      // If online request fails, delete locally for later sync
      if (this.tacticalStorageService) {
        await this.tacticalStorageService.deleteTacticalPlay(id);
      }
      
      throw error;
    }
  }

  async getFormations(options: { type?: string } = {}): Promise<Formation[]> {
    return this.withOfflineSupport(
      async () => {
        if (!this.tacticalApiClient) await this.initializeServices();
        const response = await this.tacticalApiClient.getFormations(options);
        return response.items || response; // Handle both paginated and direct array responses
      },
      () => {
        if (!this.tacticalStorageService) return null;
        const storedFormations = this.tacticalStorageService.getFormations();
        
        // Apply filters
        let filteredFormations = storedFormations.filter(formation => !formation.isDraft);
        
        if (options.type) {
          filteredFormations = filteredFormations.filter(formation => formation.type === options.type);
        }
        
        return filteredFormations;
      },
      `formations_${JSON.stringify(options)}`
    );
  }

  async getFormation(id: string): Promise<Formation> {
    return this.withOfflineSupport(
      async () => {
        if (!this.tacticalApiClient) await this.initializeServices();
        return this.tacticalApiClient.getFormation(id);
      },
      () => {
        if (!this.tacticalStorageService) return null;
        const storedFormation = this.tacticalStorageService.getFormation(id);
        return storedFormation && !storedFormation.isDraft ? storedFormation : null;
      },
      `formation_${id}`
    );
  }

  // ============ Sync and Cache Management ============

  async syncWithServer(): Promise<void> {
    if (!this.tacticalStorageService) await this.initializeServices();
    
    if (this.tacticalStorageService) {
      await this.tacticalStorageService.syncPendingChanges();
    }
  }

  async clearLocalCache(): Promise<void> {
    if (!this.tacticalStorageService) await this.initializeServices();
    
    if (this.tacticalStorageService) {
      this.tacticalStorageService.clear();
    }
  }

  getOfflineStatus(): { isOnline: boolean; pendingSync: number; conflicts: number } {
    if (!this.tacticalStorageService) {
      return { isOnline: navigator.onLine, pendingSync: 0, conflicts: 0 };
    }
    
    const metadata = this.tacticalStorageService.getMetadata();
    return {
      isOnline: metadata.isOnline,
      pendingSync: metadata.pendingSync,
      conflicts: metadata.conflicts
    };
  }

  // Statistics methods with offline fallback to cached data
  async getPlayUsageStats(options?: any): Promise<PlayUsageStats[]> {
    return this.withOfflineSupport(
      async () => {
        if (!this.tacticalApiClient) await this.initializeServices();
        return this.tacticalApiClient.getPlayUsageStats(options);
      },
      () => {
        // Return mock/cached statistics when offline
        return tacticalStatisticsService.getPlayUsageStats(options);
      }
    );
  }

  async getPlayEffectivenessMetrics(playId: string, options?: any): Promise<PlayEffectivenessMetrics> {
    return this.withOfflineSupport(
      async () => {
        if (!this.tacticalApiClient) await this.initializeServices();
        return this.tacticalApiClient.getPlayEffectivenessMetrics(playId, options);
      },
      () => {
        return tacticalStatisticsService.getPlayEffectivenessMetrics(playId, options);
      }
    );
  }

  async getFormationAnalytics(options?: any): Promise<FormationAnalytics[]> {
    return this.withOfflineSupport(
      async () => {
        if (!this.tacticalApiClient) await this.initializeServices();
        return this.tacticalApiClient.getFormationAnalytics(options);
      },
      () => {
        return tacticalStatisticsService.getFormationAnalytics(options);
      }
    );
  }

  async getPlayerTacticalRatings(options?: any): Promise<PlayerTacticalRating[]> {
    return this.withOfflineSupport(
      async () => {
        if (!this.tacticalApiClient) await this.initializeServices();
        return this.tacticalApiClient.getPlayerTacticalRatings(options);
      },
      () => {
        return tacticalStatisticsService.getPlayerTacticalRatings(options);
      }
    );
  }

  async getTacticalTrends(options: any): Promise<TacticalTrendAnalysis> {
    return this.withOfflineSupport(
      async () => {
        if (!this.tacticalApiClient) await this.initializeServices();
        return this.tacticalApiClient.getTacticalTrends(options);
      },
      () => {
        return tacticalStatisticsService.getTacticalTrends(options);
      }
    );
  }

  async getOpponentAnalysis(opponentId: string, options?: any): Promise<OpponentAnalysis> {
    return this.withOfflineSupport(
      async () => {
        if (!this.tacticalApiClient) await this.initializeServices();
        return this.tacticalApiClient.getOpponentAnalysis(opponentId, options);
      },
      () => {
        return tacticalStatisticsService.getOpponentAnalysis(opponentId, options);
      }
    );
  }

  async generateGameTacticalReport(gameId: string): Promise<GameTacticalAnalysis> {
    return this.withOfflineSupport(
      async () => {
        if (!this.tacticalApiClient) await this.initializeServices();
        return this.tacticalApiClient.generateGameTacticalReport(gameId);
      },
      () => {
        return tacticalStatisticsService.generateGameTacticalReport(gameId);
      }
    );
  }

  async getRealTimeData(): Promise<RealTimeTacticalData> {
    const response = await fetch(`${this.baseUrl}/api/v1/tactical/real-time`);
    if (!response.ok) throw new Error('Failed to fetch real-time tactical data');
    return response.json();
  }

  subscribeToRealTimeUpdates(callback: (data: RealTimeTacticalData) => void): () => void {
    // Implementation would use WebSocket or Server-Sent Events
    const ws = new WebSocket(`${this.baseUrl.replace('http', 'ws')}/ws/tactical/real-time`);
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        callback(data);
      } catch (error) {
        console.error('Failed to parse real-time tactical data:', error);
      }
    };
    
    return () => {
      ws.close();
    };
  }
}

/**
 * Tactical Data Service
 * Main service class that switches between adapters based on feature flags
 */
class TacticalDataService {
  private mockAdapter: MockTacticalDataAdapter;
  private apiAdapter: ApiTacticalDataAdapter;

  constructor() {
    this.mockAdapter = new MockTacticalDataAdapter();
    this.apiAdapter = new ApiTacticalDataAdapter();
  }

  /**
   * Get the appropriate adapter based on current feature flags
   */
  private getAdapter(): TacticalDataAdapter {
    const flags = featureFlags.getFlags();
    return flags.tactical.useMockData ? this.mockAdapter : this.apiAdapter;
  }

  /**
   * Check if we're in demo mode
   */
  isDemoMode(): boolean {
    return featureFlags.isTacticalDemoMode();
  }

  /**
   * Get tactical plays
   */
  async getTacticalPlays(options?: { teamId?: string; category?: string }): Promise<TacticalPlay[]> {
    return this.getAdapter().getTacticalPlays(options);
  }

  /**
   * Get single tactical play
   */
  async getTacticalPlay(id: string): Promise<TacticalPlay> {
    return this.getAdapter().getTacticalPlay(id);
  }

  /**
   * Create new tactical play
   */
  async createTacticalPlay(play: Omit<TacticalPlay, 'id' | 'createdAt' | 'updatedAt'>): Promise<TacticalPlay> {
    return this.getAdapter().createTacticalPlay(play);
  }

  /**
   * Update tactical play
   */
  async updateTacticalPlay(id: string, updates: Partial<TacticalPlay>): Promise<TacticalPlay> {
    return this.getAdapter().updateTacticalPlay(id, updates);
  }

  /**
   * Delete tactical play
   */
  async deleteTacticalPlay(id: string): Promise<void> {
    return this.getAdapter().deleteTacticalPlay(id);
  }

  /**
   * Get formations
   */
  async getFormations(options?: { type?: string }): Promise<Formation[]> {
    return this.getAdapter().getFormations(options);
  }

  /**
   * Get single formation
   */
  async getFormation(id: string): Promise<Formation> {
    return this.getAdapter().getFormation(id);
  }

  /**
   * Get play usage statistics
   */
  async getPlayUsageStats(options?: any): Promise<PlayUsageStats[]> {
    return this.getAdapter().getPlayUsageStats(options);
  }

  /**
   * Get play effectiveness metrics
   */
  async getPlayEffectivenessMetrics(playId: string, options?: any): Promise<PlayEffectivenessMetrics> {
    return this.getAdapter().getPlayEffectivenessMetrics(playId, options);
  }

  /**
   * Get formation analytics
   */
  async getFormationAnalytics(options?: any): Promise<FormationAnalytics[]> {
    return this.getAdapter().getFormationAnalytics(options);
  }

  /**
   * Get player tactical ratings
   */
  async getPlayerTacticalRatings(options?: any): Promise<PlayerTacticalRating[]> {
    return this.getAdapter().getPlayerTacticalRatings(options);
  }

  /**
   * Get tactical trends
   */
  async getTacticalTrends(options: any): Promise<TacticalTrendAnalysis> {
    return this.getAdapter().getTacticalTrends(options);
  }

  /**
   * Get opponent analysis
   */
  async getOpponentAnalysis(opponentId: string, options?: any): Promise<OpponentAnalysis> {
    return this.getAdapter().getOpponentAnalysis(opponentId, options);
  }

  /**
   * Generate game tactical report
   */
  async generateGameTacticalReport(gameId: string): Promise<GameTacticalAnalysis> {
    return this.getAdapter().generateGameTacticalReport(gameId);
  }

  /**
   * Get real-time tactical data
   */
  async getRealTimeData(): Promise<RealTimeTacticalData> {
    return this.getAdapter().getRealTimeData();
  }

  /**
   * Subscribe to real-time updates
   */
  subscribeToRealTimeUpdates(callback: (data: RealTimeTacticalData) => void): () => void {
    return this.getAdapter().subscribeToRealTimeUpdates(callback);
  }

  /**
   * Sync local changes with server
   */
  async syncWithServer(): Promise<void> {
    return this.getAdapter().syncWithServer();
  }

  /**
   * Clear local cache
   */
  async clearLocalCache(): Promise<void> {
    return this.getAdapter().clearLocalCache();
  }

  /**
   * Get offline status and sync information
   */
  getOfflineStatus(): { isOnline: boolean; pendingSync: number; conflicts: number } {
    return this.getAdapter().getOfflineStatus();
  }

  /**
   * Create formation
   */
  async createFormation(formation: Omit<Formation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Formation> {
    // For now, delegate to API client directly since formations are handled separately
    const { tacticalApiClient } = await import('../api/tacticalApi');
    return tacticalApiClient.createFormation(formation as any);
  }

  /**
   * Update formation
   */
  async updateFormation(id: string, updates: Partial<Formation>): Promise<Formation> {
    const { tacticalApiClient } = await import('../api/tacticalApi');
    return tacticalApiClient.updateFormation(id, updates as any);
  }

  /**
   * Delete formation
   */
  async deleteFormation(id: string): Promise<void> {
    const { tacticalApiClient } = await import('../api/tacticalApi');
    return tacticalApiClient.deleteFormation(id);
  }

  /**
   * Save draft (tactical play or formation)
   */
  async saveDraft(type: 'tactical_play' | 'formation', data: any, localId?: string): Promise<string> {
    const { tacticalStorageService } = await import('./tacticalStorageService');
    return tacticalStorageService.saveDraft(type, data, localId);
  }

  /**
   * Get all drafts
   */
  async getDrafts(): Promise<{ tacticalPlays: any[]; formations: any[] }> {
    const { tacticalStorageService } = await import('./tacticalStorageService');
    return tacticalStorageService.getDrafts();
  }

  /**
   * Delete draft
   */
  async deleteDraft(localId: string): Promise<boolean> {
    const { tacticalStorageService } = await import('./tacticalStorageService');
    return tacticalStorageService.deleteDraft(localId);
  }

  /**
   * Get dashboard overview data
   */
  async getDashboardOverview(options: { teamId?: string } = {}): Promise<{
    totalPlays: number;
    totalFormations: number;
    avgSuccessRate: number;
    recentTrend: 'up' | 'down' | 'stable';
    topPlays: TacticalPlay[];
    recentActivity: Array<{
      id: string;
      type: 'play_created' | 'play_updated' | 'formation_created';
      title: string;
      timestamp: string;
    }>;
    offlineStatus?: {
      isOnline: boolean;
      pendingSync: number;
      conflicts: number;
    };
  }> {
    const [plays, formations, stats] = await Promise.all([
      this.getTacticalPlays(options),
      this.getFormations(),
      this.getPlayUsageStats(),
    ]);

    const avgSuccessRate = plays.reduce((sum, play) => sum + (play.success_rate || 0), 0) / plays.length;
    
    return {
      totalPlays: plays.length,
      totalFormations: formations.length,
      avgSuccessRate: isNaN(avgSuccessRate) ? 0 : avgSuccessRate,
      recentTrend: 'stable',
      topPlays: plays.slice(0, 5),
      recentActivity: plays
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 5)
        .map(play => ({
          id: play.id,
          type: 'play_updated' as const,
          title: `Updated "${play.name}"`,
          timestamp: play.updatedAt,
        })),
      offlineStatus: this.getOfflineStatus(),
    };
  }
}

/**
 * Global tactical data service instance
 */
export const tacticalDataService = new TacticalDataService();

/**
 * Export types for components
 */
export type {
  TacticalPlay,
  Formation,
  GameSituation,
  RealTimeTacticalData,
  PlayUsageStats,
  PlayEffectivenessMetrics,
  FormationAnalytics,
  PlayerTacticalRating,
  TacticalTrendAnalysis,
  OpponentAnalysis,
  GameTacticalAnalysis,
};