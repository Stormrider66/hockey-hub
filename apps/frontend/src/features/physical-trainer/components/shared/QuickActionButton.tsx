import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickActionButtonProps {
  icon: LucideIcon;
  label: string;
  tooltip?: string;
  onClick: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  showLabel?: boolean;
  badge?: string | number;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  shortcut?: string;
}

export const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  icon: Icon,
  label,
  tooltip,
  onClick,
  variant = 'ghost',
  size = 'sm',
  disabled = false,
  loading = false,
  className,
  showLabel = false,
  badge,
  badgeVariant = 'secondary',
  shortcut,
}) => {
  const button = (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'relative transition-all',
        showLabel ? 'gap-2' : '',
        className
      )}
    >
      <Icon className={cn(
        'h-4 w-4',
        loading && 'animate-spin'
      )} />
      {showLabel && <span>{label}</span>}
      {badge !== undefined && (
        <span
          className={cn(
            'absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium',
            badgeVariant === 'default' && 'bg-primary text-primary-foreground',
            badgeVariant === 'secondary' && 'bg-secondary text-secondary-foreground',
            badgeVariant === 'destructive' && 'bg-destructive text-destructive-foreground',
            badgeVariant === 'outline' && 'border bg-background'
          )}
        >
          {badge}
        </span>
      )}
    </Button>
  );

  if (tooltip || shortcut) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {button}
          </TooltipTrigger>
          <TooltipContent>
            <div className="flex flex-col items-center gap-1">
              <p>{tooltip || label}</p>
              {shortcut && (
                <kbd className="text-xs opacity-70 font-mono bg-background/50 px-1 rounded">
                  {shortcut}
                </kbd>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
};