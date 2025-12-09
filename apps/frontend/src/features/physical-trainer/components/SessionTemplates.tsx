'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  FileText,
  Clock,
  Users,
  Dumbbell,
  Heart,
  Zap,
  Plus,
  Edit2,
  Copy,
  Trash2,
  Calendar,
  Download,
  Upload
} from 'lucide-react';
import { format } from 'date-fns';
import { useGetSessionTemplatesQuery, useDeleteSessionTemplateMutation, useDuplicateSessionTemplateMutation } from '@/store/api/trainingApi';
import { toast } from 'react-hot-toast';
import TemplateCreationModal from './TemplateCreationModal';
import { exportTemplates, importTemplates, ExportOptions } from '../utils/dataExportImport';
import { ReportExporter } from './ReportExporter';
import { DataMigrationModal } from './DataMigrationModal';

export interface SessionTemplate {
  id: string;
  name: string;
  description: string;
  type: 'strength' | 'cardio' | 'recovery' | 'mixed';
  duration: number; // minutes
  targetPlayers: 'all' | 'forwards' | 'defense' | 'goalies';
  exercises: {
    name: string;
    duration: number;
    intensity: 'low' | 'medium' | 'high';
  }[];
  createdBy: string;
  lastUsed?: string;
  useCount: number;
}

interface SessionTemplatesProps {
  onApplyTemplate: (template: SessionTemplate, date?: Date, time?: string) => void;
  onEditTemplate?: (template: SessionTemplate) => void;
}

// Mock templates data
const mockTemplates: SessionTemplate[] = [
  {
    id: '1',
    name: 'Morning Strength Session',
    description: 'Full body strength workout focusing on power development',
    type: 'strength',
    duration: 90,
    targetPlayers: 'all',
    exercises: [
      { name: 'Warm-up', duration: 15, intensity: 'low' },
      { name: 'Power Cleans', duration: 20, intensity: 'high' },
      { name: 'Squats', duration: 20, intensity: 'high' },
      { name: 'Core Circuit', duration: 15, intensity: 'medium' },
      { name: 'Cool Down', duration: 10, intensity: 'low' },
    ],
    createdBy: 'John Smith',
    lastUsed: new Date(Date.now() - 86400000 * 2).toISOString(),
    useCount: 45,
  },
  {
    id: '2',
    name: 'Pre-Game Activation',
    description: 'Light activation session for game day preparation',
    type: 'recovery',
    duration: 45,
    targetPlayers: 'all',
    exercises: [
      { name: 'Dynamic Stretching', duration: 10, intensity: 'low' },
      { name: 'Band Work', duration: 10, intensity: 'low' },
      { name: 'Movement Patterns', duration: 15, intensity: 'medium' },
      { name: 'Foam Rolling', duration: 10, intensity: 'low' },
    ],
    createdBy: 'John Smith',
    lastUsed: new Date(Date.now() - 86400000).toISOString(),
    useCount: 120,
  },
  {
    id: '3',
    name: 'HIIT Cardio Circuit',
    description: 'High-intensity interval training for conditioning',
    type: 'cardio',
    duration: 60,
    targetPlayers: 'all',
    exercises: [
      { name: 'Warm-up', duration: 10, intensity: 'low' },
      { name: 'Sprint Intervals', duration: 20, intensity: 'high' },
      { name: 'Battle Ropes', duration: 15, intensity: 'high' },
      { name: 'Recovery', duration: 15, intensity: 'low' },
    ],
    createdBy: 'John Smith',
    useCount: 67,
  },
];

