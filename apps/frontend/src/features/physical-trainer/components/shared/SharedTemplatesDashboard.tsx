import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Share2, 
  Search, 
  Filter, 
  Eye, 
  Edit3, 
  Copy, 
  Clock,
  User,
  Star,
  TrendingUp,
  Users
} from 'lucide-react';
import { useTemplateSharing } from '../../hooks/useTemplateSharing';
import type { WorkoutTemplate, TemplatePermission } from '../../types/template.types';

interface SharedTemplatesDashboardProps {
  onUseTemplate: (template: WorkoutTemplate) => void;
  onDuplicateTemplate: (template: WorkoutTemplate) => void;
}

const PERMISSION_COLORS = {
  owner: 'bg-red-100 text-red-800',
  collaborator: 'bg-blue-100 text-blue-800',
  viewer: 'bg-green-100 text-green-800',
  link_access: 'bg-purple-100 text-purple-800'
};

const PERMISSION_ICONS = {
  owner: Edit3,
  collaborator: Edit3,
  viewer: Eye,
  link_access: Share2
};

export const SharedTemplatesDashboard: React.FC<SharedTemplatesDashboardProps> = ({
  onUseTemplate,
  onDuplicateTemplate
}) => {
  const { t } = useTranslation(['physicalTrainer']);
  const { getSharedWithMe, trackTemplateUse, loading } = useTemplateSharing();
  
  const [sharedTemplates, setSharedTemplates] = useState<Array<WorkoutTemplate & { 
    sharedBy: string; 
    permission: TemplatePermission;
    sharedAt?: Date;
  }>>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPermission, setSelectedPermission] = useState<string>('all');

  // Load shared templates on mount
  useEffect(() => {
    const loadSharedTemplates = async () => {
      const result = await getSharedWithMe();
      if (result.success && result.templates) {
        setSharedTemplates(result.templates);
      }
    };
    
    loadSharedTemplates();
  }, [getSharedWithMe]);

  // Filter templates based on search and filters
  const filteredTemplates = sharedTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.sharedBy.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesPermission = selectedPermission === 'all' || template.permission === selectedPermission;
    
    return matchesSearch && matchesCategory && matchesPermission;
  });

  const handleUseTemplate = async (template: WorkoutTemplate & { permission: TemplatePermission }) => {
    await trackTemplateUse(template.id, 'use');
    onUseTemplate(template);
  };

  const handleViewTemplate = async (template: WorkoutTemplate) => {
    await trackTemplateUse(template.id, 'view');
    // Could open a preview modal here
  };

  const handleDuplicateTemplate = async (template: WorkoutTemplate) => {
    await trackTemplateUse(template.id, 'duplicate');
    onDuplicateTemplate(template);
  };

  const getPermissionIcon = (permission: TemplatePermission) => {
    const Icon = PERMISSION_ICONS[permission];
    return <Icon className="h-3 w-3" />;
  };

  const categories = Array.from(new Set(sharedTemplates.map(t => t.category)));
  const permissions = Array.from(new Set(sharedTemplates.map(t => t.permission)));

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">{t('templates.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('templates.share.sharedWithMe')}</h2>
          <p className="text-muted-foreground">
            {t('templates.share.sharedWithMeDescription', { count: sharedTemplates.length })}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={t('templates.share.searchShared')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background"
        >
          <option value="all">{t('exercises.categories.all')}</option>
          {categories.map(category => (
            <option key={category} value={category}>
              {t(`exercises.categories.${category}`, category)}
            </option>
          ))}
        </select>

        <select
          value={selectedPermission}
          onChange={(e) => setSelectedPermission(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background"
        >
          <option value="all">{t('templates.share.allPermissions')}</option>
          {permissions.map(permission => (
            <option key={permission} value={permission}>
              {t(`templates.share.permissions.${permission}.title`)}
            </option>
          ))}
        </select>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Share2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('templates.share.noSharedTemplates')}</h3>
              <p className="text-muted-foreground">
                {searchQuery || selectedCategory !== 'all' || selectedPermission !== 'all'
                  ? t('templates.share.noMatchingShared')
                  : t('templates.share.noSharedYet')
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map(template => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1">{template.name}</CardTitle>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {t(`exercises.categories.${template.category}`, template.category)}
                      </Badge>
                      <Badge 
                        className={`text-xs ${PERMISSION_COLORS[template.permission]}`}
                      >
                        {getPermissionIcon(template.permission)}
                        <span className="ml-1">{t(`templates.share.permissions.${template.permission}.title`)}</span>
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm text-muted-foreground">
                      {template.rating?.toFixed(1) || 'N/A'}
                    </span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {template.description}
                </p>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {t('templates.share.sharedBy')}
                    </span>
                    <span className="font-medium">{template.sharedBy}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {t('workouts.parameters.duration')}
                    </span>
                    <span>{template.duration} min</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {t('templates.share.usage')}
                    </span>
                    <span>{template.usageCount} {t('templates.share.uses')}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleUseTemplate(template)}
                    className="flex-1"
                  >
                    {t('templates.share.useTemplate')}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewTemplate(template)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDuplicateTemplate(template)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};