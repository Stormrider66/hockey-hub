import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { 
  useGetSessionTemplatesQuery,
  useCreateSessionTemplateMutation,
  useUpdateSessionTemplateMutation,
  useDeleteSessionTemplateMutation,
  useDuplicateSessionTemplateMutation,
  useGetPopularSessionTemplatesQuery
} from '@/store/api/trainingApi';
import type { 
  SessionTemplate, 
  WorkoutSession,
  Exercise,
  WorkoutType
} from '../types';
import type { IntervalProgram } from '../types/conditioning.types';
import type { HybridProgram } from '../types/hybrid.types';
import type { AgilityProgram } from '../types/agility.types';
import type {
  TemplateCategory,
  WorkoutTemplate,
  TemplateMetadata,
  TemplateSearchOptions,
  CategoryFormData,
  CategoryAssignment,
  CategoryStats,
  DEFAULT_CATEGORY_COLORS,
  DEFAULT_CATEGORY_ICONS
} from '../types/template.types';

export type WorkoutTemplateType = 'strength' | 'conditioning' | 'hybrid' | 'agility';

// Legacy interface for backward compatibility
export interface LegacyWorkoutTemplate {
  id: string;
  name: string;
  description?: string;
  type: WorkoutTemplateType;
  category: string;
  data: SessionTemplate | IntervalProgram | HybridProgram | AgilityProgram;
  tags?: string[];
  isPublic: boolean;
  isFavorite?: boolean;
  usageCount: number;
  lastUsed?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  teamId?: string;
  userId?: string;
  version?: number;
}

export interface UseWorkoutTemplatesOptions {
  workoutType?: WorkoutTemplateType;
  teamId?: string;
  userId?: string;
  enableCaching?: boolean;
}

export interface UseWorkoutTemplatesReturn {
  // State
  templates: WorkoutTemplate[];
  recentTemplates: WorkoutTemplate[];
  favoriteTemplates: WorkoutTemplate[];
  popularTemplates: WorkoutTemplate[];
  categories: TemplateCategory[];
  categoryStats: Map<string, CategoryStats>;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadTemplates: (searchOptions?: TemplateSearchOptions) => Promise<void>;
  saveTemplate: (template: Partial<WorkoutTemplate>) => Promise<WorkoutTemplate>;
  updateTemplate: (id: string, updates: Partial<WorkoutTemplate>) => Promise<WorkoutTemplate>;
  deleteTemplate: (id: string) => Promise<void>;
  favoriteTemplate: (id: string, favorite: boolean) => Promise<void>;
  
  // Category Management
  createCategory: (category: CategoryFormData) => Promise<TemplateCategory>;
  updateCategory: (id: string, updates: Partial<TemplateCategory>) => Promise<TemplateCategory>;
  deleteCategory: (id: string) => Promise<void>;
  bulkAssignCategories: (assignment: CategoryAssignment) => Promise<void>;
  getByCategory: (categoryId: string) => WorkoutTemplate[];
  filterByCategory: (categoryIds: string[]) => WorkoutTemplate[];
  getCategoryHierarchy: () => TemplateCategory[];
  initializePredefinedCategories: () => Promise<void>;
  
  // Search and Filtering
  searchTemplates: (searchOptions: TemplateSearchOptions) => WorkoutTemplate[];
  getFilteredTemplates: (searchOptions: TemplateSearchOptions) => WorkoutTemplate[];
  
  // Utils
  getTemplatePreview: (id: string) => string;
  duplicateTemplate: (id: string, newName: string) => Promise<WorkoutTemplate>;
  exportTemplate: (id: string) => Promise<string>;
  importTemplate: (data: string) => Promise<WorkoutTemplate>;
  exportCategories: () => Promise<string>;
  importCategories: (data: string) => Promise<void>;
  getTemplateRecommendations: (context: RecommendationContext) => WorkoutTemplate[];
  
  // Template creation from current workout
  createFromWorkout: (workout: WorkoutSession | any, name: string, description?: string) => Promise<WorkoutTemplate>;
  
  // Legacy support
  searchTemplatesLegacy: (query: string) => WorkoutTemplate[];
  createCategoryLegacy: (name: string, icon?: string) => Promise<TemplateCategory>;
}

export interface TemplateFilters {
  search?: string;
  category?: string;
  type?: WorkoutTemplateType;
  visibility?: 'personal' | 'team' | 'public';
  tags?: string[];
  createdBy?: string;
  page?: number;
  limit?: number;
}

export interface RecommendationContext {
  playerPositions?: string[];
  teamLevel?: string;
  season?: 'preseason' | 'regular' | 'playoffs' | 'offseason';
  previousWorkouts?: string[];
  targetDuration?: number;
  equipment?: string[];
}

const CACHE_KEY = 'workout_templates_cache';
const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours
const RECENT_TEMPLATES_KEY = 'recent_workout_templates';
const FAVORITE_TEMPLATES_KEY = 'favorite_workout_templates';
const MAX_RECENT_TEMPLATES = 10;

export function useWorkoutTemplates(options: UseWorkoutTemplatesOptions = {}): UseWorkoutTemplatesReturn {
  const {
    workoutType,
    teamId,
    userId,
    enableCaching = true
  } = options;
  
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(state => state.auth.user);
  
  // State
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [recentTemplates, setRecentTemplates] = useState<WorkoutTemplate[]>([]);
  const [favoriteTemplates, setFavoriteTemplates] = useState<WorkoutTemplate[]>([]);
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [categoryStats, setCategoryStats] = useState<Map<string, CategoryStats>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // API hooks
  const { data: templatesData, isLoading: templatesLoading, error: templatesError } = useGetSessionTemplatesQuery({
    type: workoutType,
    teamId,
    createdBy: userId
  });
  
  const { data: popularData } = useGetPopularSessionTemplatesQuery({ limit: 10 });
  
  const [createTemplateMutation] = useCreateSessionTemplateMutation();
  const [updateTemplateMutation] = useUpdateSessionTemplateMutation();
  const [deleteTemplateMutation] = useDeleteSessionTemplateMutation();
  const [duplicateTemplateMutation] = useDuplicateSessionTemplateMutation();
  
  // Load templates from cache on mount
  useEffect(() => {
    if (enableCaching) {
      loadFromCache();
    }
    loadRecentTemplates();
    loadFavoriteTemplates();
    initializePredefinedCategories();
  }, [enableCaching]);
  
  // Update templates when API data changes
  useEffect(() => {
    if (templatesData?.data) {
      const mappedTemplates = mapApiTemplates(templatesData.data);
      setTemplates(mappedTemplates);
      updateCategories(mappedTemplates);
      
      if (enableCaching) {
        saveToCache(mappedTemplates);
      }
    }
  }, [templatesData, enableCaching]);
  
  // Helper functions
  const loadFromCache = useCallback(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          setTemplates(data);
          updateCategories(data);
        }
      }
    } catch (err) {
      console.error('Failed to load templates from cache:', err);
    }
  }, []);
  
  const saveToCache = useCallback((data: WorkoutTemplate[]) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (err) {
      console.error('Failed to save templates to cache:', err);
    }
  }, []);
  
  const loadRecentTemplates = useCallback(() => {
    try {
      const saved = localStorage.getItem(RECENT_TEMPLATES_KEY);
      if (saved) {
        setRecentTemplates(JSON.parse(saved));
      }
    } catch (err) {
      console.error('Failed to load recent templates:', err);
    }
  }, []);
  
  const loadFavoriteTemplates = useCallback(() => {
    try {
      const saved = localStorage.getItem(FAVORITE_TEMPLATES_KEY);
      if (saved) {
        setFavoriteTemplates(JSON.parse(saved));
      }
    } catch (err) {
      console.error('Failed to load favorite templates:', err);
    }
  }, []);
  
  const updateRecentTemplates = useCallback((template: WorkoutTemplate) => {
    setRecentTemplates(prev => {
      const filtered = prev.filter(t => t.id !== template.id);
      const updated = [template, ...filtered].slice(0, MAX_RECENT_TEMPLATES);
      localStorage.setItem(RECENT_TEMPLATES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);
  
  // Initialize predefined categories
  const initializePredefinedCategories = useCallback(async () => {
    try {
      const predefinedCategories: TemplateCategory[] = [
        // By Type
        {
          id: 'type_strength',
          name: 'Strength',
          slug: 'strength',
          description: 'Resistance training and weightlifting exercises',
          icon: DEFAULT_CATEGORY_ICONS.strength,
          color: DEFAULT_CATEGORY_COLORS.strength,
          parentId: null,
          isSystem: true,
          isActive: true,
          sortOrder: 1,
          isPublic: true,
          createdBy: 'system',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'type_conditioning',
          name: 'Conditioning',
          slug: 'conditioning',
          description: 'Cardiovascular and endurance training',
          icon: DEFAULT_CATEGORY_ICONS.conditioning,
          color: DEFAULT_CATEGORY_COLORS.conditioning,
          parentId: null,
          isSystem: true,
          isActive: true,
          sortOrder: 2,
          isPublic: true,
          createdBy: 'system',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'type_hybrid',
          name: 'Hybrid',
          slug: 'hybrid',
          description: 'Combined strength and conditioning workouts',
          icon: DEFAULT_CATEGORY_ICONS.hybrid,
          color: DEFAULT_CATEGORY_COLORS.hybrid,
          parentId: null,
          isSystem: true,
          isActive: true,
          sortOrder: 3,
          isPublic: true,
          createdBy: 'system',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'type_agility',
          name: 'Agility',
          slug: 'agility',
          description: 'Speed, agility, and coordination drills',
          icon: DEFAULT_CATEGORY_ICONS.agility,
          color: DEFAULT_CATEGORY_COLORS.agility,
          parentId: null,
          isSystem: true,
          isActive: true,
          sortOrder: 4,
          isPublic: true,
          createdBy: 'system',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        // By Focus
        {
          id: 'focus_upper_body',
          name: 'Upper Body',
          slug: 'upperbody',
          description: 'Exercises targeting chest, shoulders, arms, and back',
          icon: DEFAULT_CATEGORY_ICONS.upperBody,
          color: DEFAULT_CATEGORY_COLORS.upperBody,
          parentId: null,
          isSystem: true,
          isActive: true,
          sortOrder: 10,
          isPublic: true,
          createdBy: 'system',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'focus_lower_body',
          name: 'Lower Body',
          slug: 'lowerbody',
          description: 'Exercises targeting legs, glutes, and hips',
          icon: DEFAULT_CATEGORY_ICONS.lowerBody,
          color: DEFAULT_CATEGORY_COLORS.lowerBody,
          parentId: null,
          isSystem: true,
          isActive: true,
          sortOrder: 11,
          isPublic: true,
          createdBy: 'system',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'focus_core',
          name: 'Core',
          slug: 'core',
          description: 'Abdominal and core stability exercises',
          icon: DEFAULT_CATEGORY_ICONS.core,
          color: DEFAULT_CATEGORY_COLORS.core,
          parentId: null,
          isSystem: true,
          isActive: true,
          sortOrder: 12,
          isPublic: true,
          createdBy: 'system',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'focus_full_body',
          name: 'Full Body',
          slug: 'fullbody',
          description: 'Compound exercises targeting multiple muscle groups',
          icon: DEFAULT_CATEGORY_ICONS.fullBody,
          color: DEFAULT_CATEGORY_COLORS.fullBody,
          parentId: null,
          isSystem: true,
          isActive: true,
          sortOrder: 13,
          isPublic: true,
          createdBy: 'system',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        // By Level
        {
          id: 'level_beginner',
          name: 'Beginner',
          slug: 'beginner',
          description: 'Entry-level workouts for new athletes',
          icon: DEFAULT_CATEGORY_ICONS.beginner,
          color: DEFAULT_CATEGORY_COLORS.beginner,
          parentId: null,
          isSystem: true,
          isActive: true,
          sortOrder: 20,
          isPublic: true,
          createdBy: 'system',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'level_intermediate',
          name: 'Intermediate',
          slug: 'intermediate',
          description: 'Moderate difficulty for developing athletes',
          icon: DEFAULT_CATEGORY_ICONS.intermediate,
          color: DEFAULT_CATEGORY_COLORS.intermediate,
          parentId: null,
          isSystem: true,
          isActive: true,
          sortOrder: 21,
          isPublic: true,
          createdBy: 'system',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'level_advanced',
          name: 'Advanced',
          slug: 'advanced',
          description: 'High-intensity workouts for experienced athletes',
          icon: DEFAULT_CATEGORY_ICONS.advanced,
          color: DEFAULT_CATEGORY_COLORS.advanced,
          parentId: null,
          isSystem: true,
          isActive: true,
          sortOrder: 22,
          isPublic: true,
          createdBy: 'system',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'level_elite',
          name: 'Elite',
          slug: 'elite',
          description: 'Professional-level training for elite athletes',
          icon: DEFAULT_CATEGORY_ICONS.elite,
          color: DEFAULT_CATEGORY_COLORS.elite,
          parentId: null,
          isSystem: true,
          isActive: true,
          sortOrder: 23,
          isPublic: true,
          createdBy: 'system',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        // By Duration
        {
          id: 'duration_quick',
          name: 'Quick (15-30min)',
          slug: 'quick',
          description: 'Short duration workouts for busy schedules',
          icon: DEFAULT_CATEGORY_ICONS.quick,
          color: DEFAULT_CATEGORY_COLORS.quick,
          parentId: null,
          isSystem: true,
          isActive: true,
          sortOrder: 30,
          isPublic: true,
          createdBy: 'system',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'duration_standard',
          name: 'Standard (30-60min)',
          slug: 'standard',
          description: 'Regular length training sessions',
          icon: DEFAULT_CATEGORY_ICONS.standard,
          color: DEFAULT_CATEGORY_COLORS.standard,
          parentId: null,
          isSystem: true,
          isActive: true,
          sortOrder: 31,
          isPublic: true,
          createdBy: 'system',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'duration_extended',
          name: 'Extended (60min+)',
          slug: 'extended',
          description: 'Long duration intensive training',
          icon: DEFAULT_CATEGORY_ICONS.extended,
          color: DEFAULT_CATEGORY_COLORS.extended,
          parentId: null,
          isSystem: true,
          isActive: true,
          sortOrder: 32,
          isPublic: true,
          createdBy: 'system',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        // By Season
        {
          id: 'season_preseason',
          name: 'Pre-season',
          slug: 'preseason',
          description: 'Preparation phase before the competitive season',
          icon: DEFAULT_CATEGORY_ICONS.preseason,
          color: DEFAULT_CATEGORY_COLORS.preseason,
          parentId: null,
          isSystem: true,
          isActive: true,
          sortOrder: 40,
          isPublic: true,
          createdBy: 'system',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'season_inseason',
          name: 'In-season',
          slug: 'inseason',
          description: 'Maintenance training during competitive season',
          icon: DEFAULT_CATEGORY_ICONS.inseason,
          color: DEFAULT_CATEGORY_COLORS.inseason,
          parentId: null,
          isSystem: true,
          isActive: true,
          sortOrder: 41,
          isPublic: true,
          createdBy: 'system',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'season_offseason',
          name: 'Off-season',
          slug: 'offseason',
          description: 'Recovery and base building after season',
          icon: DEFAULT_CATEGORY_ICONS.offseason,
          color: DEFAULT_CATEGORY_COLORS.offseason,
          parentId: null,
          isSystem: true,
          isActive: true,
          sortOrder: 42,
          isPublic: true,
          createdBy: 'system',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'season_playoffs',
          name: 'Playoffs',
          slug: 'playoffs',
          description: 'Peak performance training for playoffs',
          icon: DEFAULT_CATEGORY_ICONS.playoffs,
          color: DEFAULT_CATEGORY_COLORS.playoffs,
          parentId: null,
          isSystem: true,
          isActive: true,
          sortOrder: 43,
          isPublic: true,
          createdBy: 'system',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      setCategories(prev => {
        // Only add categories that don't already exist
        const existingIds = new Set(prev.map(c => c.id));
        const newCategories = predefinedCategories.filter(c => !existingIds.has(c.id));
        return [...prev, ...newCategories];
      });
      
      updateCategoryStats([...templates]);
    } catch (err) {
      console.error('Failed to initialize predefined categories:', err);
    }
  }, [templates]);

  const updateCategories = useCallback((templates: WorkoutTemplate[]) => {
    // Legacy function for backward compatibility
    const categoryMap = new Map<string, number>();
    
    templates.forEach(template => {
      if (template.categoryIds) {
        template.categoryIds.forEach(categoryId => {
          const count = categoryMap.get(categoryId) || 0;
          categoryMap.set(categoryId, count + 1);
        });
      }
    });
    
    updateCategoryStats(templates);
  }, []);

  const updateCategoryStats = useCallback((templates: WorkoutTemplate[]) => {
    const statsMap = new Map<string, CategoryStats>();
    
    categories.forEach(category => {
      const categoryTemplates = templates.filter(t => 
        t.categoryIds?.includes(category.id) || 
        (t as any).category === category.name // Legacy support
      );
      
      const totalUsage = categoryTemplates.reduce((sum, t) => sum + (t.usageCount || 0), 0);
      const ratings = categoryTemplates.filter(t => t.averageRating).map(t => t.averageRating!);
      const averageRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;
      
      const topTemplates = categoryTemplates
        .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
        .slice(0, 5)
        .map(t => ({
          templateId: t.id,
          name: t.name,
          usageCount: t.usageCount || 0,
          rating: t.averageRating || 0
        }));

      statsMap.set(category.id, {
        categoryId: category.id,
        templateCount: categoryTemplates.length,
        totalUsage,
        averageRating,
        lastUsed: categoryTemplates
          .filter(t => t.lastUsed)
          .sort((a, b) => new Date(b.lastUsed!).getTime() - new Date(a.lastUsed!).getTime())[0]?.lastUsed,
        topTemplates
      });
    });
    
    setCategoryStats(statsMap);
  }, [categories]);

  // Category Management Functions
  const createCategory = useCallback(async (categoryData: CategoryFormData): Promise<TemplateCategory> => {
    try {
      const newCategory: TemplateCategory = {
        id: `custom_${Date.now()}`,
        name: categoryData.name,
        slug: categoryData.name.toLowerCase().replace(/\s+/g, '_'),
        description: categoryData.description,
        icon: categoryData.icon,
        color: categoryData.color,
        parentId: categoryData.parentId,
        isSystem: false,
        isActive: true,
        sortOrder: categoryData.sortOrder || categories.length + 1,
        isPublic: categoryData.isPublic,
        createdBy: currentUser?.id || 'unknown',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setCategories(prev => [...prev, newCategory]);
      updateCategoryStats(templates);
      
      return newCategory;
    } catch (err) {
      throw new Error('Failed to create category');
    }
  }, [categories, templates, currentUser]);

  const updateCategory = useCallback(async (id: string, updates: Partial<TemplateCategory>): Promise<TemplateCategory> => {
    try {
      const updatedCategory = categories.find(c => c.id === id);
      if (!updatedCategory) {
        throw new Error('Category not found');
      }

      const newCategory = {
        ...updatedCategory,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      setCategories(prev => prev.map(c => c.id === id ? newCategory : c));
      updateCategoryStats(templates);
      
      return newCategory;
    } catch (err) {
      throw new Error('Failed to update category');
    }
  }, [categories, templates]);

  const deleteCategory = useCallback(async (id: string): Promise<void> => {
    try {
      const category = categories.find(c => c.id === id);
      if (!category) {
        throw new Error('Category not found');
      }

      if (category.isSystem) {
        throw new Error('Cannot delete system categories');
      }

      // Remove category from all templates
      setTemplates(prev => prev.map(template => ({
        ...template,
        categoryIds: template.categoryIds?.filter(cId => cId !== id) || []
      })));

      setCategories(prev => prev.filter(c => c.id !== id));
      updateCategoryStats(templates);
    } catch (err) {
      throw new Error('Failed to delete category');
    }
  }, [categories, templates]);

  const bulkAssignCategories = useCallback(async (assignment: CategoryAssignment): Promise<void> => {
    try {
      setTemplates(prev => prev.map(template => {
        if (!assignment.templateIds.includes(template.id)) return template;

        let newCategoryIds = template.categoryIds || [];

        switch (assignment.operation) {
          case 'add':
            assignment.categoryIds.forEach(catId => {
              if (!newCategoryIds.includes(catId)) {
                newCategoryIds.push(catId);
              }
            });
            break;
          case 'remove':
            newCategoryIds = newCategoryIds.filter(catId => !assignment.categoryIds.includes(catId));
            break;
          case 'replace':
            newCategoryIds = [...assignment.categoryIds];
            break;
        }

        return {
          ...template,
          categoryIds: newCategoryIds
        };
      }));

      updateCategoryStats(templates);
    } catch (err) {
      throw new Error('Failed to bulk assign categories');
    }
  }, [templates]);

  const getCategoryHierarchy = useCallback((): TemplateCategory[] => {
    return categories
      .filter(c => !c.parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [categories]);

  const exportCategories = useCallback(async (): Promise<string> => {
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      categories: categories.filter(c => !c.isSystem), // Only export custom categories
      hierarchy: getCategoryHierarchy()
    };

    return JSON.stringify(exportData, null, 2);
  }, [categories, getCategoryHierarchy]);

  const importCategories = useCallback(async (data: string): Promise<void> => {
    try {
      const parsed = JSON.parse(data);
      
      if (!parsed.categories || !Array.isArray(parsed.categories)) {
        throw new Error('Invalid category export format');
      }

      const importedCategories = parsed.categories.map((cat: any) => ({
        ...cat,
        id: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: currentUser?.id || 'imported'
      }));

      setCategories(prev => [...prev, ...importedCategories]);
      updateCategoryStats(templates);
    } catch (err) {
      throw new Error('Failed to import categories');
    }
  }, [templates, currentUser]);
  
  const mapApiTemplates = useCallback((apiTemplates: SessionTemplate[]): WorkoutTemplate[] => {
    return apiTemplates.map(template => ({
      id: template.id?.toString() || '',
      name: template.name,
      description: template.description,
      type: determineTemplateType(template),
      category: template.category,
      data: template,
      tags: template.tags || [],
      isPublic: template.isPublic || false,
      isFavorite: favoriteTemplates.some(f => f.id === template.id?.toString()),
      usageCount: template.usageCount || 0,
      lastUsed: template.lastUsed,
      createdBy: template.createdBy || template.author,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
      teamId,
      userId: template.createdBy
    }));
  }, [favoriteTemplates, teamId]);
  
  const determineTemplateType = (template: SessionTemplate): WorkoutTemplateType => {
    // Logic to determine template type based on content
    if (template.type === 'cardio' || template.type === 'mixed') {
      // Check if it has interval program data
      return 'conditioning';
    }
    // Add more sophisticated type detection as needed
    return 'strength';
  };
  
  // Enhanced search and filtering
  const searchTemplates = useCallback((searchOptions: TemplateSearchOptions): WorkoutTemplate[] => {
    return getFilteredTemplates(searchOptions);
  }, []);

  const getFilteredTemplates = useCallback((searchOptions: TemplateSearchOptions): WorkoutTemplate[] => {
    let filtered = [...templates];

    // Text search
    if (searchOptions.query) {
      const query = searchOptions.query.toLowerCase();
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(query) ||
        template.description?.toLowerCase().includes(query) ||
        template.tags?.some(tag => tag.toLowerCase().includes(query)) ||
        template.keywords?.some(keyword => keyword.toLowerCase().includes(query))
      );
    }

    // Filter by workout type
    if (searchOptions.type) {
      filtered = filtered.filter(template => template.type === searchOptions.type);
    }

    // Filter by categories
    if (searchOptions.categoryIds && searchOptions.categoryIds.length > 0) {
      filtered = filtered.filter(template =>
        template.categoryIds?.some(catId => searchOptions.categoryIds!.includes(catId)) ||
        // Legacy support
        (template as any).category && searchOptions.categoryIds!.some(catId => {
          const category = categories.find(c => c.id === catId);
          return category?.name === (template as any).category;
        })
      );
    }

    // Filter by tags
    if (searchOptions.tags && searchOptions.tags.length > 0) {
      filtered = filtered.filter(template =>
        template.tags?.some(tag => searchOptions.tags!.includes(tag))
      );
    }

    // Filter by difficulty
    if (searchOptions.difficulty && searchOptions.difficulty.length > 0) {
      filtered = filtered.filter(template =>
        searchOptions.difficulty!.includes(template.difficulty)
      );
    }

    // Filter by duration range
    if (searchOptions.durationRange) {
      const { min, max } = searchOptions.durationRange;
      filtered = filtered.filter(template => {
        const duration = template.duration;
        if (min !== undefined && duration < min) return false;
        if (max !== undefined && duration > max) return false;
        return true;
      });
    }

    // Filter by equipment
    if (searchOptions.equipment && searchOptions.equipment.length > 0) {
      filtered = filtered.filter(template =>
        searchOptions.equipment!.every(eq => template.equipment.includes(eq))
      );
    }

    // Filter by visibility
    if (searchOptions.isPublic !== undefined) {
      filtered = filtered.filter(template => template.isPublic === searchOptions.isPublic);
    }

    // Filter by creator
    if (searchOptions.createdBy) {
      filtered = filtered.filter(template => template.createdBy === searchOptions.createdBy);
    }

    // Sort results
    const sortBy = searchOptions.sortBy || 'name';
    const sortOrder = searchOptions.sortOrder || 'asc';

    filtered.sort((a, b) => {
      let valueA: any, valueB: any;

      switch (sortBy) {
        case 'name':
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
          break;
        case 'usageCount':
          valueA = a.usageCount || 0;
          valueB = b.usageCount || 0;
          break;
        case 'rating':
          valueA = a.averageRating || 0;
          valueB = b.averageRating || 0;
          break;
        case 'lastUsed':
          valueA = a.lastUsed ? new Date(a.lastUsed).getTime() : 0;
          valueB = b.lastUsed ? new Date(b.lastUsed).getTime() : 0;
          break;
        case 'created':
          valueA = new Date(a.createdAt).getTime();
          valueB = new Date(b.createdAt).getTime();
          break;
        default:
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
      }

      if (sortOrder === 'desc') {
        return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
      } else {
        return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
      }
    });

    return filtered;
  }, [templates, categories]);

  // Actions
  const loadTemplates = useCallback(async (searchOptions?: TemplateSearchOptions) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // This would trigger a refetch with new filters
      // For now, we rely on the query hook
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
      setIsLoading(false);
    }
  }, []);
  
  const saveTemplate = useCallback(async (template: Partial<WorkoutTemplate>): Promise<WorkoutTemplate> => {
    try {
      const result = await createTemplateMutation({
        name: template.name!,
        description: template.description,
        type: template.type as any,
        category: template.category!,
        exercises: template.type === 'strength' ? (template.data as SessionTemplate).exercises : [],
        duration: 60, // Calculate from template data
        equipment: [],
        tags: template.tags,
        isPublic: template.isPublic
      }).unwrap();
      
      const newTemplate: WorkoutTemplate = {
        ...template,
        id: result.id?.toString() || '',
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
        usageCount: 0
      } as WorkoutTemplate;
      
      setTemplates(prev => [...prev, newTemplate]);
      updateRecentTemplates(newTemplate);
      
      return newTemplate;
    } catch (err) {
      throw new Error('Failed to save template');
    }
  }, [createTemplateMutation, updateRecentTemplates]);
  
  const updateTemplate = useCallback(async (id: string, updates: Partial<WorkoutTemplate>): Promise<WorkoutTemplate> => {
    try {
      const result = await updateTemplateMutation({
        id,
        data: {
          name: updates.name,
          description: updates.description,
          category: updates.category,
          tags: updates.tags,
          isPublic: updates.isPublic
        }
      }).unwrap();
      
      const updatedTemplate = templates.find(t => t.id === id)!;
      const newTemplate = { ...updatedTemplate, ...updates, updatedAt: new Date().toISOString() };
      
      setTemplates(prev => prev.map(t => t.id === id ? newTemplate : t));
      
      return newTemplate;
    } catch (err) {
      throw new Error('Failed to update template');
    }
  }, [templates, updateTemplateMutation]);
  
  const deleteTemplate = useCallback(async (id: string) => {
    try {
      await deleteTemplateMutation(id).unwrap();
      setTemplates(prev => prev.filter(t => t.id !== id));
      setRecentTemplates(prev => prev.filter(t => t.id !== id));
      setFavoriteTemplates(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      throw new Error('Failed to delete template');
    }
  }, [deleteTemplateMutation]);
  
  const favoriteTemplate = useCallback(async (id: string, favorite: boolean) => {
    const template = templates.find(t => t.id === id);
    if (!template) return;
    
    template.isFavorite = favorite;
    
    setFavoriteTemplates(prev => {
      const updated = favorite 
        ? [...prev, template]
        : prev.filter(t => t.id !== id);
      
      localStorage.setItem(FAVORITE_TEMPLATES_KEY, JSON.stringify(updated));
      return updated;
    });
    
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, isFavorite: favorite } : t));
  }, [templates]);
  
  const duplicateTemplate = useCallback(async (id: string, newName: string): Promise<WorkoutTemplate> => {
    try {
      const result = await duplicateTemplateMutation({ id, name: newName }).unwrap();
      const original = templates.find(t => t.id === id)!;
      
      const duplicated: WorkoutTemplate = {
        ...original,
        id: result.id?.toString() || '',
        name: newName,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
        usageCount: 0,
        lastUsed: undefined
      };
      
      setTemplates(prev => [...prev, duplicated]);
      
      return duplicated;
    } catch (err) {
      throw new Error('Failed to duplicate template');
    }
  }, [templates, duplicateTemplateMutation]);
  
  // Category filter functions
  const getByCategory = useCallback((categoryId: string): WorkoutTemplate[] => {
    return templates.filter(t => 
      t.categoryIds?.includes(categoryId) ||
      // Legacy support
      (t as any).category === categories.find(c => c.id === categoryId)?.name
    );
  }, [templates, categories]);

  const filterByCategory = useCallback((categoryIds: string[]): WorkoutTemplate[] => {
    if (categoryIds.length === 0) return templates;
    
    return templates.filter(t =>
      t.categoryIds?.some(catId => categoryIds.includes(catId)) ||
      // Legacy support
      (t as any).category && categoryIds.some(catId => {
        const category = categories.find(c => c.id === catId);
        return category?.name === (t as any).category;
      })
    );
  }, [templates, categories]);

  // Legacy support functions
  const searchTemplatesLegacy = useCallback((query: string): WorkoutTemplate[] => {
    const lowercaseQuery = query.toLowerCase();
    
    return templates.filter(template => 
      template.name.toLowerCase().includes(lowercaseQuery) ||
      template.description?.toLowerCase().includes(lowercaseQuery) ||
      template.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
      (template as any).category?.toLowerCase().includes(lowercaseQuery)
    );
  }, [templates]);

  const createCategoryLegacy = useCallback(async (name: string, icon?: string): Promise<TemplateCategory> => {
    return await createCategory({
      name,
      icon,
      isPublic: false
    });
  }, [createCategory]);
  
  // Utility functions
  
  const getTemplatePreview = useCallback((id: string): string => {
    const template = templates.find(t => t.id === id);
    if (!template) return '';
    
    switch (template.type) {
      case 'strength':
        const strengthData = template.data as SessionTemplate;
        return `${strengthData.exercises.length} exercises, ${strengthData.duration} min`;
      
      case 'conditioning':
        const conditioningData = template.data as IntervalProgram;
        return `${conditioningData.intervals.length} intervals, ${Math.round(conditioningData.totalDuration / 60)} min`;
      
      case 'hybrid':
        const hybridData = template.data as HybridProgram;
        return `${hybridData.blocks.length} blocks, ${Math.round(hybridData.totalDuration / 60)} min`;
      
      case 'agility':
        const agilityData = template.data as AgilityProgram;
        return `${agilityData.drills.length} drills, ${Math.round(agilityData.totalDuration / 60)} min`;
      
      default:
        return template.description || '';
    }
  }, [templates]);
  
  const exportTemplate = useCallback(async (id: string): Promise<string> => {
    const template = templates.find(t => t.id === id);
    if (!template) throw new Error('Template not found');
    
    const exportData = {
      version: '1.0',
      type: 'hockey_hub_workout_template',
      template: {
        ...template,
        id: undefined, // Remove ID for export
        createdAt: undefined,
        updatedAt: undefined,
        userId: undefined,
        teamId: undefined
      }
    };
    
    return JSON.stringify(exportData, null, 2);
  }, [templates]);
  
  const importTemplate = useCallback(async (data: string): Promise<WorkoutTemplate> => {
    try {
      const parsed = JSON.parse(data);
      
      if (parsed.type !== 'hockey_hub_workout_template') {
        throw new Error('Invalid template format');
      }
      
      const imported = parsed.template;
      return await saveTemplate({
        ...imported,
        name: `${imported.name} (Imported)`,
        isPublic: false
      });
    } catch (err) {
      throw new Error('Failed to import template');
    }
  }, [saveTemplate]);
  
  const getTemplateRecommendations = useCallback((context: RecommendationContext): WorkoutTemplate[] => {
    let recommendations = [...templates];
    
    // Filter by equipment availability
    if (context.equipment && context.equipment.length > 0) {
      recommendations = recommendations.filter(template => {
        if (template.type === 'strength') {
          const data = template.data as SessionTemplate;
          return data.equipment.every(eq => context.equipment!.includes(eq));
        }
        return true;
      });
    }
    
    // Filter by duration
    if (context.targetDuration) {
      recommendations = recommendations.filter(template => {
        const duration = getTemplateDuration(template);
        return Math.abs(duration - context.targetDuration!) <= 15; // Within 15 minutes
      });
    }
    
    // Sort by relevance
    recommendations.sort((a, b) => {
      // Prioritize recently used
      if (a.lastUsed && b.lastUsed) {
        return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime();
      }
      
      // Then by usage count
      return b.usageCount - a.usageCount;
    });
    
    return recommendations.slice(0, 5);
  }, [templates]);
  
  const getTemplateDuration = (template: WorkoutTemplate): number => {
    switch (template.type) {
      case 'strength':
        return (template.data as SessionTemplate).duration;
      case 'conditioning':
        return Math.round((template.data as IntervalProgram).totalDuration / 60);
      case 'hybrid':
        return Math.round((template.data as HybridProgram).totalDuration / 60);
      case 'agility':
        return Math.round((template.data as AgilityProgram).totalDuration / 60);
      default:
        return 60;
    }
  };
  
  const createFromWorkout = useCallback(async (
    workout: WorkoutSession | any,
    name: string,
    description?: string
  ): Promise<WorkoutTemplate> => {
    // Extract template data based on workout type
    let templateData: any;
    let templateType: WorkoutTemplateType = 'strength';
    
    if ('intervalProgram' in workout) {
      templateData = workout.intervalProgram;
      templateType = 'conditioning';
    } else if ('hybridProgram' in workout) {
      templateData = workout.hybridProgram;
      templateType = 'hybrid';
    } else if ('agilityProgram' in workout) {
      templateData = workout.agilityProgram;
      templateType = 'agility';
    } else {
      // Default strength workout
      templateData = {
        name,
        description,
        type: workout.type,
        category: 'Custom',
        exercises: workout.exercises || [],
        duration: workout.estimatedDuration || 60,
        equipment: workout.equipment || [],
        difficulty: 'intermediate'
      };
    }
    
    return await saveTemplate({
      name,
      description,
      type: templateType,
      category: 'Custom',
      data: templateData,
      tags: ['from_workout'],
      isPublic: false
    });
  }, [saveTemplate]);
  
  // Memoized values
  const popularTemplates = useMemo(() => {
    if (popularData && Array.isArray(popularData)) {
      return mapApiTemplates(popularData);
    }
    return [];
  }, [popularData, mapApiTemplates]);
  
  return {
    // State
    templates,
    recentTemplates,
    favoriteTemplates,
    popularTemplates,
    categories,
    categoryStats,
    isLoading: isLoading || templatesLoading,
    error: error || (templatesError ? 'Failed to load templates' : null),
    
    // Actions
    loadTemplates,
    saveTemplate,
    updateTemplate,
    deleteTemplate,
    favoriteTemplate,
    
    // Category Management
    createCategory,
    updateCategory,
    deleteCategory,
    bulkAssignCategories,
    getByCategory,
    filterByCategory,
    getCategoryHierarchy,
    initializePredefinedCategories,
    
    // Search and Filtering
    searchTemplates,
    getFilteredTemplates,
    
    // Utils
    getTemplatePreview,
    duplicateTemplate,
    exportTemplate,
    importTemplate,
    exportCategories,
    importCategories,
    getTemplateRecommendations,
    
    // Template creation from current workout
    createFromWorkout,
    
    // Legacy support
    searchTemplatesLegacy,
    createCategoryLegacy
  };
}