/**
 * TacticalVideoPlayer Component
 * 
 * Professional video player with tactical analysis features
 * Uses video.js for robust video handling and custom controls
 */

'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  SkipBack, 
  SkipForward,
  Settings,
  Download,
  Share2,
  Camera
} from '@/components/icons';
import type { 
  VideoSource, 
  VideoPlayerState, 
  VideoPlayerControls,
  VideoEventHandlers,
  VideoAnnotation 
} from '@/types/tactical/video.types';
import { VideoAnnotationLayer } from './VideoAnnotationLayer';
import { cn } from '@/lib/utils';

export interface TacticalVideoPlayerProps {
  source: VideoSource;
  annotations?: VideoAnnotation[];
  showAnnotations?: boolean;
  showControls?: boolean;
  showTimeline?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  playbackRates?: number[];
  onStateChange?: (state: VideoPlayerState) => void;
  onAnnotationAdd?: (annotation: VideoAnnotation) => void;
  onAnnotationUpdate?: (annotation: VideoAnnotation) => void;
  onAnnotationDelete?: (annotationId: string) => void;
  eventHandlers?: VideoEventHandlers;
  className?: string;
}

interface FrameControlsProps {
  onSkipFrames: (frames: number) => void;
  disabled?: boolean;
}

const FrameControls: React.FC<FrameControlsProps> = ({ onSkipFrames, disabled }) => {
  return (
    <div className="flex items-center space-x-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onSkipFrames(-1)}
        disabled={disabled}
        className="p-1 h-8 w-8"
      >
        <SkipBack className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onSkipFrames(1)}
        disabled={disabled}
        className="p-1 h-8 w-8"
      >
        <SkipForward className="w-4 h-4" />
      </Button>
    </div>
  );
};

