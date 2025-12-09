/**
 * AI Analysis Service
 * 
 * Provides unified interface for multiple AI providers (OpenAI, Anthropic Claude)
 * with proper error handling, rate limiting, and cost tracking.
 */

import { TacticalPlay, AnalysisContext, PlayAnalysis } from '../components/tactical/AIAnalysisEngine';
import { getAIConfig, AIConfig, ERROR_HANDLING } from '../config/aiConfig';
import { getTacticalPrompts } from '../prompts/tacticalPrompts';

// AI Provider Types
export type AIProvider = 'openai' | 'claude' | 'local';

export interface AIProviderConfig {
  openai?: {
    apiKey: string;
    model: string;
    maxTokens: number;
    temperature: number;
  };
  claude?: {
    apiKey: string;
    model: string;
    maxTokens: number;
    temperature: number;
  };
}

export interface AIResponse {
  content: string;
  provider: AIProvider;
  model: string;
  tokensUsed: number;
  costEstimate: number;
  confidence: number;
  timestamp: string;
}

export interface CostTracking {
  totalTokensUsed: number;
  totalCostEstimate: number;
  requestCount: number;
  averageCost: number;
  dailyLimit: number;
  dailyUsed: number;
}

export interface RateLimitInfo {
  requestsPerMinute: number;
  tokensPerMinute: number;
  lastRequest: number;
  requestCount: number;
  tokenCount: number;
}

export class AIAnalysisService {
  private config: AIConfig;
  private providerConfig: AIProviderConfig;
  private costTracking: CostTracking;
  private rateLimits: Map<AIProvider, RateLimitInfo> = new Map();
  private requestQueue: Array<() => Promise<void>> = [];
  private processing = false;

  constructor() {
    this.config = getAIConfig();
    this.providerConfig = this.initializeProviderConfig();
    this.costTracking = this.initializeCostTracking();
    this.initializeRateLimits();
  }

  /**
   * Main analysis method with provider failover
   */
  async analyzePlay(
    play: TacticalPlay,
    analysisType: string = 'detailed',
    context?: AnalysisContext,
    preferredProvider?: AIProvider
  ): Promise<AIResponse> {
    const providers = this.getProviderPriority(preferredProvider);
    
    for (const provider of providers) {
      try {
        if (await this.canMakeRequest(provider)) {
          const response = await this.makeAnalysisRequest(play, analysisType, context, provider);
          this.updateCostTracking(response);
          this.updateRateLimit(provider, response.tokensUsed);
          return response;
        }
      } catch (error) {
        console.warn(`AI Provider ${provider} failed:`, error);
        continue; // Try next provider
      }
    }

    throw new Error('All AI providers failed or unavailable');
  }

