'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  StepBack,
  StepForward,
  Repeat,
  Circle,
  Volume2,
  VolumeX,
  Keyboard
} from '@/components/icons';
import { cn } from '@/lib/utils';

// Types
export interface TimelineKeyframe {
  id: string;
  time: number;
  label?: string;
  type: 'play' | 'pause' | 'event' | 'marker';
  color?: string;
}

export interface TimelineControlsProps {
  // Time properties
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  
  // Playback controls
  speed: number;
  isLooping: boolean;
  isMuted: boolean;
  volume: number;
  
  // Timeline markers
  keyframes?: TimelineKeyframe[];
  showKeyframes?: boolean;
  
  // Recording mode
  isRecording?: boolean;
  recordingEnabled?: boolean;
  
  // Event handlers
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSeek: (time: number) => void;
  onSpeedChange: (speed: number) => void;
  onLoopToggle: () => void;
  onMuteToggle?: () => void;
  onVolumeChange?: (volume: number) => void;
  onRecordToggle?: () => void;
  onStepBackward: () => void;
  onStepForward: () => void;
  onSkipToKeyframe?: (keyframe: TimelineKeyframe) => void;
  
  // UI customization
  className?: string;
  compact?: boolean;
  showLabels?: boolean;
  disabled?: boolean;
}

const SPEED_OPTIONS = [
  { value: 0.25, label: '0.25x' },
  { value: 0.5, label: '0.5x' },
  { value: 1, label: '1x' },
  { value: 1.5, label: '1.5x' },
  { value: 2, label: '2x' },
];

const KEYBOARD_SHORTCUTS = [
  { key: 'Space', action: 'Play/Pause' },
  { key: '←/→', action: 'Step backward/forward' },
  { key: 'Shift + ←/→', action: 'Skip backward/forward' },
  { key: 'R', action: 'Toggle recording' },
  { key: 'L', action: 'Toggle loop' },
  { key: 'M', action: 'Toggle mute' },
  { key: '1-5', action: 'Change speed' },
];

