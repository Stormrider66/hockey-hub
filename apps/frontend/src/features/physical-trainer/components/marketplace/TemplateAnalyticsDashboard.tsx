/**
 * TemplateAnalyticsDashboard Component
 * 
 * Comprehensive analytics dashboard for template performance and usage insights
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Users, 
  Star,
  Download,
  Clock,
  Target,
  Award,
  Calendar,
  Filter,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from '@/components/icons';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  TemplateMarketplaceItem, 
  TemplateRecommendation,
  TemplateAnalyticsData 
} from '../../types/template.types';
import WorkoutTemplateAnalytics from '../../services/WorkoutTemplateAnalytics';
import { useTranslation } from 'react-i18next';

interface TemplateAnalyticsDashboardProps {
  templates: TemplateMarketplaceItem[];
  recommendations: TemplateRecommendation[];
  currentUserId: string;
  teamId?: string;
}

interface AnalyticsMetric {
  label: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  icon: React.ComponentType<any>;
  color: string;
}

interface TopTemplate {
  template: TemplateMarketplaceItem;
  analytics: TemplateAnalyticsData;
  rank: number;
}

export const TemplateAnalyticsDashboard: React.FC<TemplateAnalyticsDashboardProps> = ({
  templates,
  recommendations,
  currentUserId,
  teamId
}) => {
  const { t } = useTranslation('physicalTrainer');
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('30d');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<Map<string, TemplateAnalyticsData>>(new Map());
  
  const analytics = WorkoutTemplateAnalytics.getInstance();
  
  // Load analytics data
  useEffect(() => {
    loadAnalyticsData();
  }, [templates, timeframe]);
  
  const loadAnalyticsData = async () => {
    setIsRefreshing(true);
    try {
      const templateIds = templates.map(t => t.id);
      const data = analytics.getBulkAnalytics(templateIds);
      setAnalyticsData(data);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  const handleRefresh = async () => {
    await loadAnalyticsData();
  };
  
  // Calculate overall metrics
  const overallMetrics = useMemo((): AnalyticsMetric[] => {
    const allAnalytics = Array.from(analyticsData.values());
    
    if (allAnalytics.length === 0) {
      return [];
    }
    
    const totalUsage = allAnalytics.reduce((sum, a) => sum + a.usageMetrics.totalUsage, 0);
    const avgRating = allAnalytics.reduce((sum, a) => sum + a.usageMetrics.averageRating, 0) / allAnalytics.length;
    const avgCompletionRate = allAnalytics.reduce((sum, a) => sum + a.usageMetrics.completionRate, 0) / allAnalytics.length;
    const avgEffectiveness = allAnalytics.reduce((sum, a) => sum + a.effectivenessScore, 0) / allAnalytics.length;
    
    return [
      {
        label: 'Total Usage',
        value: totalUsage.toLocaleString(),
        change: 15.2,
        trend: 'up',
        icon: Download,
        color: 'text-blue-600'
      },
      {
        label: 'Average Rating',
        value: `${avgRating.toFixed(1)}/10`,
        change: 0.3,
        trend: 'up',
        icon: Star,
        color: 'text-yellow-600'
      },
      {
        label: 'Completion Rate',
        value: `${(avgCompletionRate * 100).toFixed(1)}%`,
        change: -2.1,
        trend: 'down',
        icon: Target,
        color: 'text-green-600'
      },
      {
        label: 'Effectiveness',
        value: `${avgEffectiveness.toFixed(0)}/100`,
        change: 5.7,
        trend: 'up',
        icon: Award,
        color: 'text-purple-600'
      }
    ];
  }, [analyticsData]);
  
  // Get top performing templates
  const topTemplates = useMemo((): TopTemplate[] => {
    return templates
      .map(template => {
        const analytics = analyticsData.get(template.id);
        return analytics ? {
          template,
          analytics,
          rank: 0
        } : null;
      })
      .filter(Boolean) as TopTemplate[]
      .sort((a, b) => b.analytics.effectivenessScore - a.analytics.effectivenessScore)
      .slice(0, 10)
      .map((item, index) => ({ ...item, rank: index + 1 }));
  }, [templates, analyticsData]);
  
  // Category performance data
  const categoryPerformance = useMemo(() => {
    const categories = new Map<string, {
      name: string;
      totalUsage: number;
      avgEffectiveness: number;
      templateCount: number;
    }>();
    
    templates.forEach(template => {
      const analytics = analyticsData.get(template.id);
      if (!analytics) return;
      
      template.categoryIds.forEach(categoryId => {
        const existing = categories.get(categoryId) || {
          name: categoryId.charAt(0).toUpperCase() + categoryId.slice(1),
          totalUsage: 0,
          avgEffectiveness: 0,
          templateCount: 0
        };
        
        existing.totalUsage += analytics.usageMetrics.totalUsage;
        existing.avgEffectiveness += analytics.effectivenessScore;
        existing.templateCount += 1;
        
        categories.set(categoryId, existing);
      });
    });
    
    return Array.from(categories.values())
      .map(cat => ({
        ...cat,
        avgEffectiveness: cat.avgEffectiveness / cat.templateCount
      }))
      .sort((a, b) => b.totalUsage - a.totalUsage);
  }, [templates, analyticsData]);
  
  // Seasonal usage patterns
  const seasonalData = useMemo(() => {
    const seasonal = {
      preseason: 0,
      inseason: 0,
      playoffs: 0,
      offseason: 0
    };
    
    let count = 0;
    analyticsData.forEach(analytics => {
      seasonal.preseason += analytics.seasonalPatterns.preseason;
      seasonal.inseason += analytics.seasonalPatterns.inseason;
      seasonal.playoffs += analytics.seasonalPatterns.playoffs;
      seasonal.offseason += analytics.seasonalPatterns.offseason;
      count++;
    });
    
    if (count === 0) return seasonal;
    
    return {
      preseason: seasonal.preseason / count,
      inseason: seasonal.inseason / count,
      playoffs: seasonal.playoffs / count,
      offseason: seasonal.offseason / count
    };
  }, [analyticsData]);
  
  const renderMetricCard = (metric: AnalyticsMetric) => {
    const Icon = metric.icon;
    const TrendIcon = metric.trend === 'up' ? ArrowUpRight : 
                     metric.trend === 'down' ? ArrowDownRight : Minus;
    
    return (
      <Card key={metric.label}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">{metric.label}</p>
              <p className="text-2xl font-bold">{metric.value}</p>
              {metric.change !== undefined && (
                <div className={cn(
                  "flex items-center gap-1 text-sm mt-2",
                  metric.trend === 'up' ? 'text-green-600' :
                  metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                )}>
                  <TrendIcon className="h-3 w-3" />
                  <span>{Math.abs(metric.change)}%</span>
                </div>
              )}
            </div>
            <div className={cn("p-3 rounded-lg bg-muted", metric.color)}>
              <Icon className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  const renderTopTemplatesTable = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Top Performing Templates
        </CardTitle>
        <CardDescription>
          Templates ranked by effectiveness score and user engagement
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topTemplates.map((item) => (
            <div key={item.template.id} className="flex items-center gap-4 p-3 rounded-lg border">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                {item.rank}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-medium truncate">{item.template.name}</h4>
                <div className="flex items-center gap-4 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {item.template.difficulty}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {item.template.duration} min
                  </span>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "h-3 w-3",
                          i < Math.floor(item.template.averageStarRating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm font-medium">
                  {item.analytics.effectivenessScore}/100
                </div>
                <div className="text-xs text-muted-foreground">
                  {item.analytics.usageMetrics.totalUsage} uses
                </div>
              </div>
              
              <div className="w-16">
                <Progress 
                  value={item.analytics.effectivenessScore} 
                  className="h-2" 
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
  
  const renderCategoryAnalytics = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5" />
          Category Performance
        </CardTitle>
        <CardDescription>
          Usage and effectiveness by workout category
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {categoryPerformance.map((category) => (
            <div key={category.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">{category.name}</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    ({category.templateCount} templates)
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {category.avgEffectiveness.toFixed(0)}/100
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {category.totalUsage} uses
                  </div>
                </div>
              </div>
              <Progress value={category.avgEffectiveness} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
  
  const renderSeasonalAnalytics = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Seasonal Usage Patterns
        </CardTitle>
        <CardDescription>
          Template usage distribution across hockey seasons
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(seasonalData).map(([season, usage]) => (
            <div key={season} className="text-center p-4 rounded-lg border">
              <div className="text-2xl font-bold text-primary mb-1">
                {(usage * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-muted-foreground capitalize">
                {season.replace('season', '-season')}
              </div>
              <Progress value={usage * 100} className="h-2 mt-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
  
  const renderUsageTrends = () => {
    // Mock trend data - in real implementation, this would come from analytics
    const trendData = [
      { period: 'This Week', usage: 1250, change: 12.5 },
      { period: 'Last Week', usage: 1110, change: -3.2 },
      { period: '2 Weeks Ago', usage: 1148, change: 8.7 },
      { period: '3 Weeks Ago', usage: 1056, change: 2.1 }
    ];
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Usage Trends
          </CardTitle>
          <CardDescription>
            Template usage over the last 4 weeks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {trendData.map((item) => (
              <div key={item.period} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div>
                  <div className="font-medium">{item.period}</div>
                  <div className="text-sm text-muted-foreground">
                    {item.usage.toLocaleString()} total uses
                  </div>
                </div>
                <div className={cn(
                  "flex items-center gap-1 text-sm",
                  item.change > 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  {item.change > 0 ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  <span>{Math.abs(item.change)}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Template Analytics</h2>
          <p className="text-muted-foreground">
            Performance insights and usage statistics
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={timeframe} onValueChange={(value: any) => setTimeframe(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          </Button>
        </div>
      </div>
      
      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {overallMetrics.map(renderMetricCard)}
      </div>
      
      {/* Detailed Analytics */}
      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="seasonal">Seasonal</TabsTrigger>
        </TabsList>
        
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {renderTopTemplatesTable()}
            {renderUsageTrends()}
          </div>
        </TabsContent>
        
        <TabsContent value="usage" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {renderUsageTrends()}
            {renderCategoryAnalytics()}
          </div>
        </TabsContent>
        
        <TabsContent value="categories" className="space-y-6">
          {renderCategoryAnalytics()}
        </TabsContent>
        
        <TabsContent value="seasonal" className="space-y-6">
          {renderSeasonalAnalytics()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TemplateAnalyticsDashboard;