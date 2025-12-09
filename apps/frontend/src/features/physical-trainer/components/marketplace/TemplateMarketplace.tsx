/**
 * TemplateMarketplace Component
 * 
 * Advanced template marketplace with AI-powered recommendations,
 * comprehensive search, filtering, and analytics integration.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Search, 
  Filter, 
  TrendingUp, 
  Star, 
  Download, 
  Eye, 
  Heart, 
  Bookmark,
  Grid3x3,
  List,
  SlidersHorizontal,
  ChevronDown,
  Crown,
  Verified,
  Clock,
  Users,
  Award,
  Zap,
  Target,
  Activity,
  Dumbbell
} from '@/components/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  TemplateMarketplaceItem, 
  TemplateRecommendation,
  WorkoutType 
} from '../../types/template.types';
import WorkoutTemplateAnalytics from '../../services/WorkoutTemplateAnalytics';
import WorkoutRecommendationEngine from '../../services/WorkoutRecommendationEngine';
import TemplateCard from './TemplateCard';
import RecommendedTemplates from './RecommendedTemplates';
import TemplateAnalyticsDashboard from './TemplateAnalyticsDashboard';
import { useTranslation } from 'react-i18next';

interface TemplateMarketplaceProps {
  onSelectTemplate: (template: TemplateMarketplaceItem) => void;
  onPreviewTemplate: (templateId: string) => void;
  currentUserId: string;
  teamId?: string;
  availableEquipment: string[];
  playerLevel: 'beginner' | 'intermediate' | 'advanced' | 'elite';
  currentSeason: 'preseason' | 'inseason' | 'playoffs' | 'offseason';
}

interface MarketplaceFilters {
  categories: string[];
  difficulty: string[];
  duration: { min: number; max: number };
  rating: number;
  equipment: string[];
  price: 'free' | 'premium' | 'all';
  certification: string[];
  sortBy: 'relevance' | 'rating' | 'popularity' | 'newest' | 'price';
}

const WORKOUT_TYPE_ICONS = {
  STRENGTH: Dumbbell,
  CONDITIONING: Activity,
  HYBRID: Zap,
  AGILITY: Target,
} as const;

const CERTIFICATION_LEVELS = {
  basic: { label: 'Basic', color: 'bg-blue-100 text-blue-800' },
  professional: { label: 'Professional', color: 'bg-purple-100 text-purple-800' },
  expert: { label: 'Expert', color: 'bg-gold-100 text-gold-800' },
} as const;

export const TemplateMarketplace: React.FC<TemplateMarketplaceProps> = ({
  onSelectTemplate,
  onPreviewTemplate,
  currentUserId,
  teamId,
  availableEquipment,
  playerLevel,
  currentSeason
}) => {
  const { t } = useTranslation('physicalTrainer');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('browse');
  const [isLoading, setIsLoading] = useState(false);
  const [templates, setTemplates] = useState<TemplateMarketplaceItem[]>([]);
  const [recommendations, setRecommendations] = useState<TemplateRecommendation[]>([]);
  
  // Filters state
  const [filters, setFilters] = useState<MarketplaceFilters>({
    categories: [],
    difficulty: [],
    duration: { min: 0, max: 120 },
    rating: 0,
    equipment: [],
    price: 'all',
    certification: [],
    sortBy: 'relevance'
  });
  
  // Services
  const analytics = WorkoutTemplateAnalytics.getInstance();
  const recommendationEngine = WorkoutRecommendationEngine.getInstance();
  
  // Load initial data
  useEffect(() => {
    loadMarketplaceData();
    loadRecommendations();
  }, [currentUserId, teamId, currentSeason]);
  
  // Load recommendations when filters change
  useEffect(() => {
    if (activeTab === 'recommended') {
      loadRecommendations();
    }
  }, [filters, playerLevel, availableEquipment]);
  
  const loadMarketplaceData = useCallback(async () => {
    setIsLoading(true);
    try {
      // In a real implementation, this would be an API call
      const mockTemplates = generateMockMarketplaceTemplates();
      setTemplates(mockTemplates);
      
      // Initialize recommendation engine with template features
      recommendationEngine.initializeTemplateFeatures(mockTemplates);
    } catch (error) {
      console.error('Failed to load marketplace data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const loadRecommendations = useCallback(async () => {
    try {
      const context = {
        userId: currentUserId,
        teamId,
        currentSeason,
        availableTime: filters.duration.max,
        availableEquipment,
        recentWorkouts: [], // Would come from user's history
        trainingGoals: [], // Would come from user's profile
        playerLevel,
        medicalRestrictions: [] // Would come from medical service
      };
      
      const result = recommendationEngine.getRecommendations(context, { limit: 20 });
      setRecommendations(result.recommendations);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    }
  }, [currentUserId, teamId, currentSeason, filters, playerLevel, availableEquipment]);
  
  // Filter and sort templates
  const filteredTemplates = useMemo(() => {
    let filtered = [...templates];
    
    // Text search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(template => 
        template.name.toLowerCase().includes(query) ||
        template.description?.toLowerCase().includes(query) ||
        template.tags.some(tag => tag.toLowerCase().includes(query)) ||
        template.creatorInfo.name.toLowerCase().includes(query)
      );
    }
    
    // Category filter
    if (filters.categories.length > 0) {
      filtered = filtered.filter(template => 
        template.categoryIds.some(catId => filters.categories.includes(catId))
      );
    }
    
    // Difficulty filter
    if (filters.difficulty.length > 0) {
      filtered = filtered.filter(template => 
        filters.difficulty.includes(template.difficulty)
      );
    }
    
    // Duration filter
    filtered = filtered.filter(template => 
      template.duration >= filters.duration.min && 
      template.duration <= filters.duration.max
    );
    
    // Rating filter
    if (filters.rating > 0) {
      filtered = filtered.filter(template => 
        template.averageStarRating >= filters.rating
      );
    }
    
    // Equipment filter
    if (filters.equipment.length > 0) {
      filtered = filtered.filter(template => 
        filters.equipment.every(eq => template.equipment.includes(eq))
      );
    }
    
    // Price filter
    if (filters.price !== 'all') {
      filtered = filtered.filter(template => 
        filters.price === 'free' ? !template.isPremium : template.isPremium
      );
    }
    
    // Certification filter
    if (filters.certification.length > 0) {
      filtered = filtered.filter(template => 
        template.certificationLevel && filters.certification.includes(template.certificationLevel)
      );
    }
    
    // Sort
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'rating':
          return b.averageStarRating - a.averageStarRating;
        case 'popularity':
          return b.downloadCount - a.downloadCount;
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'price':
          const aPrice = a.price || 0;
          const bPrice = b.price || 0;
          return aPrice - bPrice;
        default: // relevance
          return (b.qualityScore || 0) - (a.qualityScore || 0);
      }
    });
    
    return filtered;
  }, [templates, searchQuery, filters]);
  
  const handleTemplateInteraction = useCallback((
    templateId: string, 
    action: 'viewed' | 'downloaded' | 'bookmarked' | 'liked'
  ) => {
    // Track user interaction for recommendation engine
    let interactionType: 'viewed' | 'started' | 'completed' | 'rated' | 'skipped' = 'viewed';
    
    switch (action) {
      case 'downloaded':
        interactionType = 'started';
        break;
      case 'bookmarked':
      case 'liked':
        interactionType = 'rated';
        break;
    }
    
    recommendationEngine.updateUserInteraction(
      currentUserId,
      templateId,
      interactionType,
      action === 'liked' ? 0.8 : undefined
    );
  }, [currentUserId]);
  
  const updateFilter = useCallback((key: keyof MarketplaceFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);
  
  const clearFilters = useCallback(() => {
    setFilters({
      categories: [],
      difficulty: [],
      duration: { min: 0, max: 120 },
      rating: 0,
      equipment: [],
      price: 'all',
      certification: [],
      sortBy: 'relevance'
    });
    setSearchQuery('');
  }, []);
  
  const renderTemplateGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <AnimatePresence mode="popLayout">
        {filteredTemplates.map((template) => (
          <motion.div
            key={template.id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <TemplateCard
              template={template}
              onSelect={onSelectTemplate}
              onPreview={onPreviewTemplate}
              onInteraction={handleTemplateInteraction}
              currentUserId={currentUserId}
              compact={false}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
  
  const renderTemplateList = () => (
    <div className="space-y-4">
      <AnimatePresence mode="popLayout">
        {filteredTemplates.map((template) => (
          <motion.div
            key={template.id}
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <TemplateCard
              template={template}
              onSelect={onSelectTemplate}
              onPreview={onPreviewTemplate}
              onInteraction={handleTemplateInteraction}
              currentUserId={currentUserId}
              compact={true}
              listView={true}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
  
  const renderFilterSheet = () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          {t('marketplace.filters')}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80">
        <SheetHeader>
          <SheetTitle>{t('marketplace.filterTemplates')}</SheetTitle>
          <SheetDescription>
            {t('marketplace.filterDescription')}
          </SheetDescription>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-120px)] pr-4">
          <div className="space-y-6 mt-6">
            {/* Categories */}
            <div>
              <h4 className="font-semibold mb-3">{t('marketplace.categories')}</h4>
              <div className="space-y-2">
                {['strength', 'conditioning', 'hybrid', 'agility'].map(category => (
                  <label key={category} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filters.categories.includes(category)}
                      onChange={(e) => {
                        const newCategories = e.target.checked
                          ? [...filters.categories, category]
                          : filters.categories.filter(c => c !== category);
                        updateFilter('categories', newCategories);
                      }}
                      className="rounded"
                    />
                    <span className="text-sm capitalize">{category}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Difficulty */}
            <div>
              <h4 className="font-semibold mb-3">{t('marketplace.difficulty')}</h4>
              <div className="space-y-2">
                {['beginner', 'intermediate', 'advanced', 'elite'].map(level => (
                  <label key={level} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filters.difficulty.includes(level)}
                      onChange={(e) => {
                        const newDifficulty = e.target.checked
                          ? [...filters.difficulty, level]
                          : filters.difficulty.filter(d => d !== level);
                        updateFilter('difficulty', newDifficulty);
                      }}
                      className="rounded"
                    />
                    <span className="text-sm capitalize">{level}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Duration */}
            <div>
              <h4 className="font-semibold mb-3">{t('marketplace.duration')}</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-muted-foreground">
                    {t('marketplace.minDuration')}: {filters.duration.min} min
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={120}
                    step={15}
                    value={filters.duration.min}
                    onChange={(e) => updateFilter('duration', {
                      ...filters.duration,
                      min: parseInt(e.target.value)
                    })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">
                    {t('marketplace.maxDuration')}: {filters.duration.max} min
                  </label>
                  <input
                    type="range"
                    min={15}
                    max={180}
                    step={15}
                    value={filters.duration.max}
                    onChange={(e) => updateFilter('duration', {
                      ...filters.duration,
                      max: parseInt(e.target.value)
                    })}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
            
            {/* Rating */}
            <div>
              <h4 className="font-semibold mb-3">{t('marketplace.minimumRating')}</h4>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map(rating => (
                  <Button
                    key={rating}
                    variant={filters.rating >= rating ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateFilter('rating', rating === filters.rating ? 0 : rating)}
                  >
                    <Star className="h-3 w-3" />
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Price */}
            <div>
              <h4 className="font-semibold mb-3">{t('marketplace.price')}</h4>
              <Select
                value={filters.price}
                onValueChange={(value) => updateFilter('price', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('marketplace.allPrices')}</SelectItem>
                  <SelectItem value="free">{t('marketplace.freeOnly')}</SelectItem>
                  <SelectItem value="premium">{t('marketplace.premiumOnly')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Clear Filters */}
            <Button variant="outline" onClick={clearFilters} className="w-full">
              {t('marketplace.clearFilters')}
            </Button>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">{t('marketplace.title')}</h2>
          <p className="text-muted-foreground">
            {t('marketplace.description')}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center border rounded-lg">
            <Button
              variant={view === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('grid')}
              className="rounded-r-none"
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={view === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Sort */}
          <Select
            value={filters.sortBy}
            onValueChange={(value) => updateFilter('sortBy', value)}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">{t('marketplace.sortRelevance')}</SelectItem>
              <SelectItem value="rating">{t('marketplace.sortRating')}</SelectItem>
              <SelectItem value="popularity">{t('marketplace.sortPopularity')}</SelectItem>
              <SelectItem value="newest">{t('marketplace.sortNewest')}</SelectItem>
              <SelectItem value="price">{t('marketplace.sortPrice')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('marketplace.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-2">
          {renderFilterSheet()}
          <Badge variant="secondary" className="px-3">
            {filteredTemplates.length} {t('marketplace.templates')}
          </Badge>
        </div>
      </div>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="browse">{t('marketplace.browse')}</TabsTrigger>
          <TabsTrigger value="recommended">{t('marketplace.recommended')}</TabsTrigger>
          <TabsTrigger value="trending">{t('marketplace.trending')}</TabsTrigger>
          <TabsTrigger value="analytics">{t('marketplace.analytics')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="browse" className="mt-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <Card className="p-12">
              <div className="text-center">
                <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">
                  {t('marketplace.noTemplatesFound')}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {t('marketplace.tryAdjustingFilters')}
                </p>
                <Button onClick={clearFilters}>
                  {t('marketplace.clearFilters')}
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-6">
              {view === 'grid' ? renderTemplateGrid() : renderTemplateList()}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="recommended" className="mt-6">
          <RecommendedTemplates
            recommendations={recommendations}
            templates={templates}
            onSelectTemplate={onSelectTemplate}
            onPreviewTemplate={onPreviewTemplate}
            onInteraction={handleTemplateInteraction}
            currentUserId={currentUserId}
            context={{
              userId: currentUserId,
              teamId,
              currentSeason,
              availableTime: filters.duration.max,
              availableEquipment,
              recentWorkouts: [],
              trainingGoals: [],
              playerLevel,
              medicalRestrictions: []
            }}
          />
        </TabsContent>
        
        <TabsContent value="trending" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates
              .sort((a, b) => b.socialMetrics.likes - a.socialMetrics.likes)
              .slice(0, 12)
              .map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onSelect={onSelectTemplate}
                  onPreview={onPreviewTemplate}
                  onInteraction={handleTemplateInteraction}
                  currentUserId={currentUserId}
                  showTrendingBadge={true}
                />
              ))}
          </div>
        </TabsContent>
        
        <TabsContent value="analytics" className="mt-6">
          <TemplateAnalyticsDashboard
            templates={templates}
            recommendations={recommendations}
            currentUserId={currentUserId}
            teamId={teamId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Mock data generator
function generateMockMarketplaceTemplates(): TemplateMarketplaceItem[] {
  const types: WorkoutType['type'][] = ['STRENGTH', 'CONDITIONING', 'HYBRID', 'AGILITY'];
  const difficulties = ['beginner', 'intermediate', 'advanced', 'elite'] as const;
  const certifications = ['basic', 'professional', 'expert'] as const;
  
  return Array.from({ length: 50 }, (_, i) => {
    const type = types[i % types.length];
    const difficulty = difficulties[i % difficulties.length];
    const isPremium = Math.random() > 0.7;
    const rating = 3 + Math.random() * 2; // 3-5 rating
    
    return {
      id: `template-${i + 1}`,
      name: `${type.charAt(0) + type.slice(1).toLowerCase()} Workout ${i + 1}`,
      description: `A comprehensive ${type.toLowerCase()} workout designed for ${difficulty} level athletes. Features proven exercises and progressive difficulty.`,
      type: type as WorkoutType,
      categoryIds: [type.toLowerCase()],
      tags: [`${type.toLowerCase()}`, difficulty, 'hockey', 'fitness'],
      duration: 30 + (i % 6) * 15, // 30-105 minutes
      difficulty,
      equipment: ['dumbbells', 'barbell', 'bench'].slice(0, (i % 3) + 1),
      usageCount: Math.floor(Math.random() * 1000),
      averageRating: rating / 10,
      isPublic: true,
      createdBy: `creator-${(i % 10) + 1}`,
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      workoutData: {},
      
      // Marketplace-specific fields
      downloadCount: Math.floor(Math.random() * 500),
      reviewCount: Math.floor(Math.random() * 100),
      averageStarRating: rating,
      isPremium,
      price: isPremium ? 5 + Math.floor(Math.random() * 15) : undefined,
      
      creatorInfo: {
        name: `Coach ${String.fromCharCode(65 + (i % 26))}`,
        verified: Math.random() > 0.5,
        totalTemplates: Math.floor(Math.random() * 50) + 5,
        averageRating: 3.5 + Math.random() * 1.5
      },
      
      socialMetrics: {
        likes: Math.floor(Math.random() * 200),
        bookmarks: Math.floor(Math.random() * 150),
        shares: Math.floor(Math.random() * 50),
        comments: Math.floor(Math.random() * 75)
      },
      
      qualityScore: 60 + Math.floor(Math.random() * 40), // 60-100
      certificationLevel: certifications[i % certifications.length],
      officialApproval: Math.random() > 0.8
    } as TemplateMarketplaceItem;
  });
}

export default TemplateMarketplace;