'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { Label } from '@/components/ui/label';
import {
  Snowflake,
  Clock,
  Users,
  Target,
  Plus,
  Edit2,
  Copy,
  Trash2,
  Calendar,
  Trophy,
  Shield,
  Zap,
  Heart,
  Brain,
  FileText,
  Star,
} from 'lucide-react';
import { format } from 'date-fns';
import { PracticePlan } from './PracticePlanBuilder';

interface PracticeTemplatesProps {
  onApplyTemplate: (template: PracticePlan, date?: Date, time?: string) => void;
}

// Mock practice templates
const mockPracticeTemplates: PracticePlan[] = [
  {
    id: 'pt1',
    name: 'Pre-Game Practice',
    duration: 60,
    objectives: ['System review', 'Power play setup', 'Light conditioning'],
    drills: [
      {
        id: 'd1',
        name: 'Dynamic Warm-up',
        category: 'warmup',
        duration: 10,
        zone: 'full',
        equipment: [],
        intensity: 'low',
      },
      {
        id: 'd2',
        name: 'Power Play Setup',
        category: 'tactics',
        duration: 20,
        zone: 'offensive',
        equipment: ['pucks', 'cones'],
        intensity: 'medium',
      },
      {
        id: 'd3',
        name: 'Defensive Zone Coverage',
        category: 'tactics',
        duration: 15,
        zone: 'defensive',
        equipment: ['pucks'],
        intensity: 'medium',
      },
      {
        id: 'd4',
        name: 'Shootout Practice',
        category: 'skills',
        duration: 10,
        zone: 'offensive',
        equipment: ['pucks'],
        intensity: 'low',
      },
      {
        id: 'd5',
        name: 'Cool Down',
        category: 'cooldown',
        duration: 5,
        zone: 'full',
        equipment: [],
        intensity: 'low',
      },
    ],
    equipment: ['pucks', 'cones'],
    createdBy: 'Head Coach',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    lastUsed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    useCount: 24,
  },
  {
    id: 'pt2',
    name: 'Skills Development',
    duration: 90,
    objectives: ['Individual skills', 'Small area games', 'Competition'],
    drills: [
      {
        id: 'd1',
        name: 'Edge Work',
        category: 'warmup',
        duration: 15,
        zone: 'full',
        equipment: [],
        intensity: 'medium',
      },
      {
        id: 'd2',
        name: 'Passing Stations',
        category: 'skills',
        duration: 20,
        zone: 'full',
        equipment: ['pucks', 'cones'],
        intensity: 'medium',
      },
      {
        id: 'd3',
        name: 'Shooting Stations',
        category: 'skills',
        duration: 20,
        zone: 'full',
        equipment: ['pucks', 'nets', 'targets'],
        intensity: 'high',
      },
      {
        id: 'd4',
        name: '3v3 Small Area Games',
        category: 'scrimmage',
        duration: 25,
        zone: 'third',
        equipment: ['pucks', 'jerseys'],
        intensity: 'high',
        playerCount: '3v3',
      },
      {
        id: 'd5',
        name: 'Cool Down & Stretch',
        category: 'cooldown',
        duration: 10,
        zone: 'full',
        equipment: [],
        intensity: 'low',
      },
    ],
    equipment: ['pucks', 'cones', 'nets', 'targets', 'jerseys'],
    createdBy: 'Skills Coach',
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    useCount: 45,
  },
  {
    id: 'pt3',
    name: 'High Intensity Game Prep',
    duration: 75,
    objectives: ['Game simulation', 'Special teams', 'Compete level'],
    drills: [
      {
        id: 'd1',
        name: 'Quick Warm-up',
        category: 'warmup',
        duration: 8,
        zone: 'full',
        equipment: ['pucks'],
        intensity: 'medium',
      },
      {
        id: 'd2',
        name: '5v5 Scrimmage',
        category: 'scrimmage',
        duration: 20,
        zone: 'full',
        equipment: ['pucks', 'jerseys'],
        intensity: 'high',
        playerCount: '5v5',
      },
      {
        id: 'd3',
        name: 'Power Play vs Penalty Kill',
        category: 'tactics',
        duration: 15,
        zone: 'full',
        equipment: ['pucks', 'jerseys'],
        intensity: 'high',
      },
      {
        id: 'd4',
        name: 'Overtime 3v3',
        category: 'scrimmage',
        duration: 12,
        zone: 'full',
        equipment: ['pucks', 'jerseys'],
        intensity: 'high',
        playerCount: '3v3',
      },
      {
        id: 'd5',
        name: 'Conditioning Skate',
        category: 'conditioning',
        duration: 15,
        zone: 'full',
        equipment: [],
        intensity: 'high',
      },
      {
        id: 'd6',
        name: 'Recovery',
        category: 'cooldown',
        duration: 5,
        zone: 'full',
        equipment: [],
        intensity: 'low',
      },
    ],
    equipment: ['pucks', 'jerseys'],
    createdBy: 'Head Coach',
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    lastUsed: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    useCount: 32,
  },
];

