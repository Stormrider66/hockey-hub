'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, ChevronRight, X, Plus, FileText, Users, Share2, Library, Inbox } from 'lucide-react';
import SessionTemplates from '../SessionTemplates';
import { useGetTemplatesQuery, useDeleteTemplateMutation } from '@/store/api/trainingApi';
import { mockSessionTemplates } from '../../constants/mockData';
import type { SessionTemplate } from '../../types';
import type { WorkoutTemplate } from '../../types/template.types';
import BulkTemplateAssignment from '../BulkTemplateAssignment';
import { TemplateShareModal } from '../shared/TemplateShareModal';
import { TemplateNotifications } from '../shared/TemplateNotifications';
import { SharedTemplatesDashboard } from '../shared/SharedTemplatesDashboard';
import { toast } from 'react-hot-toast';

interface TemplatesTabProps {
  onCreateSession: () => void;
  onApplyTemplate: (template: SessionTemplate, date?: Date, time?: string) => void;
}

export default function TemplatesTab({ onCreateSession, onApplyTemplate }: TemplatesTabProps) {
  const { t } = useTranslation(['physicalTrainer', 'common']);
  // Fetch templates from API
  const { data: templates, isLoading: templatesLoading } = useGetTemplatesQuery({});
  const [deleteTemplate] = useDeleteTemplateMutation();
  
  // State for bulk assignment
  const [bulkAssignmentOpen, setBulkAssignmentOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<SessionTemplate | null>(null);
  
  // State for template sharing
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [templateToShare, setTemplateToShare] = useState<WorkoutTemplate | null>(null);
  
  // State for active tab
  const [activeTab, setActiveTab] = useState('my-templates');
  
  // Use API data - templates might be wrapped in a response object
  const displayTemplates = Array.isArray(templates) 
    ? templates 
    : Array.isArray(templates?.data) 
      ? templates.data 
      : Array.isArray(templates?.templates) 
        ? templates.templates 
        : [];

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await deleteTemplate(templateId).unwrap();
      toast.success(t('physicalTrainer:templates.deleteSuccess'));
    } catch (error) {
      console.error('Failed to delete template:', error);
      toast.error(t('physicalTrainer:templates.deleteError'));
    }
  };

  const handleBulkAssign = (template: SessionTemplate) => {
    setSelectedTemplate(template);
    setBulkAssignmentOpen(true);
  };

  const handleBulkAssignSuccess = (result: { created: number; errors: any[] }) => {
    setBulkAssignmentOpen(false);
    setSelectedTemplate(null);
  };

  const handleShareTemplate = (template: SessionTemplate) => {
    // Convert SessionTemplate to WorkoutTemplate format for sharing
    const workoutTemplate: WorkoutTemplate = {
      id: template.id.toString(),
      name: template.name,
      description: template.description || '',
      category: template.category || 'general',
      tags: template.tags || [],
      exercises: Array.isArray(template.exercises) ? template.exercises : [],
      createdBy: 'current_user',
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: false,
      usageCount: 0,
      rating: 0,
      type: 'strength', // Default type
      categoryIds: [],
      duration: template.duration || 60,
      difficulty: 'intermediate',
      equipment: template.equipment || [],
      version: 1,
      workoutData: template
    };
    
    setTemplateToShare(workoutTemplate);
    setShareModalOpen(true);
  };

  const handleAcceptShare = (notification: any) => {
    toast.success(t('physicalTrainer:templates.share.notifications.accepted'));
    // Could trigger a refetch of shared templates or add to local state
  };

  const handleDeclineShare = (notification: any) => {
    toast.info(t('physicalTrainer:templates.share.notifications.declined'));
  };

  const handleUseSharedTemplate = (template: WorkoutTemplate) => {
    // Convert WorkoutTemplate back to SessionTemplate for onApplyTemplate
    const sessionTemplate: SessionTemplate = {
      id: parseInt(template.id),
      name: template.name,
      description: template.description,
      category: template.category,
      duration: template.duration,
      exercises: template.exercises,
      equipment: template.equipment,
      tags: template.tags
    };
    
    onApplyTemplate(sessionTemplate);
    toast.success(t('physicalTrainer:templates.share.templateApplied', { name: template.name }));
  };

  const handleDuplicateSharedTemplate = (template: WorkoutTemplate) => {
    // Logic to duplicate the template to user's own templates
    toast.success(t('physicalTrainer:templates.share.templateDuplicated', { name: template.name }));
  };

  return (
    <div className="space-y-6">
      {/* Template Sharing Notifications */}
      <TemplateNotifications
        onAcceptShare={handleAcceptShare}
        onDeclineShare={handleDeclineShare}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="my-templates" className="flex items-center gap-2">
            <Library className="h-4 w-4" />
            {t('physicalTrainer:templates.myTemplates')}
          </TabsTrigger>
          <TabsTrigger value="shared-with-me" className="flex items-center gap-2">
            <Inbox className="h-4 w-4" />
            {t('physicalTrainer:templates.share.sharedWithMe')}
          </TabsTrigger>
          <TabsTrigger value="legacy" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {t('physicalTrainer:templates.legacyTitle')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-templates" className="space-y-4">
          <SessionTemplates onApplyTemplate={onApplyTemplate} />
        </TabsContent>

        <TabsContent value="shared-with-me" className="space-y-4">
          <SharedTemplatesDashboard
            onUseTemplate={handleUseSharedTemplate}
            onDuplicateTemplate={handleDuplicateSharedTemplate}
          />
        </TabsContent>

        <TabsContent value="legacy" className="space-y-4">
          {/* Legacy template display - can be removed once API is fully integrated */}
          <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{t('physicalTrainer:templates.legacyTitle')}</CardTitle>
              <CardDescription>{t('physicalTrainer:templates.legacySubtitle')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {templatesLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">{t('physicalTrainer:templates.loading')}</p>
              </div>
            </div>
          ) : displayTemplates.length === 0 ? (
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">{t('physicalTrainer:templates.noTemplates')}</p>
                <Button className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('physicalTrainer:templates.createFirst')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {displayTemplates.map(template => (
                <Card key={template.id} className="hover:bg-accent/50 transition-colors">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold">{template.name}</h3>
                        <Badge variant="outline" className="mt-1">{template.category}</Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            // Use template to create new session
                            onCreateSession();
                            // Could pre-populate form with template data
                          }}
                          title={t('physicalTrainer:templates.createSingleSession')}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleBulkAssign(template)}
                          title={t('physicalTrainer:templates.bulkAssignTitle')}
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleShareTemplate(template)}
                          title={t('physicalTrainer:templates.share.title')}
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title={t('common:actions.viewDetails')}>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        {templates && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteTemplate(template.id.toString())}
                            title={t('physicalTrainer:templates.deleteTemplate')}
                          >
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('physicalTrainer:workouts.parameters.duration')}</span>
                        <span>{template.duration} min</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('physicalTrainer:tabs.exercises')}</span>
                        <span>{template.exercises?.length || template.exercises}</span>
                      </div>
                      {template.equipment && template.equipment.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('physicalTrainer:exercises.equipment')}</span>
                          <span>{template.equipment.length} {t('physicalTrainer:templates.items')}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('physicalTrainer:templates.lastUsed')}</span>
                        <span>{template.lastUsed || t('physicalTrainer:templates.never')}</span>
                      </div>
                    </div>
                    
                    {template.description && (
                      <p className="text-xs text-muted-foreground mt-3 line-clamp-2">
                        {template.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>

      {/* Bulk Assignment Modal */}
      {selectedTemplate && (
        <BulkTemplateAssignment
          templateId={selectedTemplate.id.toString()}
          templateName={selectedTemplate.name}
          open={bulkAssignmentOpen}
          onOpenChange={setBulkAssignmentOpen}
          onSuccess={handleBulkAssignSuccess}
        />
      )}

      {/* Template Share Modal */}
      {templateToShare && (
        <TemplateShareModal
          template={templateToShare}
          isOpen={shareModalOpen}
          onClose={() => {
            setShareModalOpen(false);
            setTemplateToShare(null);
          }}
        />
      )}
    </div>
  );
}