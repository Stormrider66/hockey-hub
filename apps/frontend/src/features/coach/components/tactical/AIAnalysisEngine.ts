import { Player, Position, Formation, TacticalPlay } from '../../types/tactical.types';
import { aiAnalysisService } from '../../services/aiAnalysisService';
import { aiCacheService } from '../../services/aiCacheService';

// Analysis result types
export interface PlayAnalysis {
  overallScore: number; // 0-100
  timestamp: string;
  playId: string;
  analysisType: AnalysisType;
  breakdown: AnalysisBreakdown;
  suggestions: Suggestion[];
  patterns: PatternRecognition;
  risks: RiskAssessment[];
  metadata: AnalysisMetadata;
}

export interface AnalysisBreakdown {
  spacing: SpacingAnalysis;
  timing: TimingAnalysis;
  formation: FormationAnalysis;
  effectiveness: EffectivenessAnalysis;
  tactical: TacticalAnalysis;
}

export interface SpacingAnalysis {
  score: number; // 0-100
  averageDistance: number; // meters
  clusteringIssues: ClusteringIssue[];
  optimalSpacing: boolean;
  spacingMap: SpacingMap;
  recommendations: string[];
}

export interface TimingAnalysis {
  score: number;
  sequenceOptimal: boolean;
  timingIssues: TimingIssue[];
  movementSync: number; // 0-100
  phaseTransitions: PhaseTransition[];
  recommendations: string[];
}

export interface FormationAnalysis {
  detectedFormation: string;
  formationScore: number;
  coverageMap: ZoneCoverage[];
  vulnerabilities: Vulnerability[];
  strengths: string[];
  alternativeFormations: AlternativeFormation[];
}

export interface EffectivenessAnalysis {
  successProbability: number; // 0-100
  goalScoringChance: number; // 0-100
  possessionRetention: number; // 0-100
  counterAttackVulnerability: number; // 0-100
  energyEfficiency: number; // 0-100
}

export interface TacticalAnalysis {
  playType: string;
  tacticalPrinciples: TacticalPrinciple[];
  adherenceToStrategy: number; // 0-100
  creativity: number; // 0-100
  predictability: number; // 0-100 (lower is better)
  adaptability: number; // 0-100
}

export interface Suggestion {
  id: string;
  type: SuggestionType;
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  implementation: string;
  expectedImprovement: number; // 0-100
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'positioning' | 'timing' | 'formation' | 'execution' | 'strategy';
  affectedPlayers: string[];
  visualAid?: VisualAid;
}

export interface PatternRecognition {
  playPattern: string;
  similarPlays: SimilarPlay[];
  commonMistakes: CommonMistake[];
  tacticalTrends: TacticalTrend[];
  formationPattern: FormationPattern;
  predictabilityFactors: string[];
}

export interface RiskAssessment {
  id: string;
  type: RiskType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  probability: number; // 0-100
  description: string;
  mitigation: string;
  affectedZones: string[];
  timeframe: 'immediate' | 'short-term' | 'long-term';
}

// Supporting interfaces
export interface ClusteringIssue {
  zone: string;
  playerCount: number;
  recommendation: string;
  severity: 'minor' | 'moderate' | 'major';
}

export interface TimingIssue {
  player: string;
  issue: string;
  suggestedDelay: number; // seconds
  impact: string;
}

export interface PhaseTransition {
  from: string;
  to: string;
  timing: number;
  efficiency: number;
  recommendation: string;
}

export interface ZoneCoverage {
  zone: string;
  coverage: number; // 0-100
  players: string[];
  vulnerability: boolean;
}

export interface Vulnerability {
  zone: string;
  type: string;
  severity: 'low' | 'medium' | 'high';
  exploitation: string;
  countermeasure: string;
}

export interface AlternativeFormation {
  name: string;
  score: number;
  advantages: string[];
  disadvantages: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface TacticalPrinciple {
  principle: string;
  adherence: number; // 0-100
  importance: number; // 0-100
  feedback: string;
}

export interface SimilarPlay {
  playId: string;
  similarity: number; // 0-100
  source: string;
  effectiveness: number;
  keyDifferences: string[];
}

export interface CommonMistake {
  mistake: string;
  frequency: number; // 0-100
  impact: number; // 0-100
  solution: string;
}

export interface TacticalTrend {
  trend: string;
  strength: number; // 0-100
  recommendation: string;
}

export interface FormationPattern {
  primary: string;
  variations: string[];
  effectiveness: number;
  modernTrend: boolean;
}

export interface SpacingMap {
  zones: { [key: string]: number }; // zone -> player density
  averageSpacing: number;
  optimalZones: string[];
  problematicZones: string[];
}

export interface AnalysisMetadata {
  aiProvider: 'openai' | 'local' | 'hybrid';
  processingTime: number; // milliseconds
  confidence: number; // 0-100
  dataQuality: number; // 0-100
  version: string;
  context: AnalysisContext;
}

export interface AnalysisContext {
  gamePhase: 'power-play' | 'penalty-kill' | 'even-strength' | 'empty-net';
  situation: 'offensive-zone' | 'defensive-zone' | 'neutral-zone' | 'transition';
  timeRemaining: number; // seconds
  scoreState: 'leading' | 'tied' | 'trailing';
  playerTiredness: { [playerId: string]: number }; // 0-100
}

export interface VisualAid {
  type: 'arrow' | 'circle' | 'line' | 'zone-highlight';
  coordinates: { x: number; y: number }[];
  color: string;
  description: string;
}

// Enums
export type AnalysisType = 'quick' | 'detailed' | 'comparative' | 'opponent-perspective' | 'learning';
export type SuggestionType = 'improvement' | 'alternative' | 'counter-strategy' | 'optimization' | 'education';
export type RiskType = 'turnover' | 'counter-attack' | 'positional' | 'fatigue' | 'injury' | 'strategic';

// OpenAI Configuration
export interface AIConfig {
  apiKey?: string;
  model: string;
  maxTokens: number;
  temperature: number;
  enabled: boolean;
  fallbackToLocal: boolean;
  cacheDuration: number; // minutes
}

// Main AI Analysis Engine Class
export class AIAnalysisEngine {
  private config: AIConfig;
  private analysisCache: Map<string, PlayAnalysis> = new Map();
  private rateLimitTracker: Map<string, number> = new Map();

