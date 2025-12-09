import React, { useState, useEffect } from 'react';
import { TrendingUp, Clock, Zap, Users, AlertCircle, CheckCircle, X, Eye, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface WorkoutOptimizationSuggestionsProps {
  workoutId: string;
  playerId?: string;
  onApplySuggestion?: (suggestionId: string) => void;
  onDismissSuggestion?: (suggestionId: string) => void;
  onViewDetails?: (suggestionId: string) => void;
}

interface OptimizationSuggestion {
  id: string;
  category: 'duration' | 'intensity' | 'exercise_order' | 'rest_periods' | 'volume' | 'progression';
  title: string;
  description: string;
  currentValue: string | number;
  suggestedValue: string | number;
  reasoning: string;
  confidence: number;
  expectedImprovement: string;
  evidenceType: 'data_driven' | 'research_based' | 'performance_pattern' | 'fatigue_analysis';
  implementationComplexity: 'low' | 'medium' | 'high';
  safetyRating: number;
  applicablePlayerTypes: string[];
  seasonPhase: string[];
  prerequisites: string[];
  alternatives: OptimizationAlternative[];
  metrics: OptimizationMetrics;
  status: 'pending' | 'applied' | 'dismissed';
  appliedAt?: Date;
  estimatedTimeToImplement: string;
  potentialRisks: string[];
}

interface OptimizationAlternative {
  description: string;
  pros: string[];
  cons: string[];
  applicability: string;
  effectiveness: number;
}

interface OptimizationMetrics {
  currentEffectiveness: number;
  predictedEffectiveness: number;
  fatigueScore: number;
  adaptationPotential: number;
  injuryRisk: number;
  timeEfficiency: number;
}

const WorkoutOptimizationSuggestions: React.FC<WorkoutOptimizationSuggestionsProps> = ({
  workoutId,
  playerId,
  onApplySuggestion,
  onDismissSuggestion,
  onViewDetails
}) => {
  const { t } = useTranslation('physicalTrainer');
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSuggestion, setSelectedSuggestion] = useState<OptimizationSuggestion | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'impact' | 'confidence' | 'complexity'>('impact');
  const [showAppliedSuggestions, setShowAppliedSuggestions] = useState(false);

  useEffect(() => {
    loadOptimizationSuggestions();
  }, [workoutId, playerId]);

  const loadOptimizationSuggestions = async () => {
    setIsLoading(true);
    try {
      // Mock data loading - in real implementation, would call WorkoutOptimizationService
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockSuggestions: OptimizationSuggestion[] = [
        {
          id: 'opt-001',
          category: 'rest_periods',
          title: 'Increase Rest Periods for Strength Gains',
          description: 'Current rest periods are too short for optimal strength development',
          currentValue: '90 seconds',
          suggestedValue: '180-240 seconds',
          reasoning: 'Phosphocreatine system needs 3-4 minutes for complete recovery to maintain power output',
          confidence: 92,
          expectedImprovement: '20%',
          evidenceType: 'research_based',
          implementationComplexity: 'low',
          safetyRating: 9,
          applicablePlayerTypes: ['Strength-focused athletes'],
          seasonPhase: ['offseason', 'preseason'],
          prerequisites: ['Adequate training time'],
          alternatives: [
            {
              description: 'Active recovery between sets',
              pros: ['Maintains body temperature', 'Time efficient'],
              cons: ['Not complete recovery', 'May impact performance'],
              applicability: 'Time-constrained sessions',
              effectiveness: 70
            }
          ],
          metrics: {
            currentEffectiveness: 75,
            predictedEffectiveness: 90,
            fatigueScore: 45,
            adaptationPotential: 95,
            injuryRisk: 15,
            timeEfficiency: 60
          },
          status: 'pending',
          estimatedTimeToImplement: 'Immediate',
          potentialRisks: ['Longer workout duration', 'Potential boredom']
        },
        {
          id: 'opt-002',
          category: 'exercise_order',
          title: 'Reorder Exercises for Better Performance',
          description: 'Complex movements should be performed when energy systems are fresh',
          currentValue: 'Current sequence',
          suggestedValue: 'Power → Strength → Endurance',
          reasoning: 'Neural demanding exercises performed first yield better adaptation and reduce injury risk',
          confidence: 88,
          expectedImprovement: '15%',
          evidenceType: 'data_driven',
          implementationComplexity: 'low',
          safetyRating: 10,
          applicablePlayerTypes: ['All athletes'],
          seasonPhase: ['all'],
          prerequisites: [],
          alternatives: [
            {
              description: 'Pre-exhaustion method',
              pros: ['Targets specific muscles', 'Corrects imbalances'],
              cons: ['Reduced total load', 'Complex planning'],
              applicability: 'Corrective training',
              effectiveness: 65
            }
          ],
          metrics: {
            currentEffectiveness: 80,
            predictedEffectiveness: 92,
            fatigueScore: 40,
            adaptationPotential: 88,
            injuryRisk: 20,
            timeEfficiency: 95
          },
          status: 'pending',
          estimatedTimeToImplement: 'Immediate',
          potentialRisks: ['Requires exercise reordering']
        },
        {
          id: 'opt-003',
          category: 'intensity',
          title: 'Adjust Training Intensity Based on Readiness',
          description: 'Current intensity may be too high given recent fatigue markers',
          currentValue: '85% 1RM',
          suggestedValue: '70-75% 1RM',
          reasoning: 'High fatigue levels indicate need for reduced training stress to promote recovery',
          confidence: 85,
          expectedImprovement: '25%',
          evidenceType: 'fatigue_analysis',
          implementationComplexity: 'medium',
          safetyRating: 9,
          applicablePlayerTypes: ['Fatigued athletes', 'High-volume trainees'],
          seasonPhase: ['regular', 'playoffs'],
          prerequisites: ['Fatigue monitoring data'],
          alternatives: [
            {
              description: 'Maintain intensity but reduce volume',
              pros: ['Preserves neural adaptations', 'Maintains skill'],
              cons: ['May not address fatigue', 'Limited recovery'],
              applicability: 'Skill-dependent sports',
              effectiveness: 60
            }
          ],
          metrics: {
            currentEffectiveness: 70,
            predictedEffectiveness: 88,
            fatigueScore: 80,
            adaptationPotential: 75,
            injuryRisk: 40,
            timeEfficiency: 85
          },
          status: 'pending',
          estimatedTimeToImplement: '1-2 sessions',
          potentialRisks: ['Temporary strength plateau', 'Athlete motivation']
        },
        {
          id: 'opt-004',
          category: 'volume',
          title: 'Optimize Training Volume',
          description: 'Current volume appears suboptimal for the training goal',
          currentValue: '12 sets',
          suggestedValue: '16-18 sets',
          reasoning: 'Research indicates 14-20 sets per week for optimal hypertrophy in trained individuals',
          confidence: 82,
          expectedImprovement: '18%',
          evidenceType: 'research_based',
          implementationComplexity: 'medium',
          safetyRating: 8,
          applicablePlayerTypes: ['Hypertrophy-focused', 'Intermediate-advanced'],
          seasonPhase: ['offseason'],
          prerequisites: ['Recovery capacity', 'Time availability'],
          alternatives: [
            {
              description: 'Gradual volume increase',
              pros: ['Better adaptation', 'Reduced injury risk'],
              cons: ['Slower initial progress', 'Longer timeline'],
              applicability: 'Conservative approach',
              effectiveness: 75
            }
          ],
          metrics: {
            currentEffectiveness: 70,
            predictedEffectiveness: 85,
            fatigueScore: 55,
            adaptationPotential: 90,
            injuryRisk: 25,
            timeEfficiency: 75
          },
          status: 'applied',
          appliedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          estimatedTimeToImplement: '1 week transition',
          potentialRisks: ['Increased fatigue', 'Recovery demands']
        }
      ];

      setSuggestions(mockSuggestions);
    } catch (error) {
      console.error('Failed to load optimization suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplySuggestion = (suggestionId: string) => {
    setSuggestions(prev => prev.map(s => 
      s.id === suggestionId 
        ? { ...s, status: 'applied', appliedAt: new Date() }
        : s
    ));
    onApplySuggestion?.(suggestionId);
  };

  const handleDismissSuggestion = (suggestionId: string) => {
    setSuggestions(prev => prev.map(s => 
      s.id === suggestionId 
        ? { ...s, status: 'dismissed' }
        : s
    ));
    onDismissSuggestion?.(suggestionId);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'duration': return <Clock className="w-4 h-4" />;
      case 'intensity': return <Zap className="w-4 h-4" />;
      case 'exercise_order': return <TrendingUp className="w-4 h-4" />;
      case 'rest_periods': return <Clock className="w-4 h-4" />;
      case 'volume': return <Users className="w-4 h-4" />;
      case 'progression': return <TrendingUp className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'duration': return 'text-blue-600 bg-blue-100';
      case 'intensity': return 'text-red-600 bg-red-100';
      case 'exercise_order': return 'text-green-600 bg-green-100';
      case 'rest_periods': return 'text-purple-600 bg-purple-100';
      case 'volume': return 'text-yellow-600 bg-yellow-100';
      case 'progression': return 'text-indigo-600 bg-indigo-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredSuggestions = suggestions
    .filter(s => filterCategory === 'all' || s.category === filterCategory)
    .filter(s => showAppliedSuggestions || s.status !== 'applied')
    .sort((a, b) => {
      switch (sortBy) {
        case 'impact':
          return parseFloat(b.expectedImprovement) - parseFloat(a.expectedImprovement);
        case 'confidence':
          return b.confidence - a.confidence;
        case 'complexity':
          const complexityOrder = { low: 1, medium: 2, high: 3 };
          return complexityOrder[a.implementationComplexity] - complexityOrder[b.implementationComplexity];
        default:
          return 0;
      }
    });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="border border-gray-200 rounded-lg p-4">
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">{t('optimization.suggestions.title')}</h3>
          <p className="text-sm text-gray-600 mt-1">{t('optimization.suggestions.subtitle')}</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-3 py-1"
          >
            <option value="all">{t('optimization.filters.allCategories')}</option>
            <option value="duration">{t('optimization.categories.duration')}</option>
            <option value="intensity">{t('optimization.categories.intensity')}</option>
            <option value="exercise_order">{t('optimization.categories.exerciseOrder')}</option>
            <option value="rest_periods">{t('optimization.categories.restPeriods')}</option>
            <option value="volume">{t('optimization.categories.volume')}</option>
            <option value="progression">{t('optimization.categories.progression')}</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'impact' | 'confidence' | 'complexity')}
            className="text-sm border border-gray-300 rounded-md px-3 py-1"
          >
            <option value="impact">{t('optimization.sort.impact')}</option>
            <option value="confidence">{t('optimization.sort.confidence')}</option>
            <option value="complexity">{t('optimization.sort.complexity')}</option>
          </select>
          <label className="flex items-center text-sm">
            <input
              type="checkbox"
              checked={showAppliedSuggestions}
              onChange={(e) => setShowAppliedSuggestions(e.target.checked)}
              className="mr-2"
            />
            {t('optimization.filters.showApplied')}
          </label>
        </div>
      </div>

      {/* Suggestions List */}
      <div className="space-y-4">
        {filteredSuggestions.length === 0 ? (
          <div className="text-center py-8">
            <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">{t('optimization.suggestions.noSuggestions')}</h4>
            <p className="text-gray-600">{t('optimization.suggestions.noSuggestionsDesc')}</p>
          </div>
        ) : (
          filteredSuggestions.map(suggestion => (
            <div
              key={suggestion.id}
              className={`border rounded-lg p-4 transition-all ${
                suggestion.status === 'applied' 
                  ? 'border-green-200 bg-green-50' 
                  : suggestion.status === 'dismissed'
                  ? 'border-gray-200 bg-gray-50 opacity-60'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center space-x-3 mb-2">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${getCategoryColor(suggestion.category)}`}>
                      {getCategoryIcon(suggestion.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900">{suggestion.title}</h4>
                      <div className="flex items-center space-x-3 mt-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(suggestion.category)}`}>
                          {t(`optimization.categories.${suggestion.category}`)}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getComplexityColor(suggestion.implementationComplexity)}`}>
                          {t(`optimization.complexity.${suggestion.implementationComplexity}`)}
                        </span>
                        {suggestion.status === 'applied' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-green-600 bg-green-100">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {t('optimization.status.applied')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-3">{suggestion.description}</p>

                  {/* Current vs Suggested */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs font-medium text-gray-900 mb-1">{t('optimization.current')}</p>
                      <p className="text-sm text-gray-700">{suggestion.currentValue}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs font-medium text-blue-900 mb-1">{t('optimization.suggested')}</p>
                      <p className="text-sm text-blue-700">{suggestion.suggestedValue}</p>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    <div className="text-center">
                      <p className="text-xs text-gray-500">{t('optimization.metrics.confidence')}</p>
                      <p className="text-sm font-medium text-gray-900">{suggestion.confidence}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">{t('optimization.metrics.improvement')}</p>
                      <p className="text-sm font-medium text-green-600">+{suggestion.expectedImprovement}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">{t('optimization.metrics.safety')}</p>
                      <p className="text-sm font-medium text-gray-900">{suggestion.safetyRating}/10</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">{t('optimization.metrics.timeToImplement')}</p>
                      <p className="text-sm font-medium text-gray-900">{suggestion.estimatedTimeToImplement}</p>
                    </div>
                  </div>

                  {/* Reasoning */}
                  <div className="bg-blue-50 rounded-lg p-3 mb-3">
                    <p className="text-xs font-medium text-blue-900 mb-1">{t('optimization.reasoning')}</p>
                    <p className="text-sm text-blue-800">{suggestion.reasoning}</p>
                  </div>

                  {/* Prerequisites and Risks */}
                  {(suggestion.prerequisites.length > 0 || suggestion.potentialRisks.length > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      {suggestion.prerequisites.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-900 mb-1">{t('optimization.prerequisites')}</p>
                          <ul className="text-xs text-gray-600 space-y-1">
                            {suggestion.prerequisites.map((req, index) => (
                              <li key={index} className="flex items-center">
                                <CheckCircle className="w-3 h-3 text-green-500 mr-1" />
                                {req}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {suggestion.potentialRisks.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-900 mb-1">{t('optimization.potentialRisks')}</p>
                          <ul className="text-xs text-gray-600 space-y-1">
                            {suggestion.potentialRisks.map((risk, index) => (
                              <li key={index} className="flex items-center">
                                <AlertCircle className="w-3 h-3 text-yellow-500 mr-1" />
                                {risk}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col space-y-2 ml-4">
                  {suggestion.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApplySuggestion(suggestion.id)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        {t('optimization.actions.apply')}
                      </button>
                      <button
                        onClick={() => setSelectedSuggestion(suggestion)}
                        className="px-3 py-1 text-sm text-blue-600 border border-blue-300 rounded hover:bg-blue-50 transition-colors"
                      >
                        <Eye className="w-4 h-4 mr-1 inline" />
                        {t('optimization.actions.details')}
                      </button>
                      <button
                        onClick={() => handleDismissSuggestion(suggestion.id)}
                        className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                      >
                        <X className="w-4 h-4 mr-1 inline" />
                        {t('optimization.actions.dismiss')}
                      </button>
                    </>
                  )}
                  {suggestion.status === 'applied' && suggestion.appliedAt && (
                    <div className="text-xs text-green-600">
                      {t('optimization.appliedAt')}: {suggestion.appliedAt.toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detailed View Modal */}
      {selectedSuggestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">{selectedSuggestion.title}</h3>
                <button
                  onClick={() => setSelectedSuggestion(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Effectiveness Metrics */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">{t('optimization.details.effectiveness')}</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">{t('optimization.details.current')}</p>
                      <p className="text-lg font-bold text-gray-900">{selectedSuggestion.metrics.currentEffectiveness}%</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-600">{t('optimization.details.predicted')}</p>
                      <p className="text-lg font-bold text-green-600">{selectedSuggestion.metrics.predictedEffectiveness}%</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-600">{t('optimization.details.improvement')}</p>
                      <p className="text-lg font-bold text-blue-600">
                        +{selectedSuggestion.metrics.predictedEffectiveness - selectedSuggestion.metrics.currentEffectiveness}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Additional Metrics */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">{t('optimization.details.additionalMetrics')}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">{t('optimization.details.fatigueScore')}</span>
                      <span className="font-medium">{selectedSuggestion.metrics.fatigueScore}/100</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">{t('optimization.details.adaptationPotential')}</span>
                      <span className="font-medium">{selectedSuggestion.metrics.adaptationPotential}%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">{t('optimization.details.injuryRisk')}</span>
                      <span className="font-medium">{selectedSuggestion.metrics.injuryRisk}%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">{t('optimization.details.timeEfficiency')}</span>
                      <span className="font-medium">{selectedSuggestion.metrics.timeEfficiency}%</span>
                    </div>
                  </div>
                </div>

                {/* Alternatives */}
                {selectedSuggestion.alternatives.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">{t('optimization.details.alternatives')}</h4>
                    <div className="space-y-3">
                      {selectedSuggestion.alternatives.map((alt, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <h5 className="font-medium text-gray-900 mb-2">{alt.description}</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium text-green-600 mb-1">{t('optimization.details.pros')}</p>
                              <ul className="text-sm text-gray-600 space-y-1">
                                {alt.pros.map((pro, i) => (
                                  <li key={i} className="flex items-center">
                                    <CheckCircle className="w-3 h-3 text-green-500 mr-1" />
                                    {pro}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-red-600 mb-1">{t('optimization.details.cons')}</p>
                              <ul className="text-sm text-gray-600 space-y-1">
                                {alt.cons.map((con, i) => (
                                  <li key={i} className="flex items-center">
                                    <X className="w-3 h-3 text-red-500 mr-1" />
                                    {con}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-sm text-gray-600">{alt.applicability}</span>
                            <span className="text-sm font-medium">{t('optimization.details.effectiveness')}: {alt.effectiveness}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={() => setSelectedSuggestion(null)}
                    className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    {t('optimization.actions.close')}
                  </button>
                  {selectedSuggestion.status === 'pending' && (
                    <button
                      onClick={() => {
                        handleApplySuggestion(selectedSuggestion.id);
                        setSelectedSuggestion(null);
                      }}
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      {t('optimization.actions.apply')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutOptimizationSuggestions;