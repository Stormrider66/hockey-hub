/**
 * AI Analysis Configuration
 * 
 * Configuration settings for AI-powered tactical analysis features
 */

export interface AIConfig {
  providers: {
    openai: {
      enabled: boolean;
      apiKey?: string;
      model: string;
      maxTokens: number;
      temperature: number;
      priority: number; // 1 = highest priority
    };
    claude: {
      enabled: boolean;
      apiKey?: string;
      model: string;
      maxTokens: number;
      temperature: number;
      priority: number;
    };
    local: {
      enabled: boolean;
      priority: number; // Usually lowest priority
    };
  };
  selection: {
    preferredProvider: 'openai' | 'claude' | 'local' | 'auto';
    fallbackOrder: Array<'openai' | 'claude' | 'local'>;
    costLimitEnabled: boolean;
    dailyCostLimit: number; // USD
  };
  analysis: {
    autoAnalyze: boolean;
    throttleDelay: number;
    confidenceThreshold: number;
    enableRealTimeAnalysis: boolean;
    enableVoiceComments: boolean;
    cacheEnabled: boolean;
    cacheTTL: number; // minutes
  };
  features: {
    patternRecognition: boolean;
    counterPlayAnalysis: boolean;
    historicalComparison: boolean;
    riskAssessment: boolean;
    suggestionGeneration: boolean;
    comparativeAnalysis: boolean;
    educationalMode: boolean;
  };
  ui: {
    enableVisualHighlights: boolean;
    enableHeatMaps: boolean;
    enableSuggestionOverlays: boolean;
    enableAnalysisHistory: boolean;
    maxHistoryItems: number;
    showProviderInfo: boolean;
    showCostTracking: boolean;
    showCacheStats: boolean;
  };
  mock: {
    enabled: boolean;
    simulateDelay: boolean;
    delayRange: [number, number];
    errorRate: number;
    simulateProviderFailures: boolean;
  };
}

const defaultConfig: AIConfig = {
  providers: {
    openai: {
      enabled: false, // Disabled by default until API key is provided
      model: 'gpt-4-turbo-preview',
      maxTokens: 2000,
      temperature: 0.3,
      priority: 1 // Highest priority when available
    },
    claude: {
      enabled: false, // Disabled by default until API key is provided
      model: 'claude-3-sonnet-20240229',
      maxTokens: 2000,
      temperature: 0.3,
      priority: 2 // Second priority
    },
    local: {
      enabled: true, // Always available as fallback
      priority: 3 // Lowest priority
    }
  },
  selection: {
    preferredProvider: 'auto', // Auto-select best available
    fallbackOrder: ['openai', 'claude', 'local'],
    costLimitEnabled: true,
    dailyCostLimit: 5.00 // $5 daily limit by default
  },
  analysis: {
    autoAnalyze: false, // Manual analysis by default
    throttleDelay: 3000, // 3 seconds between auto-analyses
    confidenceThreshold: 0.7, // Minimum confidence for suggestions
    enableRealTimeAnalysis: true,
    enableVoiceComments: false,
    cacheEnabled: true,
    cacheTTL: 60 // 1 hour cache by default
  },
  features: {
    patternRecognition: true,
    counterPlayAnalysis: true,
    historicalComparison: true,
    riskAssessment: true,
    suggestionGeneration: true,
    comparativeAnalysis: true,
    educationalMode: false
  },
  ui: {
    enableVisualHighlights: true,
    enableHeatMaps: true,
    enableSuggestionOverlays: true,
    enableAnalysisHistory: true,
    maxHistoryItems: 50,
    showProviderInfo: true,
    showCostTracking: true,
    showCacheStats: false // Hidden by default
  },
  mock: {
    enabled: true, // Use mock data by default for development
    simulateDelay: true,
    delayRange: [1500, 3000], // 1.5-3 second delay simulation
    errorRate: 0.05, // 5% mock error rate
    simulateProviderFailures: false
  }
};

/**
 * Get AI configuration with environment variable overrides
 */
