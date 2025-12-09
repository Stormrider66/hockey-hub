/**
 * Live Coaching Mode Component
 * Provides real-time coaching tools for tactical collaboration sessions
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Square,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Screen,
  ScreenShare,
  Pointer,
  Highlight,
  MessageCircle,
  Users,
  Settings,
  Recording,
  Download,
  Share2,
  Eye,
  EyeOff,
  Zap,
  Target,
  Clock,
  Activity,
  ChevronDown,
  MoreHorizontal,
  X,
  Send,
  Camera,
  Monitor
} from '@/components/icons';
import { toast } from 'sonner';
import { useTranslation } from '@hockey-hub/translations';
import { 
  useCollaborationPresentation,
  useCollaborationChat,
  useCollaboration
} from '../../providers/CollaborationProvider';
import {
  PresentationState,
  CoachingControl,
  CollaborationUser
} from '@hockey-hub/shared-types/src/tactical/collaboration.types';

interface LiveCoachingModeProps {
  isActive: boolean;
  onToggle: (active: boolean) => void;
  playId: string;
  sessionId: string;
}

interface CoachingTool {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  color: string;
  isActive: boolean;
}

interface PointerState {
  x: number;
  y: number;
  visible: boolean;
  color: string;
}

interface HighlightArea {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  opacity: number;
  temporary: boolean;
}

export default function LiveCoachingMode({
  isActive,
  onToggle,
  playId,
  sessionId
}: LiveCoachingModeProps) {
  const { t } = useTranslation('coach');
  const {
    presentationState,
    isPresenting,
    startPresentation,
    updatePresentation,
    endPresentation
  } = useCollaborationPresentation();
  
  const {
    messages,
    unreadCount,
    sendMessage,
    markMessagesRead
  } = useCollaborationChat();
  
  const { state } = useCollaboration();
  
  // Local state
  const [currentTool, setCurrentTool] = useState<string>('pointer');
  const [playbackSpeed, setPlaybackSpeed] = useState([1]);
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(10);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState([100]);
  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [screenShareEnabled, setScreenShareEnabled] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [pointer, setPointer] = useState<PointerState>({
    x: 0,
    y: 0,
    visible: false,
    color: '#ff4444'
  });
  const [highlights, setHighlights] = useState<HighlightArea[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  
  // Refs
  const boardRef = useRef<HTMLDivElement>(null);
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);
  const playbackTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Coaching tools configuration
  const coachingTools: CoachingTool[] = [
    { id: 'pointer', name: t('coaching.tools.pointer'), icon: Pointer, color: '#3b82f6', isActive: currentTool === 'pointer' },
    { id: 'highlight', name: t('coaching.tools.highlight'), icon: Highlight, color: '#f59e0b', isActive: currentTool === 'highlight' },
    { id: 'target', name: t('coaching.tools.target'), icon: Target, color: '#ef4444', isActive: currentTool === 'target' },
    { id: 'focus', name: t('coaching.tools.focus'), icon: Eye, color: '#8b5cf6', isActive: currentTool === 'focus' }
  ];

  // Start/stop presentation
  const handleTogglePresentation = useCallback(() => {
    if (isPresenting) {
      endPresentation();
      setIsPlaying(false);
      toast.success(t('coaching.presentationEnded'));
    } else {
      startPresentation();
      toast.success(t('coaching.presentationStarted'));
    }
  }, [isPresenting, startPresentation, endPresentation, t]);

  // Playback controls
  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    
    const control: Omit<CoachingControl, 'timestamp'> = {
      type: 'play',
      data: { currentStep, speed: playbackSpeed[0] }
    };
    
    updatePresentation({
      isPresenting: true,
      currentStep,
      playbackSpeed: playbackSpeed[0],
      isPaused: false
    });

    // Start playback timer
    playbackTimer.current = setInterval(() => {
      setCurrentStep(prev => {
        const next = prev + 1;
        if (next >= totalSteps) {
          setIsPlaying(false);
          return prev;
        }
        
        updatePresentation({ currentStep: next });
        return next;
      });
    }, 1000 / playbackSpeed[0]);
  }, [currentStep, playbackSpeed, updatePresentation, totalSteps]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    
    if (playbackTimer.current) {
      clearInterval(playbackTimer.current);
      playbackTimer.current = null;
    }
    
    updatePresentation({
      isPaused: true
    });
  }, [updatePresentation]);

  const handleStepForward = useCallback(() => {
    const nextStep = Math.min(currentStep + 1, totalSteps - 1);
    setCurrentStep(nextStep);
    updatePresentation({ currentStep: nextStep });
  }, [currentStep, totalSteps, updatePresentation]);

  const handleStepBack = useCallback(() => {
    const prevStep = Math.max(currentStep - 1, 0);
    setCurrentStep(prevStep);
    updatePresentation({ currentStep: prevStep });
  }, [currentStep, updatePresentation]);

  // Tool selection
  const handleToolSelect = useCallback((toolId: string) => {
    setCurrentTool(toolId);
    updatePresentation({
      highlightedElements: toolId === 'highlight' ? ['selected-element'] : []
    });
  }, [updatePresentation]);

  // Mouse interactions for coaching tools
  const handleBoardMouseMove = useCallback((e: React.MouseEvent) => {
    if (!boardRef.current) return;
    
    const rect = boardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (currentTool === 'pointer' && isPresenting) {
      setPointer(prev => ({ ...prev, x, y, visible: true }));
      updatePresentation({
        pointerPosition: { x, y }
      });
    }
  }, [currentTool, isPresenting, updatePresentation]);

  const handleBoardClick = useCallback((e: React.MouseEvent) => {
    if (!boardRef.current || !isPresenting) return;
    
    const rect = boardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (currentTool === 'highlight') {
      const newHighlight: HighlightArea = {
        id: `highlight-${Date.now()}`,
        x: x - 50,
        y: y - 25,
        width: 100,
        height: 50,
        color: '#fbbf24',
        opacity: 0.3,
        temporary: true
      };
      
      setHighlights(prev => [...prev, newHighlight]);
      
      // Auto-remove temporary highlights
      setTimeout(() => {
        setHighlights(prev => prev.filter(h => h.id !== newHighlight.id));
      }, 3000);
    }
  }, [currentTool, isPresenting]);

  // Recording controls
  const handleStartRecording = useCallback(() => {
    setIsRecording(true);
    setRecordingDuration(0);
    
    recordingTimer.current = setInterval(() => {
      setRecordingDuration(prev => prev + 1);
    }, 1000);
    
    toast.success(t('coaching.recordingStarted'));
  }, [t]);

  const handleStopRecording = useCallback(() => {
    setIsRecording(false);
    
    if (recordingTimer.current) {
      clearInterval(recordingTimer.current);
      recordingTimer.current = null;
    }
    
    toast.success(t('coaching.recordingStopped', { duration: recordingDuration }));
  }, [recordingDuration, t]);

  // Chat functionality
  const handleSendMessage = useCallback(() => {
    if (chatMessage.trim()) {
      sendMessage(chatMessage.trim());
      setChatMessage('');
    }
  }, [chatMessage, sendMessage]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
      if (playbackTimer.current) {
        clearInterval(playbackTimer.current);
      }
    };
  }, []);

  // Format time helper
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isActive) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => onToggle(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
        >
          <Video className="w-4 h-4 mr-2" />
          {t('coaching.startLiveMode')}
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/95">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-900 text-white">
        <div className="flex items-center gap-4">
          <Badge variant={isPresenting ? 'destructive' : 'secondary'}>
            {isPresenting ? t('coaching.presenting') : t('coaching.standby')}
          </Badge>
          
          {isRecording && (
            <Badge variant="destructive" className="animate-pulse">
              <Recording className="w-3 h-3 mr-1" />
              {formatTime(recordingDuration)}
            </Badge>
          )}
          
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>{state.participants.length}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowChat(!showChat)}
            className="relative"
          >
            <MessageCircle className="w-4 h-4" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 text-xs">
                {unreadCount}
              </Badge>
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggle(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-64px)]">
        {/* Main content area */}
        <div className="flex-1 relative">
          {/* Tactical board area */}
          <div
            ref={boardRef}
            className="w-full h-full bg-green-600 relative cursor-crosshair"
            onMouseMove={handleBoardMouseMove}
            onClick={handleBoardClick}
          >
            {/* Hockey rink background would go here */}
            <div className="absolute inset-4 border-4 border-white rounded-lg opacity-30" />
            
            {/* Pointer */}
            {pointer.visible && isPresenting && (
              <div
                className="absolute w-6 h-6 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10"
                style={{ left: pointer.x, top: pointer.y }}
              >
                <div className="w-full h-full bg-red-500 rounded-full shadow-lg animate-pulse" />
              </div>
            )}
            
            {/* Highlights */}
            {highlights.map(highlight => (
              <div
                key={highlight.id}
                className="absolute border-2 border-yellow-400 rounded-lg pointer-events-none z-10 animate-pulse"
                style={{
                  left: highlight.x,
                  top: highlight.y,
                  width: highlight.width,
                  height: highlight.height,
                  backgroundColor: highlight.color,
                  opacity: highlight.opacity
                }}
              />
            ))}
            
            {/* Other users' cursors */}
            {Object.entries(state.cursors).map(([userId, cursor]) => {
              const user = state.participants.find(p => p.id === userId);
              if (!user || userId === state.currentUser?.id) return null;
              
              return (
                <div
                  key={userId}
                  className="absolute w-4 h-4 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10"
                  style={{ left: cursor.x, top: cursor.y }}
                >
                  <div
                    className="w-full h-full rounded-full shadow-lg"
                    style={{ backgroundColor: user.color }}
                  />
                  <div className="absolute top-4 left-4 bg-black/75 text-white px-1 py-0.5 rounded text-xs whitespace-nowrap">
                    {user.name}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Coaching tools overlay */}
          <div className="absolute top-4 left-4 flex gap-2">
            {coachingTools.map(tool => {
              const IconComponent = tool.icon;
              return (
                <Button
                  key={tool.id}
                  variant={tool.isActive ? 'default' : 'secondary'}
                  size="sm"
                  onClick={() => handleToolSelect(tool.id)}
                  className={tool.isActive ? 'bg-blue-600 text-white' : ''}
                >
                  <IconComponent className="w-4 h-4" />
                </Button>
              );
            })}
          </div>
        </div>

        {/* Control panels */}
        <div className="w-80 bg-gray-800 text-white flex flex-col">
          <Tabs defaultValue="controls" className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-3 bg-gray-700">
              <TabsTrigger value="controls">{t('coaching.controls')}</TabsTrigger>
              <TabsTrigger value="participants">{t('coaching.participants')}</TabsTrigger>
              <TabsTrigger value="settings">{t('coaching.settings')}</TabsTrigger>
            </TabsList>

            <TabsContent value="controls" className="flex-1 p-4 space-y-4">
              {/* Presentation control */}
              <Card className="bg-gray-700 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-white text-sm">{t('coaching.presentation')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    onClick={handleTogglePresentation}
                    className={isPresenting ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
                    className="w-full"
                  >
                    {isPresenting ? (
                      <>
                        <Square className="w-4 h-4 mr-2" />
                        {t('coaching.stopPresentation')}
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        {t('coaching.startPresentation')}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Playback controls */}
              {isPresenting && (
                <Card className="bg-gray-700 border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-white text-sm">{t('coaching.playback')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleStepBack}
                        disabled={currentStep === 0}
                      >
                        <SkipBack className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={isPlaying ? handlePause : handlePlay}
                      >
                        {isPlaying ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleStepForward}
                        disabled={currentStep === totalSteps - 1}
                      >
                        <SkipForward className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-300">
                        {t('coaching.step')} {currentStep + 1} / {totalSteps}
                      </Label>
                      <div className="w-full bg-gray-600 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-300">
                        {t('coaching.speed')}: {playbackSpeed[0]}x
                      </Label>
                      <Slider
                        value={playbackSpeed}
                        onValueChange={setPlaybackSpeed}
                        min={0.25}
                        max={2}
                        step={0.25}
                        className="w-full"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recording controls */}
              <Card className="bg-gray-700 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-white text-sm">{t('coaching.recording')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    onClick={isRecording ? handleStopRecording : handleStartRecording}
                    className={isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
                    className="w-full"
                  >
                    {isRecording ? (
                      <>
                        <Square className="w-4 h-4 mr-2" />
                        {t('coaching.stopRecording')}
                      </>
                    ) : (
                      <>
                        <Recording className="w-4 h-4 mr-2" />
                        {t('coaching.startRecording')}
                      </>
                    )}
                  </Button>
                  
                  {isRecording && (
                    <div className="text-center text-red-400 animate-pulse">
                      {formatTime(recordingDuration)}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="participants" className="flex-1 p-4">
              <ScrollArea className="h-full">
                <div className="space-y-2">
                  {state.participants.map(participant => {
                    const presence = state.userPresences[participant.id];
                    const isOnline = presence?.status === 'online';
                    
                    return (
                      <div
                        key={participant.id}
                        className="flex items-center gap-3 p-2 rounded-lg bg-gray-700"
                      >
                        <div className="relative">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                            style={{ backgroundColor: participant.color }}
                          >
                            {participant.name[0]}
                          </div>
                          <div
                            className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-700 ${
                              isOnline ? 'bg-green-400' : 'bg-gray-400'
                            }`}
                          />
                        </div>
                        
                        <div className="flex-1">
                          <div className="text-white font-medium">{participant.name}</div>
                          <div className="text-gray-400 text-xs">{participant.role}</div>
                        </div>
                        
                        {participant.id === state.currentUser?.id && (
                          <Badge variant="outline" className="text-xs">
                            {t('coaching.you')}
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="settings" className="flex-1 p-4 space-y-4">
              {/* Audio/Video controls */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-gray-300">{t('coaching.audio')}</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAudioEnabled(!audioEnabled)}
                    className={audioEnabled ? 'text-green-400' : 'text-red-400'}
                  >
                    {audioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label className="text-gray-300">{t('coaching.video')}</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setVideoEnabled(!videoEnabled)}
                    className={videoEnabled ? 'text-green-400' : 'text-red-400'}
                  >
                    {videoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label className="text-gray-300">{t('coaching.screenShare')}</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setScreenShareEnabled(!screenShareEnabled)}
                    className={screenShareEnabled ? 'text-green-400' : 'text-red-400'}
                  >
                    {screenShareEnabled ? <Screen className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Chat overlay */}
      {showChat && (
        <div className="absolute bottom-4 right-4 w-80 h-96 bg-gray-800 rounded-lg shadow-xl border border-gray-600 flex flex-col">
          <div className="flex items-center justify-between p-3 border-b border-gray-600">
            <h3 className="text-white font-medium">{t('coaching.chat')}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowChat(false);
                markMessagesRead();
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <ScrollArea className="flex-1 p-3">
            <div className="space-y-2">
              {messages.map(message => {
                const user = state.participants.find(p => p.id === message.userId);
                return (
                  <div key={message.id} className="text-sm">
                    <div className="text-gray-400 text-xs">
                      {user?.name || 'Unknown'} • {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="text-white">{message.content}</div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
          
          <div className="p-3 border-t border-gray-600">
            <div className="flex gap-2">
              <Input
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t('coaching.typeMessage')}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!chatMessage.trim()}
                size="sm"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}