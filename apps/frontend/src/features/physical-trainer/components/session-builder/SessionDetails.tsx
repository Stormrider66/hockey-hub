'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Clock,
  MapPin,
  Users,
  Activity,
  Dumbbell,
  X,
  Plus
} from 'lucide-react';
import type { SessionData } from '../SessionBuilder';

interface SessionDetailsProps {
  sessionData: SessionData;
  onUpdateSessionData: <K extends keyof SessionData>(field: K, value: SessionData[K]) => void;
  totalDuration: number;
}

const EQUIPMENT_OPTIONS = [
  'Barbells',
  'Dumbbells',
  'Kettlebells',
  'Medicine Balls',
  'Resistance Bands',
  'Pull-up Bar',
  'Bench',
  'Squat Rack',
  'Cables',
  'TRX',
  'Jump Boxes',
  'Agility Ladder',
  'Cones',
  'Battle Ropes',
  'Foam Rollers',
  'Mats'
];

const LOCATIONS = [
  'Main Gym',
  'Weight Room',
  'Field',
  'Track',
  'Ice Rink',
  'Recovery Room',
  'Pool',
  'Studio'
];

const TARGET_POSITIONS = [
  'Forwards',
  'Defense',
  'Goalies',
  'All Positions'
];

const AGE_GROUPS = [
  'U16',
  'U18',
  'U20',
  'Senior',
  'All Ages'
];

const SKILL_LEVELS = [
  'Beginner',
  'Intermediate',
  'Advanced',
  'Elite',
  'All Levels'
];

export default function SessionDetails({
  sessionData,
  onUpdateSessionData,
  totalDuration
}: SessionDetailsProps) {
  const [newTag, setNewTag] = React.useState('');

  const addTag = () => {
    if (newTag.trim()) {
      const currentTags = (sessionData as any).tags || [];
      onUpdateSessionData('tags' as any, [...currentTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = (sessionData as any).tags || [];
    onUpdateSessionData('tags' as any, currentTags.filter((tag: string) => tag !== tagToRemove));
  };

  const toggleEquipment = (item: string) => {
    const isSelected = sessionData.equipment.includes(item);
    if (isSelected) {
      onUpdateSessionData('equipment', sessionData.equipment.filter(e => e !== item));
    } else {
      onUpdateSessionData('equipment', [...sessionData.equipment, item]);
    }
  };

  const updateTargetGroup = (type: 'positions' | 'ageGroups' | 'skillLevels', value: string) => {
    const currentGroups = sessionData.targetGroups || {};
    const currentValues = currentGroups[type] || [];
    
    if (currentValues.includes(value)) {
      onUpdateSessionData('targetGroups', {
        ...currentGroups,
        [type]: currentValues.filter(v => v !== value)
      });
    } else {
      onUpdateSessionData('targetGroups', {
        ...currentGroups,
        [type]: [...currentValues, value]
      });
    }
  };

  // Calculate equipment from exercises
  const exerciseEquipment = new Set<string>();
  sessionData.exercises.forEach(exercise => {
    exercise.equipment?.forEach(item => exerciseEquipment.add(item));
  });

  return (
    <ScrollArea className="h-[calc(100vh-200px)]">
      <div className="space-y-6 pr-2">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm">Basic Information</h3>
          
          <div className="space-y-2">
            <Label htmlFor="name">Session Name</Label>
            <Input
              id="name"
              value={sessionData.name}
              onChange={(e) => onUpdateSessionData('name', e.target.value)}
              placeholder="e.g., Morning Strength Session"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={sessionData.description}
              onChange={(e) => onUpdateSessionData('description', e.target.value)}
              placeholder="Describe the session goals and focus..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={sessionData.category}
              onChange={(e) => onUpdateSessionData('category', e.target.value)}
              placeholder="e.g., pre-season, recovery"
            />
          </div>
        </div>

        <Separator />

        {/* Session Metrics */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm">Session Metrics</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Duration</Label>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{totalDuration} min</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Exercises</Label>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{sessionData.exercises.length}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="intensity">Intensity Level</Label>
            <Select 
              value={sessionData.intensity} 
              onValueChange={(value) => onUpdateSessionData('intensity', value as SessionData['intensity'])}
            >
              <SelectTrigger id="intensity">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low - Recovery Focus</SelectItem>
                <SelectItem value="medium">Medium - Skill Development</SelectItem>
                <SelectItem value="high">High - Performance Focus</SelectItem>
                <SelectItem value="max">Maximum - Testing/Competition</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Select 
              value={sessionData.location} 
              onValueChange={(value) => onUpdateSessionData('location', value)}
            >
              <SelectTrigger id="location">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {LOCATIONS.map(location => (
                  <SelectItem key={location} value={location}>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {location}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* Target Groups */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm">Target Groups</h3>
          
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Positions</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {TARGET_POSITIONS.map(position => (
                  <div key={position} className="flex items-center space-x-2">
                    <Checkbox
                      checked={sessionData.targetGroups?.positions?.includes(position) || false}
                      onCheckedChange={() => updateTargetGroup('positions', position)}
                    />
                    <label className="text-sm">{position}</label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Age Groups</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {AGE_GROUPS.map(age => (
                  <div key={age} className="flex items-center space-x-2">
                    <Checkbox
                      checked={sessionData.targetGroups?.ageGroups?.includes(age) || false}
                      onCheckedChange={() => updateTargetGroup('ageGroups', age)}
                    />
                    <label className="text-sm">{age}</label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Skill Levels</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {SKILL_LEVELS.map(level => (
                  <div key={level} className="flex items-center space-x-2">
                    <Checkbox
                      checked={sessionData.targetGroups?.skillLevels?.includes(level) || false}
                      onCheckedChange={() => updateTargetGroup('skillLevels', level)}
                    />
                    <label className="text-sm">{level}</label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Equipment */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm">Equipment Required</h3>
          
          {exerciseEquipment.size > 0 && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">From exercises:</Label>
              <div className="flex flex-wrap gap-1">
                {Array.from(exerciseEquipment).map(item => (
                  <Badge key={item} variant="secondary" className="text-xs">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Additional equipment:</Label>
            <div className="grid grid-cols-2 gap-2">
              {EQUIPMENT_OPTIONS.map(item => (
                <div key={item} className="flex items-center space-x-2">
                  <Checkbox
                    checked={sessionData.equipment.includes(item)}
                    onCheckedChange={() => toggleEquipment(item)}
                    disabled={exerciseEquipment.has(item)}
                  />
                  <label className="text-sm">{item}</label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Separator />

        {/* Tags */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm">Tags</h3>
          
          <div className="flex gap-2">
            <Input
              placeholder="Add a tag..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTag()}
              className="h-8"
            />
            <Button size="sm" onClick={addTag}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-1">
            {((sessionData as any).tags || []).map((tag: string) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="ml-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}