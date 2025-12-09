'use client';

import React from 'react';
import { FileText, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface MedicalReportButtonProps {
  playerId: string;
  playerName: string;
  injuryStatus: 'injured' | 'limited' | 'healthy';
  onClick?: () => void;
}

export const MedicalReportButton: React.FC<MedicalReportButtonProps> = ({
  playerId,
  playerName,
  injuryStatus,
  onClick,
}) => {
  // Don't show button for healthy players
  if (injuryStatus === 'healthy') {
    return null;
  }

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  // Determine icon color based on injury status
  const iconColorClass = injuryStatus === 'injured' 
    ? 'text-red-500 hover:text-red-600' 
    : 'text-yellow-500 hover:text-yellow-600';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 w-8 p-0",
              injuryStatus === 'injured' 
                ? "hover:bg-red-50" 
                : "hover:bg-yellow-50"
            )}
            onClick={handleClick}
            data-player-id={playerId}
            data-injury-status={injuryStatus}
            aria-label={`View medical report for ${playerName}`}
          >
            <Heart 
              className={cn("h-4 w-4", iconColorClass)} 
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>View Medical Report</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default MedicalReportButton;