  constructor(config: Partial<AIConfig> = {}) {
    this.config = {
      apiKey: config.apiKey || process.env.NEXT_PUBLIC_OPENAI_API_KEY,
      model: config.model || 'gpt-4-turbo-preview',
      maxTokens: config.maxTokens || 2000,
      temperature: config.temperature || 0.3,
      enabled: config.enabled ?? true,
      fallbackToLocal: config.fallbackToLocal ?? true,
      cacheDuration: config.cacheDuration ?? 30,
      ...config
    };
  }

  /**
   * Main analysis method - routes to appropriate analysis type
   */
  public async analyzePlay(
    play: TacticalPlay,
    analysisType: AnalysisType = 'detailed',
    context?: AnalysisContext
  ): Promise<PlayAnalysis> {
    const cacheKey = this.getCacheKey(play, analysisType, context);
    
    // Check AI cache service first
    const cached = await aiCacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const startTime = Date.now();
    let result: PlayAnalysis;

    try {
      if (this.config.enabled && this.config.apiKey && this.canMakeAPICall()) {
        result = await this.performAIAnalysis(play, analysisType, context);
      } else {
        result = await this.performLocalAnalysis(play, analysisType, context);
      }
    } catch (error) {
      console.error('AI Analysis failed, falling back to local:', error);
      if (this.config.fallbackToLocal) {
        result = await this.performLocalAnalysis(play, analysisType, context);
      } else {
        throw error;
      }
    }

    result.metadata.processingTime = Date.now() - startTime;
    
    // Cache using AI cache service
    await aiCacheService.set(play, analysisType, context, result);
    
    return result;
  }

  /**
   * AI-powered analysis using AI service with fallback
   */
  private async performAIAnalysis(
    play: TacticalPlay,
    analysisType: AnalysisType,
    context?: AnalysisContext
  ): Promise<PlayAnalysis> {
    try {
      // Use the new AI service for actual analysis
      const aiResponse = await aiAnalysisService.analyzePlay(play, analysisType, context);
      const aiAnalysis = aiAnalysisService.parseAIResponse(aiResponse);
      const localAnalysis = await this.performLocalAnalysis(play, analysisType, context);

      // Merge AI insights with local calculations
      const merged = this.mergeAnalyses(aiAnalysis, localAnalysis, aiResponse.provider as any);
      
      // Update metadata with AI response info
      merged.metadata.processingTime = 0; // Will be set by caller
      merged.metadata.confidence = Math.max(merged.metadata.confidence, aiResponse.confidence);
      
      return merged;
    } catch (error) {
      console.error('AI service failed, using local analysis:', error);
      // Fallback to local analysis
      return await this.performLocalAnalysis(play, analysisType, context);
    }
  }

  /**
   * Local fallback analysis using algorithmic approach
   */
  private async performLocalAnalysis(
    play: TacticalPlay,
    analysisType: AnalysisType,
    context?: AnalysisContext
  ): Promise<PlayAnalysis> {
    const spacing = this.analyzeSpacing(play);
    const timing = this.analyzeTiming(play);
    const formation = this.analyzeFormation(play);
    const effectiveness = this.analyzeEffectiveness(play, context);
    const tactical = this.analyzeTactical(play);

    const breakdown: AnalysisBreakdown = {
      spacing,
      timing,
      formation,
      effectiveness,
      tactical
    };

    const suggestions = this.generateSuggestions(breakdown, play);
    const patterns = this.recognizePatterns(play);
    const risks = this.assessRisks(play, context);

    const overallScore = this.calculateOverallScore(breakdown);

    return {
      overallScore,
      timestamp: new Date().toISOString(),
      playId: play.id,
      analysisType,
      breakdown,
      suggestions,
      patterns,
      risks,
      metadata: {
        aiProvider: 'local',
        processingTime: 0, // Will be set by caller
        confidence: this.calculateConfidence(breakdown),
        dataQuality: this.assessDataQuality(play),
        version: '1.0.0',
        context: context || this.getDefaultContext()
      }
    };
  }

  /**
   * Spacing Analysis - Geometric calculations
   */
  private analyzeSpacing(play: TacticalPlay): SpacingAnalysis {
    const players = play.formation.players;
    const distances: number[] = [];
    const clusteringIssues: ClusteringIssue[] = [];
    const spacingMap: SpacingMap = {
      zones: {},
      averageSpacing: 0,
      optimalZones: [],
      problematicZones: []
    };

    // Calculate all pairwise distances
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        const distance = this.calculateDistance(players[i].position, players[j].position);
        distances.push(distance);
      }
    }

    const averageDistance = distances.reduce((a, b) => a + b, 0) / distances.length;
    spacingMap.averageSpacing = averageDistance;

    // Analyze zone density
    const zones = this.getHockeyZones();
    zones.forEach(zone => {
      const playersInZone = players.filter(p => this.isInZone(p.position, zone));
      spacingMap.zones[zone.name] = playersInZone.length;

      if (playersInZone.length > 2) {
        clusteringIssues.push({
          zone: zone.name,
          playerCount: playersInZone.length,
          recommendation: `Spread players in ${zone.name} to create better spacing`,
          severity: playersInZone.length > 3 ? 'major' : 'moderate'
        });
        spacingMap.problematicZones.push(zone.name);
      } else if (playersInZone.length === 1 || playersInZone.length === 2) {
        spacingMap.optimalZones.push(zone.name);
      }
    });

