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
  Trophy,
  CheckCircle,
  TrendingUp,
  Brain,
  Plus,
} from "lucide-react";
import { mockAssignedPlays, mockAchievementBadges } from '../../constants';

export function TacticalTab() {
  return (
    <div className="space-y-6">
      {/* Tactical Learning Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              Play Mastery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 tabular-nums mb-2">87%</div>
            <Progress value={87} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">14 of 17 plays mastered</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 tabular-nums mb-2">92%</div>
            <Progress value={92} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">In practice execution</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange-500" />
              Learning Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 tabular-nums mb-2">12</div>
            <div className="text-xs text-muted-foreground">Days consecutive study</div>
            <Badge className="bg-orange-100 text-orange-800 mt-2 w-full justify-center text-xs">
              Personal best!
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Assigned Plays */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Assigned Plays
          </CardTitle>
          <CardDescription>Plays your coach wants you to master</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockAssignedPlays.map((play, index) => (
              <div key={index} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                <div className={`p-2 rounded-lg ${
                  play.status === 'mastered' ? 'bg-green-100 text-green-600' :
                  play.status === 'in-progress' ? 'bg-blue-100 text-blue-600' :
                  'bg-orange-100 text-orange-600'
                }`}>
                  {play.status === 'mastered' && <CheckCircle className="h-4 w-4" />}
                  {play.status === 'in-progress' && <Brain className="h-4 w-4" />}
                  {play.status === 'new' && <Plus className="h-4 w-4" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{play.name}</h4>
                    <Badge variant="outline" className="text-xs">{play.category}</Badge>
                  </div>
                  <div className="flex items-center gap-4 mb-2">
                    <div className="flex-1">
                      <Progress value={play.progress} className="h-2" />
                    </div>
                    <span className="text-sm font-medium">{play.progress}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Last studied: {play.lastStudied}</p>
                </div>
                <Button size="sm" variant={play.status === 'new' ? 'default' : 'outline'}>
                  {play.status === 'new' ? 'Start Learning' : 'Continue'}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Achievement Badges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Achievement Badges
          </CardTitle>
          <CardDescription>Your tactical learning milestones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {mockAchievementBadges.map((badge, index) => (
              <div key={index} className={`p-3 rounded-lg border text-center ${
                badge.earned ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className={`text-xl mb-1 ${badge.earned ? '' : 'grayscale'}`}>
                  {badge.icon}
                </div>
                <h4 className={`font-medium text-xs mb-1 ${badge.earned ? 'text-amber-800' : 'text-muted-foreground'}`}>
                  {badge.name}
                </h4>
                <p className="text-xs text-muted-foreground mb-2 leading-tight">
                  {badge.description}
                </p>
                {badge.earned ? (
                  <Badge className="bg-amber-100 text-amber-800 text-xs">
                    {badge.dateEarned}
                  </Badge>
                ) : (
                  <div className="space-y-1">
                    <Progress value={33} className="h-1" />
                    <p className="text-xs text-muted-foreground">{badge.progress}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default TacticalTab;