  /**
   * OpenAI Analysis
   */
  private async analyzeWithOpenAI(
    play: TacticalPlay,
    analysisType: string,
    context?: AnalysisContext
  ): Promise<AIResponse> {
    if (!this.providerConfig.openai?.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = getTacticalPrompts().getAnalysisPrompt(play, analysisType, context);
    const systemPrompt = getTacticalPrompts().getSystemPrompt('openai');

    const requestBody = {
      model: this.providerConfig.openai.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      max_tokens: this.providerConfig.openai.maxTokens,
      temperature: this.providerConfig.openai.temperature,
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.providerConfig.openai.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      await this.handleAPIError(response, 'openai');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    const tokensUsed = data.usage?.total_tokens || 0;

    if (!content) {
      throw new Error('No response content from OpenAI');
    }

    return {
      content,
      provider: 'openai',
      model: this.providerConfig.openai.model,
      tokensUsed,
      costEstimate: this.calculateOpenAICost(tokensUsed, this.providerConfig.openai.model),
      confidence: this.extractConfidenceScore(content),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Claude (Anthropic) Analysis
   */
  private async analyzeWithClaude(
    play: TacticalPlay,
    analysisType: string,
    context?: AnalysisContext
  ): Promise<AIResponse> {
    if (!this.providerConfig.claude?.apiKey) {
      throw new Error('Claude API key not configured');
    }

    const prompt = getTacticalPrompts().getAnalysisPrompt(play, analysisType, context);
    const systemPrompt = getTacticalPrompts().getSystemPrompt('claude');

    const requestBody = {
      model: this.providerConfig.claude.model,
      max_tokens: this.providerConfig.claude.maxTokens,
      temperature: this.providerConfig.claude.temperature,
      system: systemPrompt,
      messages: [
        { role: 'user', content: prompt }
      ]
    };

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.providerConfig.claude.apiKey}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      await this.handleAPIError(response, 'claude');
    }

    const data = await response.json();
    const content = data.content[0]?.text;
    const tokensUsed = data.usage?.input_tokens + data.usage?.output_tokens || 0;

    if (!content) {
      throw new Error('No response content from Claude');
    }

    return {
      content,
      provider: 'claude',
      model: this.providerConfig.claude.model,
      tokensUsed,
      costEstimate: this.calculateClaudeCost(tokensUsed, this.providerConfig.claude.model),
      confidence: this.extractConfidenceScore(content),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Parse and validate AI response content
   */
  parseAIResponse(response: AIResponse): Partial<PlayAnalysis> {
    try {
      const content = response.content;
      
      // Try to extract structured data from the response
      const analysis: Partial<PlayAnalysis> = {
        overallScore: this.extractScore(content, 'overall') || 75,
        metadata: {
          aiProvider: response.provider,
          processingTime: 0, // Will be set by caller
          confidence: response.confidence,
          dataQuality: 90, // AI responses generally have good data quality
          version: '2.0.0',
          context: undefined // Will be set by caller
        }
      };

      // Extract breakdown scores
      const breakdown: any = {
        spacing: {
          score: this.extractScore(content, 'spacing') || 75,
          averageDistance: this.extractNumber(content, 'spacing distance') || 5,
          clusteringIssues: this.extractClusteringIssues(content),
          optimalSpacing: this.extractBoolean(content, 'optimal spacing'),
          spacingMap: { zones: {}, averageSpacing: 5, optimalZones: [], problematicZones: [] },
          recommendations: this.extractRecommendations(content, 'spacing')
        },
        timing: {
          score: this.extractScore(content, 'timing') || 75,
          sequenceOptimal: this.extractBoolean(content, 'timing optimal'),
          timingIssues: this.extractTimingIssues(content),
          movementSync: this.extractScore(content, 'synchronization') || 80,
          phaseTransitions: this.extractPhaseTransitions(content),
          recommendations: this.extractRecommendations(content, 'timing')
        },
        formation: {
          detectedFormation: this.extractFormation(content) || 'Standard Formation',
          formationScore: this.extractScore(content, 'formation') || 75,
          coverageMap: [],
          vulnerabilities: this.extractVulnerabilities(content),
          strengths: this.extractStrengths(content),
          alternativeFormations: this.extractAlternativeFormations(content)
        },
        effectiveness: {
          successProbability: this.extractScore(content, 'success') || 70,
          goalScoringChance: this.extractScore(content, 'goal') || 30,
          possessionRetention: this.extractScore(content, 'possession') || 75,
          counterAttackVulnerability: this.extractScore(content, 'counter') || 40,
          energyEfficiency: this.extractScore(content, 'energy') || 80
        },
        tactical: {
          playType: this.extractPlayType(content) || 'Offensive Set Play',
          tacticalPrinciples: this.extractTacticalPrinciples(content),
          adherenceToStrategy: this.extractScore(content, 'strategy') || 75,
          creativity: this.extractScore(content, 'creativity') || 65,
          predictability: this.extractScore(content, 'predictability') || 60,
          adaptability: this.extractScore(content, 'adaptability') || 70
        }
      };

      analysis.breakdown = breakdown;
      analysis.suggestions = this.extractSuggestions(content);
      analysis.patterns = this.extractPatterns(content);
      analysis.risks = this.extractRisks(content);

      return analysis;
    } catch (error) {
      console.error('Error parsing AI response:', error);
      // Return minimal fallback structure
      return {
        overallScore: 70,
        metadata: {
          aiProvider: response.provider,
          processingTime: 0,
          confidence: 60, // Lower confidence due to parsing issues
          dataQuality: 70,
          version: '2.0.0',
          context: undefined
        }
      };
    }
  }

  /**
   * Get cost tracking information
   */
  getCostTracking(): CostTracking {
    return { ...this.costTracking };
  }

  /**
   * Check if daily limit would be exceeded
   */
  canAffordRequest(estimatedTokens: number = 2000): boolean {
    const estimatedCost = this.estimateRequestCost(estimatedTokens);
    return (this.costTracking.dailyUsed + estimatedCost) <= this.costTracking.dailyLimit;
  }

  /**
   * Reset daily usage (should be called daily)
   */
  resetDailyUsage(): void {
    this.costTracking.dailyUsed = 0;
    this.costTracking.requestCount = 0;
    
    // Reset rate limits
    this.rateLimits.clear();
    this.initializeRateLimits();
  }

  // Private helper methods

  private initializeProviderConfig(): AIProviderConfig {
    const config: AIProviderConfig = {};

    // OpenAI configuration
    const openaiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (openaiKey) {
      config.openai = {
        apiKey: openaiKey,
        model: 'gpt-4-turbo-preview',
        maxTokens: 2000,
        temperature: 0.3
      };
    }

    // Claude configuration
    const claudeKey = process.env.NEXT_PUBLIC_CLAUDE_API_KEY;
    if (claudeKey) {
      config.claude = {
        apiKey: claudeKey,
        model: 'claude-3-sonnet-20240229',
        maxTokens: 2000,
        temperature: 0.3
      };
    }

    return config;
  }

  private initializeCostTracking(): CostTracking {
    const saved = localStorage.getItem('ai_cost_tracking');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Check if it's from today
      const today = new Date().toDateString();
      const savedDate = new Date(parsed.lastReset || 0).toDateString();
      
      if (today === savedDate) {
        return parsed;
      }
    }

    return {
      totalTokensUsed: 0,
      totalCostEstimate: 0,
      requestCount: 0,
      averageCost: 0,
      dailyLimit: 10.00, // $10 daily limit
      dailyUsed: 0
    };
  }

  private initializeRateLimits(): void {
    // OpenAI rate limits (tier 1)
    this.rateLimits.set('openai', {
      requestsPerMinute: 50,
      tokensPerMinute: 40000,
      lastRequest: 0,
      requestCount: 0,
      tokenCount: 0
    });

    // Claude rate limits
    this.rateLimits.set('claude', {
      requestsPerMinute: 50,
      tokensPerMinute: 50000,
      lastRequest: 0,
      requestCount: 0,
      tokenCount: 0
    });
  }

  private getProviderPriority(preferred?: AIProvider): AIProvider[] {
    const available: AIProvider[] = [];
    
    if (this.providerConfig.openai) available.push('openai');
    if (this.providerConfig.claude) available.push('claude');
    available.push('local'); // Always available as fallback

    if (preferred && available.includes(preferred)) {
      // Move preferred to front
      const others = available.filter(p => p !== preferred);
      return [preferred, ...others];
    }

    return available;
  }

  private async canMakeRequest(provider: AIProvider): Promise<boolean> {
    if (provider === 'local') return true;

    const rateLimit = this.rateLimits.get(provider);
    if (!rateLimit) return false;

    const now = Date.now();
    const minuteAgo = now - 60000;

    // Reset counters if more than a minute has passed
    if (rateLimit.lastRequest < minuteAgo) {
      rateLimit.requestCount = 0;
      rateLimit.tokenCount = 0;
    }

    // Check rate limits
    if (rateLimit.requestCount >= rateLimit.requestsPerMinute) {
      return false;
    }

    // Check cost limits
    if (!this.canAffordRequest()) {
      return false;
    }

    return true;
  }

  private async makeAnalysisRequest(
    play: TacticalPlay,
    analysisType: string,
    context?: AnalysisContext,
    provider: AIProvider = 'openai'
  ): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      let response: AIResponse;

      switch (provider) {
        case 'openai':
          response = await this.analyzeWithOpenAI(play, analysisType, context);
          break;
        case 'claude':
          response = await this.analyzeWithClaude(play, analysisType, context);
          break;
        case 'local':
        default:
          throw new Error('Local analysis should be handled by AIAnalysisEngine');
      }

      const processingTime = Date.now() - startTime;
      console.log(`AI Analysis completed in ${processingTime}ms using ${provider}`);

      return response;
    } catch (error) {
      console.error(`AI Analysis failed with ${provider}:`, error);
      throw error;
    }
  }

  private async handleAPIError(response: Response, provider: string): Promise<never> {
    const errorData = await response.json().catch(() => ({}));
    
    switch (response.status) {
      case 401:
        throw new Error(ERROR_HANDLING.userFriendlyMessages.apiKeyError);
      case 429:
        throw new Error(ERROR_HANDLING.userFriendlyMessages.quotaError);
      case 408:
      case 504:
        throw new Error(ERROR_HANDLING.userFriendlyMessages.timeoutError);
      default:
        throw new Error(`${provider} API error: ${errorData.error?.message || response.statusText}`);
    }
  }

  private updateCostTracking(response: AIResponse): void {
    this.costTracking.totalTokensUsed += response.tokensUsed;
    this.costTracking.totalCostEstimate += response.costEstimate;
    this.costTracking.requestCount += 1;
    this.costTracking.dailyUsed += response.costEstimate;
    this.costTracking.averageCost = this.costTracking.totalCostEstimate / this.costTracking.requestCount;

    // Save to localStorage
    const toSave = {
      ...this.costTracking,
      lastReset: new Date().toISOString()
    };
    localStorage.setItem('ai_cost_tracking', JSON.stringify(toSave));
  }

  private updateRateLimit(provider: AIProvider, tokensUsed: number): void {
    const rateLimit = this.rateLimits.get(provider);
    if (rateLimit) {
      rateLimit.requestCount += 1;
      rateLimit.tokenCount += tokensUsed;
      rateLimit.lastRequest = Date.now();
    }
  }

  private calculateOpenAICost(tokens: number, model: string): number {
    // GPT-4 pricing (as of 2024)
    const pricing: { [key: string]: { input: number; output: number } } = {
      'gpt-4-turbo-preview': { input: 0.01, output: 0.03 }, // per 1K tokens
      'gpt-4': { input: 0.03, output: 0.06 }
    };

    const modelPricing = pricing[model] || pricing['gpt-4'];
    // Assume 70% input, 30% output tokens
    const inputTokens = Math.floor(tokens * 0.7);
    const outputTokens = tokens - inputTokens;

    return ((inputTokens * modelPricing.input) + (outputTokens * modelPricing.output)) / 1000;
  }

  private calculateClaudeCost(tokens: number, model: string): number {
    // Claude pricing (as of 2024)
    const pricing: { [key: string]: { input: number; output: number } } = {
      'claude-3-sonnet-20240229': { input: 0.003, output: 0.015 }, // per 1K tokens
      'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 }
    };

    const modelPricing = pricing[model] || pricing['claude-3-sonnet-20240229'];
    // Assume 70% input, 30% output tokens
    const inputTokens = Math.floor(tokens * 0.7);
    const outputTokens = tokens - inputTokens;

    return ((inputTokens * modelPricing.input) + (outputTokens * modelPricing.output)) / 1000;
  }

  private estimateRequestCost(estimatedTokens: number): number {
    // Use GPT-4 pricing as baseline for estimation
    return this.calculateOpenAICost(estimatedTokens, 'gpt-4-turbo-preview');
  }

  private extractConfidenceScore(content: string): number {
    const matches = content.match(/confidence[:\s]*(\d+)[%]?/i);
    if (matches) {
      return parseInt(matches[1]);
    }
    
    // Estimate confidence based on response quality
    const length = content.length;
    const hasNumbers = /\d+/.test(content);
    const hasStructure = /(?:score|rating|analysis)/i.test(content);
    
    let confidence = 70;
    if (length > 500) confidence += 10;
    if (hasNumbers) confidence += 10;
    if (hasStructure) confidence += 10;
    
    return Math.min(95, confidence);
  }

  // Response parsing helper methods
  private extractScore(content: string, type: string): number | null {
    const patterns = [
      new RegExp(`${type}[:\\s]*([0-9]+)/100`, 'i'),
      new RegExp(`${type}[:\\s]*([0-9]+)%`, 'i'),
      new RegExp(`${type}[:\\s]*([0-9]+)`, 'i')
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        return parseInt(match[1]);
      }
    }
    return null;
  }

