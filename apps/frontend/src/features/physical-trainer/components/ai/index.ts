/**
 * AI Components Index
 * 
 * Export all AI-powered components for the Physical Trainer system
 */

export { default as PlayerDistributionPanel } from './PlayerDistributionPanel';
export { default as FatigueIndicator } from './FatigueIndicator';
export { default as LoadBalanceVisualization } from './LoadBalanceVisualization';
export { default as AIRecommendationsPanel } from './AIRecommendationsPanel';

// Export types
export type { PlayerAIProfile, DistributionStrategy, DistributionResult, PlayerGroup } from '../../services/PlayerDistributionAI';
export type { 
  ACWRCalculation, 
  RecoveryPrediction, 
  FatigueAlert,
  WorkloadData,
  EWMAMetrics 
} from '../../services/FatiguePrediction';