export function getAIConfig(): AIConfig {
  const config = { ...defaultConfig };

  // Override with environment variables if available
  if (typeof window !== 'undefined') {
    // OpenAI configuration
    const openaiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (openaiKey) {
      config.providers.openai.enabled = true;
      config.providers.openai.apiKey = openaiKey;
    }

    // Claude configuration
    const claudeKey = process.env.NEXT_PUBLIC_CLAUDE_API_KEY;
    if (claudeKey) {
      config.providers.claude.enabled = true;
      config.providers.claude.apiKey = claudeKey;
    }

    // Provider selection from environment
    const preferredProvider = process.env.NEXT_PUBLIC_AI_PREFERRED_PROVIDER as any;
    if (preferredProvider && ['openai', 'claude', 'local', 'auto'].includes(preferredProvider)) {
      config.selection.preferredProvider = preferredProvider;
    }

    // Cost limit configuration
    const costLimit = process.env.NEXT_PUBLIC_AI_DAILY_COST_LIMIT;
    if (costLimit) {
      const limit = parseFloat(costLimit);
      if (!isNaN(limit) && limit > 0) {
        config.selection.dailyCostLimit = limit;
      }
    }

    // Disable mock when real APIs are available
    if (openaiKey || claudeKey) {
      config.mock.enabled = false;
    }

    // Development mode settings
    if (process.env.NODE_ENV === 'development') {
      config.mock.enabled = true; // Force mock in development for safety
      config.ui.showCacheStats = true; // Show debug info in dev
    }

    // Feature flags from environment
    if (process.env.NEXT_PUBLIC_AI_AUTO_ANALYZE === 'true') {
      config.analysis.autoAnalyze = true;
    }
    
    if (process.env.NEXT_PUBLIC_AI_REAL_TIME === 'false') {
      config.analysis.enableRealTimeAnalysis = false;
    }

    if (process.env.NEXT_PUBLIC_AI_CACHE_DISABLED === 'true') {
      config.analysis.cacheEnabled = false;
    }

    if (process.env.NEXT_PUBLIC_AI_EDUCATIONAL_MODE === 'true') {
      config.features.educationalMode = true;
    }
  }

  return config;
}

/**
 * Validate AI configuration
 */
