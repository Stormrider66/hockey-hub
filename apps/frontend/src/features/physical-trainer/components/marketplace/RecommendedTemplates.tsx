/**
 * RecommendedTemplates Component
 * 
 * AI-powered template recommendations with explanations and context
 */

import React, { useMemo } from 'react';
import { 
  Brain, 
  TrendingUp, 
  Users, 
  Target, 
  Clock,
  Info,
  Lightbulb,
  Zap,
  Star,
  ChevronRight
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  TemplateMarketplaceItem, 
  TemplateRecommendation 
} from '../../types/template.types';
import { RecommendationContext } from '../../services/WorkoutRecommendationEngine';
import TemplateCard from './TemplateCard';
import { useTranslation } from 'react-i18next';

interface RecommendedTemplatesProps {
  recommendations: TemplateRecommendation[];
  templates: TemplateMarketplaceItem[];
  onSelectTemplate: (template: TemplateMarketplaceItem) => void;
  onPreviewTemplate: (templateId: string) => void;
  onInteraction: (templateId: string, action: 'viewed' | 'downloaded' | 'bookmarked' | 'liked') => void;
  currentUserId: string;
  context: RecommendationContext;
}

interface RecommendationGroup {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  recommendations: TemplateRecommendation[];
  templates: TemplateMarketplaceItem[];
}

const REASON_ICONS = {
  similar_users: Users,
  content_similarity: Target,
  seasonal_trend: TrendingUp,
  success_rate: Star,
  team_preference: Users,
} as const;

const CONFIDENCE_COLORS = {
  high: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-gray-100 text-gray-800',
} as const;

