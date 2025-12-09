import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Download, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface VoiceMessageProps {
  url: string;
  duration: number;
  waveform?: number[];
  fileName?: string;
  size?: number;
  sender?: string;
  timestamp?: Date;
}

export function VoiceMessage({
  url,
  duration,
  waveform = [],
  fileName = 'Voice Message',
  size,
  sender,
  timestamp,
}: VoiceMessageProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => {
      setIsPlaying(true);
      startProgressUpdate();
    };

    const handlePause = () => {
      setIsPlaying(false);
      stopProgressUpdate();
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      stopProgressUpdate();
    };

    const handleError = () => {
      setError('Failed to load audio');
      setIsPlaying(false);
      setIsLoading(false);
      stopProgressUpdate();
    };

    const handleLoadStart = () => {
      setIsLoading(true);
    };

    const handleLoadedData = () => {
      setIsLoading(false);
      setError(null);
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('loadeddata', handleLoadedData);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('loadeddata', handleLoadedData);
      stopProgressUpdate();
    };
  }, []);

  const startProgressUpdate = () => {
    progressInterval.current = setInterval(() => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
      }
    }, 100);
  };

  const stopProgressUpdate = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((err) => {
        console.error('Failed to play audio:', err);
        setError('Failed to play audio');
      });
    }
  };

  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return;
    const newTime = value[0];
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  // Generate default waveform if not provided
  const displayWaveform = waveform.length > 0 ? waveform : Array(30).fill(0.5);
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 max-w-sm">
      <audio ref={audioRef} src={url} preload="metadata" />
      
      {/* Header with sender info */}
      {sender && (
        <div className="flex items-center gap-2 mb-3 text-sm text-gray-600 dark:text-gray-400">
          <Volume2 className="w-4 h-4" />
          <span>{sender}</span>
          {timestamp && (
            <span className="text-xs">
              • {new Date(timestamp).toLocaleTimeString()}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center gap-3">
        {/* Play/Pause button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={togglePlayPause}
          disabled={isLoading || !!error}
          className={cn(
            "rounded-full",
            isPlaying && "bg-blue-500 hover:bg-blue-600 text-white"
          )}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5" />
          )}
        </Button>

        {/* Waveform and progress */}
        <div className="flex-1">
          <div className="relative h-12 flex items-center">
            {/* Waveform bars */}
            <div className="absolute inset-0 flex items-center gap-0.5">
              {displayWaveform.map((height, i) => {
                const barProgress = (i / displayWaveform.length) * 100;
                const isActive = barProgress <= progress;
                
                return (
                  <div
                    key={i}
                    className={cn(
                      "flex-1 rounded-full transition-all duration-100",
                      isActive
                        ? "bg-blue-500"
                        : "bg-gray-300 dark:bg-gray-600"
                    )}
                    style={{
                      height: `${height * 100}%`,
                    }}
                  />
                );
              })}
            </div>

            {/* Seek slider (invisible but interactive) */}
            <Slider
              value={[currentTime]}
              max={duration}
              step={0.1}
              onValueChange={handleSeek}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>

          {/* Time display */}
          <div className="flex justify-between mt-1 text-xs text-gray-600 dark:text-gray-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Download button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDownload}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <Download className="w-4 h-4" />
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-2 text-sm text-red-500 dark:text-red-400">{error}</p>
      )}

      {/* File info */}
      {size && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {formatFileSize(size)}
        </p>
      )}
    </div>
  );
}