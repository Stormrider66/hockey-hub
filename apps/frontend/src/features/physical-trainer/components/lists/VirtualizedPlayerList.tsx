'use client';

import React, { useCallback, useMemo, CSSProperties } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Player, PlayerReadiness, MedicalRestriction } from '../../types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Heart, AlertTriangle, Shield } from '@/components/icons';
import { cn } from '@/lib/utils';

interface VirtualizedPlayerListProps {
  players: Player[];
  readiness?: Record<string, PlayerReadiness>;
  restrictions?: Record<string, MedicalRestriction[]>;
  selectedIds?: string[];
  onPlayerSelect?: (playerId: string) => void;
  height?: number;
  itemHeight?: number;
  className?: string;
  searchTerm?: string;
}

interface PlayerRowProps {
  player: Player;
  readiness?: PlayerReadiness;
  restrictions?: MedicalRestriction[];
  isSelected?: boolean;
  onSelect?: (playerId: string) => void;
  style: CSSProperties;
}

const PlayerRow = React.memo(({ 
  player, 
  readiness, 
  restrictions, 
  isSelected, 
  onSelect,
  style 
}: PlayerRowProps) => {
  const hasRestrictions = restrictions && restrictions.length > 0;
  const isInjured = player.status === 'injured';
  const isLimited = hasRestrictions || readiness?.status !== 'ready';
  
  return (
    <div style={style} className="px-4 py-1">
      <Card 
        className={cn(
          "cursor-pointer transition-all hover:shadow-md",
          isSelected && "ring-2 ring-primary",
          isInjured && "border-destructive/50",
          isLimited && "border-yellow-500/50"
        )}
        onClick={() => onSelect?.(player.id.toString())}
      >
        <div className="p-4 flex items-center gap-4">
          {/* Player Photo/Icon */}
          <div className="relative">
            {player.photo ? (
              <img 
                src={player.photo} 
                alt={player.name}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            {/* Status Indicator */}
            {isInjured && (
              <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-destructive rounded-full flex items-center justify-center">
                <AlertTriangle className="h-3 w-3 text-destructive-foreground" />
              </div>
            )}
            {!isInjured && hasRestrictions && (
              <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-yellow-500 rounded-full flex items-center justify-center">
                <Shield className="h-3 w-3 text-white" />
              </div>
            )}
          </div>

          {/* Player Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">{player.name}</h4>
              <span className="text-sm text-muted-foreground">#{player.number}</span>
            </div>
            <p className="text-sm text-muted-foreground">{player.position}</p>
          </div>

          {/* Readiness Indicators */}
          <div className="flex items-center gap-2">
            {readiness && (
              <div className="flex items-center gap-1">
                <Heart className={cn(
                  "h-4 w-4",
                  readiness.status === 'ready' ? 'text-green-500' :
                  readiness.status === 'caution' ? 'text-yellow-500' :
                  'text-destructive'
                )} />
                <span className="text-sm font-medium">{readiness.load}%</span>
              </div>
            )}
            
            <Badge 
              variant={
                player.status === 'injured' ? 'destructive' :
                player.status === 'inactive' ? 'secondary' :
                'default'
              }
              className="text-xs"
            >
              {player.status}
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  );
});

PlayerRow.displayName = 'PlayerRow';

export function VirtualizedPlayerList({
  players,
  readiness = {},
  restrictions = {},
  selectedIds = [],
  onPlayerSelect,
  height = 600,
  itemHeight = 80,
  className,
  searchTerm = ''
}: VirtualizedPlayerListProps) {
  // Filter players based on search term
  const filteredPlayers = useMemo(() => {
    if (!searchTerm) return players;
    
    const term = searchTerm.toLowerCase();
    return players.filter(player => 
      player.name.toLowerCase().includes(term) ||
      player.number.toString().includes(term) ||
      player.position.toLowerCase().includes(term)
    );
  }, [players, searchTerm]);

  // Create row renderer
  const Row = useCallback(({ index, style }: { index: number; style: CSSProperties }) => {
    const player = filteredPlayers[index];
    return (
      <PlayerRow
        player={player}
        readiness={readiness[player.id]}
        restrictions={restrictions[player.id]}
        isSelected={selectedIds.includes(player.id.toString())}
        onSelect={onPlayerSelect}
        style={style}
      />
    );
  }, [filteredPlayers, readiness, restrictions, selectedIds, onPlayerSelect]);

  if (filteredPlayers.length === 0) {
    return (
      <Card className={cn("flex items-center justify-center", className)} style={{ height }}>
        <div className="text-center p-8">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {searchTerm ? 'No players found matching your search' : 'No players available'}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <List
        height={height}
        itemCount={filteredPlayers.length}
        itemSize={itemHeight}
        width="100%"
      >
        {Row}
      </List>
    </Card>
  );
}