  private extractNumber(content: string, context: string): number | null {
    const pattern = new RegExp(`${context}[:\\s]*([0-9.]+)`, 'i');
    const match = content.match(pattern);
    return match ? parseFloat(match[1]) : null;
  }

  private extractBoolean(content: string, context: string): boolean {
    const pattern = new RegExp(`${context}[:\\s]*(true|false|yes|no|good|bad|optimal|poor)`, 'i');
    const match = content.match(pattern);
    if (match) {
      const value = match[1].toLowerCase();
      return ['true', 'yes', 'good', 'optimal'].includes(value);
    }
    return false;
  }

  private extractRecommendations(content: string, category: string): string[] {
    const recommendations: string[] = [];
    const lines = content.split('\n');
    
    let inRecommendationsSection = false;
    for (const line of lines) {
      if (line.toLowerCase().includes(`${category} recommendation`) || 
          line.toLowerCase().includes(`${category} suggestion`)) {
        inRecommendationsSection = true;
        continue;
      }
      
      if (inRecommendationsSection && line.trim()) {
        if (line.match(/^[-•*]\s/) || line.match(/^\d+\.\s/)) {
          recommendations.push(line.replace(/^[-•*\d.]\s*/, '').trim());
        } else if (line.includes(':')) {
          break; // New section
        }
      }
    }
    
    return recommendations.slice(0, 3); // Limit to 3 recommendations
  }