export const PracticeTemplates: React.FC<PracticeTemplatesProps> = ({
  onApplyTemplate,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<PracticePlan | null>(null);
  const [showQuickSchedule, setShowQuickSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('16:00'); // Default 4 PM
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'game-prep' | 'skills' | 'conditioning'>('all');

  const filteredTemplates = mockPracticeTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.objectives.some(obj => obj.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (filterType === 'all') return matchesSearch;
    if (filterType === 'game-prep') return matchesSearch && template.name.toLowerCase().includes('game');
    if (filterType === 'skills') return matchesSearch && template.name.toLowerCase().includes('skill');
    if (filterType === 'conditioning') return matchesSearch && template.objectives.some(obj => obj.toLowerCase().includes('conditioning'));
    
    return matchesSearch;
  });

  const getTemplateBadge = (template: PracticePlan) => {
    if (template.name.toLowerCase().includes('game')) {
      return { icon: Trophy, color: 'bg-yellow-500' };
    }
    if (template.name.toLowerCase().includes('skill')) {
      return { icon: Target, color: 'bg-blue-500' };
    }
    if (template.objectives.some(obj => obj.toLowerCase().includes('conditioning'))) {
      return { icon: Zap, color: 'bg-orange-500' };
    }
    return { icon: Snowflake, color: 'bg-gray-500' };
  };

  const getDrillCategoryBreakdown = (template: PracticePlan) => {
    const breakdown: Record<string, number> = {};
    template.drills.forEach(drill => {
      breakdown[drill.category] = (breakdown[drill.category] || 0) + drill.duration;
    });
    return breakdown;
  };

  const handleQuickSchedule = () => {
    if (selectedTemplate && scheduleDate) {
      const date = new Date(scheduleDate);
      onApplyTemplate(selectedTemplate, date, scheduleTime);
      setShowQuickSchedule(false);
      setSelectedTemplate(null);
    }
  };

  return (
    <>
      <Card className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Practice Templates</h3>
              <p className="text-sm text-muted-foreground">Pre-built practice plans for different scenarios</p>
            </div>
            <Button size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-2">
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Select value={filterType} onValueChange={(v) => setFilterType(v as any)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Templates</SelectItem>
                <SelectItem value="game-prep">Game Prep</SelectItem>
                <SelectItem value="skills">Skills Focus</SelectItem>
                <SelectItem value="conditioning">Conditioning</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Template List */}
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {filteredTemplates.map((template) => {
                const { icon: Icon, color } = getTemplateBadge(template);
                const breakdown = getDrillCategoryBreakdown(template);
                
                return (
                  <Card
                    key={template.id}
                    className="p-4 hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <div className="space-y-3">
                      {/* Template Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded ${color} text-white`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="font-medium text-base">{template.name}</h4>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {template.duration} min
                              </span>
                              <span className="flex items-center">
                                <FileText className="w-3 h-3 mr-1" />
                                {template.drills.length} drills
                              </span>
                              <span className="flex items-center">
                                <Users className="w-3 h-3 mr-1" />
                                Used {template.useCount}x
                              </span>
                            </div>
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
                          <Button size="sm" variant="ghost">
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Objectives */}
                      <div className="flex flex-wrap gap-1">
                        {template.objectives.map((obj, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {obj}
                          </Badge>
                        ))}
                      </div>

                      {/* Drill Category Breakdown */}
                      <div className="grid grid-cols-6 gap-2 text-xs">
                        {Object.entries(breakdown).map(([category, minutes]) => (
                          <div key={category} className="text-center">
                            <div className="text-muted-foreground capitalize">{category}</div>
                            <div className="font-medium">{minutes}m</div>
                          </div>
                        ))}
                      </div>

                      {/* Equipment */}
                      {template.equipment.length > 0 && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground">Equipment:</span>
                          {template.equipment.map((item, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Last Used */}
                      {template.lastUsed && (
                        <div className="text-xs text-muted-foreground">
                          Last used: {format(template.lastUsed, 'MMM d, yyyy')}
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </Card>

      {/* Quick Schedule Dialog */}
      <Dialog open={showQuickSchedule} onOpenChange={setShowQuickSchedule}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Practice</DialogTitle>
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
              <Label htmlFor="time">Ice Time</Label>
              <Input
                id="time"
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Rink</Label>
              <Select defaultValue="main">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="main">Main Rink</SelectItem>
                  <SelectItem value="practice">Practice Rink</SelectItem>
                  <SelectItem value="outdoor">Outdoor Rink</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuickSchedule(false)}>
              Cancel
            </Button>
            <Button onClick={handleQuickSchedule}>
              Schedule Practice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PracticeTemplates;