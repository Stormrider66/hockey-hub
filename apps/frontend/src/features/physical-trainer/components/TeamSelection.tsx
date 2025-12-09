'use client';

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Users, Trophy, Star, Shield } from 'lucide-react';

interface Team {
  id: string;
  name: string;
  level: 'A-Team' | 'J20' | 'U18' | 'U16' | 'U14';
  playerCount: number;
  activeSession?: boolean;
}

interface TeamSelectionProps {
  teams: Team[];
  onSelectTeam: (teamId: string, teamName: string) => void;
  className?: string;
}

const TEAM_ICONS = {
  'A-Team': Trophy,
  'J20': Star,
  'U18': Shield,
  'U16': Users,
  'U14': Users,
};

const TEAM_COLORS = {
  'A-Team': 'from-amber-500 to-amber-600',
  'J20': 'from-blue-500 to-blue-600',
  'U18': 'from-green-500 to-green-600',
  'U16': 'from-purple-500 to-purple-600',
  'U14': 'from-pink-500 to-pink-600',
};

export default function TeamSelection({ teams, onSelectTeam, className }: TeamSelectionProps) {
  return (
    <div className={cn("h-full flex flex-col items-center justify-center p-8", className)}>
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-2">Select Team</h1>
        <p className="text-xl text-muted-foreground">Choose a team to view training session</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 max-w-6xl">
        {teams.map(team => {
          const Icon = TEAM_ICONS[team.level] || Users;
          const gradientColor = TEAM_COLORS[team.level] || 'from-gray-500 to-gray-600';
          
          return (
            <Card
              key={team.id}
              className={cn(
                "cursor-pointer transition-all hover:scale-105 hover:shadow-xl",
                "min-w-[200px] min-h-[200px]",
                team.activeSession && "ring-4 ring-green-500 ring-opacity-50"
              )}
              onClick={() => onSelectTeam(team.id, team.name)}
            >
              <CardContent className="p-8 flex flex-col items-center justify-center h-full">
                <div className={cn(
                  "w-24 h-24 rounded-full flex items-center justify-center mb-4",
                  "bg-gradient-to-br text-white",
                  gradientColor
                )}>
                  <Icon className="w-12 h-12" />
                </div>
                <h3 className="text-2xl font-bold mb-2">{team.name}</h3>
                <p className="text-lg text-muted-foreground">{team.playerCount} players</p>
                {team.activeSession && (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm text-green-600 font-medium">Active Session</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}