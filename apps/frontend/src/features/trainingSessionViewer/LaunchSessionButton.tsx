'use client';

import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { Play } from 'lucide-react';

interface LaunchSessionButtonProps extends Omit<ButtonProps, 'onClick'> {
  sessionType: 'team' | 'individual';
  teamId?: string;
  teamName?: string;
  playerId?: string;
  playerName?: string;
  sessionCategory?: string;
  onLaunch: () => void;
}

export default function LaunchSessionButton({
  sessionType,
  teamId,
  teamName,
  playerId,
  playerName,
  sessionCategory,
  onLaunch,
  size = 'default',
  variant = 'default',
  ...buttonProps
}: LaunchSessionButtonProps) {
  const handleLaunch = () => {
    console.log('Launching session:', {
      sessionType,
      teamId,
      teamName,
      playerId,
      playerName,
      sessionCategory
    });
    onLaunch();
  };

  return (
    <Button
      size={size}
      variant={variant}
      onClick={handleLaunch}
      {...buttonProps}
    >
      <Play className="h-4 w-4 mr-1" />
      Start
    </Button>
  );
} 