    // Calculate score based on spacing quality
    const optimalDistance = 5; // meters (ideal hockey spacing)
    const spacingScore = Math.max(0, 100 - Math.abs(averageDistance - optimalDistance) * 10);
    const clusteringPenalty = clusteringIssues.length * 15;
    const score = Math.max(0, spacingScore - clusteringPenalty);

    const recommendations = this.generateSpacingRecommendations(spacingMap, clusteringIssues);

    return {
      score,
      averageDistance,
      clusteringIssues,
      optimalSpacing: score > 75,
      spacingMap,
      recommendations
    };
  }

  /**
   * Timing Analysis - Movement synchronization
   */
  private analyzeTiming(play: TacticalPlay): TimingAnalysis {
    // Simulate timing analysis based on play sequence
    const movements = play.movements || [];
    const timingIssues: TimingIssue[] = [];
    const phaseTransitions: PhaseTransition[] = [];

    let movementSync = 85; // Base score
    let sequenceOptimal = true;

    // Analyze movement timing (simulated)
    movements.forEach((movement, index) => {
      // Check for timing conflicts
      if (movement.startTime && index > 0) {
        const prevMovement = movements[index - 1];
        const gap = movement.startTime - (prevMovement.startTime || 0);
        
        if (gap < 0.5) {
          timingIssues.push({
            player: movement.playerId,
            issue: 'Movement starts too early, may interfere with previous action',
            suggestedDelay: 0.5 - gap,
            impact: 'Reduced effectiveness, potential confusion'
          });
          movementSync -= 10;
          sequenceOptimal = false;
        }
      }

      // Analyze phase transitions
      if (movement.phase) {
        phaseTransitions.push({
          from: index > 0 ? movements[index - 1].phase || 'unknown' : 'start',
          to: movement.phase,
          timing: movement.startTime || index,
          efficiency: Math.random() * 40 + 60, // Mock efficiency 60-100
          recommendation: this.generatePhaseRecommendation(movement.phase)
        });
      }
    });

    const score = Math.max(0, movementSync);
    const recommendations = this.generateTimingRecommendations(timingIssues, phaseTransitions);

    return {
      score,
      sequenceOptimal,
      timingIssues,
      movementSync,
      phaseTransitions,
      recommendations
    };
  }

  /**
   * Formation Analysis - Structure and coverage
   */
  private analyzeFormation(play: TacticalPlay): FormationAnalysis {
    const formation = play.formation;
    const players = formation.players;
    
    // Detect formation type
    const detectedFormation = this.detectFormationType(players);
    
    // Analyze zone coverage
    const coverageMap = this.analyzeCoverage(players);
    
    // Identify vulnerabilities
    const vulnerabilities = this.identifyVulnerabilities(coverageMap, detectedFormation);
    
    // Calculate formation score
    const formationScore = this.calculateFormationScore(coverageMap, vulnerabilities);
    
    // Suggest alternative formations
    const alternativeFormations = this.suggestAlternativeFormations(detectedFormation, formationScore);
    
    // Identify strengths
    const strengths = this.identifyFormationStrengths(detectedFormation, coverageMap);

    return {
      detectedFormation,
      formationScore,
      coverageMap,
      vulnerabilities,
      strengths,
      alternativeFormations
    };
  }

  /**
   * Effectiveness Analysis - Success probability calculations
   */
  private analyzeEffectiveness(play: TacticalPlay, context?: AnalysisContext): EffectivenessAnalysis {
    // Base calculations with context consideration
    const baseSuccess = 70;
    const contextModifier = context ? this.getContextModifier(context) : 0;
    
    const successProbability = Math.min(100, Math.max(0, baseSuccess + contextModifier));
    
    // Calculate specific effectiveness metrics
    const goalScoringChance = this.calculateGoalScoringChance(play, context);
    const possessionRetention = this.calculatePossessionRetention(play);
    const counterAttackVulnerability = this.calculateCounterAttackRisk(play);
    const energyEfficiency = this.calculateEnergyEfficiency(play);

    return {
      successProbability,
      goalScoringChance,
      possessionRetention,
      counterAttackVulnerability,
      energyEfficiency
    };
  }

  /**
   * Tactical Analysis - Strategic evaluation
   */
  private analyzeTactical(play: TacticalPlay): TacticalAnalysis {
    const playType = this.determinePlayType(play);
    const tacticalPrinciples = this.evaluateTacticalPrinciples(play);
    
    // Calculate tactical metrics
    const adherenceToStrategy = tacticalPrinciples.reduce((sum, p) => sum + p.adherence, 0) / tacticalPrinciples.length;
    const creativity = this.calculateCreativity(play);
    const predictability = this.calculatePredictability(play);
    const adaptability = this.calculateAdaptability(play);

    return {
      playType,
      tacticalPrinciples,
      adherenceToStrategy,
      creativity,
      predictability,
      adaptability
    };
  }

  /**
   * Generate improvement suggestions
   */
  private generateSuggestions(breakdown: AnalysisBreakdown, play: TacticalPlay): Suggestion[] {
    const suggestions: Suggestion[] = [];

    // Spacing suggestions
    if (breakdown.spacing.score < 70) {
      breakdown.spacing.clusteringIssues.forEach((issue, index) => {
        suggestions.push({
          id: `spacing-${index}`,
          type: 'improvement',
          priority: issue.severity === 'major' ? 'high' : 'medium',
          title: `Improve spacing in ${issue.zone}`,
          description: issue.recommendation,
          implementation: `Reposition players to maintain 4-6 meter spacing in ${issue.zone}`,
          expectedImprovement: 15,
          difficulty: 'medium',
          category: 'positioning',
          affectedPlayers: this.getPlayersInZone(play.formation.players, issue.zone),
          visualAid: {
            type: 'zone-highlight',
            coordinates: this.getZoneCoordinates(issue.zone),
            color: '#ff6b6b',
            description: `Overcrowded zone: ${issue.zone}`
          }
        });
      });
    }

    // Timing suggestions
    if (breakdown.timing.score < 70) {
      breakdown.timing.timingIssues.forEach((issue, index) => {
        suggestions.push({
          id: `timing-${index}`,
          type: 'improvement',
          priority: 'medium',
          title: `Adjust timing for ${issue.player}`,
          description: issue.issue,
          implementation: `Delay movement by ${issue.suggestedDelay} seconds`,
          expectedImprovement: 12,
          difficulty: 'easy',
          category: 'timing',
          affectedPlayers: [issue.player]
        });
      });
    }

    // Formation suggestions
    if (breakdown.formation.formationScore < 70) {
      breakdown.formation.alternativeFormations
        .filter(alt => alt.score > breakdown.formation.formationScore)
        .slice(0, 2)
        .forEach((alt, index) => {
          suggestions.push({
            id: `formation-${index}`,
            type: 'alternative',
            priority: 'medium',
            title: `Consider ${alt.name} formation`,
            description: `Current formation scores ${breakdown.formation.formationScore}/100, ${alt.name} could score ${alt.score}/100`,
            implementation: `Reorganize players into ${alt.name} formation`,
            expectedImprovement: alt.score - breakdown.formation.formationScore,
            difficulty: alt.difficulty,
            category: 'formation',
            affectedPlayers: play.formation.players.map(p => p.id)
          });
        });
    }

    return suggestions.sort((a, b) => this.getSuggestionPriority(b.priority) - this.getSuggestionPriority(a.priority));
  }

  /**
   * Pattern Recognition
   */
  private recognizePatterns(play: TacticalPlay): PatternRecognition {
    const playPattern = this.identifyPlayPattern(play);
    const similarPlays = this.findSimilarPlays(play);
    const commonMistakes = this.identifyCommonMistakes(play);
    const tacticalTrends = this.analyzeTacticalTrends(play);
    const formationPattern = this.analyzeFormationPattern(play);
    const predictabilityFactors = this.identifyPredictabilityFactors(play);

    return {
      playPattern,
      similarPlays,
      commonMistakes,
      tacticalTrends,
      formationPattern,
      predictabilityFactors
    };
  }

  /**
   * Risk Assessment
   */
  private assessRisks(play: TacticalPlay, context?: AnalysisContext): RiskAssessment[] {
    const risks: RiskAssessment[] = [];

    // Turnover risk
    const turnoverRisk = this.calculateTurnoverRisk(play, context);
    if (turnoverRisk > 30) {
      risks.push({
        id: 'turnover-risk',
        type: 'turnover',
        severity: turnoverRisk > 70 ? 'high' : turnoverRisk > 50 ? 'medium' : 'low',
        probability: turnoverRisk,
        description: 'High probability of losing possession during play execution',
        mitigation: 'Add support players and simplify passes',
        affectedZones: ['neutral-zone', 'offensive-zone'],
        timeframe: 'immediate'
      });
    }

    // Counter-attack vulnerability
    const counterRisk = this.calculateCounterAttackRisk(play);
    if (counterRisk > 40) {
      risks.push({
        id: 'counter-attack-risk',
        type: 'counter-attack',
        severity: counterRisk > 75 ? 'critical' : counterRisk > 60 ? 'high' : 'medium',
        probability: counterRisk,
        description: 'Vulnerable to quick counter-attack if possession is lost',
        mitigation: 'Ensure defensive coverage and quick backchecking',
        affectedZones: ['defensive-zone'],
        timeframe: 'short-term'
      });
    }

    // Positional risk
    const positionalRisk = this.calculatePositionalRisk(play);
    if (positionalRisk > 35) {
      risks.push({
        id: 'positional-risk',
        type: 'positional',
        severity: positionalRisk > 65 ? 'high' : 'medium',
        probability: positionalRisk,
        description: 'Players may end up in suboptimal positions',
        mitigation: 'Clear role definitions and positioning guidelines',
        affectedZones: this.getAffectedZones(play),
        timeframe: 'immediate'
      });
    }

    return risks;
  }

  // Helper Methods

  private buildAnalysisPrompt(play: TacticalPlay, analysisType: AnalysisType, context?: AnalysisContext): string {
    const playDescription = this.describePlay(play);
    const contextDescription = context ? this.describeContext(context) : '';

    return `
Analyze this hockey tactical play with the following details:

PLAY DESCRIPTION:
${playDescription}

CONTEXT:
${contextDescription}

ANALYSIS TYPE: ${analysisType}

Please provide a comprehensive analysis focusing on:
1. Play effectiveness (0-100 score with breakdown)
2. Spacing and positioning quality
3. Timing and movement coordination
4. Formation strengths and weaknesses
5. Risk assessment (turnovers, counter-attacks)
6. Specific improvement suggestions
7. Alternative strategies or formations
8. Pattern recognition and predictability factors

Format your response as structured analysis with specific numerical scores and actionable recommendations.
    `.trim();
  }

  private getSystemPrompt(): string {
    return `
You are an expert hockey tactical analyst with deep knowledge of:
- Modern hockey systems and formations (1-2-2, 2-1-2, 1-3-1, etc.)
- Offensive and defensive principles
- Player positioning and spacing optimization
- Power play and penalty kill strategies
- Transition game analysis
- Risk assessment and game management

Provide detailed, actionable analysis with specific numerical scores and concrete recommendations.
Focus on tactical soundness, player safety, and practical implementation.
Consider modern NHL trends and coaching best practices.
    `.trim();
  }


  private mergeAnalyses(aiAnalysis: Partial<PlayAnalysis>, localAnalysis: PlayAnalysis, provider: 'openai' | 'claude' | 'hybrid' | 'local'): PlayAnalysis {
    // Merge AI insights with local calculations
    const merged = { ...localAnalysis };
    
    if (aiAnalysis.overallScore) {
      // Weight AI score with local score based on provider confidence
      const aiWeight = provider === 'local' ? 0.3 : 0.7;
      const localWeight = 1 - aiWeight;
      merged.overallScore = Math.round(aiAnalysis.overallScore * aiWeight + localAnalysis.overallScore * localWeight);
    }

    // Merge breakdown data if available
    if (aiAnalysis.breakdown) {
      Object.keys(aiAnalysis.breakdown).forEach(key => {
        if (merged.breakdown && aiAnalysis.breakdown && aiAnalysis.breakdown[key as keyof typeof aiAnalysis.breakdown]) {
          // Merge specific breakdown components intelligently
          const localSection = merged.breakdown[key as keyof typeof merged.breakdown] as any;
          const aiSection = aiAnalysis.breakdown[key as keyof typeof aiAnalysis.breakdown] as any;
          
          if (localSection && aiSection && aiSection.score) {
            localSection.score = Math.round(aiSection.score * 0.7 + localSection.score * 0.3);
          }
        }
      });
    }

    // Merge suggestions if available
    if (aiAnalysis.suggestions && aiAnalysis.suggestions.length > 0) {
      merged.suggestions = [...(aiAnalysis.suggestions || []), ...merged.suggestions].slice(0, 10);
    }

    // Merge risks if available
    if (aiAnalysis.risks && aiAnalysis.risks.length > 0) {
      merged.risks = [...(aiAnalysis.risks || []), ...merged.risks].slice(0, 8);
    }

    merged.metadata.aiProvider = provider as any;
    merged.metadata.confidence = Math.min(merged.metadata.confidence + 10, 95); // AI analysis increases confidence

    return merged;
  }

  private calculateDistance(pos1: Position, pos2: Position): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private getHockeyZones() {
    return [
      { name: 'defensive-zone', x1: 0, y1: 0, x2: 33, y2: 100 },
      { name: 'neutral-zone', x1: 33, y1: 0, x2: 67, y2: 100 },
      { name: 'offensive-zone', x1: 67, y1: 0, x2: 100, y2: 100 },
      { name: 'left-wing', x1: 0, y1: 0, x2: 100, y2: 33 },
      { name: 'center', x1: 0, y1: 33, x2: 100, y2: 67 },
      { name: 'right-wing', x1: 0, y1: 67, x2: 100, y2: 100 }
    ];
  }

  private isInZone(position: Position, zone: any): boolean {
    return position.x >= zone.x1 && position.x <= zone.x2 && 
           position.y >= zone.y1 && position.y <= zone.y2;
  }

  private detectFormationType(players: Player[]): string {
    // Simple formation detection based on player positions
    const forwards = players.filter(p => ['LW', 'C', 'RW'].includes(p.role));
    const defensemen = players.filter(p => ['LD', 'RD'].includes(p.role));
    
    if (forwards.length === 3 && defensemen.length === 2) {
      return '1-2-2 (Standard)';
    } else if (forwards.length === 3 && defensemen.length === 1) {
      return '2-1-2 (Aggressive)';
    } else if (forwards.length === 2 && defensemen.length === 3) {
      return '1-3-1 (Defensive)';
    }
    
    return 'Custom Formation';
  }

  private analyzeCoverage(players: Player[]): ZoneCoverage[] {
    const zones = this.getHockeyZones();
    return zones.map(zone => {
      const playersInZone = players.filter(p => this.isInZone(p.position, zone));
      const coverage = Math.min(100, playersInZone.length * 50);
      
      return {
        zone: zone.name,
        coverage,
        players: playersInZone.map(p => p.id),
        vulnerability: coverage < 50
      };
    });
  }

  private identifyVulnerabilities(coverageMap: ZoneCoverage[], formation: string): Vulnerability[] {
    return coverageMap
      .filter(zone => zone.vulnerability)
      .map(zone => ({
        zone: zone.zone,
        type: 'Under-covered',
        severity: zone.coverage < 25 ? 'high' : 'medium',
        exploitation: `Opponent can exploit weak ${zone.zone} coverage`,
        countermeasure: `Add player support in ${zone.zone} or adjust formation`
      }));
  }

  private calculateFormationScore(coverageMap: ZoneCoverage[], vulnerabilities: Vulnerability[]): number {
    const avgCoverage = coverageMap.reduce((sum, zone) => sum + zone.coverage, 0) / coverageMap.length;
    const vulnerabilityPenalty = vulnerabilities.length * 10;
    return Math.max(0, avgCoverage - vulnerabilityPenalty);
  }

  private suggestAlternativeFormations(currentFormation: string, currentScore: number): AlternativeFormation[] {
    const formations = [
      {
        name: '1-2-2 Balanced',
        score: currentScore + Math.random() * 20 - 10,
        advantages: ['Balanced coverage', 'Good for neutral zone'],
        disadvantages: ['Less aggressive offense'],
        difficulty: 'easy' as const
      },
      {
        name: '2-1-2 Aggressive',
        score: currentScore + Math.random() * 20 - 10,
        advantages: ['Strong offensive pressure', 'Good for power play'],
        disadvantages: ['Vulnerable to counter-attacks'],
        difficulty: 'medium' as const
      },
      {
        name: '1-3-1 Trap',
        score: currentScore + Math.random() * 20 - 10,
        advantages: ['Excellent defensive coverage', 'Counter-attack opportunities'],
        disadvantages: ['Less offensive creativity'],
        difficulty: 'hard' as const
      }
    ];

    return formations.filter(f => f.name !== currentFormation);
  }

  private identifyFormationStrengths(formation: string, coverageMap: ZoneCoverage[]): string[] {
    const strengths: string[] = [];
    const strongZones = coverageMap.filter(zone => zone.coverage > 75);
    
    if (strongZones.length > 0) {
      strengths.push(`Strong coverage in ${strongZones.map(z => z.zone).join(', ')}`);
    }
    
    if (formation.includes('Aggressive')) {
      strengths.push('High offensive pressure');
    }
    
    if (formation.includes('Defensive') || formation.includes('Trap')) {
      strengths.push('Solid defensive structure');
    }
    
    return strengths;
  }

  private calculateOverallScore(breakdown: AnalysisBreakdown): number {
    const weights = {
      spacing: 0.25,
      timing: 0.20,
      formation: 0.25,
      effectiveness: 0.20,
      tactical: 0.10
    };

    return Math.round(
      breakdown.spacing.score * weights.spacing +
      breakdown.timing.score * weights.timing +
      breakdown.formation.formationScore * weights.formation +
      breakdown.effectiveness.successProbability * weights.effectiveness +
      breakdown.tactical.adherenceToStrategy * weights.tactical
    );
  }

  private calculateConfidence(breakdown: AnalysisBreakdown): number {
    // Base confidence on data completeness and consistency
    let confidence = 85; // Base local analysis confidence
    
    // Reduce confidence for edge cases
    if (breakdown.spacing.score < 20 || breakdown.spacing.score > 95) confidence -= 10;
    if (breakdown.timing.timingIssues.length > 3) confidence -= 5;
    if (breakdown.formation.vulnerabilities.length > 2) confidence -= 5;
    
    return Math.max(60, confidence);
  }

  private assessDataQuality(play: TacticalPlay): number {
    let quality = 100;
    
    // Reduce quality for missing data
    if (!play.formation.players || play.formation.players.length === 0) quality -= 30;
    if (!play.movements || play.movements.length === 0) quality -= 20;
    if (!play.objectives || play.objectives.length === 0) quality -= 10;
    
    return Math.max(0, quality);
  }

  private getDefaultContext(): AnalysisContext {
    return {
      gamePhase: 'even-strength',
      situation: 'offensive-zone',
      timeRemaining: 1200, // 20 minutes
      scoreState: 'tied',
      playerTiredness: {}
    };
  }

  // Rate limiting and caching
  private canMakeAPICall(): boolean {
    const now = Date.now();
    const lastCall = this.rateLimitTracker.get('lastCall') || 0;
    const minInterval = 1000; // 1 second between calls
    
    if (now - lastCall < minInterval) {
      return false;
    }
    
    this.rateLimitTracker.set('lastCall', now);
    return true;
  }

  private getCacheKey(play: TacticalPlay, analysisType: AnalysisType, context?: AnalysisContext): string {
    const playHash = this.hashPlay(play);
    const contextHash = context ? this.hashContext(context) : 'no-context';
    return `${playHash}-${analysisType}-${contextHash}`;
  }


  // Additional helper methods (simplified implementations)
  private generateSpacingRecommendations(spacingMap: SpacingMap, issues: ClusteringIssue[]): string[] {
    const recommendations: string[] = [];
    
    if (issues.length > 0) {
      recommendations.push('Spread players to maintain 4-6 meter spacing');
    }
    
    if (spacingMap.problematicZones.length > 0) {
      recommendations.push(`Avoid clustering in ${spacingMap.problematicZones.join(', ')}`);
    }
    
    return recommendations;
  }

  private generateTimingRecommendations(issues: TimingIssue[], transitions: PhaseTransition[]): string[] {
    const recommendations: string[] = [];
    
    if (issues.length > 0) {
      recommendations.push('Improve movement synchronization');
    }
    
    const inefficientTransitions = transitions.filter(t => t.efficiency < 70);
    if (inefficientTransitions.length > 0) {
      recommendations.push('Work on phase transition timing');
    }
    
    return recommendations;
  }

  private generatePhaseRecommendation(phase: string): string {
    const recommendations: { [key: string]: string } = {
      'setup': 'Ensure all players are in position before initiating',
      'execution': 'Maintain timing and spacing during execution',
      'finish': 'Follow through on all movements to completion'
    };
    
    return recommendations[phase] || 'Focus on smooth phase execution';
  }

  private getContextModifier(context: AnalysisContext): number {
    let modifier = 0;
    
    // Game phase modifiers
    if (context.gamePhase === 'power-play') modifier += 10;
    if (context.gamePhase === 'penalty-kill') modifier -= 15;
    
    // Situation modifiers
    if (context.situation === 'offensive-zone') modifier += 5;
    if (context.situation === 'defensive-zone') modifier -= 5;
    
    // Score state modifiers
    if (context.scoreState === 'trailing') modifier += 5; // More aggressive
    if (context.scoreState === 'leading') modifier -= 3; // More conservative
    
    return modifier;
  }

  private calculateGoalScoringChance(play: TacticalPlay, context?: AnalysisContext): number {
    let baseChance = 25; // Base scoring chance percentage
    
    // Adjust based on zone
    if (context?.situation === 'offensive-zone') baseChance += 20;
    if (context?.situation === 'neutral-zone') baseChance += 5;
    if (context?.situation === 'defensive-zone') baseChance -= 10;
    
    // Adjust based on formation aggressiveness
    const formation = this.detectFormationType(play.formation.players);
    if (formation.includes('Aggressive')) baseChance += 10;
    if (formation.includes('Defensive')) baseChance -= 5;
    
    return Math.max(0, Math.min(100, baseChance));
  }

  private calculatePossessionRetention(play: TacticalPlay): number {
    // Base retention probability
    let retention = 75;
    
    // Factor in formation stability
    const formation = this.detectFormationType(play.formation.players);
    if (formation.includes('Balanced')) retention += 10;
    if (formation.includes('Aggressive')) retention -= 5;
    
    // Factor in number of risky passes (simulated)
    const riskyMoves = (play.movements || []).length;
    retention -= Math.min(20, riskyMoves * 2);
    
    return Math.max(0, Math.min(100, retention));
  }

  private calculateCounterAttackRisk(play: TacticalPlay): number {
    let risk = 30; // Base counter-attack risk
    
    // Higher risk with aggressive formations
    const formation = this.detectFormationType(play.formation.players);
    if (formation.includes('Aggressive')) risk += 15;
    if (formation.includes('Defensive')) risk -= 10;
    
    // Higher risk with more complex plays
    const complexity = (play.movements || []).length;
    risk += Math.min(25, complexity * 3);
    
    return Math.max(0, Math.min(100, risk));
  }

  private calculateEnergyEfficiency(play: TacticalPlay): number {
    let efficiency = 80; // Base efficiency
    
    // Less efficient with more movements
    const movements = (play.movements || []).length;
    efficiency -= Math.min(30, movements * 2);
    
    // More efficient with better spacing
    const players = play.formation.players;
    if (players.length > 0) {
      const spacingScore = this.analyzeSpacing(play).score;
      efficiency = Math.round(efficiency * 0.7 + spacingScore * 0.3);
    }
    
    return Math.max(0, Math.min(100, efficiency));
  }

  private determinePlayType(play: TacticalPlay): string {
    // Simple play type determination based on objectives and formation
    const objectives = play.objectives || [];
    const hasScoring = objectives.some(obj => obj.includes('goal') || obj.includes('score'));
    const hasDefensive = objectives.some(obj => obj.includes('defend') || obj.includes('protect'));
    
    if (hasScoring) return 'Offensive Set Play';
    if (hasDefensive) return 'Defensive Set Play';
    return 'Transition Play';
  }

  private evaluateTacticalPrinciples(play: TacticalPlay): TacticalPrinciple[] {
    return [
      {
        principle: 'Spacing',
        adherence: this.analyzeSpacing(play).score,
        importance: 90,
        feedback: 'Maintain proper player spacing for optimal coverage'
      },
      {
        principle: 'Support',
        adherence: Math.random() * 40 + 60, // Mock 60-100
        importance: 85,
        feedback: 'Ensure players provide adequate support options'
      },
      {
        principle: 'Timing',
        adherence: this.analyzeTiming(play).score,
        importance: 80,
        feedback: 'Coordinate movement timing for maximum effectiveness'
      },
      {
        principle: 'Communication',
        adherence: Math.random() * 30 + 70, // Mock 70-100
        importance: 75,
        feedback: 'Clear communication is essential for play execution'
      }
    ];
  }

  private calculateCreativity(play: TacticalPlay): number {
    // Assess creativity based on play uniqueness and complexity
    const movements = play.movements || [];
    const uniqueMoves = new Set(movements.map(m => m.type)).size;
    const complexity = movements.length;
    
    return Math.min(100, (uniqueMoves * 15) + (complexity * 3) + Math.random() * 20);
  }

  private calculatePredictability(play: TacticalPlay): number {
    // Lower predictability is better
    const formation = this.detectFormationType(play.formation.players);
    let predictability = 50; // Base predictability
    
    // Standard formations are more predictable
    if (formation.includes('Standard')) predictability += 20;
    if (formation.includes('Custom')) predictability -= 15;
    
    // Simple plays are more predictable
    const complexity = (play.movements || []).length;
    if (complexity < 3) predictability += 15;
    if (complexity > 5) predictability -= 10;
    
    return Math.max(0, Math.min(100, predictability));
  }

  private calculateAdaptability(play: TacticalPlay): number {
    // Assess how well the play can adapt to different situations
    let adaptability = 70; // Base adaptability
    
    // More movements generally mean more adaptability
    const movements = play.movements || [];
    adaptability += Math.min(20, movements.length * 2);
    
    // Flexible formations are more adaptable
    const formation = this.detectFormationType(play.formation.players);
    if (formation.includes('Balanced')) adaptability += 15;
    if (formation.includes('Custom')) adaptability += 10;
    
    return Math.max(0, Math.min(100, adaptability));
  }

  // Additional helper methods for pattern recognition and risk assessment
  private identifyPlayPattern(play: TacticalPlay): string {
    const objectives = play.objectives || [];
    const movements = play.movements || [];
    
    if (objectives.some(obj => obj.includes('cycle'))) return 'Cycle Pattern';
    if (objectives.some(obj => obj.includes('rush'))) return 'Rush Pattern';
    if (movements.length > 4) return 'Complex Pattern';
    return 'Simple Pattern';
  }

  private findSimilarPlays(play: TacticalPlay): SimilarPlay[] {
    // Mock similar plays (would query actual play database)
    return [
      {
        playId: 'play-123',
        similarity: 85,
        source: 'Template Library',
        effectiveness: 78,
        keyDifferences: ['Different formation', 'Modified timing']
      },
      {
        playId: 'play-456',
        similarity: 72,
        source: 'Recent Games',
        effectiveness: 65,
        keyDifferences: ['Additional player movement', 'Different zone entry']
      }
    ];
  }

  private identifyCommonMistakes(play: TacticalPlay): CommonMistake[] {
    const mistakes: CommonMistake[] = [];
    
    // Analyze for common tactical mistakes
    const spacing = this.analyzeSpacing(play);
    if (spacing.clusteringIssues.length > 0) {
      mistakes.push({
        mistake: 'Player clustering',
        frequency: 65,
        impact: 70,
        solution: 'Maintain 4-6 meter spacing between players'
      });
    }
    
    const timing = this.analyzeTiming(play);
    if (timing.timingIssues.length > 0) {
      mistakes.push({
        mistake: 'Poor timing synchronization',
        frequency: 45,
        impact: 60,
        solution: 'Practice movement timing and communication'
      });
    }
    
    return mistakes;
  }

  private analyzeTacticalTrends(play: TacticalPlay): TacticalTrend[] {
    return [
      {
        trend: 'High-tempo offensive pressure',
        strength: 75,
        recommendation: 'Maintain aggressive forechecking'
      },
      {
        trend: 'Quick transition focus',
        strength: 60,
        recommendation: 'Work on faster zone exits'
      }
    ];
  }

  private analyzeFormationPattern(play: TacticalPlay): FormationPattern {
    const formation = this.detectFormationType(play.formation.players);
    
    return {
      primary: formation,
      variations: ['Standard variation', 'Power play variant'],
      effectiveness: 75,
      modernTrend: !formation.includes('Defensive')
    };
  }

  private identifyPredictabilityFactors(play: TacticalPlay): string[] {
    const factors: string[] = [];
    
    const formation = this.detectFormationType(play.formation.players);
    if (formation.includes('Standard')) {
      factors.push('Common formation pattern');
    }
    
    const movements = play.movements || [];
    if (movements.length < 3) {
      factors.push('Simple movement pattern');
    }
    
    return factors;
  }

  private calculateTurnoverRisk(play: TacticalPlay, context?: AnalysisContext): number {
    let risk = 25; // Base turnover risk
    
    // Increase risk in neutral zone
    if (context?.situation === 'neutral-zone') risk += 15;
    
    // Increase risk with complex plays
    const complexity = (play.movements || []).length;
    risk += Math.min(20, complexity * 2);
    
    // Increase risk with poor spacing
    const spacingScore = this.analyzeSpacing(play).score;
    if (spacingScore < 60) risk += 15;
    
    return Math.max(0, Math.min(100, risk));
  }

  private calculatePositionalRisk(play: TacticalPlay): number {
    let risk = 20; // Base positional risk
    
    // Increase risk with aggressive formations
    const formation = this.detectFormationType(play.formation.players);
    if (formation.includes('Aggressive')) risk += 20;
    
    // Increase risk with poor coverage
    const coverage = this.analyzeCoverage(play.formation.players);
    const vulnerableZones = coverage.filter(z => z.vulnerability).length;
    risk += vulnerableZones * 10;
    
    return Math.max(0, Math.min(100, risk));
  }

  private getAffectedZones(play: TacticalPlay): string[] {
    const players = play.formation.players;
    const zones = this.getHockeyZones();
    
    return zones
      .filter(zone => players.some(p => this.isInZone(p.position, zone)))
      .map(zone => zone.name);
  }

  private getSuggestionPriority(priority: string): number {
    const priorities: { [key: string]: number } = {
      'critical': 4,
      'high': 3,
      'medium': 2,
      'low': 1
    };
    return priorities[priority] || 0;
  }

  private getPlayersInZone(players: Player[], zoneName: string): string[] {
    const zone = this.getHockeyZones().find(z => z.name === zoneName);
    if (!zone) return [];
    
    return players
      .filter(p => this.isInZone(p.position, zone))
      .map(p => p.id);
  }

  private getZoneCoordinates(zoneName: string): { x: number; y: number }[] {
    const zone = this.getHockeyZones().find(z => z.name === zoneName);
    if (!zone) return [];
    
    return [
      { x: zone.x1, y: zone.y1 },
      { x: zone.x2, y: zone.y1 },
      { x: zone.x2, y: zone.y2 },
      { x: zone.x1, y: zone.y2 }
    ];
  }

  private describePlay(play: TacticalPlay): string {
    const formation = this.detectFormationType(play.formation.players);
    const playerCount = play.formation.players.length;
    const movementCount = (play.movements || []).length;
    const objectives = (play.objectives || []).join(', ');
    
    return `
Formation: ${formation} (${playerCount} players)
Movements: ${movementCount} coordinated movements
Objectives: ${objectives}
Players: ${play.formation.players.map(p => `${p.role} at (${p.position.x}, ${p.position.y})`).join(', ')}
    `.trim();
  }

  private describeContext(context: AnalysisContext): string {
    return `
Game Phase: ${context.gamePhase}
Situation: ${context.situation}
Time Remaining: ${Math.floor(context.timeRemaining / 60)}:${(context.timeRemaining % 60).toString().padStart(2, '0')}
Score State: ${context.scoreState}
    `.trim();
  }

  private hashPlay(play: TacticalPlay): string {
    // Simple hash of play characteristics
    const playString = JSON.stringify({
      formation: play.formation.name,
      playerCount: play.formation.players.length,
      movements: (play.movements || []).length,
      objectives: play.objectives
    });
    
    return btoa(playString).slice(0, 16);
  }

  private hashContext(context: AnalysisContext): string {
    const contextString = JSON.stringify({
      gamePhase: context.gamePhase,
      situation: context.situation,
      scoreState: context.scoreState
    });
    
    return btoa(contextString).slice(0, 8);
  }
}

// Export default instance with configuration
export const aiAnalysisEngine = new AIAnalysisEngine({
  enabled: true,
  fallbackToLocal: true,
  cacheDuration: 30,
  model: 'gpt-4-turbo-preview',
  maxTokens: 2000,
  temperature: 0.3
});

export default AIAnalysisEngine;