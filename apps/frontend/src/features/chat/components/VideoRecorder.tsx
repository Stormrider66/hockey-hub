import React, { useState, useRef, useEffect } from 'react';
import { Video, VideoOff, Pause, Play, Square, RotateCw, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { videoRecordingService } from '@/services/VideoRecordingService';
import { cn } from '@/lib/utils';

interface VideoRecorderProps {
  onVideoRecorded: (videoBlob: Blob, thumbnail: string, duration: number) => void;
  onCancel: () => void;
  maxDuration?: number;
  maxFileSize?: number;
  quality?: 'low' | 'medium' | 'high';
}

export const VideoRecorder: React.FC<VideoRecorderProps> = ({
  onVideoRecorded,
  onCancel,
  maxDuration = 60,
  maxFileSize = 25,
  quality = 'medium'
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [fileSize, setFileSize] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    checkPermission();
    return () => {
      videoRecordingService.cancelRecording();
    };
  }, []);

  const checkPermission = async () => {
    const permission = await videoRecordingService.requestPermission();
    setHasPermission(permission);
    if (!permission) {
      setError('Camera and microphone access is required to record videos');
    }
  };

  const startRecording = async () => {
    if (!hasPermission) {
      await checkPermission();
      return;
    }

    try {
      setError(null);
      await videoRecordingService.startRecording(
        { maxDuration, maxFileSize, quality, facingMode },
        videoRef.current!,
        (state) => {
          setIsRecording(state.isRecording);
          setIsPaused(state.isPaused);
          setDuration(state.duration);
          setFileSize(state.fileSize);
          if (state.error) {
            setError(state.error);
          }
        }
      );
    } catch (err) {
      setError('Failed to start recording. Please check your camera and microphone.');
    }
  };

  const pauseRecording = () => {
    videoRecordingService.pauseRecording();
  };

  const resumeRecording = () => {
    videoRecordingService.resumeRecording();
  };

  const stopRecording = async () => {
    setIsProcessing(true);
    try {
      const videoBlob = await videoRecordingService.stopRecording();
      if (videoBlob) {
        const thumbnail = await videoRecordingService.generateThumbnail(videoBlob);
        onVideoRecorded(videoBlob, thumbnail, duration);
      }
    } catch (err) {
      setError('Failed to process video. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const cancelRecording = () => {
    videoRecordingService.cancelRecording();
    onCancel();
  };

  const switchCamera = () => {
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);
    
    // If recording, restart with new camera
    if (isRecording || isPaused) {
      videoRecordingService.cancelRecording();
      setIsRecording(false);
      setIsPaused(false);
      setDuration(0);
      setFileSize(0);
      // Auto-start with new camera
      setTimeout(() => startRecording(), 100);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (hasPermission === false) {
    return (
      <div className="p-6 text-center">
        <VideoOff className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <Button onClick={checkPermission} variant="outline">
          Grant Permission
        </Button>
      </div>
    );
  }

  return (
    <div className="relative bg-background rounded-lg overflow-hidden">
      {/* Video Preview */}
      <div className="relative aspect-video bg-black">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />
        
        {/* Recording Indicator */}
        {isRecording && !isPaused && (
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-sm font-medium">Recording</span>
          </div>
        )}

        {/* Duration and File Size */}
        <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
          <div className="bg-black/70 text-white px-3 py-1 rounded-full">
            <span className="text-sm font-mono">{formatDuration(duration)}</span>
            <span className="text-xs text-gray-300"> / {formatDuration(maxDuration)}</span>
          </div>
          {fileSize > 0 && (
            <div className="bg-black/70 text-white px-3 py-1 rounded-full">
              <span className="text-xs">{fileSize.toFixed(1)} MB</span>
            </div>
          )}
        </div>

        {/* Switch Camera Button */}
        <Button
          onClick={switchCamera}
          variant="ghost"
          size="icon"
          className="absolute bottom-4 right-4 bg-black/50 hover:bg-black/70 text-white"
          disabled={isProcessing}
        >
          <RotateCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Controls */}
      <div className="p-4 bg-background border-t">
        {error && (
          <div className="mb-3 p-2 bg-destructive/10 text-destructive text-sm rounded">
            {error}
          </div>
        )}

        <div className="flex items-center justify-center gap-3">
          {!isRecording && !isPaused && duration === 0 && (
            <>
              <Button
                onClick={cancelRecording}
                variant="outline"
                size="sm"
                disabled={isProcessing}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={startRecording}
                variant="default"
                size="sm"
                className="bg-red-600 hover:bg-red-700"
                disabled={isProcessing}
              >
                <Video className="w-4 h-4 mr-2" />
                Start Recording
              </Button>
            </>
          )}

          {(isRecording || isPaused) && (
            <>
              <Button
                onClick={cancelRecording}
                variant="outline"
                size="icon"
                disabled={isProcessing}
              >
                <X className="w-4 h-4" />
              </Button>

              {isRecording && (
                <Button
                  onClick={pauseRecording}
                  variant="outline"
                  size="icon"
                  disabled={isProcessing}
                >
                  <Pause className="w-4 h-4" />
                </Button>
              )}

              {isPaused && (
                <Button
                  onClick={resumeRecording}
                  variant="outline"
                  size="icon"
                  disabled={isProcessing}
                >
                  <Play className="w-4 h-4" />
                </Button>
              )}

              <Button
                onClick={stopRecording}
                variant="default"
                size="sm"
                disabled={isProcessing}
                className="gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Square className="w-4 h-4" />
                    Stop & Send
                  </>
                )}
              </Button>
            </>
          )}
        </div>

        {/* Progress Bar */}
        {(isRecording || isPaused) && (
          <div className="mt-3">
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-red-600 transition-all duration-300"
                style={{ width: `${(duration / maxDuration) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};