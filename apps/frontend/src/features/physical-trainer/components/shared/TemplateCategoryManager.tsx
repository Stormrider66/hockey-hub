import React, { useState, useMemo, useCallback } from 'react';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  ChevronRight, 
  ChevronDown,
  Folder,
  FolderOpen,
  Settings,
  Download,
  Upload,
  Share2,
  BarChart3,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import {
  TemplateCategory,
  CategoryHierarchy,
  CategoryType,
  CategoryStats,
  CategoryFormData,
  DEFAULT_CATEGORY_COLORS,
  DEFAULT_CATEGORY_ICONS
} from '../../types/template.types';

interface TemplateCategoryManagerProps {
  categories: TemplateCategory[];
  categoryStats?: Map<string, CategoryStats>;
  selectedCategoryIds?: string[];
  onCategorySelect?: (categoryIds: string[]) => void;
  onCategoryCreate?: (category: CategoryFormData) => Promise<void>;
  onCategoryUpdate?: (id: string, category: Partial<TemplateCategory>) => Promise<void>;
  onCategoryDelete?: (id: string) => Promise<void>;
  onImport?: (file: File) => Promise<void>;
  onExport?: () => Promise<void>;
  allowEdit?: boolean;
  multiSelect?: boolean;
}

export const TemplateCategoryManager: React.FC<TemplateCategoryManagerProps> = ({
  categories,
  categoryStats,
  selectedCategoryIds = [],
  onCategorySelect,
  onCategoryCreate,
  onCategoryUpdate,
  onCategoryDelete,
  onImport,
  onExport,
  allowEdit = true,
  multiSelect = true
}) => {
  const { t } = useTranslation(['physicalTrainer']);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [editingCategory, setEditingCategory] = useState<TemplateCategory | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTab, setSelectedTab] = useState<CategoryType>(CategoryType.BY_TYPE);
  const [showStats, setShowStats] = useState(false);

  // Build category hierarchy
  const categoryHierarchy = useMemo(() => {
    const buildHierarchy = (
      cats: TemplateCategory[],
      parentId: string | null = null,
      depth = 0
    ): CategoryHierarchy[] => {
      return cats
        .filter(cat => cat.parentId === parentId)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(cat => ({
          category: cat,
          children: buildHierarchy(cats, cat.id, depth + 1),
          depth,
          path: [] // Would be populated in a real implementation
        }));
    };

    return buildHierarchy(categories);
  }, [categories]);

  // Filter categories by search term
  const filteredHierarchy = useMemo(() => {
    if (!searchTerm) return categoryHierarchy;

    const filterHierarchy = (nodes: CategoryHierarchy[]): CategoryHierarchy[] => {
      return nodes
        .map(node => {
          const matchesSearch = node.category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            node.category.description?.toLowerCase().includes(searchTerm.toLowerCase());
          
          const filteredChildren = filterHierarchy(node.children);
          
          if (matchesSearch || filteredChildren.length > 0) {
            return {
              ...node,
              children: filteredChildren
            };
          }
          
          return null;
        })
        .filter(Boolean) as CategoryHierarchy[];
    };

    return filterHierarchy(categoryHierarchy);
  }, [categoryHierarchy, searchTerm]);

  // Group categories by type
  const categoriesByType = useMemo(() => {
    const grouped = new Map<CategoryType, TemplateCategory[]>();
    
    categories.forEach(cat => {
      // Determine category type based on predefined patterns or custom flag
      let type: CategoryType = CategoryType.CUSTOM;
      
      if (cat.isSystem) {
        if (cat.slug.includes('strength') || cat.slug.includes('conditioning') || 
            cat.slug.includes('hybrid') || cat.slug.includes('agility')) {
          type = CategoryType.BY_TYPE;
        } else if (cat.slug.includes('body') || cat.slug.includes('cardio') || 
                   cat.slug.includes('mobility') || cat.slug.includes('recovery')) {
          type = CategoryType.BY_FOCUS;
        } else if (cat.slug.includes('beginner') || cat.slug.includes('intermediate') || 
                   cat.slug.includes('advanced') || cat.slug.includes('elite')) {
          type = CategoryType.BY_LEVEL;
        } else if (cat.slug.includes('quick') || cat.slug.includes('standard') || 
                   cat.slug.includes('extended')) {
          type = CategoryType.BY_DURATION;
        } else if (cat.slug.includes('season') || cat.slug.includes('playoffs')) {
          type = CategoryType.BY_SEASON;
        }
      }
      
      if (!grouped.has(type)) {
        grouped.set(type, []);
      }
      grouped.get(type)!.push(cat);
    });
    
    return grouped;
  }, [categories]);

  const toggleExpanded = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const handleCategoryToggle = (categoryId: string) => {
    if (!onCategorySelect) return;

    if (multiSelect) {
      const newSelection = selectedCategoryIds.includes(categoryId)
        ? selectedCategoryIds.filter(id => id !== categoryId)
        : [...selectedCategoryIds, categoryId];
      onCategorySelect(newSelection);
    } else {
      onCategorySelect([categoryId]);
    }
  };

  const renderCategoryNode = (node: CategoryHierarchy) => {
    const { category, children } = node;
    const isExpanded = expandedCategories.has(category.id);
    const isSelected = selectedCategoryIds.includes(category.id);
    const stats = categoryStats?.get(category.id);

    return (
      <div key={category.id} className="select-none">
        <div
          className={cn(
            "flex items-center gap-2 p-2 rounded-md hover:bg-muted cursor-pointer",
            isSelected && "bg-primary/10"
          )}
          style={{ paddingLeft: `${node.depth * 20 + 8}px` }}
        >
          {children.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(category.id);
              }}
              className="p-0.5 hover:bg-muted-foreground/10 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          )}
          
          <div
            className="flex items-center gap-2 flex-1"
            onClick={() => handleCategoryToggle(category.id)}
          >
            <div
              className="w-6 h-6 rounded flex items-center justify-center text-sm"
              style={{ backgroundColor: category.color || '#e2e8f0' }}
            >
              {category.icon || <Folder className="h-3 w-3" />}
            </div>
            
            <span className="font-medium">{category.name}</span>
            
            {stats && (
              <Badge variant="secondary" className="ml-auto">
                {stats.templateCount}
              </Badge>
            )}
          </div>

          {allowEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Settings className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setEditingCategory(category)}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                {!category.isSystem && (
                  <DropdownMenuItem
                    onClick={() => onCategoryDelete?.(category.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {isExpanded && children.length > 0 && (
          <div className="ml-2">
            {children.map(child => renderCategoryNode(child))}
          </div>
        )}
      </div>
    );
  };

  const renderCategoryGrid = (cats: TemplateCategory[]) => {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {cats.map(category => {
          const isSelected = selectedCategoryIds.includes(category.id);
          const stats = categoryStats?.get(category.id);

          return (
            <Card
              key={category.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                isSelected && "ring-2 ring-primary"
              )}
              onClick={() => handleCategoryToggle(category.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                    style={{ backgroundColor: category.color || '#e2e8f0' }}
                  >
                    {category.icon || <Folder className="h-5 w-5" />}
                  </div>
                  {allowEdit && !category.isSystem && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Settings className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingCategory(category)}>
                          <Edit2 className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onCategoryDelete?.(category.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                
                <h4 className="font-semibold text-sm mb-1">{category.name}</h4>
                {category.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {category.description}
                  </p>
                )}
                
                {stats && (
                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <span className="text-xs text-muted-foreground">Templates</span>
                    <Badge variant="secondary">{stats.templateCount}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Template Categories</h3>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowStats(!showStats)}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Stats
          </Button>
          
          {allowEdit && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Category
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onImport?.({} as File)}>
                    <Upload className="mr-2 h-4 w-4" />
                    Import Categories
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onExport?.()}>
                    <Download className="mr-2 h-4 w-4" />
                    Export Categories
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share Categories
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Category Display */}
      <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as CategoryType)}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value={CategoryType.BY_TYPE}>Type</TabsTrigger>
          <TabsTrigger value={CategoryType.BY_FOCUS}>Focus</TabsTrigger>
          <TabsTrigger value={CategoryType.BY_LEVEL}>Level</TabsTrigger>
          <TabsTrigger value={CategoryType.BY_DURATION}>Duration</TabsTrigger>
          <TabsTrigger value={CategoryType.BY_SEASON}>Season</TabsTrigger>
          <TabsTrigger value={CategoryType.CUSTOM}>Custom</TabsTrigger>
        </TabsList>

        {Object.values(CategoryType).map(type => (
          <TabsContent key={type} value={type} className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              {type === CategoryType.CUSTOM ? (
                // Show hierarchical view for custom categories
                <div className="space-y-1">
                  {filteredHierarchy
                    .filter(node => !node.category.isSystem)
                    .map(node => renderCategoryNode(node))}
                </div>
              ) : (
                // Show grid view for system categories
                renderCategoryGrid(categoriesByType.get(type) || [])
              )}
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>

      {/* Stats Panel */}
      {showStats && categoryStats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Category Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from(categoryStats.entries())
                .filter(([id]) => selectedCategoryIds.includes(id))
                .map(([id, stats]) => {
                  const category = categories.find(c => c.id === id);
                  if (!category) return null;

                  return (
                    <div key={id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded flex items-center justify-center"
                          style={{ backgroundColor: category.color || '#e2e8f0' }}
                        >
                          {category.icon || <Folder className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="font-medium">{category.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {stats.totalUsage} total uses
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{stats.templateCount}</p>
                        <p className="text-xs text-muted-foreground">templates</p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <CategoryFormDialog
        category={editingCategory}
        categories={categories}
        isOpen={showCreateDialog || !!editingCategory}
        onClose={() => {
          setShowCreateDialog(false);
          setEditingCategory(null);
        }}
        onSubmit={async (data) => {
          if (editingCategory) {
            await onCategoryUpdate?.(editingCategory.id, data);
          } else {
            await onCategoryCreate?.(data);
          }
          setShowCreateDialog(false);
          setEditingCategory(null);
        }}
      />
    </div>
  );
};

// Category Form Dialog Component
interface CategoryFormDialogProps {
  category?: TemplateCategory | null;
  categories: TemplateCategory[];
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CategoryFormData) => Promise<void>;
}

const CategoryFormDialog: React.FC<CategoryFormDialogProps> = ({
  category,
  categories,
  isOpen,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    icon: '',
    color: '#3498db',
    parentId: null,
    isPublic: false,
    sortOrder: 0
  });

  React.useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || '',
        icon: category.icon || '',
        color: category.color || '#3498db',
        parentId: category.parentId,
        isPublic: category.isPublic,
        sortOrder: category.sortOrder
      });
    } else {
      setFormData({
        name: '',
        description: '',
        icon: '',
        color: '#3498db',
        parentId: null,
        isPublic: false,
        sortOrder: 0
      });
    }
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {category ? 'Edit Category' : 'Create New Category'}
          </DialogTitle>
          <DialogDescription>
            {category 
              ? 'Update the category information below'
              : 'Create a new category to organize your workout templates'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Category name"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Icon</label>
              <Input
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="Emoji or icon"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Color</label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-16 h-9 p-1 cursor-pointer"
                />
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="#3498db"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Parent Category</label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.parentId || ''}
              onChange={(e) => setFormData({ ...formData, parentId: e.target.value || null })}
            >
              <option value="">None (Top Level)</option>
              {categories
                .filter(c => c.id !== category?.id)
                .map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPublic"
              checked={formData.isPublic}
              onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
            />
            <label htmlFor="isPublic" className="text-sm">
              Make this category public to other trainers
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {category ? 'Update' : 'Create'} Category
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};