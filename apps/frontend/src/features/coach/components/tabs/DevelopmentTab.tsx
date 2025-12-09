'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Plus, CheckCircle2, Zap, Clock } from '@/components/icons';
import type { PlayerDevelopment } from '../../types/coach-dashboard.types';
import { playerDevelopment } from '../../constants/mock-data';

interface DevelopmentTabProps {
  // Can add more props as needed
}

export function DevelopmentTab({}: DevelopmentTabProps) {
  return (
    <div className="space-y-6">
      {/* Player Development Goals */}
      <IndividualDevelopmentPlansCard />

      {/* Skill Development Programs */}
      <div className="grid grid-cols-2 gap-6">
        <SkillDevelopmentProgramsCard />
        <AssessmentScheduleCard />
      </div>

      {/* Season Planning */}
      <SeasonDevelopmentTimelineCard />
    </div>
  );
}

function IndividualDevelopmentPlansCard() {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Individual Development Plans</CardTitle>
            <CardDescription>Track player skill progression and goals</CardDescription>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Goal
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {playerDevelopment.map((player, playerIndex) => (
            <Card key={playerIndex}>
              <CardHeader>
                <CardTitle className="text-lg">{player.player}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {player.goals.map((goal, goalIndex) => (
                    <div key={goalIndex}>
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <p className="font-medium text-sm">{goal.skill}</p>
                          <p className="text-xs text-muted-foreground">
                            Current: {goal.current} → Target: {goal.target}
                          </p>
                        </div>
                        <Badge variant="outline">{goal.progress}%</Badge>
                      </div>
                      <Progress value={goal.progress} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SkillDevelopmentProgramsCard() {
  const programs = [
    { name: 'Shooting Accuracy Program', duration: '4 weeks', enrolled: 5 },
    { name: 'Defensive Positioning', duration: '3 weeks', enrolled: 8 },
    { name: 'Faceoff Specialist', duration: '2 weeks', enrolled: 3 },
    { name: 'Goalie Fundamentals', duration: '6 weeks', enrolled: 2 },
    { name: 'Power Skating', duration: '4 weeks', enrolled: 12 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Skill Development Programs</CardTitle>
        <CardDescription>Structured improvement plans</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {programs.map((program, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium text-sm">{program.name}</p>
                <p className="text-xs text-muted-foreground">
                  {program.duration} • {program.enrolled} players
                </p>
              </div>
              <Button size="sm" variant="outline">
                Manage
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function AssessmentScheduleCard() {
  const assessments = [
    { date: 'Jan 25', type: 'Shooting Test', players: 'All forwards' },
    { date: 'Jan 28', type: 'Skating Speed', players: 'Full team' },
    { date: 'Feb 2', type: 'Defensive Skills', players: 'Defense' },
    { date: 'Feb 5', type: 'Goalie Evaluation', players: 'Goalies' },
    { date: 'Feb 10', type: 'Team Fitness', players: 'Full team' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assessment Schedule</CardTitle>
        <CardDescription>Upcoming skill evaluations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {assessments.map((assessment, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">{assessment.date.split(' ')[0]}</p>
                  <p className="font-bold">{assessment.date.split(' ')[1]}</p>
                </div>
                <div>
                  <p className="font-medium text-sm">{assessment.type}</p>
                  <p className="text-xs text-muted-foreground">{assessment.players}</p>
                </div>
              </div>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SeasonDevelopmentTimelineCard() {
  const phases = [
    { phase: 'Pre-Season', status: 'completed', focus: 'Fitness & Fundamentals', date: 'Aug-Sep' },
    { phase: 'Early Season', status: 'completed', focus: 'System Implementation', date: 'Oct-Nov' },
    { phase: 'Mid-Season', status: 'active', focus: 'Performance Optimization', date: 'Dec-Jan' },
    { phase: 'Late Season', status: 'upcoming', focus: 'Playoff Preparation', date: 'Feb-Mar' },
    { phase: 'Playoffs', status: 'upcoming', focus: 'Peak Performance', date: 'Apr-May' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Season Development Timeline</CardTitle>
        <CardDescription>Long-term planning and milestones</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
          <div className="space-y-6">
            {phases.map((phase, index) => (
              <div key={index} className="flex items-center gap-4">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center z-10 bg-background',
                    phase.status === 'completed' && 'bg-green-100',
                    phase.status === 'active' && 'bg-blue-100',
                    phase.status === 'upcoming' && 'bg-gray-100'
                  )}
                >
                  {phase.status === 'completed' && (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  )}
                  {phase.status === 'active' && <Zap className="h-4 w-4 text-blue-600" />}
                  {phase.status === 'upcoming' && <Clock className="h-4 w-4 text-gray-400" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{phase.phase}</p>
                      <p className="text-sm text-muted-foreground">{phase.focus}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{phase.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default DevelopmentTab;



