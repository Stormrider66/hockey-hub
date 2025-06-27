'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { 
  ArrowLeft, Heart, Zap, TrendingUp, TrendingDown, 
  ArrowUpDown, Activity, Users
} from 'lucide-react';

interface PlayerMetric {
  id: string;
  name: string;
  number: number;
  heartRate: number;
  watts: number;
  heartRateZone: 1 | 2 | 3 | 4 | 5;
  maxHeartRate: number;
  targetZone: { min: number; max: number };
  effort: number; // 1-10
}

interface TeamMetricsProps {
  teamName: string;
  players: PlayerMetric[];
  metricType: 'heartRate' | 'watts';
  onBack: () => void;
  className?: string;
}

type SortField = 'number' | 'name' | 'heartRate' | 'watts' | 'zone' | 'effort';
type SortOrder = 'asc' | 'desc';

const ZONE_COLORS = {
  1: { bg: 'bg-blue-100', text: 'text-blue-700', name: 'Recovery' },
  2: { bg: 'bg-green-100', text: 'text-green-700', name: 'Aerobic' },
  3: { bg: 'bg-yellow-100', text: 'text-yellow-700', name: 'Threshold' },
  4: { bg: 'bg-orange-100', text: 'text-orange-700', name: 'Anaerobic' },
  5: { bg: 'bg-red-100', text: 'text-red-700', name: 'Max' },
};

export default function TeamMetrics({
  teamName,
  players,
  metricType,
  onBack,
  className
}: TeamMetricsProps) {
  const [sortField, setSortField] = useState<SortField>('number');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedPlayers = [...players].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortField) {
      case 'number':
        aValue = a.number;
        bValue = b.number;
        break;
      case 'name':
        aValue = a.name;
        bValue = b.name;
        break;
      case 'heartRate':
        aValue = a.heartRate;
        bValue = b.heartRate;
        break;
      case 'watts':
        aValue = a.watts;
        bValue = b.watts;
        break;
      case 'zone':
        aValue = a.heartRateZone;
        bValue = b.heartRateZone;
        break;
      case 'effort':
        aValue = a.effort;
        bValue = b.effort;
        break;
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Calculate team statistics
  const avgHeartRate = Math.round(
    players.reduce((sum, p) => sum + p.heartRate, 0) / players.length
  );
  const avgWatts = Math.round(
    players.reduce((sum, p) => sum + p.watts, 0) / players.length
  );
  const avgEffort = (
    players.reduce((sum, p) => sum + p.effort, 0) / players.length
  ).toFixed(1);

  const zoneDistribution = players.reduce((acc, p) => {
    acc[p.heartRateZone] = (acc[p.heartRateZone] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const getHeartRatePercentage = (heartRate: number, max: number) => {
    return Math.round((heartRate / max) * 100);
  };

  return (
    <div className={cn("h-full flex flex-col", className)}>
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="h-12 w-12"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{teamName} - Live Metrics</h1>
              <p className="text-lg text-muted-foreground">Real-time team performance data</p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="p-6 grid grid-cols-4 gap-4 border-b">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Players</p>
                <p className="text-2xl font-bold">{players.length}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Heart Rate</p>
                <p className="text-2xl font-bold">{avgHeartRate} bpm</p>
              </div>
              <Heart className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Power</p>
                <p className="text-2xl font-bold">{avgWatts} W</p>
              </div>
              <Zap className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Effort</p>
                <p className="text-2xl font-bold">{avgEffort}/10</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Zone Distribution */}
      <div className="px-6 py-4 border-b">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">Zone Distribution:</span>
          {[1, 2, 3, 4, 5].map(zone => {
            const count = zoneDistribution[zone] || 0;
            const percentage = Math.round((count / players.length) * 100);
            const zoneInfo = ZONE_COLORS[zone as keyof typeof ZONE_COLORS];
            
            return (
              <div key={zone} className="flex items-center gap-2">
                <div className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium",
                  zoneInfo.bg,
                  zoneInfo.text
                )}>
                  Zone {zone}: {count} ({percentage}%)
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Player Table */}
      <div className="flex-1 overflow-auto p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('number')}
              >
                <div className="flex items-center gap-1">
                  # <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-1">
                  Name <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer text-center"
                onClick={() => handleSort('heartRate')}
              >
                <div className="flex items-center justify-center gap-1">
                  <Heart className="h-4 w-4" />
                  Heart Rate <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer text-center"
                onClick={() => handleSort('watts')}
              >
                <div className="flex items-center justify-center gap-1">
                  <Zap className="h-4 w-4" />
                  Power <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer text-center"
                onClick={() => handleSort('zone')}
              >
                <div className="flex items-center justify-center gap-1">
                  Zone <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="text-center">% Max HR</TableHead>
              <TableHead className="text-center">Target Zone</TableHead>
              <TableHead 
                className="cursor-pointer text-center"
                onClick={() => handleSort('effort')}
              >
                <div className="flex items-center justify-center gap-1">
                  Effort <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPlayers.map(player => {
              const hrPercentage = getHeartRatePercentage(player.heartRate, player.maxHeartRate);
              const inTargetZone = player.heartRate >= player.targetZone.min && 
                                 player.heartRate <= player.targetZone.max;
              const zoneInfo = ZONE_COLORS[player.heartRateZone];
              
              return (
                <TableRow key={player.id}>
                  <TableCell className="font-bold text-lg">{player.number}</TableCell>
                  <TableCell className="font-medium">{player.name}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-xl font-bold">{player.heartRate}</span>
                      <span className="text-sm text-muted-foreground">bpm</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-xl font-bold">{player.watts}</span>
                      <span className="text-sm text-muted-foreground">W</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={cn(zoneInfo.bg, zoneInfo.text)}>
                      {zoneInfo.name}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-medium">{hrPercentage}%</span>
                      <Progress value={hrPercentage} className="w-16 h-2" />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      {inTargetZone ? (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          In Zone
                        </Badge>
                      ) : player.heartRate < player.targetZone.min ? (
                        <Badge variant="outline" className="text-blue-600 border-blue-600">
                          Below
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-red-600 border-red-600">
                          Above
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-lg font-medium">{player.effort}/10</span>
                      {player.effort > 7 && <TrendingUp className="h-4 w-4 text-red-500" />}
                      {player.effort < 4 && <TrendingDown className="h-4 w-4 text-blue-500" />}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}