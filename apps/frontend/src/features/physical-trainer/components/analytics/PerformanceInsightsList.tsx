'use client';

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle,
  Info,
  Zap,
  Target,
  Calendar,
  Users,
  Activity,
  Heart,
  Shield,
  Clock,
  Eye,
  ArrowRight,
  Filter
} from 'lucide-react';

import { 
  PerformanceInsight
} from '../../types/performance-analytics.types';

interface PerformanceInsightsListProps {
  insights: PerformanceInsight[];
  onInsightClick: (action: string, params?: any) => void;
  maxItems?: number;
  showFilters?: boolean;
}

export function PerformanceInsightsList({
  insights,
  onInsightClick,
  maxItems = 10,
  showFilters = true
}: PerformanceInsightsListProps) {
  const { t } = useTranslation(['physicalTrainer', 'common']);

  // Filter state
  const [typeFilter, setTypeFilter] = useState<'all' | PerformanceInsight['type']>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | PerformanceInsight['category']>('all');
  const [impactFilter, setImpactFilter] = useState<'all' | PerformanceInsight['impact']>('all');

  // Filter insights based on current filters
  const filteredInsights = useMemo(() => {
    return insights.filter(insight => {
      if (typeFilter !== 'all' && insight.type !== typeFilter) return false;
      if (categoryFilter !== 'all' && insight.category !== categoryFilter) return false;
      if (impactFilter !== 'all' && insight.impact !== impactFilter) return false;
      return true;
    }).slice(0, maxItems);
  }, [insights, typeFilter, categoryFilter, impactFilter, maxItems]);

  // Get icon for insight type
  const getInsightIcon = (type: PerformanceInsight['type']) => {
    switch (type) {
      case 'positive':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'negative':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'neutral':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  // Get icon for insight category
  const getCategoryIcon = (category: PerformanceInsight['category']) => {
    switch (category) {
      case 'performance':
        return <Zap className="h-3 w-3" />;
      case 'load':
        return <Activity className="h-3 w-3" />;
      case 'injury':
        return <Shield className="h-3 w-3" />;
      case 'attendance':
        return <Users className="h-3 w-3" />;
      case 'recovery':
        return <Heart className="h-3 w-3" />;
      default:
        return <Target className="h-3 w-3" />;
    }
  };

  // Get color classes for insight type
  const getInsightColors = (type: PerformanceInsight['type']) => {
    switch (type) {
      case 'positive':
        return 'border-l-green-500 bg-green-50';
      case 'negative':
        return 'border-l-red-500 bg-red-50';
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'neutral':
        return 'border-l-blue-500 bg-blue-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day${days === 1 ? '' : 's'} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    } else {
      return 'Just now';
    }
  };

  // Handle insight click
  const handleInsightClick = (insight: PerformanceInsight) => {
    // Determine action based on insight type and category
    if (insight.category === 'performance' && insight.entities.length === 1) {
      if (insight.entities[0].startsWith('team-')) {
        onInsightClick('view-team', { teamId: insight.entities[0] });
      } else if (insight.entities[0].startsWith('player-')) {
        onInsightClick('view-player', { playerId: insight.entities[0] });
      }
    } else if (insight.category === 'injury') {
      onInsightClick('view-injury-risk', { entities: insight.entities });
    } else if (insight.category === 'load') {
      onInsightClick('view-load-management', { entities: insight.entities });
    } else {
      onInsightClick('view-insight-details', { insightId: insight.id });
    }
  };

  // Handle recommendation click
  const handleRecommendationClick = (insight: PerformanceInsight, recommendation: string) => {
    onInsightClick('apply-recommendation', { 
      insightId: insight.id, 
      recommendation,
      entities: insight.entities 
    });
  };

  if (insights.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Zap className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t('physicalTrainer:analytics.insights.noInsights')}
          </h3>
          <p className="text-sm text-gray-500">
            {t('physicalTrainer:analytics.insights.noInsightsDescription')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          
          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="text-xs border rounded px-2 py-1"
          >
            <option value="all">All Types</option>
            <option value="positive">Positive</option>
            <option value="negative">Negative</option>
            <option value="warning">Warning</option>
            <option value="neutral">Neutral</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="text-xs border rounded px-2 py-1"
          >
            <option value="all">All Categories</option>
            <option value="performance">Performance</option>
            <option value="load">Load</option>
            <option value="injury">Injury</option>
            <option value="attendance">Attendance</option>
            <option value="recovery">Recovery</option>
          </select>

          {/* Impact Filter */}
          <select
            value={impactFilter}
            onChange={(e) => setImpactFilter(e.target.value as any)}
            className="text-xs border rounded px-2 py-1"
          >
            <option value="all">All Impact</option>
            <option value="high">High Impact</option>
            <option value="medium">Medium Impact</option>
            <option value="low">Low Impact</option>
          </select>

          {/* Active filters count */}
          {(typeFilter !== 'all' || categoryFilter !== 'all' || impactFilter !== 'all') && (
            <Badge variant="secondary" className="text-xs">
              {filteredInsights.length} of {insights.length} insights
            </Badge>
          )}
        </div>
      )}

      {/* Insights List */}
      <div className="space-y-3">
        {filteredInsights.map((insight) => (
          <Card 
            key={insight.id}
            className={`border-l-4 cursor-pointer hover:shadow-md transition-shadow ${getInsightColors(insight.type)}`}
            onClick={() => handleInsightClick(insight)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getInsightIcon(insight.type)}
                  <h3 className="font-semibold text-sm">{insight.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={insight.impact === 'high' ? 'destructive' : 
                           insight.impact === 'medium' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {insight.impact} impact
                  </Badge>
                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                    {getCategoryIcon(insight.category)}
                    {insight.category}
                  </Badge>
                </div>
              </div>

              <p className="text-sm text-gray-700 mb-3">{insight.description}</p>

              {/* Entities affected */}
              {insight.entities.length > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-3 w-3 text-gray-500" />
                  <span className="text-xs text-gray-500">
                    Affects: {insight.entities.length} {insight.entities.length === 1 ? 'entity' : 'entities'}
                  </span>
                </div>
              )}

              {/* Recommendations */}
              {insight.recommendations.length > 0 && (
                <div className="space-y-2 mb-3">
                  <h4 className="text-xs font-medium text-gray-600 flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    Recommendations:
                  </h4>
                  <div className="space-y-1">
                    {insight.recommendations.slice(0, 2).map((recommendation, index) => (
                      <div 
                        key={index}
                        className="text-xs bg-white/50 rounded px-2 py-1 cursor-pointer hover:bg-white/80 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRecommendationClick(insight, recommendation);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <ArrowRight className="h-3 w-3 text-blue-500" />
                          {recommendation}
                        </div>
                      </div>
                    ))}
                    {insight.recommendations.length > 2 && (
                      <p className="text-xs text-gray-500">
                        +{insight.recommendations.length - 2} more recommendations
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTimestamp(insight.timestamp)}
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {Math.round(insight.confidence * 100)}% confidence
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-1 text-xs hover:bg-white/50"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleInsightClick(insight);
                  }}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More */}
      {insights.length > maxItems && filteredInsights.length === maxItems && (
        <div className="text-center pt-4">
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            View All Insights ({insights.length})
          </Button>
        </div>
      )}

      {/* Empty State for Filtered Results */}
      {filteredInsights.length === 0 && insights.length > 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <Filter className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No insights match your filters
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Try adjusting your filter criteria to see more insights.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setTypeFilter('all');
                setCategoryFilter('all');
                setImpactFilter('all');
              }}
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}