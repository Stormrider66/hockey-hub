/**
 * AI Analysis Hooks
 * 
 * Custom hooks for managing AI-powered tactical analysis
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { getAIConfig, AI_KEYBOARD_SHORTCUTS, AnalysisType } from '../config/aiConfig';

// Types
interface AnalysisScore {
  overall: number;
  categories: {
    spacing: number;
    timing: number;
    positioning: number;
    flow: number;
    creativity: number;
    effectiveness: number;
  };
  confidence: number;
  trend: 'up' | 'down' | 'stable';
}

interface Suggestion {
  id: string;
  title: string;
  description: string;
  category: 'spacing' | 'timing' | 'positioning' | 'flow' | 'creativity' | 'effectiveness';
  priority: 'high' | 'medium' | 'low';
  difficulty: 'easy' | 'moderate' | 'hard';
  expectedImprovement: number;
  coordinates?: { x: number; y: number };
  beforeAfter?: {
    before: string;
    after: string;
  };
}

interface AnalysisResult {
  score: AnalysisScore;
  suggestions: Suggestion[];
  patterns: any; // PatternRecognition type
  counterPlay: any; // CounterPlay type
  metadata: {
    analysisType: AnalysisType;
    duration: number;
    timestamp: Date;
    playId: string;
  };
}

interface AnalysisState {
  isAnalyzing: boolean;
  result: AnalysisResult | null;
  error: string | null;
  progress: number;
}

/**
 * Main AI Analysis Hook
 */