  private extractClusteringIssues(content: string): any[] {
    // Simple extraction - would be more sophisticated in practice
    const issues = [];
    if (content.toLowerCase().includes('clustering') || content.toLowerCase().includes('crowded')) {
      issues.push({
        zone: 'offensive-zone',
        playerCount: 3,
        recommendation: 'Spread players to improve spacing',
        severity: 'moderate' as const
      });
    }
    return issues;
  }

  private extractTimingIssues(content: string): any[] {
    const issues = [];
    if (content.toLowerCase().includes('timing') || content.toLowerCase().includes('synchron')) {
      issues.push({
        player: 'Center',
        issue: 'Movement timing needs adjustment',
        suggestedDelay: 0.5,
        impact: 'Improved coordination'
      });
    }
    return issues;
  }

  private extractPhaseTransitions(content: string): any[] {
    return [
      {
        from: 'setup',
        to: 'execution',
        timing: 2.0,
        efficiency: 80,
        recommendation: 'Smooth transition timing'
      }
    ];
  }

  private extractFormation(content: string): string {
    const formations = ['1-2-2', '2-1-2', '1-3-1', '2-2-1'];
    for (const formation of formations) {
      if (content.includes(formation)) {
        return `${formation} Formation`;
      }
    }
    return 'Standard Formation';
  }

