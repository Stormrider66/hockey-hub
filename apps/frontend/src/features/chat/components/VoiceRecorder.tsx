import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Mic, MicOff, Square, Send, X, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import AudioRecordingService, { AudioRecordingData } from '@/services/AudioRecordingService';
import { useToast } from '@/components/ui/use-toast';

interface VoiceRecorderProps {
  onSend: (audioData: AudioRecordingData) => void;
  onCancel: () => void;
  maxDuration?: number; // in seconds, default 5 minutes
}

export function VoiceRecorder({ onSend, onCancel, maxDuration = 300 }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const durationInterval = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const recorder = AudioRecordingService;

  useEffect(() => {
    // Check microphone permissions
    checkPermissions();

    // Set up event listeners
    recorder.on('started', handleRecordingStarted);
    recorder.on('stopped', handleRecordingStopped);
    recorder.on('paused', handleRecordingPaused);
    recorder.on('resumed', handleRecordingResumed);
    recorder.on('error', handleRecordingError);
    recorder.on('levelUpdate', handleLevelUpdate);

    return () => {
      recorder.removeListener('started', handleRecordingStarted);
      recorder.removeListener('stopped', handleRecordingStopped);
      recorder.removeListener('paused', handleRecordingPaused);
      recorder.removeListener('resumed', handleRecordingResumed);
      recorder.removeListener('error', handleRecordingError);
      recorder.removeListener('levelUpdate', handleLevelUpdate);

      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    };
  }, []);

  const checkPermissions = async () => {
    const permission = await recorder.checkPermissions();
    setHasPermission(permission);
  };

  const handleRecordingStarted = () => {
    setIsRecording(true);
    setIsPaused(false);
    setDuration(0);
    
    // Update duration every second
    durationInterval.current = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
  };

  const handleRecordingStopped = (data: AudioRecordingData) => {
    setIsRecording(false);
    setIsPaused(false);
    setAudioLevel(0);
    
    if (durationInterval.current) {
      clearInterval(durationInterval.current);
      durationInterval.current = null;
    }
  };

  const handleRecordingPaused = () => {
    setIsPaused(true);
    if (durationInterval.current) {
      clearInterval(durationInterval.current);
      durationInterval.current = null;
    }
  };

  const handleRecordingResumed = () => {
    setIsPaused(false);
    durationInterval.current = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
  };

  const handleRecordingError = (error: any) => {
    console.error('Recording error:', error);
    toast({
      title: 'Recording Error',
      description: 'Failed to record audio. Please check your microphone permissions.',
      variant: 'destructive',
    });
    setIsRecording(false);
    setIsPaused(false);
  };

  const handleLevelUpdate = (level: number) => {
    setAudioLevel(level);
  };

  const startRecording = async () => {
    if (!hasPermission) {
      toast({
        title: 'Microphone Permission Required',
        description: 'Please allow microphone access to record voice notes.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await recorder.startRecording({ maxDuration });
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = async () => {
    try {
      const audioData = await recorder.stopRecording();
      onSend(audioData);
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  const pauseRecording = async () => {
    try {
      await recorder.pauseRecording();
    } catch (error) {
      console.error('Failed to pause recording:', error);
    }
  };

  const resumeRecording = async () => {
    try {
      await recorder.resumeRecording();
    } catch (error) {
      console.error('Failed to resume recording:', error);
    }
  };

  const cancelRecording = () => {
    if (isRecording) {
      recorder.stopRecording().catch(console.error);
    }
    onCancel();
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (hasPermission === false) {
    return (
      <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <MicOff className="w-5 h-5" />
          <span className="text-sm">Microphone permission denied</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
      {/* Cancel button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={cancelRecording}
        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <X className="w-5 h-5" />
      </Button>

      {/* Recording controls */}
      {!isRecording ? (
        <Button
          variant="default"
          size="icon"
          onClick={startRecording}
          className="bg-red-500 hover:bg-red-600 text-white"
        >
          <Mic className="w-5 h-5" />
        </Button>
      ) : (
        <>
          {isPaused ? (
            <Button
              variant="default"
              size="icon"
              onClick={resumeRecording}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              <Play className="w-5 h-5" />
            </Button>
          ) : (
            <Button
              variant="default"
              size="icon"
              onClick={pauseRecording}
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
            >
              <Pause className="w-5 h-5" />
            </Button>
          )}
          
          <Button
            variant="default"
            size="icon"
            onClick={stopRecording}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Send className="w-5 h-5" />
          </Button>
        </>
      )}

      {/* Duration and level indicator */}
      <div className="flex-1 flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {formatDuration(duration)} / {formatDuration(maxDuration)}
        </span>
        
        {/* Audio level visualization */}
        <div className="flex-1 flex items-center gap-1">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-4 w-1 rounded-full transition-all duration-100",
                audioLevel * 20 > i
                  ? "bg-green-500"
                  : "bg-gray-300 dark:bg-gray-700"
              )}
              style={{
                height: `${8 + (audioLevel * 20 > i ? audioLevel * 16 : 0)}px`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Recording indicator */}
      {isRecording && !isPaused && (
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm text-red-500 font-medium">Recording</span>
        </div>
      )}
    </div>
  );
}