export function useAIAnalysis() {
  const [state, setState] = useState<AnalysisState>({
    isAnalyzing: false,
    result: null,
    error: null,
    progress: 0
  });

  const config = getAIConfig();
  const abortControllerRef = useRef<AbortController | null>(null);

  const analyzePlay = useCallback(async (playData: any, analysisType: AnalysisType = 'quick') => {
    // Cancel any ongoing analysis
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    setState(prev => ({
      ...prev,
      isAnalyzing: true,
      error: null,
      progress: 0
    }));

    try {
      const startTime = Date.now();
      
      if (config.mock.enabled) {
        // Mock analysis
        const result = await performMockAnalysis(playData, analysisType, signal);
        
        setState(prev => ({
          ...prev,
          isAnalyzing: false,
          result: {
            ...result,
            metadata: {
              analysisType,
              duration: Date.now() - startTime,
              timestamp: new Date(),
              playId: playData.id || 'unknown'
            }
          },
          progress: 100
        }));
      } else {
        // Real AI analysis
        const result = await performRealAnalysis(playData, analysisType, signal);
        
        setState(prev => ({
          ...prev,
          isAnalyzing: false,
          result: {
            ...result,
            metadata: {
              analysisType,
              duration: Date.now() - startTime,
              timestamp: new Date(),
              playId: playData.id || 'unknown'
            }
          },
          progress: 100
        }));
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return; // Analysis was cancelled
      }

      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: error.message || 'Analysis failed',
        progress: 0
      }));
    }
  }, [config]);

  const cancelAnalysis = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        progress: 0
      }));
    }
  }, []);

  const clearResult = useCallback(() => {
    setState(prev => ({
      ...prev,
      result: null,
      error: null
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    ...state,
    analyzePlay,
    cancelAnalysis,
    clearResult,
    config
  };
}

/**
 * Hook for managing visual overlays and highlights
 */
export function useAnalysisVisuals() {
  const [highlightedAreas, setHighlightedAreas] = useState<Array<{ x: number; y: number; type: string }>>([]);
  const [showHeatMap, setShowHeatMap] = useState(false);
  const [showSuggestionOverlays, setShowSuggestionOverlays] = useState(false);
  const [analysisMode, setAnalysisMode] = useState(false);

  const highlightArea = useCallback((coordinates: { x: number; y: number }, type: string = 'suggestion') => {
    setHighlightedAreas(prev => [
      ...prev.filter(area => !(area.x === coordinates.x && area.y === coordinates.y)),
      { ...coordinates, type }
    ]);
  }, []);

  const clearHighlights = useCallback(() => {
    setHighlightedAreas([]);
  }, []);

  const toggleHeatMap = useCallback(() => {
    setShowHeatMap(prev => !prev);
  }, []);

  const toggleSuggestionOverlays = useCallback(() => {
    setShowSuggestionOverlays(prev => !prev);
  }, []);

  const toggleAnalysisMode = useCallback(() => {
    setAnalysisMode(prev => !prev);
    if (analysisMode) {
      // Exiting analysis mode - clear highlights
      clearHighlights();
      setShowHeatMap(false);
      setShowSuggestionOverlays(false);
    }
  }, [analysisMode, clearHighlights]);

  return {
    highlightedAreas,
    showHeatMap,
    showSuggestionOverlays,
    analysisMode,
    highlightArea,
    clearHighlights,
    toggleHeatMap,
    toggleSuggestionOverlays,
    toggleAnalysisMode
  };
}

/**
 * Hook for applying AI suggestions to play data
 */
export function useApplySuggestions() {
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());
  const [previewingSuggestion, setPreviewingSuggestion] = useState<string | null>(null);

  const applySuggestion = useCallback((suggestion: Suggestion, playData: any): any => {
    // Mark suggestion as applied
    setAppliedSuggestions(prev => new Set([...prev, suggestion.id]));

    // Apply the suggestion logic based on category
    switch (suggestion.category) {
      case 'spacing':
        return applySpacingSuggestion(suggestion, playData);
      case 'positioning':
        return applyPositioningSuggestion(suggestion, playData);
      case 'timing':
        return applyTimingSuggestion(suggestion, playData);
      default:
        return playData;
    }
  }, []);

  const previewSuggestion = useCallback((suggestionId: string) => {
    setPreviewingSuggestion(suggestionId);
  }, []);

  const clearPreview = useCallback(() => {
    setPreviewingSuggestion(null);
  }, []);

  const undoSuggestion = useCallback((suggestionId: string) => {
    setAppliedSuggestions(prev => {
      const newSet = new Set(prev);
      newSet.delete(suggestionId);
      return newSet;
    });
  }, []);

  return {
    appliedSuggestions,
    previewingSuggestion,
    applySuggestion,
    previewSuggestion,
    clearPreview,
    undoSuggestion
  };
}

/**
 * Hook for real-time analysis throttling
 */
export function useRealTimeAnalysis(onAnalyze: (playData: any) => void) {
  const throttleRef = useRef<NodeJS.Timeout | null>(null);
  const config = getAIConfig();

  const triggerAnalysis = useCallback((playData: any) => {
    if (!config.analysis.enableRealTimeAnalysis) {
      return;
    }

    // Clear existing throttle
    if (throttleRef.current) {
      clearTimeout(throttleRef.current);
    }

    // Set new throttle
    throttleRef.current = setTimeout(() => {
      onAnalyze(playData);
    }, config.analysis.throttleDelay);
  }, [onAnalyze, config.analysis.enableRealTimeAnalysis, config.analysis.throttleDelay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (throttleRef.current) {
        clearTimeout(throttleRef.current);
      }
    };
  }, []);

  return { triggerAnalysis };
}

/**
 * Hook for keyboard shortcuts
 */
export function useAIKeyboardShortcuts(callbacks: {
  onQuickAnalysis?: () => void;
  onToggleAnalysisMode?: () => void;
  onNextSuggestion?: () => void;
  onPreviousSuggestion?: () => void;
  onApplySuggestion?: () => void;
  onToggleHighlights?: () => void;
  onExportAnalysis?: () => void;
  onOpenAIPanel?: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const { ctrlKey, shiftKey, key } = event;

      if (ctrlKey && !shiftKey && key === 'a' && callbacks.onQuickAnalysis) {
        event.preventDefault();
        callbacks.onQuickAnalysis();
      } else if (ctrlKey && shiftKey && key === 'A' && callbacks.onToggleAnalysisMode) {
        event.preventDefault();
        callbacks.onToggleAnalysisMode();
      } else if (ctrlKey && key === 'n' && callbacks.onNextSuggestion) {
        event.preventDefault();
        callbacks.onNextSuggestion();
      } else if (ctrlKey && key === 'p' && callbacks.onPreviousSuggestion) {
        event.preventDefault();
        callbacks.onPreviousSuggestion();
      } else if (ctrlKey && key === 'Enter' && callbacks.onApplySuggestion) {
        event.preventDefault();
        callbacks.onApplySuggestion();
      } else if (ctrlKey && key === 'h' && callbacks.onToggleHighlights) {
        event.preventDefault();
        callbacks.onToggleHighlights();
      } else if (ctrlKey && key === 'e' && callbacks.onExportAnalysis) {
        event.preventDefault();
        callbacks.onExportAnalysis();
      } else if (ctrlKey && key === 'i' && callbacks.onOpenAIPanel) {
        event.preventDefault();
        callbacks.onOpenAIPanel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [callbacks]);
}

// Helper functions for mock analysis
async function performMockAnalysis(playData: any, analysisType: AnalysisType, signal: AbortSignal): Promise<Omit<AnalysisResult, 'metadata'>> {
  const config = getAIConfig();
  
  if (config.mock.simulateDelay) {
    const delay = Math.random() * (config.mock.delayRange[1] - config.mock.delayRange[0]) + config.mock.delayRange[0];
    await new Promise(resolve => {
      const timeout = setTimeout(resolve, delay);
      signal.addEventListener('abort', () => clearTimeout(timeout));
    });
  }

  if (signal.aborted) {
    throw new Error('Analysis was cancelled');
  }

  // Mock error simulation
  if (Math.random() < config.mock.errorRate) {
    throw new Error('Mock analysis error');
  }

  // Return mock analysis result
  return {
    score: {
      overall: Math.floor(Math.random() * 40) + 60, // 60-100
      categories: {
        spacing: Math.floor(Math.random() * 30) + 70,
        timing: Math.floor(Math.random() * 30) + 65,
        positioning: Math.floor(Math.random() * 30) + 68,
        flow: Math.floor(Math.random() * 30) + 72,
        creativity: Math.floor(Math.random() * 30) + 75,
        effectiveness: Math.floor(Math.random() * 30) + 65
      },
      confidence: Math.floor(Math.random() * 20) + 80,
      trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable'
    },
    suggestions: [
      {
        id: '1',
        title: 'Improve Forward Spacing',
        description: 'Left wing is too close to center, reducing passing options',
        category: 'spacing',
        priority: 'high',
        difficulty: 'easy',
        expectedImprovement: 8,
        coordinates: { x: 150, y: 200 }
      }
    ],
    patterns: {},
    counterPlay: {}
  };
}

async function performRealAnalysis(playData: any, analysisType: AnalysisType, signal: AbortSignal): Promise<Omit<AnalysisResult, 'metadata'>> {
  // TODO: Implement real OpenAI API integration
  throw new Error('Real AI analysis not implemented yet');
}

// Helper functions for applying suggestions
function applySpacingSuggestion(suggestion: Suggestion, playData: any): any {
  // TODO: Implement spacing suggestion application logic
  return playData;
}

function applyPositioningSuggestion(suggestion: Suggestion, playData: any): any {
  // TODO: Implement positioning suggestion application logic
  return playData;
}

function applyTimingSuggestion(suggestion: Suggestion, playData: any): any {
  // TODO: Implement timing suggestion application logic
  return playData;
}