export const RecommendedTemplates: React.FC<RecommendedTemplatesProps> = ({
  recommendations,
  templates,
  onSelectTemplate,
  onPreviewTemplate,
  onInteraction,
  currentUserId,
  context
}) => {
  const { t } = useTranslation('physicalTrainer');
  
  // Group recommendations by primary reason
  const recommendationGroups = useMemo((): RecommendationGroup[] => {
    const groups = new Map<string, {
      title: string;
      description: string;
      icon: React.ComponentType<any>;
      color: string;
      items: TemplateRecommendation[];
    }>();
    
    recommendations.forEach(rec => {
      if (rec.reasons.length === 0) return;
      
      const primaryReason = rec.reasons.reduce((max, reason) => 
        reason.weight > max.weight ? reason : max
      );
      
      const key = primaryReason.type;
      if (!groups.has(key)) {
        groups.set(key, {
          title: getReasonTitle(key),
          description: getReasonDescription(key),
          icon: REASON_ICONS[key] || Brain,
          color: getReasonColor(key),
          items: []
        });
      }
      
      groups.get(key)!.items.push(rec);
    });
    
    // Convert to array and add template data
    return Array.from(groups.entries()).map(([key, group]) => ({
      ...group,
      recommendations: group.items.sort((a, b) => b.score - a.score),
      templates: group.items
        .map(rec => templates.find(t => t.id === rec.templateId))
        .filter(Boolean) as TemplateMarketplaceItem[]
    })).filter(group => group.templates.length > 0);
  }, [recommendations, templates]);
  
  const topRecommendations = useMemo(() => {
    return recommendations
      .slice(0, 3)
      .map(rec => ({
        recommendation: rec,
        template: templates.find(t => t.id === rec.templateId)
      }))
      .filter(item => item.template) as Array<{
        recommendation: TemplateRecommendation;
        template: TemplateMarketplaceItem;
      }>;
  }, [recommendations, templates]);
  
  const renderRecommendationExplanation = (recommendation: TemplateRecommendation) => {
    const confidence = getConfidenceLevel(recommendation.confidence);
    const primaryReason = recommendation.reasons.length > 0 
      ? recommendation.reasons.reduce((max, reason) => reason.weight > max.weight ? reason : max)
      : null;
    
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">AI Recommendation</span>
          </div>
          <Badge className={cn('text-xs', CONFIDENCE_COLORS[confidence])}>
            {confidence} confidence
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <span className="text-sm text-muted-foreground">
              Match Score: {Math.round(recommendation.score * 100)}%
            </span>
          </div>
          <Progress value={recommendation.score * 100} className="h-2" />
        </div>
        
        {primaryReason && (
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              {React.createElement(REASON_ICONS[primaryReason.type] || Info, {
                className: "h-4 w-4 text-primary"
              })}
              <span className="font-medium text-sm">
                {getReasonTitle(primaryReason.type)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {primaryReason.description}
            </p>
          </div>
        )}
        
        {recommendation.contextFactors.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Target className="h-4 w-4" />
              Context Factors
            </h4>
            <div className="grid grid-cols-1 gap-1">
              {recommendation.contextFactors.slice(0, 3).map((factor, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <div 
                    className={cn(
                      "w-2 h-2 rounded-full",
                      factor.influence > 0.5 ? "bg-green-500" : 
                      factor.influence > 0 ? "bg-yellow-500" : "bg-red-500"
                    )}
                  ></div>
                  <span className="text-muted-foreground capitalize">
                    {factor.factor.replace('_', ' ')}: {String(factor.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };
  
  const renderTopRecommendations = () => (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Zap className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">{t('recommendations.topPicks')}</h2>
          <p className="text-muted-foreground text-sm">
            {t('recommendations.topPicksDescription')}
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {topRecommendations.map(({ recommendation, template }, index) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-2">
                  <Badge className="bg-primary/10 text-primary">
                    #{index + 1} {t('recommendations.recommended')}
                  </Badge>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent side="left" className="w-80">
                        {renderRecommendationExplanation(recommendation)}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                <CardTitle className="text-lg line-clamp-2">
                  {template.name}
                </CardTitle>
                
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "h-3 w-3",
                          i < Math.floor(template.averageStarRating) 
                            ? "fill-yellow-400 text-yellow-400" 
                            : "text-gray-300"
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {template.averageStarRating.toFixed(1)} ({template.reviewCount})
                  </span>
                </div>
              </CardHeader>
              
              <CardContent>
                <CardDescription className="mb-4 line-clamp-3">
                  {template.description}
                </CardDescription>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{template.duration}min</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {template.difficulty}
                      </Badge>
                    </div>
                    <div className="text-primary font-medium">
                      {Math.round(recommendation.score * 100)}% match
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      onClick={() => onSelectTemplate(template)}
                      className="flex-1"
                      size="sm"
                    >
                      Select Template
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onPreviewTemplate(template.id)}
                    >
                      Preview
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
  
  const renderRecommendationGroup = (group: RecommendationGroup, index: number) => {
    const Icon = group.icon;
    
    return (
      <motion.div
        key={group.title}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className={cn("p-2 rounded-lg", group.color)}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{group.title}</h3>
            <p className="text-muted-foreground text-sm">{group.description}</p>
          </div>
          <Badge variant="outline" className="ml-auto">
            {group.templates.length} templates
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {group.templates.slice(0, 8).map((template) => {
            const recommendation = group.recommendations.find(r => r.templateId === template.id)!;
            
            return (
              <div key={template.id} className="relative">
                <TemplateCard
                  template={template}
                  onSelect={onSelectTemplate}
                  onPreview={onPreviewTemplate}
                  onInteraction={onInteraction}
                  currentUserId={currentUserId}
                  compact={true}
                />
                
                {/* Recommendation overlay */}
                <div className="absolute top-2 right-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge className="bg-primary/90 text-white text-xs">
                          {Math.round(recommendation.score * 100)}%
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="w-80">
                        {renderRecommendationExplanation(recommendation)}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            );
          })}
        </div>
        
        {group.templates.length > 8 && (
          <div className="text-center mt-4">
            <Button variant="outline">
              View All {group.templates.length} Templates
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </motion.div>
    );
  };
  
  const renderContextSummary = () => (
    <Card className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          {t('recommendations.contextTitle')}
        </CardTitle>
        <CardDescription>
          {t('recommendations.contextDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{context.currentSeason}</div>
            <div className="text-xs text-muted-foreground">Season</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{context.playerLevel}</div>
            <div className="text-xs text-muted-foreground">Level</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{context.availableTime}min</div>
            <div className="text-xs text-muted-foreground">Available</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{context.availableEquipment.length}</div>
            <div className="text-xs text-muted-foreground">Equipment</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
  
  if (recommendations.length === 0) {
    return (
      <div className="text-center py-12">
        <Brain className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-xl font-semibold mb-2">
          {t('recommendations.noRecommendations')}
        </h3>
        <p className="text-muted-foreground mb-6">
          {t('recommendations.noRecommendationsDescription')}
        </p>
        <Button>
          <Lightbulb className="h-4 w-4 mr-2" />
          {t('recommendations.exploreTemplates')}
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      {renderContextSummary()}
      {renderTopRecommendations()}
      
      <Separator />
      
      <div>
        <h2 className="text-xl font-bold mb-6">{t('recommendations.allRecommendations')}</h2>
        {recommendationGroups.map(renderRecommendationGroup)}
      </div>
    </div>
  );
};

// Helper functions
function getReasonTitle(type: string): string {
  const titles: Record<string, string> = {
    similar_users: 'Similar Users',
    content_similarity: 'Content Match',
    seasonal_trend: 'Seasonal Picks',
    success_rate: 'Proven Results',
    team_preference: 'Team Favorites',
  };
  return titles[type] || 'Recommended';
}

function getReasonDescription(type: string): string {
  const descriptions: Record<string, string> = {
    similar_users: 'Templates loved by users with similar preferences and training goals',
    content_similarity: 'Templates that match your previous workouts and interests',
    seasonal_trend: 'Templates optimized for the current training season',
    success_rate: 'Templates with the highest effectiveness and completion rates',
    team_preference: 'Templates popular among your team and organization',
  };
  return descriptions[type] || 'AI-powered recommendations based on your profile';
}

function getReasonColor(type: string): string {
  const colors: Record<string, string> = {
    similar_users: 'bg-blue-500',
    content_similarity: 'bg-green-500',
    seasonal_trend: 'bg-purple-500',
    success_rate: 'bg-yellow-500',
    team_preference: 'bg-red-500',
  };
  return colors[type] || 'bg-gray-500';
}

function getConfidenceLevel(confidence: number): 'high' | 'medium' | 'low' {
  if (confidence > 0.7) return 'high';
  if (confidence > 0.4) return 'medium';
  return 'low';
}

export default RecommendedTemplates;