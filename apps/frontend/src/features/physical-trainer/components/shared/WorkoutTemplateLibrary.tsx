import React, { useState, useMemo, useCallback } from 'react';
import {
  Search,
  Grid3x3,
  List,
  Star,
  StarOff,
  Clock,
  Users,
  Filter,
  Plus,
  MoreVertical,
  Copy,
  Edit,
  Trash2,
  Share2,
  Download,
  Tag,
  Dumbbell,
  Activity,
  Zap,
  Target,
  TrendingUp,
  Calendar,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkoutType } from '@/features/physical-trainer/types';
import { useWorkoutTemplates } from '@/features/physical-trainer/hooks/useWorkoutTemplates';
import WorkoutPreview from '../WorkoutPreview';

interface WorkoutTemplate {
  id: string;
  name: string;
  description?: string;
  type: WorkoutType;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'elite';
  duration: number; // minutes
  exercises?: any[];
  intervalProgram?: any;
  hybridProgram?: any;
  agilityProgram?: any;
  equipment: string[];
  tags: string[];
  isFavorite: boolean;
  usageCount: number;
  lastUsed?: string;
  createdAt: string;
  createdBy: string;
  isPublic: boolean;
}

interface WorkoutTemplateLibraryProps {
  workoutType?: WorkoutType;
  onSelectTemplate: (template: WorkoutTemplate) => void;
  onCreateNew?: () => void;
  allowEdit?: boolean;
  allowDelete?: boolean;
  view?: 'grid' | 'list';
}

const WORKOUT_TYPE_ICONS = {
  STRENGTH: Dumbbell,
  CONDITIONING: Activity,
  HYBRID: Zap,
  AGILITY: Target,
};

const DIFFICULTY_COLORS = {
  beginner: 'bg-green-100 text-green-800',
  intermediate: 'bg-yellow-100 text-yellow-800',
  advanced: 'bg-orange-100 text-orange-800',
  elite: 'bg-red-100 text-red-800',
};

const CATEGORIES = {
  STRENGTH: ['Upper Body', 'Lower Body', 'Full Body', 'Core', 'Olympic', 'Powerlifting'],
  CONDITIONING: ['HIIT', 'Steady State', 'Intervals', 'Endurance', 'Sprint', 'Recovery'],
  HYBRID: ['Circuit', 'CrossFit', 'Bootcamp', 'Functional', 'Sport Specific'],
  AGILITY: ['Speed', 'Footwork', 'Reaction', 'Coordination', 'Sport Drills'],
};

