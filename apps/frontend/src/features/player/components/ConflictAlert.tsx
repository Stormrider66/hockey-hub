"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertTriangle, Calendar, Clock, MapPin, 
  ChevronRight, X, AlertCircle, Zap
} from "lucide-react";
import { format, differenceInMinutes } from "date-fns";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface Conflict {
  event1: any;
  event2: any;
  type: 'overlap' | 'back-to-back' | 'travel-time';
}

interface ConflictAlertProps {
  conflicts: Conflict[];
  onResolve: (conflict: Conflict) => void;
}

export function ConflictAlert({ conflicts, onResolve }: ConflictAlertProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [expandedConflict, setExpandedConflict] = useState<number | null>(null);

  if (!conflicts.length || !isOpen) return null;

  const getConflictSeverity = (conflict: Conflict) => {
    if (conflict.type === 'overlap') return 'high';
    if (conflict.type === 'travel-time') return 'medium';
    return 'low';
  };

  const getConflictDescription = (conflict: Conflict) => {
    const { event1, event2, type } = conflict;
    
    if (type === 'overlap') {
      const overlapMinutes = differenceInMinutes(
        new Date(event1.end),
        new Date(event2.start)
      );
      return `These events overlap by ${Math.abs(overlapMinutes)} minutes`;
    }
    
    if (type === 'back-to-back') {
      return 'These events are scheduled back-to-back with no break';
    }
    
    if (type === 'travel-time') {
      return 'Insufficient travel time between different locations';
    }
    
    return 'Schedule conflict detected';
  };

  const getSuggestions = (conflict: Conflict) => {
    const suggestions: string[] = [];
    
    if (conflict.type === 'overlap') {
      suggestions.push('Contact coaches to reschedule one event');
      suggestions.push('Check if you can leave the first event early');
      suggestions.push('See if you can join the second event late');
    } else if (conflict.type === 'back-to-back') {
      suggestions.push('Prepare equipment and materials in advance');
      suggestions.push('Consider requesting a 15-minute buffer');
      suggestions.push('Pack snacks and hydration for quick recovery');
    } else if (conflict.type === 'travel-time') {
      suggestions.push('Leave the first event 10 minutes early');
      suggestions.push('Arrange transportation in advance');
      suggestions.push('Notify the second event organizer about potential delay');
    }
    
    return suggestions;
  };

  const conflictCounts = {
    high: conflicts.filter(c => getConflictSeverity(c) === 'high').length,
    medium: conflicts.filter(c => getConflictSeverity(c) === 'medium').length,
    low: conflicts.filter(c => getConflictSeverity(c) === 'low').length,
  };

  return (
    <Card className="mb-4 border-red-200 bg-red-50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-red-900">
                Schedule Conflicts Detected
              </h3>
              <p className="text-sm text-red-700 mt-0.5">
                {conflicts.length} conflict{conflicts.length > 1 ? 's' : ''} found in your schedule
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Conflict Summary */}
        <div className="flex gap-2 mb-3">
          {conflictCounts.high > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              {conflictCounts.high} Critical
            </Badge>
          )}
          {conflictCounts.medium > 0 && (
            <Badge variant="outline" className="gap-1 text-amber-600 border-amber-600">
              <AlertTriangle className="h-3 w-3" />
              {conflictCounts.medium} Warning
            </Badge>
          )}
          {conflictCounts.low > 0 && (
            <Badge variant="secondary" className="gap-1">
              <Zap className="h-3 w-3" />
              {conflictCounts.low} Minor
            </Badge>
          )}
        </div>

        <ScrollArea className="max-h-64">
          <div className="space-y-3">
            {conflicts.map((conflict, index) => {
              const severity = getConflictSeverity(conflict);
              const isExpanded = expandedConflict === index;
              
              return (
                <Collapsible
                  key={index}
                  open={isExpanded}
                  onOpenChange={() => setExpandedConflict(isExpanded ? null : index)}
                >
                  <div className={`border rounded-lg p-3 bg-white ${
                    severity === 'high' ? 'border-red-300' :
                    severity === 'medium' ? 'border-amber-300' :
                    'border-gray-200'
                  }`}>
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={
                              severity === 'high' ? 'destructive' :
                              severity === 'medium' ? 'outline' :
                              'secondary'
                            } className="text-xs">
                              {conflict.type.replace('-', ' ')}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(conflict.event1.start), "MMM d")}
                            </span>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {conflict.event1.title}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(conflict.event1.start), "h:mm a")}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <span className="text-xs">vs</span>
                              <span className="text-sm font-medium">
                                {conflict.event2.title}
                              </span>
                              <span className="text-xs">
                                {format(new Date(conflict.event2.start), "h:mm a")}
                              </span>
                            </div>
                          </div>
                          
                          <p className="text-xs text-muted-foreground mt-1">
                            {getConflictDescription(conflict)}
                          </p>
                        </div>
                        
                        <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${
                          isExpanded ? 'rotate-90' : ''
                        }`} />
                      </div>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <div className="mt-3 pt-3 border-t space-y-3">
                        {/* Event Details */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="font-medium mb-1">{conflict.event1.title}</p>
                            <div className="space-y-1 text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span className="text-xs">
                                  {format(new Date(conflict.event1.start), "h:mm a")} - 
                                  {format(new Date(conflict.event1.end), "h:mm a")}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                <span className="text-xs">{conflict.event1.location}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <p className="font-medium mb-1">{conflict.event2.title}</p>
                            <div className="space-y-1 text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span className="text-xs">
                                  {format(new Date(conflict.event2.start), "h:mm a")} - 
                                  {format(new Date(conflict.event2.end), "h:mm a")}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                <span className="text-xs">{conflict.event2.location}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Suggestions */}
                        <div>
                          <p className="text-sm font-medium mb-1">Suggestions:</p>
                          <ul className="space-y-1">
                            {getSuggestions(conflict).map((suggestion, idx) => (
                              <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1">
                                <span>•</span>
                                <span>{suggestion}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onResolve(conflict)}
                          >
                            View in Calendar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            Report Conflict
                          </Button>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}