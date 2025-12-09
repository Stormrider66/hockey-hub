import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, AlertTriangle, Users, Target, Lightbulb, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { OptimizationRecommendation } from '../../../../../services/statistics-service/src/services/AIOptimizationEngine';
import { WorkoutOptimizationSuggestion } from '../../../../../services/statistics-service/src/services/WorkoutOptimizationService';
import { PersonalizedRecommendation } from '../../../../../services/statistics-service/src/services/PersonalizationEngine';
import { TeamCompositionAnalysis } from '../../../../../services/statistics-service/src/services/TeamCompositionAnalyzer';
import { LoadBalancingRecommendation } from '../../../../../services/statistics-service/src/services/LoadBalancingOptimizer';
import { AnomalyAlert } from '../../../../../services/statistics-service/src/services/AnomalyDetectionService';

interface AIInsightsDashboardProps {
  teamId: string;
  onRecommendationSelect?: (recommendation: any) => void;
  onSettingsClick?: () => void;
}

interface InsightCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  count: number;
  priority: 'high' | 'medium' | 'low';
  color: string;
}

interface InsightSummary {
  totalRecommendations: number;
  highPriorityCount: number;
  activeAnomalies: number;
  optimizationOpportunities: number;
  lastUpdated: Date;
  confidenceScore: number;
}