export const WorkoutTemplateLibrary: React.FC<WorkoutTemplateLibraryProps> = ({
  workoutType,
  onSelectTemplate,
  onCreateNew,
  allowEdit = true,
  allowDelete = true,
  view: initialView = 'grid',
}) => {
  const [currentView, setCurrentView] = useState<'grid' | 'list'>(initialView);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'alphabetical'>('popular');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedType, setSelectedType] = useState<WorkoutType | 'all'>(workoutType || 'all');
  const [previewTemplate, setPreviewTemplate] = useState<WorkoutTemplate | null>(null);

  const { templates, loading, error, toggleFavorite, deleteTemplate } = useWorkoutTemplates();

  // Filter and sort templates
  const filteredTemplates = useMemo(() => {
    let filtered = templates;

    // Filter by workout type
    if (selectedType !== 'all') {
      filtered = filtered.filter((t) => t.type === selectedType);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query) ||
          t.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }

    // Filter by difficulty
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter((t) => t.difficulty === selectedDifficulty);
    }

    // Filter favorites
    if (showFavoritesOnly) {
      filtered = filtered.filter((t) => t.isFavorite);
    }

    // Sort
    switch (sortBy) {
      case 'popular':
        filtered.sort((a, b) => b.usageCount - a.usageCount);
        break;
      case 'recent':
        filtered.sort((a, b) => {
          const dateA = a.lastUsed ? new Date(a.lastUsed).getTime() : 0;
          const dateB = b.lastUsed ? new Date(b.lastUsed).getTime() : 0;
          return dateB - dateA;
        });
        break;
      case 'alphabetical':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return filtered;
  }, [templates, selectedType, searchQuery, selectedCategory, selectedDifficulty, showFavoritesOnly, sortBy]);

  const handleToggleFavorite = useCallback(
    (templateId: string) => {
      toggleFavorite(templateId);
    },
    [toggleFavorite]
  );

  const handleDeleteTemplate = useCallback(
    (templateId: string) => {
      if (window.confirm('Are you sure you want to delete this template?')) {
        deleteTemplate(templateId);
      }
    },
    [deleteTemplate]
  );

  const renderTemplateCard = (template: WorkoutTemplate) => {
    const Icon = WORKOUT_TYPE_ICONS[template.type];

    return (
      <motion.div
        key={template.id}
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
      >
        <Card
          className="h-full cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => onSelectTemplate(template)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {template.category}
                    </Badge>
                    <Badge className={cn('text-xs', DIFFICULTY_COLORS[template.difficulty])}>
                      {template.difficulty}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleFavorite(template.id);
                  }}
                >
                  {template.isFavorite ? (
                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                  ) : (
                    <StarOff className="h-4 w-4" />
                  )}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewTemplate(template);
                      }}
                    >
                      <Search className="mr-2 h-4 w-4" />
                      Preview
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTemplate(template);
                      }}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Use Template
                    </DropdownMenuItem>
                    {allowEdit && (
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Share2 className="mr-2 h-4 w-4" />
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </DropdownMenuItem>
                    {allowDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTemplate(template.id);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {template.description && (
              <CardDescription className="mb-3 line-clamp-2">
                {template.description}
              </CardDescription>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{template.duration} min</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{template.usageCount} uses</span>
                  </div>
                </div>
                {template.lastUsed && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span className="text-xs">
                            {format(new Date(template.lastUsed), 'MMM d')}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        Last used {format(new Date(template.lastUsed), 'PPP')}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>

              {template.equipment.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  <Tag className="h-3 w-3 text-muted-foreground" />
                  {template.equipment.slice(0, 3).map((eq) => (
                    <Badge key={eq} variant="outline" className="text-xs">
                      {eq}
                    </Badge>
                  ))}
                  {template.equipment.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{template.equipment.length - 3}
                    </Badge>
                  )}
                </div>
              )}

              {template.tags.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  {template.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                  {template.tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{template.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const renderTemplateRow = (template: WorkoutTemplate) => {
    const Icon = WORKOUT_TYPE_ICONS[template.type];

    return (
      <motion.div
        key={template.id}
        layout
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
        className="group"
      >
        <div
          className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
          onClick={() => onSelectTemplate(template)}
        >
          <div className="flex items-center gap-4 flex-1">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold">{template.name}</h4>
                {template.isFavorite && (
                  <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                )}
              </div>
              {template.description && (
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {template.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Badge variant="secondary">{template.category}</Badge>
              <Badge className={cn(DIFFICULTY_COLORS[template.difficulty])}>
                {template.difficulty}
              </Badge>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{template.duration} min</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{template.usageCount}</span>
              </div>
              {template.lastUsed && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{format(new Date(template.lastUsed), 'MMM d')}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleFavorite(template.id);
              }}
            >
              {template.isFavorite ? (
                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
              ) : (
                <StarOff className="h-4 w-4" />
              )}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewTemplate(template);
                  }}
                >
                  <Search className="mr-2 h-4 w-4" />
                  Preview
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectTemplate(template);
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Use Template
                </DropdownMenuItem>
                {allowEdit && (
                  <DropdownMenuItem>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </DropdownMenuItem>
                {allowDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTemplate(template.id);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-destructive mb-4">
          <TrendingUp className="h-12 w-12 mx-auto mb-2" />
          <h3 className="text-lg font-semibold">Error loading templates</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates by name, description, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showFavoritesOnly ? 'default' : 'outline'}
            size="icon"
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          >
            <Star className={cn('h-4 w-4', showFavoritesOnly && 'fill-current')} />
          </Button>
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Popular</SelectItem>
              <SelectItem value="recent">Recent</SelectItem>
              <SelectItem value="alphabetical">A-Z</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center border rounded-lg">
            <Button
              variant={currentView === 'grid' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setCurrentView('grid')}
              className="rounded-r-none"
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={currentView === 'list' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setCurrentView('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          {onCreateNew && (
            <Button onClick={onCreateNew}>
              <Plus className="mr-2 h-4 w-4" />
              Create New
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="lg:w-64">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Workout Type</label>
                <Select
                  value={selectedType}
                  onValueChange={(value: any) => setSelectedType(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="STRENGTH">Strength</SelectItem>
                    <SelectItem value="CONDITIONING">Conditioning</SelectItem>
                    <SelectItem value="HYBRID">Hybrid</SelectItem>
                    <SelectItem value="AGILITY">Agility</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {selectedType !== 'all' &&
                      CATEGORIES[selectedType as WorkoutType]?.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Difficulty</label>
                <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                    <SelectItem value="elite">Elite</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSelectedType(workoutType || 'all');
                  setSelectedCategory('all');
                  setSelectedDifficulty('all');
                  setSearchQuery('');
                  setShowFavoritesOnly(false);
                }}
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Library Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Templates</span>
                  <span className="font-medium">{templates.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Favorites</span>
                  <span className="font-medium">
                    {templates.filter((t) => t.isFavorite).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Most Used</span>
                  <span className="font-medium">
                    {templates.reduce((max, t) => Math.max(max, t.usageCount), 0)} uses
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Template Grid/List */}
        <div className="flex-1">
          {filteredTemplates.length === 0 ? (
            <Card className="p-12">
              <div className="text-center">
                <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No templates found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Try adjusting your search or filters
                </p>
                {onCreateNew && (
                  <Button onClick={onCreateNew}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Template
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            <ScrollArea className="h-[calc(100vh-300px)]">
              <AnimatePresence mode="wait">
                {currentView === 'grid' ? (
                  <motion.div
                    key="grid"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                  >
                    {filteredTemplates.map(renderTemplateCard)}
                  </motion.div>
                ) : (
                  <motion.div
                    key="list"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-2"
                  >
                    {filteredTemplates.map(renderTemplateRow)}
                  </motion.div>
                )}
              </AnimatePresence>
            </ScrollArea>
          )}
        </div>
      </div>

      {/* Template Preview Modal */}
      {previewTemplate && (
        <WorkoutPreview
          workout={{
            type: previewTemplate.type,
            exercises: previewTemplate.exercises,
            intervalProgram: previewTemplate.intervalProgram,
            hybridProgram: previewTemplate.hybridProgram,
            agilityProgram: previewTemplate.agilityProgram,
          }}
          isOpen={!!previewTemplate}
          onClose={() => setPreviewTemplate(null)}
        />
      )}
    </div>
  );
};