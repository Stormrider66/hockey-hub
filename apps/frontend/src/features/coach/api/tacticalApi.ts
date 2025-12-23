/**
 * Tactical API Client
 * Comprehensive client for tactical system data persistence with error handling,
 * retry logic, and TypeScript types for all operations
 */

import type {
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
} from '../services/tacticalDataService';

// Re-export types from tactical data service
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

/**
 * Enhanced types for API operations
 */
export interface TacticalPlayCreateRequest {
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
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  teamId?: string;
}

export interface TacticalPlayUpdateRequest {
  name?: string;
  description?: string;
  category?: 'offensive' | 'defensive' | 'special_teams' | 'neutral_zone';
  formation?: string;
  players?: Array<{
    position: string;
    role: string;
    x: number;
    y: number;
  }>;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  tags?: string[];
  success_rate?: number;
}

export interface FormationCreateRequest {
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
}

export interface FormationUpdateRequest {
  name?: string;
  description?: string;
  type?: 'offensive' | 'defensive' | 'transition' | 'special_teams';
  positions?: Array<{
    role: string;
    x: number;
    y: number;
    zone: 'offensive' | 'defensive' | 'neutral';
  }>;
  strengths?: string[];
  weaknesses?: string[];
  situational_use?: string[];
}

export interface TacticalQueryOptions {
  teamId?: string;
  category?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'name' | 'updatedAt' | 'success_rate' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface FormationQueryOptions {
  type?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface BulkOperationRequest {
  action: 'delete' | 'duplicate' | 'archive' | 'activate';
  ids: string[];
  options?: Record<string, any>;
}

export interface BulkOperationResponse {
  success: boolean;
  affectedCount: number;
  errors?: Array<{
    id: string;
    error: string;
  }>;
  results?: Array<{
    id: string;
    result: any;
  }>;
}

/**
 * API Error types
 */
export class TacticalApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'TacticalApiError';
  }
}

export class TacticalNetworkError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'TacticalNetworkError';
  }
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryableStatusCodes: number[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};

/**
 * HTTP Client with retry logic
 */
class HttpClient {
  private baseUrl: string;
  private retryConfig: RetryConfig;

  constructor(baseUrl?: string, retryConfig?: Partial<RetryConfig>) {
    this.baseUrl = baseUrl || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private calculateBackoffDelay(attempt: number): number {
    const delay = this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffFactor, attempt);
    return Math.min(delay, this.retryConfig.maxDelay);
  }

  private shouldRetry(statusCode: number, attempt: number): boolean {
    return (
      attempt < this.retryConfig.maxAttempts &&
      this.retryConfig.retryableStatusCodes.includes(statusCode)
    );
  }

  private async makeRequest<T>(
    url: string,
    options: RequestInit = {},
    attempt = 0
  ): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${url}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        if (this.shouldRetry(response.status, attempt)) {
          const delay = this.calculateBackoffDelay(attempt);
          console.warn(`Request failed with status ${response.status}, retrying in ${delay}ms...`);
          await this.sleep(delay);
          return this.makeRequest(url, options, attempt + 1);
        }

        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: response.statusText };
        }

        throw new TacticalApiError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData.code,
          errorData
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof TacticalApiError) {
        throw error;
      }

      if (attempt < this.retryConfig.maxAttempts && 
          (error instanceof TypeError && error.message.includes('fetch'))) {
        const delay = this.calculateBackoffDelay(attempt);
        console.warn(`Network error, retrying in ${delay}ms...`);
        await this.sleep(delay);
        return this.makeRequest(url, options, attempt + 1);
      }

      throw new TacticalNetworkError(
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  async get<T>(url: string, params?: Record<string, any>): Promise<T> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    
    const queryString = searchParams.toString();
    const fullUrl = queryString ? `${url}?${queryString}` : url;
    
    return this.makeRequest<T>(fullUrl, { method: 'GET' });
  }

  async post<T>(url: string, data?: any): Promise<T> {
    return this.makeRequest<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(url: string, data?: any): Promise<T> {
    return this.makeRequest<T>(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(url: string, data?: any): Promise<T> {
    return this.makeRequest<T>(url, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(url: string): Promise<T> {
    return this.makeRequest<T>(url, { method: 'DELETE' });
  }
}

/**
 * Main Tactical API Client
 */
export class TacticalApiClient {
  private httpClient: HttpClient;

  constructor(baseUrl?: string, retryConfig?: Partial<RetryConfig>) {
    this.httpClient = new HttpClient(baseUrl, retryConfig);
  }

  // ============ Tactical Plays API ============

  /**
   * Get tactical plays with filtering and pagination
   */
  async getTacticalPlays(options: TacticalQueryOptions = {}): Promise<PaginatedResponse<TacticalPlay>> {
    return this.httpClient.get<PaginatedResponse<TacticalPlay>>('/api/v1/coach/tactical-plans', options);
  }

  /**
   * Get a single tactical play by ID
   */
  async getTacticalPlay(id: string): Promise<TacticalPlay> {
    if (!id) throw new TacticalApiError('Tactical play ID is required', 400);
    return this.httpClient.get<TacticalPlay>(`/api/v1/coach/tactical-plans/${id}`);
  }

  /**
   * Create a new tactical play
   */
  async createTacticalPlay(play: TacticalPlayCreateRequest): Promise<TacticalPlay> {
    this.validateTacticalPlayRequest(play);
    return this.httpClient.post<TacticalPlay>('/api/v1/coach/tactical-plans', play);
  }

  /**
   * Update an existing tactical play
   */
  async updateTacticalPlay(id: string, updates: TacticalPlayUpdateRequest): Promise<TacticalPlay> {
    if (!id) throw new TacticalApiError('Tactical play ID is required', 400);
    return this.httpClient.put<TacticalPlay>(`/api/v1/coach/tactical-plans/${id}`, updates);
  }

  /**
   * Delete a tactical play
   */
  async deleteTacticalPlay(id: string): Promise<void> {
    if (!id) throw new TacticalApiError('Tactical play ID is required', 400);
    return this.httpClient.delete<void>(`/api/v1/coach/tactical-plans/${id}`);
  }

  /**
   * Search tactical plays
   */
  async searchTacticalPlays(query: string): Promise<TacticalPlay[]> {
    if (!query.trim()) throw new TacticalApiError('Search query is required', 400);
    return this.httpClient.get<TacticalPlay[]>('/api/v1/coach/tactical-plans/search', { q: query });
  }

  /**
   * Bulk operations on tactical plays
   */
  async bulkTacticalPlaysOperation(request: BulkOperationRequest): Promise<BulkOperationResponse> {
    this.validateBulkRequest(request);
    return this.httpClient.post<BulkOperationResponse>('/api/v1/coach/tactical-plans/bulk', request);
  }

  // ============ Formations API ============

  /**
   * Get formations with filtering
   */
  async getFormations(options: FormationQueryOptions = {}): Promise<PaginatedResponse<Formation>> {
    return this.httpClient.get<PaginatedResponse<Formation>>('/api/v1/coach/formations', options);
  }

  /**
   * Get a single formation by ID
   */
  async getFormation(id: string): Promise<Formation> {
    if (!id) throw new TacticalApiError('Formation ID is required', 400);
    return this.httpClient.get<Formation>(`/api/v1/coach/formations/${id}`);
  }

  /**
   * Create a new formation
   */
  async createFormation(formation: FormationCreateRequest): Promise<Formation> {
    this.validateFormationRequest(formation);
    return this.httpClient.post<Formation>('/api/v1/coach/formations', formation);
  }

  /**
   * Update an existing formation
   */
  async updateFormation(id: string, updates: FormationUpdateRequest): Promise<Formation> {
    if (!id) throw new TacticalApiError('Formation ID is required', 400);
    return this.httpClient.put<Formation>(`/api/v1/coach/formations/${id}`, updates);
  }

  /**
   * Delete a formation
   */
  async deleteFormation(id: string): Promise<void> {
    if (!id) throw new TacticalApiError('Formation ID is required', 400);
    return this.httpClient.delete<void>(`/api/v1/coach/formations/${id}`);
  }

  // ============ Statistics API ============

  /**
   * Get play usage statistics
   */
  async getPlayUsageStats(options?: any): Promise<PlayUsageStats[]> {
    return this.httpClient.post<PlayUsageStats[]>('/api/v1/statistics/tactical/play-usage', options || {});
  }

  /**
   * Get play effectiveness metrics
   */
  async getPlayEffectivenessMetrics(playId: string, options?: any): Promise<PlayEffectivenessMetrics> {
    if (!playId) throw new TacticalApiError('Play ID is required', 400);
    return this.httpClient.post<PlayEffectivenessMetrics>(
      `/api/v1/statistics/tactical/play-effectiveness/${playId}`,
      options || {}
    );
  }

  /**
   * Get formation analytics
   */
  async getFormationAnalytics(options?: any): Promise<FormationAnalytics[]> {
    return this.httpClient.post<FormationAnalytics[]>('/api/v1/statistics/tactical/formation-analytics', options || {});
  }

  /**
   * Get player tactical ratings
   */
  async getPlayerTacticalRatings(options?: any): Promise<PlayerTacticalRating[]> {
    return this.httpClient.post<PlayerTacticalRating[]>('/api/v1/statistics/tactical/player-ratings', options || {});
  }

  /**
   * Get tactical trends
   */
  async getTacticalTrends(options: any): Promise<TacticalTrendAnalysis> {
    if (!options) throw new TacticalApiError('Options are required for tactical trends', 400);
    return this.httpClient.post<TacticalTrendAnalysis>('/api/v1/statistics/tactical/trends', options);
  }

  /**
   * Get opponent analysis
   */
  async getOpponentAnalysis(opponentId: string, options?: any): Promise<OpponentAnalysis> {
    if (!opponentId) throw new TacticalApiError('Opponent ID is required', 400);
    return this.httpClient.post<OpponentAnalysis>(
      `/api/v1/statistics/tactical/opponent-analysis/${opponentId}`,
      options || {}
    );
  }

  /**
   * Generate game tactical report
   */
  async generateGameTacticalReport(gameId: string): Promise<GameTacticalAnalysis> {
    if (!gameId) throw new TacticalApiError('Game ID is required', 400);
    return this.httpClient.get<GameTacticalAnalysis>(`/api/v1/statistics/tactical/game-report/${gameId}`);
  }

  // ============ Real-time API ============

  /**
   * Get current real-time tactical data
   */
  async getRealTimeData(): Promise<RealTimeTacticalData> {
    return this.httpClient.get<RealTimeTacticalData>('/api/v1/tactical/real-time');
  }

  /**
   * Subscribe to real-time tactical updates via WebSocket
   */
  subscribeToRealTimeUpdates(callback: (data: RealTimeTacticalData) => void): () => void {
    const baseUrl = this.httpClient['baseUrl'] || 'http://localhost:3000';
    const wsUrl = baseUrl.replace(/^https?/, 'ws');
    
    let ws: WebSocket;
    let reconnectTimeout: NodeJS.Timeout;
    let shouldReconnect = true;
    
    const connect = () => {
      try {
        ws = new WebSocket(`${wsUrl}/ws/tactical/real-time`);
        
        ws.onopen = () => {
          console.log('Connected to tactical real-time WebSocket');
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as RealTimeTacticalData;
            callback(data);
          } catch (error) {
            console.error('Failed to parse real-time tactical data:', error);
          }
        };
        
        ws.onclose = (event) => {
          console.log('Tactical WebSocket connection closed:', event.code, event.reason);
          if (shouldReconnect) {
            console.log('Reconnecting in 3 seconds...');
            reconnectTimeout = setTimeout(connect, 3000);
          }
        };
        
        ws.onerror = (error) => {
          console.error('Tactical WebSocket error:', error);
        };
      } catch (error) {
        console.error('Failed to create tactical WebSocket connection:', error);
        if (shouldReconnect) {
          reconnectTimeout = setTimeout(connect, 3000);
        }
      }
    };
    
    connect();
    
    return () => {
      shouldReconnect = false;
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (ws) {
        ws.close();
      }
    };
  }

  // ============ Helper Methods ============

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
  }> {
    return this.httpClient.get('/api/v1/coach/tactical/dashboard', options);
  }

  // ============ Validation Methods ============

  private validateTacticalPlayRequest(play: TacticalPlayCreateRequest): void {
    const errors: string[] = [];

    if (!play.name?.trim()) {
      errors.push('Name is required');
    }

    if (!play.category) {
      errors.push('Category is required');
    }

    if (!play.formation?.trim()) {
      errors.push('Formation is required');
    }

    if (!play.players || !Array.isArray(play.players) || play.players.length === 0) {
      errors.push('At least one player position is required');
    } else {
      play.players.forEach((player, index) => {
        if (!player.position?.trim()) {
          errors.push(`Player ${index + 1}: position is required`);
        }
        if (!player.role?.trim()) {
          errors.push(`Player ${index + 1}: role is required`);
        }
        if (typeof player.x !== 'number' || typeof player.y !== 'number') {
          errors.push(`Player ${index + 1}: x and y coordinates must be numbers`);
        }
      });
    }

    if (!play.difficulty) {
      errors.push('Difficulty is required');
    }

    if (!play.tags || !Array.isArray(play.tags)) {
      errors.push('Tags must be an array');
    }

    if (errors.length > 0) {
      throw new TacticalApiError(`Validation failed: ${errors.join(', ')}`, 400, 'VALIDATION_ERROR');
    }
  }

  private validateFormationRequest(formation: FormationCreateRequest): void {
    const errors: string[] = [];

    if (!formation.name?.trim()) {
      errors.push('Name is required');
    }

    if (!formation.type) {
      errors.push('Type is required');
    }

    if (!formation.positions || !Array.isArray(formation.positions) || formation.positions.length === 0) {
      errors.push('At least one position is required');
    } else {
      formation.positions.forEach((position, index) => {
        if (!position.role?.trim()) {
          errors.push(`Position ${index + 1}: role is required`);
        }
        if (typeof position.x !== 'number' || typeof position.y !== 'number') {
          errors.push(`Position ${index + 1}: x and y coordinates must be numbers`);
        }
        if (!position.zone) {
          errors.push(`Position ${index + 1}: zone is required`);
        }
      });
    }

    if (!formation.strengths || !Array.isArray(formation.strengths)) {
      errors.push('Strengths must be an array');
    }

    if (!formation.weaknesses || !Array.isArray(formation.weaknesses)) {
      errors.push('Weaknesses must be an array');
    }

    if (!formation.situational_use || !Array.isArray(formation.situational_use)) {
      errors.push('Situational use must be an array');
    }

    if (errors.length > 0) {
      throw new TacticalApiError(`Validation failed: ${errors.join(', ')}`, 400, 'VALIDATION_ERROR');
    }
  }

  private validateBulkRequest(request: BulkOperationRequest): void {
    const errors: string[] = [];

    if (!request.action) {
      errors.push('Action is required');
    }

    if (!request.ids || !Array.isArray(request.ids) || request.ids.length === 0) {
      errors.push('At least one ID is required');
    }

    if (request.ids && request.ids.some(id => !id || typeof id !== 'string')) {
      errors.push('All IDs must be non-empty strings');
    }

    if (errors.length > 0) {
      throw new TacticalApiError(`Bulk operation validation failed: ${errors.join(', ')}`, 400, 'VALIDATION_ERROR');
    }
  }
}

// Global instance
export const tacticalApiClient = new TacticalApiClient();