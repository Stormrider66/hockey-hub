/**
 * Test imports to verify all dependencies are correct
 */

// Test service imports
export { PlayerDistributionAI } from '../../services/PlayerDistributionAI';
export { FatiguePrediction } from '../../services/FatiguePrediction';

// Test component imports
export { default as PlayerDistributionPanel } from './PlayerDistributionPanel';
export { default as FatigueIndicator } from './FatigueIndicator';
export { default as LoadBalanceVisualization } from './LoadBalanceVisualization';
export { default as AIRecommendationsPanel } from './AIRecommendationsPanel';

// Test icon imports
export { 
  Brain,
  Battery,
  BatteryLow,
  Sparkles,
  Target,
  Zap,
  Info
} from '@/components/icons';

// Test UI imports
export { Card } from '@/components/ui/card';
export { Slider } from '@/components/ui/slider';
export { Tooltip } from '@/components/ui/tooltip';
export { Label } from '@/components/ui/label';

console.log('All imports successful!');