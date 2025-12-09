'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Plus, TrendingUp, TrendingDown, Minus } from '@/components/icons';
import { useTranslation } from '@hockey-hub/translations';
import { PlayerProfileView } from '../PlayerProfileView';
import type { Player, LineCombination } from '../../types/coach-dashboard.types';
import { mockPlayers, lineupCombinations } from '../../constants/mock-data';

interface TeamManagementTabProps {
  selectedPlayer: string | null;
  onSelectPlayer: (playerId: string | null) => void;
}

export function TeamManagementTab({ selectedPlayer, onSelectPlayer }: TeamManagementTabProps) {
  const { t } = useTranslation(['coach', 'common']);

  // If a player is selected, show their profile
  if (selectedPlayer) {
    return (
      <PlayerProfileView
        playerId={selectedPlayer}
        onBack={() => onSelectPlayer(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Roster Management */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{t('coach:team.rosterManagement', 'Roster Management')}</CardTitle>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              {t('coach:team.addPlayer', 'Add Player')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {mockPlayers.map((player) => (
              <PlayerRow
                key={player.id}
                player={player}
                onSelect={() => onSelectPlayer(String(player.id))}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Line Combinations */}
      <Card>
        <CardHeader>
          <CardTitle>{t('coach:team.lineCombinations', 'Line Combinations & Performance')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {lineupCombinations.map((line, index) => (
              <LineCombinationRow key={index} line={line} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PlayerRow({ player, onSelect }: { player: Player; onSelect: () => void }) {
  const { t } = useTranslation(['common']);
  const isGoalie = player.position === 'Goalie';

  return (
    <div
      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
      onClick={onSelect}
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback>{player.number}</AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium">{player.name}</div>
          <div className="text-sm text-muted-foreground">{player.position}</div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {isGoalie ? (
          <>
            <div className="text-center">
              <div className="text-sm font-medium">
                {player.wins}-{player.losses}-{player.otl}
              </div>
              <div className="text-xs text-muted-foreground">Record</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium">{player.gaa?.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">GAA</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium">
                {player.savePercentage ? (player.savePercentage * 100).toFixed(1) : '-'}%
              </div>
              <div className="text-xs text-muted-foreground">SV%</div>
            </div>
          </>
        ) : (
          <>
            <div className="text-center">
              <div className="text-sm font-medium">{player.goals}</div>
              <div className="text-xs text-muted-foreground">Goals</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium">{player.assists}</div>
              <div className="text-xs text-muted-foreground">Assists</div>
            </div>
            <div className="text-center">
              <div
                className={cn(
                  'text-sm font-medium',
                  player.plusMinus && player.plusMinus > 0 && 'text-green-600',
                  player.plusMinus && player.plusMinus < 0 && 'text-red-600'
                )}
              >
                {player.plusMinus && player.plusMinus > 0 ? '+' : ''}
                {player.plusMinus}
              </div>
              <div className="text-xs text-muted-foreground">+/-</div>
            </div>
          </>
        )}

        <Badge
          className={cn(
            player.status === 'available' && 'bg-green-100 text-green-800',
            player.status === 'limited' && 'bg-amber-100 text-amber-800',
            player.status === 'unavailable' && 'bg-red-100 text-red-800'
          )}
        >
          {t(`common:status.${player.status}`)}
        </Badge>
      </div>
    </div>
  );
}

function LineCombinationRow({ line }: { line: LineCombination }) {
  const trend = line.goalsFor > line.goalsAgainst ? 'up' : line.goalsFor < line.goalsAgainst ? 'down' : 'stable';

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div>
        <div className="font-medium">{line.name}</div>
        <div className="text-sm text-muted-foreground">
          {line.forwards?.join(' - ') || line.defense?.join(' - ')}
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-center">
          <div className="text-sm font-medium">{line.iceTime}</div>
          <div className="text-xs text-muted-foreground">TOI</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-medium text-green-600">{line.goalsFor}</div>
          <div className="text-xs text-muted-foreground">GF</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-medium text-red-600">{line.goalsAgainst}</div>
          <div className="text-xs text-muted-foreground">GA</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-medium">{line.corsi}%</div>
          <div className="text-xs text-muted-foreground">Corsi</div>
        </div>
        <div>
          {trend === 'up' && <TrendingUp className="h-5 w-5 text-green-600" />}
          {trend === 'down' && <TrendingDown className="h-5 w-5 text-red-600" />}
          {trend === 'stable' && <Minus className="h-5 w-5 text-gray-400" />}
        </div>
      </div>
    </div>
  );
}

export default TeamManagementTab;



