import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import {
  TemplateCategoryManager,
  CategorySelector,
  CategoryBadgeGroup,
  CategoryFilter
} from './index';
import { useWorkoutTemplates } from '../../hooks/useWorkoutTemplates';
import type {
  TemplateCategory,
  TemplateSearchOptions,
  CategoryFormData,
  CategoryAssignment
} from '../../types/template.types';

/**
 * Demo component showing how to use the template category management system
 * This can be used as a reference for integrating the category system into other components
 */
export const CategoryManagementDemo: React.FC = () => {
  const { t } = useTranslation(['physicalTrainer']);
  const {
    templates,
    categories,
    categoryStats,
    createCategory,
    updateCategory,
    deleteCategory,
    bulkAssignCategories,
    searchTemplates,
    getFilteredTemplates,
    exportCategories,
    importCategories
  } = useWorkoutTemplates();

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchOptions, setSearchOptions] = useState<TemplateSearchOptions>({
    sortBy: 'name',
    sortOrder: 'asc'
  });

  // Mock saved filters for demo
  const [savedFilters] = useState([
    {
      id: '1',
      name: 'High Intensity Strength',
      description: 'Advanced strength workouts for experienced players',
      searchOptions: {
        type: 'strength' as const,
        difficulty: ['advanced', 'elite'] as const,
        categoryIds: ['type_strength', 'level_advanced']
      },
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Quick Pre-Game',
      description: 'Short conditioning sessions before games',
      searchOptions: {
        type: 'conditioning' as const,
        durationRange: { max: 30 },
        categoryIds: ['type_conditioning', 'duration_quick']
      },
      createdAt: new Date().toISOString()
    }
  ]);

  const handleCategoryCreate = async (categoryData: CategoryFormData) => {
    try {
      await createCategory(categoryData);
      console.log('Category created successfully');
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  };

  const handleCategoryUpdate = async (id: string, updates: Partial<TemplateCategory>) => {
    try {
      await updateCategory(id, updates);
      console.log('Category updated successfully');
    } catch (error) {
      console.error('Failed to update category:', error);
    }
  };

  const handleCategoryDelete = async (id: string) => {
    try {
      await deleteCategory(id);
      console.log('Category deleted successfully');
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  const handleBulkAssign = async () => {
    if (selectedCategories.length === 0) return;

    const assignment: CategoryAssignment = {
      templateIds: templates.slice(0, 3).map(t => t.id), // Demo: assign to first 3 templates
      categoryIds: selectedCategories,
      operation: 'add'
    };

    try {
      await bulkAssignCategories(assignment);
      console.log('Categories assigned successfully');
    } catch (error) {
      console.error('Failed to assign categories:', error);
    }
  };

  const handleExportCategories = async () => {
    try {
      const exportData = await exportCategories();
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'categories-export.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export categories:', error);
    }
  };

  const filteredTemplates = getFilteredTemplates(searchOptions);
  const selectedCategoryObjects = categories.filter(c => selectedCategories.includes(c.id));

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Template Category Management Demo</h1>
        <p className="text-muted-foreground">
          This demo shows how to use the template category management system.
        </p>
      </div>

      <Tabs defaultValue="manager" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="manager">Category Manager</TabsTrigger>
          <TabsTrigger value="selector">Category Selector</TabsTrigger>
          <TabsTrigger value="filter">Category Filter</TabsTrigger>
          <TabsTrigger value="integration">Integration</TabsTrigger>
        </TabsList>

        <TabsContent value="manager" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Template Category Manager</CardTitle>
            </CardHeader>
            <CardContent>
              <TemplateCategoryManager
                categories={categories}
                categoryStats={categoryStats}
                selectedCategoryIds={selectedCategories}
                onCategorySelect={setSelectedCategories}
                onCategoryCreate={handleCategoryCreate}
                onCategoryUpdate={handleCategoryUpdate}
                onCategoryDelete={handleCategoryDelete}
                onExport={handleExportCategories}
                allowEdit={true}
                multiSelect={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="selector" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Category Selector Components</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Default Selector */}
              <div className="space-y-2">
                <h4 className="font-medium">Default Multi-Select</h4>
                <CategorySelector
                  categories={categories}
                  selectedCategoryIds={selectedCategories}
                  onCategoryChange={setSelectedCategories}
                  placeholder="Select categories..."
                  showCounts={true}
                  categoryCounts={new Map(Array.from(categoryStats.entries()).map(([id, stats]) => [id, stats.templateCount]))}
                />
              </div>

              {/* Inline Selector */}
              <div className="space-y-2">
                <h4 className="font-medium">Inline Variant</h4>
                <CategorySelector
                  categories={categories}
                  selectedCategoryIds={selectedCategories}
                  onCategoryChange={setSelectedCategories}
                  variant="inline"
                  showIcons={true}
                />
              </div>

              {/* Compact Selector */}
              <div className="space-y-2">
                <h4 className="font-medium">Compact Variant</h4>
                <CategorySelector
                  categories={categories}
                  selectedCategoryIds={selectedCategories}
                  onCategoryChange={setSelectedCategories}
                  variant="compact"
                />
              </div>

              {/* Badge Group */}
              <div className="space-y-2">
                <h4 className="font-medium">Category Badge Group</h4>
                <CategoryBadgeGroup
                  categories={selectedCategoryObjects}
                  removable={true}
                  maxVisible={3}
                  onCategoryRemove={(category) => {
                    setSelectedCategories(prev => prev.filter(id => id !== category.id));
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="filter" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Category Filter System</CardTitle>
            </CardHeader>
            <CardContent>
              <CategoryFilter
                categories={categories}
                searchOptions={searchOptions}
                onSearchOptionsChange={setSearchOptions}
                totalResults={filteredTemplates.length}
                showQuickFilters={true}
                showSaveFilter={true}
                savedFilters={savedFilters}
                onLoadFilter={(filter) => setSearchOptions(filter.searchOptions)}
              />

              {/* Results Display */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Search Results</h4>
                  <Badge variant="secondary">
                    {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {filteredTemplates.length > 0 ? (
                    filteredTemplates.map(template => (
                      <div key={template.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium">{template.name}</h5>
                            <p className="text-sm text-muted-foreground">
                              {template.type} • {template.duration}min
                            </p>
                          </div>
                          <div className="flex gap-1">
                            {template.categoryIds?.slice(0, 2).map(catId => {
                              const category = categories.find(c => c.id === catId);
                              return category ? (
                                <Badge key={catId} variant="outline" className="text-xs">
                                  {category.icon} {category.name}
                                </Badge>
                              ) : null;
                            })}
                            {(template.categoryIds?.length || 0) > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{(template.categoryIds?.length || 0) - 2}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      No templates match the current filters
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integration Examples</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Bulk Assignment */}
              <div className="space-y-3">
                <h4 className="font-medium">Bulk Category Assignment</h4>
                <p className="text-sm text-muted-foreground">
                  Assign selected categories to the first 3 templates
                </p>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleBulkAssign}
                    disabled={selectedCategories.length === 0}
                  >
                    Assign Categories
                  </Button>
                  <Button variant="outline" onClick={handleExportCategories}>
                    Export Categories
                  </Button>
                </div>
              </div>

              {/* Statistics */}
              <div className="space-y-3">
                <h4 className="font-medium">Category Statistics</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{categories.length}</div>
                    <div className="text-sm text-muted-foreground">Total Categories</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {categories.filter(c => c.isSystem).length}
                    </div>
                    <div className="text-sm text-muted-foreground">System Categories</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {categories.filter(c => !c.isSystem).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Custom Categories</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{templates.length}</div>
                    <div className="text-sm text-muted-foreground">Total Templates</div>
                  </div>
                </div>
              </div>

              {/* Usage Examples */}
              <div className="space-y-3">
                <h4 className="font-medium">Code Examples</h4>
                <div className="bg-muted p-4 rounded-lg text-sm font-mono">
                  <div className="space-y-2">
                    <div>// Import components</div>
                    <div className="text-blue-600">
                      import {`{`} TemplateCategoryManager, CategorySelector {`}`} from './shared';
                    </div>
                    <div className="mt-3">// Use in your component</div>
                    <div className="text-green-600">
                      {`<CategorySelector categories={categories} onCategoryChange={handleChange} />`}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};