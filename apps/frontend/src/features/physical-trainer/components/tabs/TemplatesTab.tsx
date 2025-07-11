'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, ChevronRight, X, Plus, FileText, Users } from 'lucide-react';
import SessionTemplates from '../SessionTemplates';
import { useGetTemplatesQuery, useDeleteTemplateMutation } from '@/store/api/trainingApi';
import { mockSessionTemplates } from '../../constants/mockData';
import type { SessionTemplate } from '../../types';
import BulkTemplateAssignment from '../BulkTemplateAssignment';
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
  
  // Use API data
  const displayTemplates = templates || [];

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

  return (
    <div className="space-y-6">
      <SessionTemplates onApplyTemplate={onApplyTemplate} />
      
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
    </div>
  );
}