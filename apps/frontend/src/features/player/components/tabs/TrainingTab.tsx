"use client";

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dumbbell,
  Target,
  CheckCircle,
  Plus,
} from "lucide-react";
import { getEventTypeColor, getPriorityColor, grids } from "@/lib/design-utils";
import type { UsePlayerDashboardReturn } from '../../hooks/usePlayerDashboard';

interface TrainingTabProps {
  dashboard: UsePlayerDashboardReturn;
}

export function TrainingTab({ dashboard }: TrainingTabProps) {
  const {
    training,
    developmentGoals,
    handleTrainingComplete,
  } = dashboard;

  return (
    <div className={grids.cards}>
      {/* Assigned Training */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5" aria-hidden="true" />
            Assigned Training
          </CardTitle>
          <CardDescription>Current training assignments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {training.map((t, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getEventTypeColor(t.type)}>
                        {t.type}
                      </Badge>
                      <p className="font-medium">{t.title}</p>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 break-words md:break-normal">
                      {t.description}
                    </p>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Due: {t.due} • Estimated: {t.estimatedTime}</p>
                      <p>Assigned by: {t.assignedBy}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium">{t.progress}%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Progress 
                    value={t.progress} 
                    className="h-2" 
                    aria-label={`Progress: ${t.progress}%`} 
                  />
                  <div className="flex gap-2 flex-wrap">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleTrainingComplete(t.title)}
                      disabled={t.progress === 100}
                      className="min-w-[120px] sm:min-w-0"
                    >
                      {t.progress === 100 ? (
                        <>
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Completed
                        </>
                      ) : (
                        <>
                          <Plus className="mr-1 h-3 w-3" />
                          Mark Complete
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Development Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" aria-hidden="true" />
            Development Goals
          </CardTitle>
          <CardDescription>Personal improvement targets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {developmentGoals.map((goal, index) => (
              <div key={index} className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getPriorityColor(goal.priority)}>
                        {goal.priority}
                      </Badge>
                      <Badge variant="outline">
                        {goal.category}
                      </Badge>
                    </div>
                    <p className="font-medium text-sm">{goal.goal}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Target: {goal.target}
                    </p>
                    {goal.notes && (
                      <p className="text-xs text-muted-foreground mt-1 break-words md:break-normal">
                        {goal.notes}
                      </p>
                    )}
                  </div>
                  <span className="text-sm font-medium">{goal.progress}%</span>
                </div>
                <Progress 
                  value={goal.progress} 
                  className="h-2" 
                  aria-label={`Goal progress: ${goal.progress}%`} 
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default TrainingTab;