export const TacticalVideoPlayer: React.FC<TacticalVideoPlayerProps> = ({
  source,
  annotations = [],
  showAnnotations = true,
  showControls = true,
  showTimeline = true,
  autoPlay = false,
  muted = false,
  loop = false,
  playbackRates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2],
  onStateChange,
  onAnnotationAdd,
  onAnnotationUpdate,
  onAnnotationDelete,
  eventHandlers,
  className
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [state, setState] = useState<VideoPlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    muted: muted,
    playbackRate: 1,
    fullscreen: false,
    loading: true,
    buffered: null
  });

  const [showCustomControls, setShowCustomControls] = useState(false);

  // Initialize video.js player
  useEffect(() => {
    if (!videoRef.current) return;

    const player = videojs(videoRef.current, {
      controls: false, // We'll use custom controls
      fluid: true,
      responsive: true,
      playbackRates: playbackRates,
      sources: [{
        src: source.url,
        type: getVideoMimeType(source.format || 'mp4')
      }],
      poster: source.thumbnailUrl,
      autoplay: autoPlay,
      muted: muted,
      loop: loop,
      preload: 'metadata',
      html5: {
        vhs: {
          overrideNative: true
        }
      }
    });

    playerRef.current = player;

    // Set up event listeners
    player.on('loadedmetadata', () => {
      const newState = {
        ...state,
        duration: player.duration() || 0,
        loading: false
      };
      setState(newState);
      onStateChange?.(newState);
      eventHandlers?.onLoaded?.();
    });

    player.on('play', () => {
      const newState = { ...state, isPlaying: true };
      setState(newState);
      onStateChange?.(newState);
      eventHandlers?.onPlay?.();
    });

    player.on('pause', () => {
      const newState = { ...state, isPlaying: false };
      setState(newState);
      onStateChange?.(newState);
      eventHandlers?.onPause?.();
    });

    player.on('timeupdate', () => {
      const currentTime = player.currentTime() || 0;
      const newState = { 
        ...state, 
        currentTime,
        buffered: player.buffered()
      };
      setState(newState);
      onStateChange?.(newState);
      eventHandlers?.onTimeUpdate?.(currentTime);
    });

    player.on('seeked', () => {
      const currentTime = player.currentTime() || 0;
      eventHandlers?.onSeek?.(currentTime);
    });

    player.on('ended', () => {
      const newState = { ...state, isPlaying: false };
      setState(newState);
      onStateChange?.(newState);
      eventHandlers?.onEnded?.();
    });

    player.on('volumechange', () => {
      const newState = {
        ...state,
        volume: player.volume(),
        muted: player.muted()
      };
      setState(newState);
      onStateChange?.(newState);
    });

    player.on('ratechange', () => {
      const newState = { ...state, playbackRate: player.playbackRate() };
      setState(newState);
      onStateChange?.(newState);
    });

    player.on('error', (error) => {
      console.error('Video player error:', error);
      eventHandlers?.onError?.(new Error('Video playback error'));
    });

    // Fullscreen change detection
    const handleFullscreenChange = () => {
      const isFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      const newState = { ...state, fullscreen: isFullscreen };
      setState(newState);
      onStateChange?.(newState);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
      }
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [source.url]);

  // Create player controls
  const controls: VideoPlayerControls = {
    play: () => playerRef.current?.play(),
    pause: () => playerRef.current?.pause(),
    seek: (time: number) => playerRef.current?.currentTime(time),
    setVolume: (volume: number) => playerRef.current?.volume(volume),
    setPlaybackRate: (rate: number) => playerRef.current?.playbackRate(rate),
    toggleMute: () => playerRef.current?.muted(!playerRef.current.muted()),
    toggleFullscreen: async () => {
      if (!containerRef.current) return;
      
      if (state.fullscreen) {
        await document.exitFullscreen?.();
      } else {
        await containerRef.current.requestFullscreen?.();
      }
    },
    skipFrames: (frames: number) => {
      if (!playerRef.current) return;
      const framerate = 30; // Assume 30fps, could be detected from video
      const timeStep = frames / framerate;
      const newTime = Math.max(0, Math.min(state.duration, state.currentTime + timeStep));
      playerRef.current.currentTime(newTime);
    },
    takeScreenshot: async (): Promise<string> => {
      if (!videoRef.current) throw new Error('Video not available');
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not available');
      
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      ctx.drawImage(videoRef.current, 0, 0);
      
      return canvas.toDataURL('image/png');
    }
  };

  const formatTime = useCallback((time: number): string => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const handleTimelineClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!showTimeline) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * state.duration;
    
    controls.seek(newTime);
  };

  const progressPercentage = state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0;

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative bg-black rounded-lg overflow-hidden group",
        state.fullscreen && "fixed inset-0 z-50 rounded-none",
        className
      )}
      onMouseEnter={() => setShowCustomControls(true)}
      onMouseLeave={() => setShowCustomControls(false)}
    >
      {/* Video Element */}
      <div className="relative">
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          playsInline
          crossOrigin="anonymous"
        />
        
        {/* Video Annotation Layer */}
        {showAnnotations && (
          <VideoAnnotationLayer
            annotations={annotations}
            currentTime={state.currentTime}
            videoElement={videoRef.current}
            isPlaying={state.isPlaying}
            onAnnotationAdd={onAnnotationAdd}
            onAnnotationUpdate={onAnnotationUpdate}
            onAnnotationDelete={onAnnotationDelete}
            canEdit={true}
          />
        )}

        {/* Loading Overlay */}
        {state.loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}

        {/* Custom Controls */}
        {showControls && (showCustomControls || state.isPlaying) && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 transform transition-transform duration-300">
            {/* Timeline */}
            {showTimeline && (
              <div className="mb-4">
                <div 
                  className="relative h-2 bg-white/20 rounded-full cursor-pointer"
                  onClick={handleTimelineClick}
                >
                  <div 
                    className="absolute left-0 top-0 h-full bg-blue-500 rounded-full transition-all duration-100"
                    style={{ width: `${progressPercentage}%` }}
                  />
                  
                  {/* Buffer indicator */}
                  {state.buffered && (
                    <div className="absolute left-0 top-0 h-full bg-white/30 rounded-full">
                      {Array.from({ length: state.buffered.length }).map((_, i) => (
                        <div
                          key={i}
                          className="absolute top-0 h-full bg-white/30"
                          style={{
                            left: `${(state.buffered!.start(i) / state.duration) * 100}%`,
                            width: `${((state.buffered!.end(i) - state.buffered!.start(i)) / state.duration) * 100}%`
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Time display */}
                <div className="flex justify-between text-white text-sm mt-1">
                  <span>{formatTime(state.currentTime)}</span>
                  <span>{formatTime(state.duration)}</span>
                </div>
              </div>
            )}

            {/* Control buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {/* Play/Pause */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={state.isPlaying ? controls.pause : controls.play}
                  className="text-white hover:bg-white/20"
                >
                  {state.isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5" />
                  )}
                </Button>

                {/* Frame controls */}
                <FrameControls onSkipFrames={controls.skipFrames} />

                {/* Volume */}
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={controls.toggleMute}
                    className="text-white hover:bg-white/20"
                  >
                    {state.muted ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </Button>
                  
                  <div className="w-16">
                    <Slider
                      value={[state.muted ? 0 : state.volume * 100]}
                      onValueChange={([value]) => {
                        const volume = value / 100;
                        controls.setVolume(volume);
                        if (volume > 0 && state.muted) {
                          controls.toggleMute();
                        }
                      }}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Playback speed */}
                <select
                  value={state.playbackRate}
                  onChange={(e) => controls.setPlaybackRate(Number(e.target.value))}
                  className="bg-transparent text-white text-sm border border-white/20 rounded px-2 py-1"
                >
                  {playbackRates.map(rate => (
                    <option key={rate} value={rate} className="bg-black">
                      {rate}x
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2">
                {/* Screenshot */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    try {
                      const screenshot = await controls.takeScreenshot();
                      // Handle screenshot (could download or show modal)
                      const link = document.createElement('a');
                      link.download = `screenshot-${Date.now()}.png`;
                      link.href = screenshot;
                      link.click();
                    } catch (error) {
                      console.error('Screenshot failed:', error);
                    }
                  }}
                  className="text-white hover:bg-white/20"
                >
                  <Camera className="w-4 h-4" />
                </Button>

                {/* Settings */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                >
                  <Settings className="w-4 h-4" />
                </Button>

                {/* Share */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                >
                  <Share2 className="w-4 h-4" />
                </Button>

                {/* Fullscreen */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={controls.toggleFullscreen}
                  className="text-white hover:bg-white/20"
                >
                  <Maximize className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Utility function to get MIME type
function getVideoMimeType(format: string): string {
  const mimeTypes: Record<string, string> = {
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'ogg': 'video/ogg',
    'mov': 'video/quicktime',
    'avi': 'video/x-msvideo',
    'm3u8': 'application/x-mpegURL'
  };
  
  return mimeTypes[format.toLowerCase()] || 'video/mp4';
}

export default TacticalVideoPlayer;