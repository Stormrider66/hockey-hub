'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize,
  MessageCircle,
  Eye,
  Clock,
  Target,
  FileText,
  X,
  ChevronRight,
  Bookmark,
  Share2
} from '@/components/icons';
import { useTranslation } from '@hockey-hub/translations';

interface VideoTimestamp {
  time: number;
  title: string;
  description: string;
  playType?: string;
  tags?: string[];
}

interface TacticalOverlay {
  timestamp: number;
  overlayData: any;
  annotations: string[];
}

interface TacticalVideoViewerProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title: string;
  timestamps: VideoTimestamp[];
  tacticalOverlays?: TacticalOverlay[];
  analysisNotes?: string;
  relatedPlays?: string[];
  onStartDiscussion?: () => void;
  onShare?: () => void;
}

export default function TacticalVideoViewer({
  isOpen,
  onClose,
  videoUrl,
  title,
  timestamps = [],
  tacticalOverlays = [],
  analysisNotes,
  relatedPlays = [],
  onStartDiscussion,
  onShare
}: TacticalVideoViewerProps) {
  const { t } = useTranslation(['chat', 'coach']);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showOverlays, setShowOverlays] = useState(true);
  const [activeTimestamp, setActiveTimestamp] = useState<VideoTimestamp | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Initialize video when modal opens
  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.load();
    }
  }, [isOpen]);

  // Update current time
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  // Check for active timestamp
  useEffect(() => {
    const current = timestamps.find(ts => 
      currentTime >= ts.time && currentTime < ts.time + 10
    );
    setActiveTimestamp(current || null);
  }, [currentTime, timestamps]);

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle play/pause
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Jump to timestamp
  const jumpToTime = (time: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = time;
    setCurrentTime(time);
  };

  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume / 100;
    }
    if (newVolume === 0 && !isMuted) {
      setIsMuted(true);
    } else if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Handle playback rate change
  const changePlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  // Skip forward/backward
  const skip = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Get current tactical overlay
  const getCurrentOverlay = (): TacticalOverlay | null => {
    return tacticalOverlays.find(overlay => 
      Math.abs(overlay.timestamp - currentTime) < 2
    ) || null;
  };

  const currentOverlay = getCurrentOverlay();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[95vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Play className="h-6 w-6" />
                {title}
              </DialogTitle>
              <DialogDescription className="mt-2">
                Video analysis with tactical overlays and key moment timestamps
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={onStartDiscussion}>
                <MessageCircle className="h-4 w-4 mr-2" />
                Discuss
              </Button>
              <Button size="sm" variant="outline" onClick={onShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button size="sm" variant="ghost" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Video Player Section */}
          <div className="flex-1 flex flex-col bg-black">
            {/* Video Container */}
            <div className="flex-1 relative">
              <video
                ref={videoRef}
                className="w-full h-full object-contain"
                src={videoUrl}
                playsInline
              >
                Your browser does not support the video tag.
              </video>

              {/* Tactical Overlay */}
              {showOverlays && currentOverlay && (
                <div className="absolute inset-0 pointer-events-none">
                  <svg className="w-full h-full">
                    {/* Mock tactical overlay - would be dynamic based on overlay data */}
                    <g opacity="0.8">
                      {/* Player movement arrows */}
                      <defs>
                        <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                          <path d="M0,0 L0,6 L9,3 z" fill="#ff6b35"/>
                        </marker>
                      </defs>
                      <line x1="20%" y1="30%" x2="60%" y2="45%" stroke="#ff6b35" strokeWidth="3" markerEnd="url(#arrow)" />
                      <line x1="80%" y1="60%" x2="50%" y2="40%" stroke="#3b82f6" strokeWidth="3" markerEnd="url(#arrow)" />
                      
                      {/* Area highlights */}
                      <circle cx="40%" cy="35%" r="30" fill="rgba(59, 130, 246, 0.2)" stroke="#3b82f6" strokeWidth="2" strokeDasharray="5,5" />
                      
                      {/* Position markers */}
                      <circle cx="30%" cy="50%" r="8" fill="#ef4444" stroke="white" strokeWidth="2" />
                      <text x="30%" y="50%" textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="12" fontWeight="bold">1</text>
                    </g>
                  </svg>
                  
                  {/* Overlay annotations */}
                  <div className="absolute top-4 left-4 bg-black/70 text-white p-3 rounded-lg max-w-sm">
                    <div className="font-medium mb-1">Tactical Analysis</div>
                    <div className="text-sm space-y-1">
                      {currentOverlay.annotations.map((annotation, i) => (
                        <div key={i}>• {annotation}</div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Active Timestamp Popup */}
              {activeTimestamp && (
                <div className="absolute bottom-20 left-4 bg-black/80 text-white p-3 rounded-lg max-w-md">
                  <div className="font-medium text-sm mb-1">{activeTimestamp.title}</div>
                  <div className="text-xs text-gray-300">{activeTimestamp.description}</div>
                  {activeTimestamp.playType && (
                    <Badge variant="secondary" className="text-xs mt-2">
                      {activeTimestamp.playType}
                    </Badge>
                  )}
                </div>
              )}

              {/* Loading State */}
              {!duration && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
                    <p>Loading video...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Video Controls */}
            <div className="bg-gray-900 text-white p-4">
              {/* Progress Bar */}
              <div className="mb-4">
                <div 
                  className="w-full h-2 bg-gray-700 rounded cursor-pointer relative"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const percentage = x / rect.width;
                    jumpToTime(percentage * duration);
                  }}
                >
                  <div 
                    className="h-full bg-blue-600 rounded"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  />
                  
                  {/* Timestamp markers */}
                  {timestamps.map((ts, i) => (
                    <div
                      key={i}
                      className="absolute top-0 h-full w-1 bg-yellow-500"
                      style={{ left: `${(ts.time / duration) * 100}%` }}
                      title={ts.title}
                    />
                  ))}
                </div>
              </div>

              {/* Controls Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={togglePlay}
                    className="text-white hover:bg-gray-800"
                  >
                    {isPlaying ? (
                      <Pause className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5" />
                    )}
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => skip(-10)}
                    className="text-white hover:bg-gray-800"
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => skip(10)}
                    className="text-white hover:bg-gray-800"
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>

                  <div className="flex items-center gap-2 text-sm">
                    <span>{formatTime(currentTime)}</span>
                    <span>/</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Playback Speed */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Speed:</span>
                    <select
                      value={playbackRate}
                      onChange={(e) => changePlaybackRate(Number(e.target.value))}
                      className="bg-gray-800 text-white text-xs rounded px-2 py-1 border-0"
                    >
                      <option value={0.25}>0.25x</option>
                      <option value={0.5}>0.5x</option>
                      <option value={0.75}>0.75x</option>
                      <option value={1}>1x</option>
                      <option value={1.25}>1.25x</option>
                      <option value={1.5}>1.5x</option>
                      <option value={2}>2x</option>
                    </select>
                  </div>

                  {/* Volume Control */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={toggleMute}
                      className="text-white hover:bg-gray-800"
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </Button>
                    <div className="w-20">
                      <Slider
                        value={[isMuted ? 0 : volume]}
                        onValueChange={handleVolumeChange}
                        max={100}
                        step={1}
                        className="cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Overlay Toggle */}
                  <Button
                    size="sm"
                    variant={showOverlays ? "default" : "ghost"}
                    onClick={() => setShowOverlays(!showOverlays)}
                    className="text-white hover:bg-gray-800"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>

                  {/* Fullscreen */}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="text-white hover:bg-gray-800"
                  >
                    <Maximize className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Side Panel */}
          <div className="w-96 border-l bg-muted/20">
            <ScrollArea className="h-full">
              <div className="p-6 space-y-6">
                {/* Analysis Notes */}
                {analysisNotes && (
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Analysis Notes
                      </h3>
                      <p className="text-sm text-muted-foreground">{analysisNotes}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Key Moments Timeline */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Key Moments ({timestamps.length})
                  </h3>
                  <div className="space-y-2">
                    {timestamps.map((ts, index) => {
                      const minutes = Math.floor(ts.time / 60);
                      const seconds = Math.floor(ts.time % 60);
                      const isActive = activeTimestamp?.time === ts.time;
                      
                      return (
                        <Card 
                          key={index} 
                          className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                            isActive ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                          }`}
                          onClick={() => jumpToTime(ts.time)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="outline" className="font-mono text-xs">
                                {minutes}:{seconds.toString().padStart(2, '0')}
                              </Badge>
                              {ts.playType && (
                                <Badge variant="secondary" className="text-xs">
                                  {ts.playType}
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm font-medium mb-1">{ts.title}</div>
                            <div className="text-xs text-muted-foreground">{ts.description}</div>
                            {ts.tags && ts.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {ts.tags.map((tag, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                {/* Related Plays */}
                {relatedPlays.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Related Plays ({relatedPlays.length})
                    </h3>
                    <div className="space-y-2">
                      {relatedPlays.map((playId, index) => (
                        <Card key={index} className="cursor-pointer hover:bg-muted/50">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-sm font-medium">Play System #{playId}</div>
                                <div className="text-xs text-muted-foreground">Referenced in video</div>
                              </div>
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="space-y-2">
                  <Button className="w-full" onClick={onStartDiscussion}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Start Discussion
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Bookmark className="h-4 w-4 mr-2" />
                    Bookmark Video
                  </Button>
                </div>

                {/* Keyboard Shortcuts */}
                <div className="text-xs text-muted-foreground space-y-1">
                  <h4 className="font-medium text-sm mb-2">Keyboard Shortcuts:</h4>
                  <div>• Spacebar: Play/Pause</div>
                  <div>• ← →: Skip 10s back/forward</div>
                  <div>• ↑ ↓: Volume up/down</div>
                  <div>• M: Toggle mute</div>
                  <div>• F: Toggle fullscreen</div>
                  <div>• O: Toggle overlays</div>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}