export default function TimelineControls({
  currentTime,
  duration,
  isPlaying,
  speed = 1,
  isLooping = false,
  isMuted = false,
  volume = 1,
  keyframes = [],
  showKeyframes = true,
  isRecording = false,
  recordingEnabled = false,
  onPlay,
  onPause,
  onStop,
  onSeek,
  onSpeedChange,
  onLoopToggle,
  onMuteToggle,
  onVolumeChange,
  onRecordToggle,
  onStepBackward,
  onStepForward,
  onSkipToKeyframe,
  className,
  compact = false,
  showLabels = true,
  disabled = false
}: TimelineControlsProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [dragTime, setDragTime] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Format time display (MM:SS or HH:MM:SS)
  const formatTime = useCallback((time: number): string => {
    const totalSeconds = Math.floor(time / 1000); // Convert milliseconds to seconds
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Handle timeline scrubbing
  const handleTimelineClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || disabled) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * duration;
    
    onSeek(newTime);
  }, [duration, onSeek, disabled]);

  // Handle timeline dragging
  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    setIsDragging(true);
    handleTimelineClick(event);
  }, [handleTimelineClick, disabled]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isDragging || !timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const moveX = event.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, moveX / rect.width));
    const newTime = percentage * duration;
    
    setDragTime(newTime);
    onSeek(newTime);
  }, [isDragging, duration, onSeek]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (disabled) return;
      
      // Don't interfere with input fields
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case ' ':
          event.preventDefault();
          if (isPlaying) {
            onPause();
          } else {
            onPlay();
          }
          break;
        case 'arrowleft':
          event.preventDefault();
          if (event.shiftKey) {
            onStepBackward();
          } else {
            onStepBackward();
          }
          break;
        case 'arrowright':
          event.preventDefault();
          if (event.shiftKey) {
            onStepForward();
          } else {
            onStepForward();
          }
          break;
        case 'r':
          if (onRecordToggle && recordingEnabled) {
            event.preventDefault();
            onRecordToggle();
          }
          break;
        case 'l':
          event.preventDefault();
          onLoopToggle();
          break;
        case 'm':
          if (onMuteToggle) {
            event.preventDefault();
            onMuteToggle();
          }
          break;
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
          event.preventDefault();
          const speedIndex = parseInt(event.key) - 1;
          if (speedIndex < SPEED_OPTIONS.length) {
            onSpeedChange(SPEED_OPTIONS[speedIndex].value);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, onPlay, onPause, onStepBackward, onStepForward, onLoopToggle, onMuteToggle, onRecordToggle, recordingEnabled, onSpeedChange, disabled]);

  // Calculate progress percentage
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  const displayTime = isDragging ? dragTime : currentTime;

  return (
    <TooltipProvider>
      <Card className={cn('p-4 bg-white dark:bg-gray-900 border shadow-lg', className)}>
        <div className={cn(
          'flex flex-col gap-4',
          compact && 'gap-2'
        )}>
          {/* Timeline scrubber */}
          <div className="relative">
            {/* Time display */}
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm font-mono text-muted-foreground">
                {formatTime(displayTime)}
              </div>
              <div className="text-sm font-mono text-muted-foreground">
                {formatTime(duration)}
              </div>
            </div>

            {/* Timeline track */}
            <div
              ref={timelineRef}
              className={cn(
                'relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer transition-all duration-200 hover:h-3',
                disabled && 'cursor-not-allowed opacity-50'
              )}
              onClick={handleTimelineClick}
              onMouseDown={handleMouseDown}
            >
              {/* Progress bar */}
              <div
                className="absolute left-0 top-0 h-full bg-blue-600 rounded-full transition-all duration-200"
                style={{ width: `${progressPercentage}%` }}
              />

              {/* Progress handle */}
              <div
                className={cn(
                  'absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-blue-600 rounded-full shadow-md transition-all duration-200',
                  'hover:scale-110 cursor-grab',
                  isDragging && 'scale-110 cursor-grabbing'
                )}
                style={{ left: `calc(${progressPercentage}% - 8px)` }}
              />

              {/* Keyframe markers */}
              {showKeyframes && keyframes.map((keyframe, index) => {
                const keyframePercentage = (keyframe.time / duration) * 100;
                return (
                  <Tooltip key={keyframe.id || `keyframe-${index}`}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          'absolute top-1/2 transform -translate-y-1/2 w-2 h-6 cursor-pointer hover:scale-110 transition-all',
                          keyframe.type === 'play' && 'bg-green-500',
                          keyframe.type === 'pause' && 'bg-yellow-500',
                          keyframe.type === 'event' && 'bg-red-500',
                          keyframe.type === 'marker' && 'bg-purple-500'
                        )}
                        style={{ 
                          left: `calc(${keyframePercentage}% - 4px)`,
                          backgroundColor: keyframe.color
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSkipToKeyframe) {
                            onSkipToKeyframe(keyframe);
                          }
                        }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{keyframe.label || `${keyframe.type} at ${formatTime(keyframe.time)}`}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>

          {/* Controls */}
          <div className={cn(
            'flex items-center justify-between gap-4',
            compact && 'gap-2'
          )}>
            {/* Playback controls */}
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size={compact ? 'sm' : 'default'}
                    onClick={onStepBackward}
                    disabled={disabled}
                    className="px-2"
                  >
                    <StepBack className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Step backward</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size={compact ? 'sm' : 'default'}
                    onClick={() => onSeek(Math.max(0, currentTime - 1000))}
                    disabled={disabled}
                    className="px-2"
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Skip backward</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isPlaying ? 'secondary' : 'default'}
                    size={compact ? 'sm' : 'default'}
                    onClick={isPlaying ? onPause : onPlay}
                    disabled={disabled}
                    className="px-3"
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isPlaying ? 'Pause (Space)' : 'Play (Space)'}</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size={compact ? 'sm' : 'default'}
                    onClick={onStop}
                    disabled={disabled}
                    className="px-2"
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Stop</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size={compact ? 'sm' : 'default'}
                    onClick={() => onSeek(Math.min(duration, currentTime + 1000))}
                    disabled={disabled}
                    className="px-2"
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Skip forward</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size={compact ? 'sm' : 'default'}
                    onClick={onStepForward}
                    disabled={disabled}
                    className="px-2"
                  >
                    <StepForward className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Step forward</TooltipContent>
              </Tooltip>
            </div>

            {/* Speed control */}
            <div className="flex items-center gap-2">
              {showLabels && !compact && (
                <span className="text-sm text-muted-foreground">Speed:</span>
              )}
              <Select
                value={speed.toString()}
                onValueChange={(value) => onSpeedChange(parseFloat(value))}
                disabled={disabled}
              >
                <SelectTrigger className={cn('w-20', compact && 'w-16 text-xs')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SPEED_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Additional controls */}
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isLooping ? 'default' : 'outline'}
                    size={compact ? 'sm' : 'default'}
                    onClick={onLoopToggle}
                    disabled={disabled}
                    className="px-2"
                  >
                    <Repeat className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Loop (L)</TooltipContent>
              </Tooltip>

              {onMuteToggle && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isMuted ? 'secondary' : 'outline'}
                      size={compact ? 'sm' : 'default'}
                      onClick={onMuteToggle}
                      disabled={disabled}
                      className="px-2"
                    >
                      {isMuted ? (
                        <VolumeX className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{isMuted ? 'Unmute (M)' : 'Mute (M)'}</TooltipContent>
                </Tooltip>
              )}

              {recordingEnabled && onRecordToggle && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isRecording ? 'destructive' : 'outline'}
                      size={compact ? 'sm' : 'default'}
                      onClick={onRecordToggle}
                      disabled={disabled}
                      className="px-2"
                    >
                      <Circle className={cn('h-4 w-4', isRecording && 'fill-current')} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isRecording ? 'Stop recording (R)' : 'Start recording (R)'}
                  </TooltipContent>
                </Tooltip>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size={compact ? 'sm' : 'default'}
                    onClick={() => setShowShortcuts(!showShortcuts)}
                    className="px-2"
                  >
                    <Keyboard className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Keyboard shortcuts</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Status indicators */}
          {!compact && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isPlaying && (
                  <Badge variant="secondary" className="animate-pulse">
                    Playing
                  </Badge>
                )}
                {isRecording && (
                  <Badge variant="destructive" className="animate-pulse">
                    Recording
                  </Badge>
                )}
                {isLooping && (
                  <Badge variant="outline">
                    Loop
                  </Badge>
                )}
                {speed !== 1 && (
                  <Badge variant="outline">
                    {speed}x Speed
                  </Badge>
                )}
              </div>
              
              <div className="text-xs text-muted-foreground">
                {keyframes.length > 0 && `${keyframes.length} keyframes`}
              </div>
            </div>
          )}

          {/* Keyboard shortcuts panel */}
          {showShortcuts && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <h4 className="font-medium text-sm mb-2">Keyboard Shortcuts</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {KEYBOARD_SHORTCUTS.map((shortcut) => (
                  <div key={shortcut.key} className="flex justify-between">
                    <span className="font-mono bg-background px-1 rounded">
                      {shortcut.key}
                    </span>
                    <span className="text-muted-foreground">
                      {shortcut.action}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </TooltipProvider>
  );
}