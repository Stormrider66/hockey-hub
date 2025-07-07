'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, ChevronRight, X, Plus, FileText } from 'lucide-react';
import SessionTemplates from '../SessionTemplates';
import { useGetTemplatesQuery, useDeleteTemplateMutation } from '@/store/api/trainingApi';
import { mockSessionTemplates } from '../../constants/mockData';
import type { SessionTemplate } from '../../types';

interface TemplatesTabProps {
  onCreateSession: () => void;
  onApplyTemplate: (template: SessionTemplate, date?: Date, time?: string) => void;
}

export default function TemplatesTab({ onCreateSession, onApplyTemplate }: TemplatesTabProps) {
  // Fetch templates from API
  const { data: templates, isLoading: templatesLoading } = useGetTemplatesQuery({});
  const [deleteTemplate] = useDeleteTemplateMutation();
  
  // Use API data if available, otherwise use mock data
  const displayTemplates = templates || mockSessionTemplates;

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await deleteTemplate(templateId).unwrap();
      // Could show success toast here
    } catch (error) {
      console.error('Failed to delete template:', error);
      // Could show error toast here
    }
  };

  return (
    <div className="space-y-6">
      <SessionTemplates onApplyTemplate={onApplyTemplate} />
      
      {/* Legacy template display - can be removed once API is fully integrated */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Legacy Templates</CardTitle>
              <CardDescription>Previous template system (will be migrated)</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {templatesLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading templates...</p>
              </div>
            </div>
          ) : displayTemplates.length === 0 ? (
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No templates created yet</p>
                <Button className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Template
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
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        {templates && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteTemplate(template.id.toString())}
                          >
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Duration</span>
                        <span>{template.duration} min</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Exercises</span>
                        <span>{template.exercises?.length || template.exercises}</span>
                      </div>
                      {template.equipment && template.equipment.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Equipment</span>
                          <span>{template.equipment.length} items</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Last used</span>
                        <span>{template.lastUsed || 'Never'}</span>
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
    </div>
  );
}