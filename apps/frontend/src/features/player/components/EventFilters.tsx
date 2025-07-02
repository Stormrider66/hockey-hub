"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Filter, RotateCcw, Calendar, Clock, 
  Users, MapPin, Star 
} from "lucide-react";

interface EventFiltersProps {
  filters: {
    eventTypes: string[];
    teams: string[];
    locations: string[];
    mandatory: boolean | null;
    timeRange: string;
  };
  onFiltersChange: (filters: any) => void;
  eventCounts?: {
    total: number;
    byType: Record<string, number>;
    byTeam: Record<string, number>;
  };
}

export function EventFilters({ filters, onFiltersChange, eventCounts }: EventFiltersProps) {
  const handleTypeToggle = (type: string) => {
    const newTypes = filters.eventTypes.includes(type)
      ? filters.eventTypes.filter(t => t !== type)
      : [...filters.eventTypes, type];
    onFiltersChange({ ...filters, eventTypes: newTypes });
  };

  const handleReset = () => {
    onFiltersChange({
      eventTypes: ['all'],
      teams: ['all'],
      locations: ['all'],
      mandatory: null,
      timeRange: 'all'
    });
  };

  const eventTypes = [
    { id: 'training', label: 'Training', icon: '🏃', color: 'bg-blue-100 text-blue-700' },
    { id: 'game', label: 'Games', icon: '🏒', color: 'bg-green-100 text-green-700' },
    { id: 'medical', label: 'Medical', icon: '🏥', color: 'bg-red-100 text-red-700' },
    { id: 'meeting', label: 'Meetings', icon: '📋', color: 'bg-purple-100 text-purple-700' },
    { id: 'personal', label: 'Personal', icon: '👤', color: 'bg-pink-100 text-pink-700' },
  ];

  const timeRanges = [
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
    { id: 'all', label: 'All Time' },
  ];

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </h3>
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset
          </Button>
        </div>

        <div className="space-y-4">
          {/* Event Types */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Event Types</Label>
            <div className="space-y-2">
              {eventTypes.map((type) => (
                <label key={type.id} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={filters.eventTypes.includes(type.id) || filters.eventTypes.includes('all')}
                    onCheckedChange={() => handleTypeToggle(type.id)}
                  />
                  <span className="text-sm flex items-center gap-2">
                    <span>{type.icon}</span>
                    {type.label}
                    {eventCounts?.byType[type.id] && (
                      <Badge variant="secondary" className="text-xs">
                        {eventCounts.byType[type.id]}
                      </Badge>
                    )}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Time Range */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Time Range</Label>
            <RadioGroup value={filters.timeRange} onValueChange={(value) => 
              onFiltersChange({ ...filters, timeRange: value })
            }>
              <div className="space-y-2">
                {timeRanges.map((range) => (
                  <div key={range.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={range.id} id={range.id} />
                    <Label htmlFor={range.id} className="text-sm font-normal cursor-pointer">
                      {range.label}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Mandatory Events */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Attendance</Label>
            <RadioGroup value={filters.mandatory?.toString() || 'all'} onValueChange={(value) => 
              onFiltersChange({ 
                ...filters, 
                mandatory: value === 'all' ? null : value === 'true' 
              })
            }>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all-events" />
                  <Label htmlFor="all-events" className="text-sm font-normal cursor-pointer">
                    All Events
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="mandatory" />
                  <Label htmlFor="mandatory" className="text-sm font-normal cursor-pointer flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    Mandatory Only
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="optional" />
                  <Label htmlFor="optional" className="text-sm font-normal cursor-pointer">
                    Optional Only
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Active Filters Summary */}
          {(filters.eventTypes.length > 0 && !filters.eventTypes.includes('all')) && (
            <div className="pt-3 border-t">
              <p className="text-xs text-muted-foreground mb-2">Active filters:</p>
              <div className="flex flex-wrap gap-1">
                {filters.eventTypes.map(type => {
                  const eventType = eventTypes.find(t => t.id === type);
                  return eventType ? (
                    <Badge key={type} variant="secondary" className="text-xs">
                      {eventType.icon} {eventType.label}
                    </Badge>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}