export function validateAIConfig(config: AIConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate OpenAI settings
  if (config.providers.openai.enabled && !config.providers.openai.apiKey) {
    errors.push('OpenAI API key is required when OpenAI is enabled');
  }

  if (config.providers.openai.maxTokens < 100 || config.providers.openai.maxTokens > 4000) {
    errors.push('OpenAI max tokens must be between 100 and 4000');
  }

  if (config.providers.openai.temperature < 0 || config.providers.openai.temperature > 1) {
    errors.push('OpenAI temperature must be between 0 and 1');
  }

  // Validate Claude settings
  if (config.providers.claude.enabled && !config.providers.claude.apiKey) {
    errors.push('Claude API key is required when Claude is enabled');
  }

  if (config.providers.claude.maxTokens < 100 || config.providers.claude.maxTokens > 4000) {
    errors.push('Claude max tokens must be between 100 and 4000');
  }

  if (config.providers.claude.temperature < 0 || config.providers.claude.temperature > 1) {
    errors.push('Claude temperature must be between 0 and 1');
  }

  // Validate selection settings
  if (config.selection.dailyCostLimit <= 0) {
    errors.push('Daily cost limit must be greater than 0');
  }

  if (config.selection.fallbackOrder.length === 0) {
    errors.push('Fallback order must contain at least one provider');
  }

  // Validate analysis settings
  if (config.analysis.throttleDelay < 1000) {
    errors.push('Throttle delay must be at least 1000ms to avoid API rate limits');
  }

  if (config.analysis.confidenceThreshold < 0 || config.analysis.confidenceThreshold > 1) {
    errors.push('Confidence threshold must be between 0 and 1');
  }

  if (config.analysis.cacheTTL < 1) {
    errors.push('Cache TTL must be at least 1 minute');
  }

  // Validate UI settings
  if (config.ui.maxHistoryItems < 1 || config.ui.maxHistoryItems > 1000) {
    errors.push('Max history items must be between 1 and 1000');
  }

  // Check that at least one provider is enabled
  const enabledProviders = [
    config.providers.openai.enabled,
    config.providers.claude.enabled,
    config.providers.local.enabled
  ].filter(Boolean);

  if (enabledProviders.length === 0) {
    errors.push('At least one AI provider must be enabled');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get keyboard shortcuts for AI analysis
 */
export const AI_KEYBOARD_SHORTCUTS = {
  quickAnalysis: 'Ctrl+A',
  toggleAnalysisMode: 'Ctrl+Shift+A',
  nextSuggestion: 'Ctrl+N',
  previousSuggestion: 'Ctrl+P',
  applySuggestion: 'Ctrl+Enter',
  toggleHighlights: 'Ctrl+H',
  exportAnalysis: 'Ctrl+E',
  openAIPanel: 'Ctrl+I'
} as const;

/**
 * Analysis type configurations
 */
export const ANALYSIS_TYPES = {
  quick: {
    name: 'Quick Analysis',
    description: 'Fast basic analysis with core suggestions',
    duration: '5-10 seconds',
    features: ['spacing', 'positioning', 'basic timing']
  },
  detailed: {
    name: 'Detailed Analysis',
    description: 'Comprehensive analysis with all features',
    duration: '15-30 seconds',
    features: ['spacing', 'positioning', 'timing', 'flow', 'creativity', 'pattern recognition']
  },
  comparative: {
    name: 'Comparative Analysis',
    description: 'Compare with similar plays and historical data',
    duration: '20-45 seconds',
    features: ['historical comparison', 'pattern matching', 'effectiveness scoring']
  }
} as const;

export type AnalysisType = keyof typeof ANALYSIS_TYPES;

/**
 * Error handling configurations
 */
export const ERROR_HANDLING = {
  retryAttempts: 3,
  retryDelay: 1000, // Base delay, exponential backoff
  timeoutMs: 30000, // 30 second timeout
  fallbackToMock: true, // Fall back to mock data on API failure
  userFriendlyMessages: {
    networkError: 'Unable to connect to AI analysis service. Please check your connection.',
    apiKeyError: 'AI analysis service authentication failed. Please check your API key.',
    quotaError: 'AI analysis quota exceeded. Please try again later.',
    timeoutError: 'AI analysis is taking longer than expected. Please try again.',
    unknownError: 'An unexpected error occurred during analysis. Please try again.'
  }
} as const;

/**
 * Performance monitoring thresholds
 */
export const PERFORMANCE_THRESHOLDS = {
  analysisTime: {
    good: 5000,    // < 5 seconds
    acceptable: 15000, // < 15 seconds
    slow: 30000    // < 30 seconds
  },
  memoryUsage: {
    warning: 50 * 1024 * 1024,  // 50MB
    critical: 100 * 1024 * 1024  // 100MB
  }
} as const;

/**
 * Get available AI providers based on configuration
 */
export function getAvailableProviders(config?: AIConfig): Array<'openai' | 'claude' | 'local'> {
  const cfg = config || getAIConfig();
  const providers: Array<'openai' | 'claude' | 'local'> = [];

  if (cfg.providers.openai.enabled && cfg.providers.openai.apiKey) {
    providers.push('openai');
  }
  
  if (cfg.providers.claude.enabled && cfg.providers.claude.apiKey) {
    providers.push('claude');
  }
  
  if (cfg.providers.local.enabled) {
    providers.push('local');
  }

  // Sort by priority
  return providers.sort((a, b) => {
    const aPriority = cfg.providers[a].priority || 999;
    const bPriority = cfg.providers[b].priority || 999;
    return aPriority - bPriority;
  });
}

/**
 * Get the best available provider based on configuration
 */
export function getBestProvider(config?: AIConfig): 'openai' | 'claude' | 'local' {
  const cfg = config || getAIConfig();
  
  if (cfg.selection.preferredProvider !== 'auto') {
    const preferred = cfg.selection.preferredProvider;
    if (cfg.providers[preferred].enabled) {
      return preferred;
    }
  }

  const available = getAvailableProviders(cfg);
  return available[0] || 'local';
}

/**
 * Check if cost limits allow for analysis
 */
export function canAffordAnalysis(estimatedCost: number = 0.05, config?: AIConfig): boolean {
  const cfg = config || getAIConfig();
  
  if (!cfg.selection.costLimitEnabled) {
    return true;
  }

  // This would integrate with actual cost tracking in production
  const dailyUsed = parseFloat(localStorage.getItem('ai_daily_cost') || '0');
  return (dailyUsed + estimatedCost) <= cfg.selection.dailyCostLimit;
}

/**
 * Get provider-specific configuration
 */
export function getProviderConfig(provider: 'openai' | 'claude' | 'local', config?: AIConfig) {
  const cfg = config || getAIConfig();
  return cfg.providers[provider];
}

/**
 * Create AI configuration for specific use case
 */
export function createAIConfig(overrides: Partial<AIConfig>): AIConfig {
  const base = getAIConfig();
  return {
    ...base,
    ...overrides,
    providers: {
      ...base.providers,
      ...overrides.providers
    },
    selection: {
      ...base.selection,
      ...overrides.selection
    },
    analysis: {
      ...base.analysis,
      ...overrides.analysis
    },
    features: {
      ...base.features,
      ...overrides.features
    },
    ui: {
      ...base.ui,
      ...overrides.ui
    },
    mock: {
      ...base.mock,
      ...overrides.mock
    }
  };
}