export const SessionTemplates: React.FC<SessionTemplatesProps> = ({
  onApplyTemplate,
  onEditTemplate,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<SessionTemplate | null>(null);
  const [showQuickSchedule, setShowQuickSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'strength' | 'cardio' | 'recovery' | 'mixed'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [templateToEdit, setTemplateToEdit] = useState<SessionTemplate | null>(null);
  const [templateToDuplicate, setTemplateToDuplicate] = useState<SessionTemplate | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  
  // Fetch templates from API
  const { data: templatesResponse, isLoading, refetch } = useGetSessionTemplatesQuery({
    type: filterType !== 'all' ? filterType : undefined,
    search: searchTerm,
    limit: 50
  });
  
  const [deleteTemplate, { isLoading: isDeleting }] = useDeleteSessionTemplateMutation();
  const [duplicateTemplate] = useDuplicateSessionTemplateMutation();
  
  const templates = templatesResponse?.data || mockTemplates;

  const filteredTemplates = templates; // Already filtered by the API based on searchTerm and filterType

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'strength':
        return <Dumbbell className="w-4 h-4" />;
      case 'cardio':
        return <Heart className="w-4 h-4" />;
      case 'recovery':
        return <Zap className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'strength':
        return 'bg-blue-500';
      case 'cardio':
        return 'bg-red-500';
      case 'recovery':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleQuickSchedule = () => {
    if (selectedTemplate && scheduleDate) {
      const date = new Date(scheduleDate);
      onApplyTemplate(selectedTemplate, date, scheduleTime);
      setShowQuickSchedule(false);
      setSelectedTemplate(null);
    }
  };

  const handleCreateTemplate = () => {
    setTemplateToEdit(null);
    setTemplateToDuplicate(null);
    setShowCreateModal(true);
  };

  const handleEditTemplate = (template: SessionTemplate) => {
    setTemplateToEdit(template);
    setTemplateToDuplicate(null);
    setShowCreateModal(true);
  };

  const handleDuplicateTemplate = async (template: SessionTemplate) => {
    try {
      const duplicatedName = `${template.name} (Copy)`;
      const result = await duplicateTemplate({
        id: template.id,
        name: duplicatedName
      }).unwrap();
      toast.success(`Template "${duplicatedName}" created successfully`);
      refetch();
    } catch (error) {
      console.error('Failed to duplicate template:', error);
      toast.error('Failed to duplicate template');
    }
  };

  const handleTemplateCreated = () => {
    setShowCreateModal(false);
    setTemplateToEdit(null);
    setTemplateToDuplicate(null);
    refetch();
  };

  const handleExportTemplates = async (options: ExportOptions) => {
    try {
      let templatesToExport = templates;
      
      // Filter by type if not 'all'
      if (filterType !== 'all') {
        templatesToExport = templatesToExport.filter(t => t.type === filterType);
      }
      
      // Filter by search term
      if (searchTerm) {
        templatesToExport = templatesToExport.filter(t => 
          t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      await exportTemplates(templatesToExport, options);
      toast.success('Templates exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export templates');
    }
  };

  const handleImportTemplates = async (dataType: string, data: any[], options: any) => {
    try {
      const result = await importTemplates(data[0], templates);
      
      if (result.success && result.data) {
        // TODO: Create templates via API
        toast.success(`Successfully imported ${result.data.length} templates`);
        
        if (result.duplicates && result.duplicates.length > 0) {
          toast('Skipped ' + result.duplicates.length + ' duplicate templates', {
            icon: '⚠️',
          });
        }
        
        refetch();
      }
      
      setShowImportModal(false);
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import templates');
    }
  };

  return (
    <>
      <Card className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Session Templates</h3>
            <div className="flex gap-2">
              <ReportExporter
                data={templates}
                dataType="test"
                onExport={handleExportTemplates}
              />
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setShowImportModal(true)}
              >
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
              <Button size="sm" variant="outline" onClick={handleCreateTemplate}>
                <Plus className="w-4 h-4 mr-2" />
                Create Template
              </Button>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-2">
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Select value={filterType} onValueChange={(v) => setFilterType(v as typeof filterType)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="strength">Strength</SelectItem>
                <SelectItem value="cardio">Cardio</SelectItem>
                <SelectItem value="recovery">Recovery</SelectItem>
                <SelectItem value="mixed">Mixed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Template List */}
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {filteredTemplates.map((template) => (
                <Card
                  key={template.id}
                  className="p-3 hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => setSelectedTemplate(template)}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded ${getTypeColor(template.type)} text-white`}>
                          {getTypeIcon(template.type)}
                        </div>
                        <h4 className="font-medium">{template.name}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {template.duration} min
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center">
                          <Users className="w-3 h-3 mr-1" />
                          {template.targetPlayers}
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          Used {template.useCount} times
                        </span>
                        {template.lastUsed && (
                          <span>
                            Last: {format(new Date(template.lastUsed), 'MMM d')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTemplate(template);
                          setShowQuickSchedule(true);
                        }}
                      >
                        <Calendar className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateTemplate(template);
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditTemplate(template);
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (confirm('Are you sure you want to delete this template?')) {
                            try {
                              await deleteTemplate(template.id).unwrap();
                              toast.success('Template deleted successfully');
                              refetch();
                            } catch (error) {
                              toast.error('Failed to delete template');
                            }
                          }
                        }}
                        disabled={isDeleting}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      </Card>

      {/* Quick Schedule Dialog */}
      <Dialog open={showQuickSchedule} onOpenChange={setShowQuickSchedule}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quick Schedule Session</DialogTitle>
            <DialogDescription>
              Schedule "{selectedTemplate?.name}" for a specific date and time.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuickSchedule(false)}>
              Cancel
            </Button>
            <Button onClick={handleQuickSchedule}>
              Schedule Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Creation Modal */}
      <TemplateCreationModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setTemplateToEdit(null);
          setTemplateToDuplicate(null);
        }}
        templateToEdit={templateToEdit}
        templateToDuplicate={templateToDuplicate}
        onSuccess={handleTemplateCreated}
      />

      {/* Data Migration Modal */}
      {showImportModal && (
        <DataMigrationModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onImport={handleImportTemplates}
        />
      )}
    </>
  );
};

export default SessionTemplates;