  private extractVulnerabilities(content: string): any[] {
    const vulnerabilities = [];
    if (content.toLowerCase().includes('vulnerab') || content.toLowerCase().includes('weak')) {
      vulnerabilities.push({
        zone: 'neutral-zone',
        type: 'Coverage gap',
        severity: 'medium' as const,
        exploitation: 'Opponent can exploit weak coverage',
        countermeasure: 'Add defensive support'
      });
    }
    return vulnerabilities;
  }

  private extractStrengths(content: string): string[] {
    const strengths = [];
    if (content.toLowerCase().includes('strong') || content.toLowerCase().includes('good')) {
      strengths.push('Good player positioning', 'Effective coverage');
    }
    return strengths;
  }

  private extractAlternativeFormations(content: string): any[] {
    return [
      {
        name: '2-1-2 Aggressive',
        score: 85,
        advantages: ['Strong offensive pressure'],
        disadvantages: ['Vulnerable to counter-attacks'],
        difficulty: 'medium' as const
      }
    ];
  }

  private extractPlayType(content: string): string {
    if (content.toLowerCase().includes('offensive')) return 'Offensive Set Play';
    if (content.toLowerCase().includes('defensive')) return 'Defensive Set Play';
    return 'Transition Play';
  }

  private extractTacticalPrinciples(content: string): any[] {
    return [
      {
        principle: 'Spacing',
        adherence: 85,
        importance: 90,
        feedback: 'Good spacing maintenance'
      }
    ];
  }

  private extractSuggestions(content: string): any[] {
    const suggestions = [];
    const lines = content.split('\n');
    
    let suggestionId = 0;
    for (const line of lines) {
      if (line.match(/^[-•*]\s/) && line.length > 20) {
        suggestions.push({
          id: `ai-suggestion-${suggestionId++}`,
          type: 'improvement',
          priority: 'medium' as const,
          title: 'AI Suggestion',
          description: line.replace(/^[-•*]\s*/, '').trim(),
          implementation: 'Follow AI recommendation',
          expectedImprovement: 10,
          difficulty: 'medium' as const,
          category: 'positioning' as const,
          affectedPlayers: []
        });
      }
      
      if (suggestions.length >= 5) break;
    }
    
    return suggestions;
  }

  private extractPatterns(content: string): any {
    return {
      playPattern: 'Standard Pattern',
      similarPlays: [],
      commonMistakes: [],
      tacticalTrends: [],
      formationPattern: {
        primary: 'Standard Formation',
        variations: [],
        effectiveness: 75,
        modernTrend: true
      },
      predictabilityFactors: []
    };
  }

  private extractRisks(content: string): any[] {
    const risks = [];
    if (content.toLowerCase().includes('risk') || content.toLowerCase().includes('vulnerab')) {
      risks.push({
        id: 'ai-risk-1',
        type: 'turnover',
        severity: 'medium' as const,
        probability: 35,
        description: 'Potential turnover risk identified',
        mitigation: 'Improve support positioning',
        affectedZones: ['neutral-zone'],
        timeframe: 'immediate' as const
      });
    }
    return risks;
  }
}

// Export singleton instance
export const aiAnalysisService = new AIAnalysisService();
export default aiAnalysisService;