const AIInsightsDashboard: React.FC<AIInsightsDashboardProps> = ({
  teamId,
  onRecommendationSelect,
  onSettingsClick
}) => {
  const { t } = useTranslation('physicalTrainer');
  const [activeTab, setActiveTab] = useState<'overview' | 'recommendations' | 'anomalies' | 'predictions'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<InsightSummary | null>(null);
  const [categories, setCategories] = useState<InsightCategory[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyAlert[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'24h' | '7d' | '30d'>('7d');

  useEffect(() => {
    loadAIInsights();
  }, [teamId, selectedTimeframe]);

  const loadAIInsights = async () => {
    setIsLoading(true);
    try {
      // Mock data loading - in real implementation, would call AI services
      await simulateDataLoading();
      
      const mockSummary: InsightSummary = {
        totalRecommendations: 23,
        highPriorityCount: 5,
        activeAnomalies: 2,
        optimizationOpportunities: 8,
        lastUpdated: new Date(),
        confidenceScore: 87
      };

      const mockCategories: InsightCategory[] = [
        {
          id: 'workout_optimization',
          name: t('ai.categories.workoutOptimization'),
          icon: <Target className="w-5 h-5" />,
          count: 8,
          priority: 'high',
          color: 'text-blue-600 bg-blue-100'
        },
        {
          id: 'load_balancing',
          name: t('ai.categories.loadBalancing'),
          icon: <Users className="w-5 h-5" />,
          count: 6,
          priority: 'medium',
          color: 'text-green-600 bg-green-100'
        },
        {
          id: 'personalization',
          name: t('ai.categories.personalization'),
          icon: <Lightbulb className="w-5 h-5" />,
          count: 5,
          priority: 'medium',
          color: 'text-purple-600 bg-purple-100'
        },
        {
          id: 'anomaly_detection',
          name: t('ai.categories.anomalyDetection'),
          icon: <AlertTriangle className="w-5 h-5" />,
          count: 2,
          priority: 'high',
          color: 'text-red-600 bg-red-100'
        },
        {
          id: 'team_composition',
          name: t('ai.categories.teamComposition'),
          icon: <Users className="w-5 h-5" />,
          count: 2,
          priority: 'low',
          color: 'text-indigo-600 bg-indigo-100'
        }
      ];

      const mockRecommendations = generateMockRecommendations();
      const mockAnomalies = generateMockAnomalies();

      setSummary(mockSummary);
      setCategories(mockCategories);
      setRecommendations(mockRecommendations);
      setAnomalies(mockAnomalies);
    } catch (error) {
      console.error('Failed to load AI insights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const simulateDataLoading = () => {
    return new Promise(resolve => setTimeout(resolve, 1500));
  };

  const generateMockRecommendations = () => {
    return [
      {
        id: 'rec-001',
        type: 'workout',
        priority: 'high',
        title: 'Optimize Sidney Crosby\'s Training Load',
        description: 'Current training load is 15% above optimal range. Reduce volume by 20% over next week.',
        confidence: 92,
        expectedImprovement: 18,
        timeToEffect: '1-2 weeks',
        category: 'workout_optimization',
        affectedPlayers: ['Sidney Crosby'],
        urgency: 85
      },
      {
        id: 'rec-002',
        type: 'load',
        priority: 'high',
        title: 'Redistribute Team Training Load',
        description: 'Load distribution is uneven across forwards. Redistribute 10% from overloaded to underloaded players.',
        confidence: 88,
        expectedImprovement: 22,
        timeToEffect: '3-5 days',
        category: 'load_balancing',
        affectedPlayers: ['Nathan MacKinnon', 'Connor McDavid', 'Leon Draisaitl'],
        urgency: 78
      },
      {
        id: 'rec-003',
        type: 'personalization',
        priority: 'medium',
        title: 'Enhance Recovery Protocol for McDavid',
        description: 'Sleep quality indicators suggest need for enhanced recovery protocols.',
        confidence: 84,
        expectedImprovement: 15,
        timeToEffect: '1 week',
        category: 'personalization',
        affectedPlayers: ['Connor McDavid'],
        urgency: 65
      },
      {
        id: 'rec-004',
        type: 'schedule',
        priority: 'medium',
        title: 'Optimize Training Schedule',
        description: 'Current schedule creates fatigue accumulation. Adjust rest day distribution.',
        confidence: 79,
        expectedImprovement: 12,
        timeToEffect: '2-3 weeks',
        category: 'load_balancing',
        affectedPlayers: ['Team'],
        urgency: 58
      },
      {
        id: 'rec-005',
        type: 'exercise',
        priority: 'low',
        title: 'Update Exercise Selection',
        description: 'Consider adding agility exercises to address identified movement deficiencies.',
        confidence: 72,
        expectedImprovement: 8,
        timeToEffect: '4-6 weeks',
        category: 'workout_optimization',
        affectedPlayers: ['Position Group: Defensemen'],
        urgency: 35
      }
    ];
  };

  const generateMockAnomalies = (): AnomalyAlert[] => {
    return [
      {
        id: 'anomaly-001',
        type: 'performance_drop' as any,
        severity: 'high',
        title: 'Unusual Performance Decline',
        description: 'Connor McDavid showing 12% performance drop over past 3 days',
        detectedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        confidence: 91,
        urgency: 88,
        affectedEntities: [
          {
            type: 'player',
            id: 'mcdavid-connor',
            name: 'Connor McDavid',
            impactLevel: 'high'
          }
        ],
        anomalyData: {
          detectedMetric: 'performance_score',
          currentValue: 82,
          expectedValue: 93,
          deviation: 2.1,
          deviationPercentage: -12,
          threshold: 1.5,
          timeWindow: {
            start: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            end: new Date(),
            duration: '3 days',
            granularity: 'daily'
          },
          dataPoints: [],
          statisticalSignificance: 95,
          anomalyScore: 88
        },
        context: {} as any,
        possibleCauses: [
          {
            cause: 'Increased fatigue',
            category: 'physiological',
            probability: 75,
            evidence: [],
            investigationSteps: ['Check sleep data', 'Review training load']
          }
        ],
        recommendations: [],
        falsePositiveProbability: 9,
        impactAssessment: {} as any,
        historicalComparison: {} as any,
        relatedAnomalies: [],
        status: 'new',
        investigationNotes: [],
        resolution: null
      },
      {
        id: 'anomaly-002',
        type: 'unusual_load' as any,
        severity: 'medium',
        title: 'Training Load Spike',
        description: 'Defensemen group showing 25% higher than normal training load',
        detectedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        confidence: 83,
        urgency: 65,
        affectedEntities: [
          {
            type: 'team',
            id: 'defensemen',
            name: 'Defensemen Group',
            impactLevel: 'medium'
          }
        ],
        anomalyData: {
          detectedMetric: 'training_load',
          currentValue: 125,
          expectedValue: 100,
          deviation: 1.8,
          deviationPercentage: 25,
          threshold: 1.5,
          timeWindow: {
            start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            end: new Date(),
            duration: '7 days',
            granularity: 'daily'
          },
          dataPoints: [],
          statisticalSignificance: 87,
          anomalyScore: 75
        },
        context: {} as any,
        possibleCauses: [
          {
            cause: 'Schedule intensification',
            category: 'training',
            probability: 68,
            evidence: [],
            investigationSteps: ['Review recent schedule changes']
          }
        ],
        recommendations: [],
        falsePositiveProbability: 17,
        impactAssessment: {} as any,
        historicalComparison: {} as any,
        relatedAnomalies: [],
        status: 'new',
        investigationNotes: [],
        resolution: null
      }
    ];
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else {
      return `${diffMinutes}m ago`;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Brain className="w-6 h-6 text-indigo-600" />
          <h2 className="text-xl font-semibold text-gray-900">{t('ai.title')}</h2>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Brain className="w-6 h-6 text-indigo-600" />
          <h2 className="text-xl font-semibold text-gray-900">{t('ai.title')}</h2>
          {summary && (
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>•</span>
              <span>{t('ai.lastUpdated')}: {formatTimeAgo(summary.lastUpdated)}</span>
              <span>•</span>
              <span>{t('ai.confidence')}: {summary.confidenceScore}%</span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value as '24h' | '7d' | '30d')}
            className="text-sm border border-gray-300 rounded-md px-3 py-1"
          >
            <option value="24h">{t('ai.timeframe.24h')}</option>
            <option value="7d">{t('ai.timeframe.7d')}</option>
            <option value="30d">{t('ai.timeframe.30d')}</option>
          </select>
          {onSettingsClick && (
            <button
              onClick={onSettingsClick}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title={t('ai.settings')}
            >
              <Settings className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">{t('ai.summary.totalRecommendations')}</p>
                <p className="text-2xl font-bold text-blue-600">{summary.totalRecommendations}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-900">{t('ai.summary.highPriority')}</p>
                <p className="text-2xl font-bold text-red-600">{summary.highPriorityCount}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-900">{t('ai.summary.activeAnomalies')}</p>
                <p className="text-2xl font-bold text-yellow-600">{summary.activeAnomalies}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-900">{t('ai.summary.opportunities')}</p>
                <p className="text-2xl font-bold text-green-600">{summary.optimizationOpportunities}</p>
              </div>
              <Target className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: t('ai.tabs.overview') },
            { id: 'recommendations', label: t('ai.tabs.recommendations') },
            { id: 'anomalies', label: t('ai.tabs.anomalies') },
            { id: 'predictions', label: t('ai.tabs.predictions') }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Category Overview */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">{t('ai.overview.categories')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map(category => (
                <div key={category.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${category.color} mb-3`}>
                    {category.icon}
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">{category.name}</h4>
                  <p className="text-sm text-gray-600 mb-2">{category.count} active insights</p>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(category.priority)}`}>
                    {t(`ai.priority.${category.priority}`)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">{t('ai.overview.recentActivity')}</h3>
            <div className="space-y-3">
              {recommendations.slice(0, 3).map(rec => (
                <div key={rec.id} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg">
                  <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                    rec.priority === 'high' ? 'bg-red-500' : 
                    rec.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{rec.title}</p>
                    <p className="text-sm text-gray-600">{rec.description}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-xs text-gray-500">Confidence: {rec.confidence}%</span>
                      <span className="text-xs text-gray-500">Impact: +{rec.expectedImprovement}%</span>
                      <span className="text-xs text-gray-500">Timeline: {rec.timeToEffect}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onRecommendationSelect?.(rec)}
                    className="flex-shrink-0 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    {t('ai.overview.viewDetails')}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'recommendations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">{t('ai.recommendations.title')}</h3>
            <div className="flex items-center space-x-2">
              <select className="text-sm border border-gray-300 rounded-md px-3 py-1">
                <option value="all">{t('ai.recommendations.filterAll')}</option>
                <option value="high">{t('ai.recommendations.filterHigh')}</option>
                <option value="medium">{t('ai.recommendations.filterMedium')}</option>
                <option value="low">{t('ai.recommendations.filterLow')}</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-3">
            {recommendations.map(rec => (
              <div key={rec.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium text-gray-900">{rec.title}</h4>
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(rec.priority)}`}>
                        {t(`ai.priority.${rec.priority}`)}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{rec.description}</p>
                    <div className="flex items-center space-x-6 text-xs text-gray-500">
                      <span>Confidence: {rec.confidence}%</span>
                      <span>Expected improvement: +{rec.expectedImprovement}%</span>
                      <span>Time to effect: {rec.timeToEffect}</span>
                      <span>Affected: {rec.affectedPlayers.join(', ')}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => onRecommendationSelect?.(rec)}
                      className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      {t('ai.recommendations.implement')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'anomalies' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">{t('ai.anomalies.title')}</h3>
            <div className="flex items-center space-x-2">
              <select className="text-sm border border-gray-300 rounded-md px-3 py-1">
                <option value="all">{t('ai.anomalies.filterAll')}</option>
                <option value="high">{t('ai.anomalies.filterHigh')}</option>
                <option value="medium">{t('ai.anomalies.filterMedium')}</option>
                <option value="low">{t('ai.anomalies.filterLow')}</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-3">
            {anomalies.map(anomaly => (
              <div key={anomaly.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium text-gray-900">{anomaly.title}</h4>
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(anomaly.severity)}`}>
                        {t(`ai.severity.${anomaly.severity}`)}
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(anomaly.detectedAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{anomaly.description}</p>
                    <div className="flex items-center space-x-6 text-xs text-gray-500">
                      <span>Confidence: {anomaly.confidence}%</span>
                      <span>Metric: {anomaly.anomalyData.detectedMetric}</span>
                      <span>Deviation: {anomaly.anomalyData.deviationPercentage.toFixed(1)}%</span>
                      <span>
                        Affected: {anomaly.affectedEntities.map(e => e.name).join(', ')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                      {t('ai.anomalies.investigate')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'predictions' && (
        <div className="space-y-4">
          <div className="text-center py-12">
            <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('ai.predictions.title')}</h3>
            <p className="text-gray-600">{t('ai.predictions.comingSoon')}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIInsightsDashboard;