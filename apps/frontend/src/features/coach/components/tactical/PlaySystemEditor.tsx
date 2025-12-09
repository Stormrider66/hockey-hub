'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { getDefaultPlayers } from '../../utils/defaultPlayers';
import { TacticalPermissionGuard, AIPermissionGuard, useCanAccessTactical } from '../TacticalPermissionGuard';
import { useTacticalPermissions, usePlayAccess, useAIUsage, useTacticalUI } from '../../hooks/useTacticalPermissions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Save,
  FolderOpen,
  Plus,
  Edit,
  Trash2,
  Play,
  Share2,
  FileText,
  Clock,
  Users,
  Target,
  Snowflake,
  Download,
  Lightbulb,
  Eye,
  AlertTriangle,
  Calendar,
  CalendarDays,
  CalendarCheck,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Activity,
  Video,
  FileSpreadsheet,
  QrCode,
  BookOpen,
  Link
} from '@/components/icons';
import { toast } from 'sonner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useTranslation } from '@hockey-hub/translations';
import ExportManager from './ExportManager';
import EnhancedExportManager from '../export/ExportManager';
import QRCodeGenerator from '../sharing/QRCodeGenerator';
import { ExcelExportService } from '../../services/excelExportService';
import { SharingService } from '../../services/sharingService';
import { exportTemplates, getTemplatesByCategory } from '../../templates/exportTemplates';
import AIAnalysisPanel from './AIAnalysisPanel';
import { useAIAnalysis, useAnalysisVisuals, useApplySuggestions, useAIKeyboardShortcuts } from '../../hooks/useAIAnalysis';
import { tacticalCalendarService, useTacticalEvents, usePlayScheduling, TacticalEvent } from '../../services/tacticalCalendarService';
import TacticalShareModal from './TacticalShareModal';
import TacticalAnalyticsDashboard from './TacticalAnalyticsDashboard';
import { 
  tacticalStatisticsService,
  type PlayUsageStats,
  type PlayEffectivenessMetrics,
  type PlayerTacticalRating
} from '../../services/tacticalStatisticsService';
import { 
  tacticalMedicalService,
  type TacticalMedicalStatus,
  type TacticalAssignment,
  type TacticalValidationResult,
  type FormationMedicalAnalysis,
  type TacticalMedicalDashboard,
  getMedicalStatusColor,
  getMedicalStatusIcon
} from '../../services/tacticalMedicalService';
import { PLAY_TEMPLATES } from './PlayTemplates';
import { ANIMATED_PLAY_TEMPLATES } from './AnimatedPlayTemplates';
import TacticalVideoPlayer from '../video/TacticalVideoPlayer';
import VideoClipManager from '../video/VideoClipManager';
import { videoSyncService } from '../../services/videoSyncService';
import type { VideoSource, VideoClip, ClipCollection, VideoAnnotation } from '@/types/tactical/video.types';

// Dynamically import TacticalBoardCanvas to avoid SSR issues with Pixi.js
// Using canvas-based implementation to avoid React 18 compatibility issues
const TacticalBoard2D = dynamic(
  () => import('./TacticalBoardCanvas').catch((err) => {
    console.error('Failed to load TacticalBoardCanvas:', err);
    // Return a fallback component that shows an error message
    return {
      default: () => (
        <div className="h-96 flex items-center justify-center border-2 border-dashed border-yellow-300 rounded-lg bg-yellow-50">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-yellow-700 mb-2">Module Loading Failed</h3>
            <p className="text-yellow-600 mb-4">
              The tactical board module could not be loaded. Please refresh the page to try again.
            </p>
            <Button onClick={() => window.location.reload()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Page
            </Button>
          </div>
        </div>
      )
    };
  }),
  { 
    ssr: false,
    loading: () => (
      <div className="h-96 flex items-center justify-center border rounded-lg bg-muted/10">
        <div className="text-center">
          <Snowflake className="h-12 w-12 animate-spin text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">Loading tactical board...</p>
          <p className="text-xs text-muted-foreground/70 mt-2">
            Please wait while we load the interactive hockey rink
          </p>
        </div>
      </div>
    )
  }
);


interface PlaySystem {
  id: string;
  name: string;
  description: string;
  category: 'offensive' | 'defensive' | 'special-teams' | 'faceoff' | 'transition';
  situation: string;
  formation: string;
  data: any; // The actual play data (players, arrows, zones)
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
}

interface PlaySystemEditorProps {
  teamId?: string;
  onClose?: () => void;
}

export default function PlaySystemEditor({ teamId, onClose }: PlaySystemEditorProps) {
  const { t } = useTranslation(['coach', 'common']);
  
  // Permission hooks
  const permissions = useTacticalPermissions();
  const uiConfig = useTacticalUI();
  const aiUsage = useAIUsage('tactical_analysis');
  
  const [activeTab, setActiveTab] = useState('editor');
  const [currentPlay, setCurrentPlay] = useState<PlaySystem | null>(null);
  const playAccess = usePlayAccess(currentPlay as any);
  const [savedPlays, setSavedPlays] = useState<PlaySystem[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showEnhancedExportModal, setShowEnhancedExportModal] = useState(false);
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedExportTemplate, setSelectedExportTemplate] = useState<string | null>(null);
  const [playName, setPlayName] = useState('');
  const [playDescription, setPlayDescription] = useState('');
  const [playCategory, setPlayCategory] = useState<PlaySystem['category']>('offensive');
  const [playSituation, setPlaySituation] = useState('');
  const [playFormation, setPlayFormation] = useState('');
  const [playTags, setPlayTags] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showCalendarPanel, setShowCalendarPanel] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [boardMode, setBoardMode] = useState<'edit' | 'view' | 'animate'>('edit');
  
  // Initialize services
  const [excelService] = useState(() => new ExcelExportService(ExcelExportService.createDefaultOptions()));
  const [sharingService] = useState(() => new SharingService());
  
  // Ref for the tactical board to capture for export
  const tacticalBoardRef = React.useRef<HTMLDivElement>(null);
  
  // AI Analysis state
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiPanelDocked, setAiPanelDocked] = useState(true);
  const aiAnalysis = useAIAnalysis();
  const analysisVisuals = useAnalysisVisuals();

  // Video integration state
  const [videoSource, setVideoSource] = useState<VideoSource | null>(null);
  const [videoClips, setVideoClips] = useState<VideoClip[]>([]);
  const [videoAnnotations, setVideoAnnotations] = useState<VideoAnnotation[]>([]);
  const [videoCollections, setVideoCollections] = useState<ClipCollection[]>([]);
  const [isVideoSynced, setIsVideoSynced] = useState(false);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const suggestionHandler = useApplySuggestions();
  
  // Calendar integration
  const { schedulePlay, scheduling } = usePlayScheduling();
  const { events: upcomingEvents } = useTacticalEvents(
    teamId || 'current-team', 
    { 
      start: new Date().toISOString().split('T')[0], 
      end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] 
    }
  );
  
  // Statistics and analytics state
  const [playStats, setPlayStats] = useState<PlayUsageStats[]>([]);
  const [playMetrics, setPlayMetrics] = useState<PlayEffectivenessMetrics | null>(null);
  const [showAnalyticsDashboard, setShowAnalyticsDashboard] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  
  // Medical integration state
  const [playerMedicalStatus, setPlayerMedicalStatus] = useState<TacticalMedicalStatus[]>([]);
  const [medicalDashboard, setMedicalDashboard] = useState<TacticalMedicalDashboard | null>(null);
  const [showMedicalPanel, setShowMedicalPanel] = useState(false);
  const [formationAnalysis, setFormationAnalysis] = useState<FormationMedicalAnalysis | null>(null);
  const [loadingMedical, setLoadingMedical] = useState(false);

  // Keyboard shortcuts for AI analysis
  useAIKeyboardShortcuts({
    onQuickAnalysis: () => {
      if (currentPlay?.data && !aiAnalysis.isAnalyzing) {
        aiAnalysis.analyzePlay(currentPlay.data, 'quick');
        setShowAIPanel(true);
      }
    },
    onToggleAnalysisMode: () => {
      analysisVisuals.toggleAnalysisMode();
    },
    onToggleHighlights: () => {
      analysisVisuals.clearHighlights();
    },
    onOpenAIPanel: () => {
      setShowAIPanel(true);
    }
  });

  // Load saved plays from localStorage on mount
  React.useEffect(() => {
    const stored = localStorage.getItem('tacticalPlaySystems');
    if (stored) {
      setSavedPlays(JSON.parse(stored));
    }
  }, []);

  // Load play statistics when current play changes
  React.useEffect(() => {
    if (currentPlay?.id) {
      loadPlayStatistics(currentPlay.id);
    }
  }, [currentPlay?.id]);

  // Load medical data on component mount
  React.useEffect(() => {
    loadMedicalData();
  }, [teamId]);

  // Load formation medical analysis when current play changes
  React.useEffect(() => {
    if (currentPlay?.data && playerMedicalStatus.length > 0) {
      loadFormationMedicalAnalysis();
    }
  }, [currentPlay?.data, playerMedicalStatus]);

  const loadPlayStatistics = async (playId: string) => {
    setLoadingStats(true);
    try {
      const [stats, metrics] = await Promise.all([
        tacticalStatisticsService.getPlayUsageStats({ playIds: [playId] }),
        tacticalStatisticsService.getPlayEffectivenessMetrics(playId)
      ]);
      
      setPlayStats(stats);
      setPlayMetrics(metrics);
    } catch (error) {
      console.error('Error loading play statistics:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const loadMedicalData = async () => {
    if (!teamId) return;
    
    setLoadingMedical(true);
    try {
      // Get all players for the team (mock player IDs for now)
      const playerIds = ['sidney-crosby', 'nathan-mackinnon', 'connor-mcdavid', 'auston-matthews', 'leon-draisaitl'];
      
      const [medicalStatus, dashboard] = await Promise.all([
        tacticalMedicalService.getTacticalMedicalStatus(playerIds),
        tacticalMedicalService.getTacticalMedicalDashboard(teamId)
      ]);
      
      setPlayerMedicalStatus(medicalStatus);
      setMedicalDashboard(dashboard);
    } catch (error) {
      console.error('Error loading medical data:', error);
    } finally {
      setLoadingMedical(false);
    }
  };

  const loadFormationMedicalAnalysis = async () => {
    if (!currentPlay?.id || !currentPlay.data || playerMedicalStatus.length === 0) return;
    
    try {
      // Extract tactical assignments from play data (simplified)
      const assignments: TacticalAssignment[] = playerMedicalStatus.map((player, index) => ({
        playerId: player.playerId,
        position: index < 2 ? 'forward' : index < 4 ? 'defense' : 'goalie',
        role: 'standard',
        expectedIntensity: 80,
        contactLevel: 'moderate' as const,
        durationMinutes: 20
      }));
      
      const analysis = await tacticalMedicalService.analyzeFormationMedical(
        currentPlay.id,
        assignments
      );
      
      setFormationAnalysis(analysis);
    } catch (error) {
      console.error('Error loading formation medical analysis:', error);
    }
  };

  const handleSavePlay = (playData: any) => {
    setCurrentPlay({
      ...currentPlay,
      data: playData,
      updatedAt: new Date()
    } as PlaySystem);
    setShowSaveDialog(true);
  };

  const confirmSave = () => {
    if (!playName) return;

    const newPlay: PlaySystem = {
      id: currentPlay?.id || `play-${Date.now()}`,
      name: playName,
      description: playDescription,
      category: playCategory,
      situation: playSituation,
      formation: playFormation,
      data: currentPlay?.data || {},
      createdAt: currentPlay?.createdAt || new Date(),
      updatedAt: new Date(),
      tags: playTags.split(',').map(tag => tag.trim()).filter(Boolean)
    };

    const updatedPlays = currentPlay?.id
      ? savedPlays.map(p => p.id === currentPlay.id ? newPlay : p)
      : [...savedPlays, newPlay];

    setSavedPlays(updatedPlays);
    localStorage.setItem('tacticalPlaySystems', JSON.stringify(updatedPlays));
    
    setCurrentPlay(newPlay);
    setShowSaveDialog(false);
    
    // Reset form
    setPlayName('');
    setPlayDescription('');
    setPlayTags('');
  };

  const loadPlay = (play: PlaySystem) => {
    setCurrentPlay(play);
    setPlayName(play.name);
    setPlayDescription(play.description);
    setPlayCategory(play.category);
    setPlaySituation(play.situation);
    setPlayFormation(play.formation);
    setPlayTags(play.tags.join(', '));
    setActiveTab('editor');
  };

  const deletePlay = (playId: string) => {
    const updatedPlays = savedPlays.filter(p => p.id !== playId);
    setSavedPlays(updatedPlays);
    localStorage.setItem('tacticalPlaySystems', JSON.stringify(updatedPlays));
    
    if (currentPlay?.id === playId) {
      setCurrentPlay(null);
    }
  };

  // Handle scheduling play practice
  const handleSchedulePractice = async () => {
    if (!currentPlay || !teamId) return;

    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const event = await schedulePlay(currentPlay, {
        preferredDate: tomorrow.toISOString().split('T')[0],
        preferredTime: '16:00', // 4 PM default
        duration: 90, // 1.5 hours
        teamId: teamId,
        organizationId: teamId, // Assuming same for now
        intensity: 'medium',
        objectives: [
          `Practice ${currentPlay.name} execution`,
          'Improve player positioning and timing',
          'Increase play success rate to 80%+'
        ]
      });
      
      // Show success message or redirect to calendar
      console.log('Practice scheduled:', event);
    } catch (error) {
      console.error('Failed to schedule practice:', error);
    }
  };

  // Get upcoming events for current play
  const getUpcomingEventsForPlay = (playId: string) => {
    return upcomingEvents.filter(event => 
      event.tacticalMetadata?.playSystemIds?.includes(playId)
    );
  };

  const categoryColors = {
    offensive: 'bg-green-100 text-green-800',
    defensive: 'bg-red-100 text-red-800',
    'special-teams': 'bg-purple-100 text-purple-800',
    faceoff: 'bg-blue-100 text-blue-800',
    transition: 'bg-orange-100 text-orange-800'
  };

  // Use actual templates with player positions
  // Combine both template systems
  const staticTemplates = PLAY_TEMPLATES.slice(0, 6); // Get first 6 static templates
  const animatedTemplates = ANIMATED_PLAY_TEMPLATES.slice(0, 6); // Get first 6 animated templates
  const [currentPlayData, setCurrentPlayData] = useState<any>(null);

  return (
    <TacticalPermissionGuard permission="tactical.play.create">
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold">Tactical Play Editor</h2>
            <Badge variant="outline" className="text-xs">
              {permissions.userRole.replace('_', ' ')}
            </Badge>
            {uiConfig.limitations.maxPlaysPerDay > 0 && (
              <Badge variant="secondary" className="text-xs">
                {savedPlays.length}/{uiConfig.limitations.maxPlaysPerDay} plays
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            Create and manage team play systems
          </p>
          {uiConfig.warnings.limitedAccess && (
            <p className="text-sm text-amber-600 mt-1 flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              {uiConfig.warnings.limitedAccess}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {currentPlay && (
            <Badge variant="outline" className="text-sm">
              Editing: {currentPlay.name}
            </Badge>
          )}
          {permissions.canExportData && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEnhancedExportModal(true)}
                disabled={!currentPlay && savedPlays.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            
            {/* Quick Export Buttons */}
            <Button
              size="sm"
              variant="ghost"
              onClick={async () => {
                if (!currentPlay) {
                  toast.error('No play selected');
                  return;
                }
                try {
                  await ExcelExportService.quickExport([currentPlay], `${currentPlay.name}.xlsx`);
                  toast.success('Excel export completed');
                } catch (error) {
                  toast.error('Excel export failed');
                }
              }}
              title="Quick Excel Export"
            >
              <FileSpreadsheet className="h-4 w-4" />
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowQRGenerator(true)}
              title="Generate QR Code"
            >
              <QrCode className="h-4 w-4" />
            </Button>
            </div>
          )}
          {permissions.canUseAIAnalysis && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAIPanel(!showAIPanel)}
              className={showAIPanel ? 'bg-blue-100 border-blue-300' : ''}
              disabled={!aiUsage.canUse}
            >
              <Lightbulb className="h-4 w-4 mr-2" />
              AI Analysis {!aiUsage.canUse && `(${aiUsage.remaining})`}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTab('statistics')}
            className={activeTab === 'statistics' ? 'bg-green-100 border-green-300' : ''}
          >
            <Target className="h-4 w-4 mr-2" />
            Analytics
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTab('medical')}
            className={`${activeTab === 'medical' ? 'bg-red-100 border-red-300' : ''} ${
              playerMedicalStatus.some(p => p.overallStatus !== 'available') ? 'border-amber-300 text-amber-700' : ''
            }`}
          >
            <Activity className="h-4 w-4 mr-2" />
            Medical Safety
            {playerMedicalStatus.filter(p => p.overallStatus !== 'available').length > 0 && (
              <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-700">
                {playerMedicalStatus.filter(p => p.overallStatus !== 'available').length}
              </Badge>
            )}
          </Button>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Close Editor
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="editor">
            <Edit className="h-4 w-4 mr-2" />
            Editor
          </TabsTrigger>
          <TabsTrigger value="library">
            <FolderOpen className="h-4 w-4 mr-2" />
            Play Library ({savedPlays.length})
          </TabsTrigger>
          <TabsTrigger value="templates">
            <FileText className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
          {permissions.canViewAnalytics && (
            <TabsTrigger value="statistics">
              <Target className="h-4 w-4 mr-2" />
              Statistics
            </TabsTrigger>
          )}
          <TabsTrigger value="medical">
            <Activity className="h-4 w-4 mr-2" />
            Medical ({playerMedicalStatus.filter(p => p.overallStatus !== 'available').length})
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <CalendarDays className="h-4 w-4 mr-2" />
            Calendar ({upcomingEvents.length})
          </TabsTrigger>
          {permissions.canUseAIAnalysis && (
            <TabsTrigger value="analysis">
              <Lightbulb className="h-4 w-4 mr-2" />
              AI Analysis
            </TabsTrigger>
          )}
          <TabsTrigger value="video">
            <Video className="h-4 w-4 mr-2" />
            Video Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="mt-4">
          <div className="grid grid-cols-3 gap-4">
            {/* Main tactical board */}
            <div className="col-span-2" ref={tacticalBoardRef}>
              {/* Mode Switcher */}
              <div className="flex items-center gap-2 mb-3 p-3 bg-muted/50 rounded-lg border">
                <span className="text-sm font-medium mr-2">Mode:</span>
                <div className="flex gap-1 bg-background rounded-md p-1">
                  <Button
                    size="sm"
                    variant={boardMode === 'edit' ? 'default' : 'ghost'}
                    onClick={() => setBoardMode('edit')}
                    className="px-3"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant={boardMode === 'view' ? 'default' : 'ghost'}
                    onClick={() => setBoardMode('view')}
                    className="px-3"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant={boardMode === 'animate' ? 'default' : 'ghost'}
                    onClick={() => setBoardMode('animate')}
                    className="px-3"
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Animate
                  </Button>
                </div>
                <div className="ml-auto text-xs text-muted-foreground">
                  {boardMode === 'edit' && 'Draw plays and move players'}
                  {boardMode === 'view' && 'View play without editing'}
                  {boardMode === 'animate' && 'Create animated play sequences'}
                </div>
              </div>
              
              <ErrorBoundary
                fallback={
                  <div className="h-96 flex items-center justify-center border-2 border-dashed border-red-300 rounded-lg bg-red-50">
                    <div className="text-center">
                      <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-red-700 mb-2">Tactical Board Loading Error</h3>
                      <p className="text-red-600 mb-4 max-w-md">
                        The tactical board failed to load. This could be due to your browser not supporting required features.
                      </p>
                      <div className="space-y-2">
                        <Button 
                          onClick={() => window.location.reload()} 
                          variant="outline" 
                          size="sm"
                          className="mr-2"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Reload Page
                        </Button>
                        <Button 
                          onClick={() => setActiveTab('library')} 
                          variant="default" 
                          size="sm"
                        >
                          <FolderOpen className="h-4 w-4 mr-2" />
                          View Play Library
                        </Button>
                      </div>
                      <p className="text-xs text-red-500 mt-3">
                        Try using Chrome or Firefox for the best experience
                      </p>
                    </div>
                  </div>
                }
              >
                <TacticalBoard2D
                  onSave={handleSavePlay}
                  initialPlayers={currentPlayData?.players || currentPlay?.data?.players || getDefaultPlayers()}
                  mode={boardMode}
                  playTemplate={currentPlayData}
                  analysisMode={analysisVisuals.analysisMode}
                  highlightedAreas={analysisVisuals.highlightedAreas}
                  showHeatMap={analysisVisuals.showHeatMap}
                  showSuggestionOverlays={analysisVisuals.showSuggestionOverlays}
                  onPlayDataChange={(data) => {
                    if (analysisVisuals.analysisMode && currentPlay) {
                      // Trigger real-time analysis on significant changes
                      // This would be throttled by the useRealTimeAnalysis hook
                    }
                  }}
                />
              </ErrorBoundary>
            </div>

            {/* Side panel with play details */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Play Details</CardTitle>
                  <CardDescription>
                    Configure play metadata and properties
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Play Name</Label>
                    <Input
                      value={playName}
                      onChange={(e) => setPlayName(e.target.value)}
                      placeholder="e.g., 2-1-2 Aggressive Forecheck"
                    />
                  </div>

                  <div>
                    <Label>Category</Label>
                    <Select value={playCategory} onValueChange={(v) => setPlayCategory(v as PlaySystem['category'])}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="offensive">Offensive</SelectItem>
                        <SelectItem value="defensive">Defensive</SelectItem>
                        <SelectItem value="special-teams">Special Teams</SelectItem>
                        <SelectItem value="faceoff">Face-off</SelectItem>
                        <SelectItem value="transition">Transition</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Situation</Label>
                    <Input
                      value={playSituation}
                      onChange={(e) => setPlaySituation(e.target.value)}
                      placeholder="e.g., 5v5, Power Play, Penalty Kill"
                    />
                  </div>

                  <div>
                    <Label>Formation</Label>
                    <Input
                      value={playFormation}
                      onChange={(e) => setPlayFormation(e.target.value)}
                      placeholder="e.g., 1-2-2, 2-3, Diamond"
                    />
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={playDescription}
                      onChange={(e) => setPlayDescription(e.target.value)}
                      placeholder="Describe the play objectives and key points..."
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label>Tags</Label>
                    <Input
                      value={playTags}
                      onChange={(e) => setPlayTags(e.target.value)}
                      placeholder="aggressive, zone-entry, cycle (comma-separated)"
                    />
                  </div>

                  <div className="pt-4 space-y-2">
                    <Button
                      className="w-full"
                      onClick={() => setShowSaveDialog(true)}
                      disabled={!playName || !permissions.canCreatePlays}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {playAccess.accessLevel === 'view' ? 'View Only' : 'Save Play System'}
                    </Button>
                    {permissions.canUseAIAnalysis && (
                      <AIPermissionGuard feature="tactical_analysis">
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            if (currentPlay?.data) {
                              aiUsage.trackUsage();
                              aiAnalysis.analyzePlay(currentPlay.data, 'quick');
                              setShowAIPanel(true);
                            }
                          }}
                          disabled={!currentPlay || aiAnalysis.isAnalyzing || !aiUsage.canUse}
                        >
                          <Lightbulb className="h-4 w-4 mr-2" />
                          {aiAnalysis.isAnalyzing ? 'Analyzing...' : `AI Analysis (${aiUsage.remaining} left)`}
                        </Button>
                      </AIPermissionGuard>
                    )}
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setActiveTab('statistics')}
                      disabled={!currentPlay}
                    >
                      <Target className="h-4 w-4 mr-2" />
                      View Statistics
                    </Button>
                    {permissions.canExportData && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setShowExportModal(true)}
                        disabled={!currentPlay}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export Play
                      </Button>
                    )}
                    {permissions.canScheduleSessions && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleSchedulePractice}
                        disabled={!currentPlay || !teamId || scheduling}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        {scheduling ? 'Scheduling...' : 'Schedule Practice'}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowCalendarPanel(!showCalendarPanel)}
                    >
                      <CalendarDays className="h-4 w-4 mr-2" />
                      {showCalendarPanel ? 'Hide' : 'Show'} Calendar
                    </Button>
                    {permissions.canSharePlays && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setShowShareModal(true)}
                        disabled={!currentPlay || !playAccess.canShare}
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Share with Team
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Medical Safety Panel */}
              {formationAnalysis && formationAnalysis.overallRiskLevel !== 'low' && (
                <Card className="border-amber-200 bg-amber-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amber-800">
                      <AlertTriangle className="h-5 w-5" />
                      Medical Safety Alert
                    </CardTitle>
                    <CardDescription className="text-amber-700">
                      Formation has medical concerns requiring attention
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Risk Level */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Risk Level:</span>
                        <Badge 
                          variant={formationAnalysis.overallRiskLevel === 'critical' ? 'destructive' : 
                                  formationAnalysis.overallRiskLevel === 'high' ? 'destructive' : 
                                  'secondary'}
                          className="capitalize"
                        >
                          {formationAnalysis.overallRiskLevel}
                        </Badge>
                      </div>

                      {/* Medical Concerns */}
                      {formationAnalysis.medicalConcerns.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">Concerns:</h4>
                          <ul className="text-xs space-y-1">
                            {formationAnalysis.medicalConcerns.map((concern, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-amber-600 mt-0.5">•</span>
                                <span className="text-amber-800">{concern}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Quick Actions */}
                      <div className="space-y-2 pt-2 border-t border-amber-200">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() => setActiveTab('medical')}
                        >
                          <Activity className="h-4 w-4 mr-2" />
                          View Medical Dashboard
                        </Button>
                        {formationAnalysis.alternativeFormations.length > 0 && (
                          <div>
                            <p className="text-xs text-amber-700 mb-1">Safer alternatives:</p>
                            <div className="flex flex-wrap gap-1">
                              {formationAnalysis.alternativeFormations.map((alt, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {alt}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Play Statistics Panel */}
              {currentPlay && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Play Performance
                      {loadingStats && <RefreshCw className="h-4 w-4 animate-spin" />}
                    </CardTitle>
                    <CardDescription>
                      Statistics and effectiveness metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingStats ? (
                      <div className="space-y-3">
                        <div className="h-4 bg-gray-200 rounded animate-pulse" />
                        <div className="h-4 bg-gray-200 rounded animate-pulse" />
                        <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      </div>
                    ) : playMetrics ? (
                      <div className="space-y-4">
                        {/* Success Rate */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Success Rate</span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full" 
                                style={{ width: `${playMetrics.successRate}%` }}
                              />
                            </div>
                            <span className="text-sm font-bold text-green-600">
                              {playMetrics.successRate.toFixed(1)}%
                            </span>
                          </div>
                        </div>

                        {/* Key Metrics */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="text-center p-2 bg-blue-50 rounded">
                            <div className="font-bold text-blue-600">{playMetrics.goalsScored}</div>
                            <div className="text-xs text-gray-600">Goals</div>
                          </div>
                          <div className="text-center p-2 bg-green-50 rounded">
                            <div className="font-bold text-green-600">{playMetrics.scoringChances}</div>
                            <div className="text-xs text-gray-600">Chances</div>
                          </div>
                          <div className="text-center p-2 bg-yellow-50 rounded">
                            <div className="font-bold text-yellow-600">{playMetrics.executionTime.average.toFixed(1)}s</div>
                            <div className="text-xs text-gray-600">Avg Time</div>
                          </div>
                          <div className="text-center p-2 bg-purple-50 rounded">
                            <div className="font-bold text-purple-600">{playMetrics.passCompletionRate.toFixed(1)}%</div>
                            <div className="text-xs text-gray-600">Passes</div>
                          </div>
                        </div>

                        {/* Usage Stats */}
                        {playStats.length > 0 && (
                          <div className="pt-3 border-t">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium">Usage</span>
                              <div className="flex items-center gap-1">
                                {playStats[0].trend === 'up' ? (
                                  <TrendingUp className="h-4 w-4 text-green-500" />
                                ) : playStats[0].trend === 'down' ? (
                                  <TrendingDown className="h-4 w-4 text-red-500" />
                                ) : (
                                  <Activity className="h-4 w-4 text-gray-500" />
                                )}
                                <span className="text-xs text-gray-600">
                                  {playStats[0].trend === 'up' ? '+' : playStats[0].trend === 'down' ? '' : ''}{playStats[0].trendPercentage.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                            <div className="text-sm space-y-1">
                              <div className="flex justify-between">
                                <span>Total Executions:</span>
                                <span className="font-medium">{playStats[0].totalExecutions}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>In Games:</span>
                                <span className="font-medium">{playStats[0].gameExecutions}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>In Practice:</span>
                                <span className="font-medium">{playStats[0].practiceExecutions}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => setActiveTab('statistics')}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Detailed Analytics
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <Target className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-3">No statistics available yet</p>
                        <p className="text-xs text-gray-500">
                          Use this play in games or practice to generate performance data
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Calendar Panel */}
              {showCalendarPanel && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CalendarDays className="h-5 w-5" />
                      Upcoming Events
                    </CardTitle>
                    <CardDescription>
                      Events using current play system
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {currentPlay ? (
                      <div className="space-y-3">
                        {getUpcomingEventsForPlay(currentPlay.id).length > 0 ? (
                          getUpcomingEventsForPlay(currentPlay.id).map((event) => (
                            <div key={event.id} className="p-3 border rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <CalendarCheck className="h-4 w-4 text-green-600" />
                                <h4 className="font-medium text-sm">{event.title}</h4>
                              </div>
                              <div className="text-xs text-muted-foreground space-y-1">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-3 w-3" />
                                  <span>{new Date(event.startTime).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Target className="h-3 w-3" />
                                  <span>{event.tacticalMetadata?.focus || 'General practice'}</span>
                                </div>
                              </div>
                              {event.tacticalMetadata?.objectives && (
                                <div className="mt-2">
                                  <p className="text-xs font-medium mb-1">Objectives:</p>
                                  <ul className="text-xs text-muted-foreground">
                                    {event.tacticalMetadata.objectives.slice(0, 2).map((obj, i) => (
                                      <li key={i} className="flex items-start gap-1">
                                        <span className="text-xs">•</span>
                                        <span>{obj.description}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6">
                            <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground mb-3">
                              No upcoming events for this play
                            </p>
                            <Button 
                              size="sm" 
                              onClick={handleSchedulePractice}
                              disabled={scheduling}
                              className="w-full"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              {scheduling ? 'Scheduling...' : 'Schedule Practice'}
                            </Button>
                          </div>
                        )}
                        
                        {/* Quick calendar view */}
                        <div className="pt-3 border-t">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">Next 7 Days</span>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => {
                                // Open full calendar view
                                window.open('/coach/calendar', '_blank');
                              }}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-7 gap-1 text-xs">
                            {Array.from({ length: 7 }, (_, i) => {
                              const date = new Date();
                              date.setDate(date.getDate() + i);
                              const hasEvents = upcomingEvents.some(event => 
                                new Date(event.startTime).toDateString() === date.toDateString()
                              );
                              return (
                                <div key={i} className={`
                                  p-1 text-center rounded border
                                  ${hasEvents ? 'bg-blue-100 border-blue-300' : 'bg-gray-50'}
                                `}>
                                  <div className="font-medium">
                                    {date.getDate()}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {date.toLocaleDateString('en', { weekday: 'short' })}
                                  </div>
                                  {hasEvents && (
                                    <div className="w-1 h-1 bg-blue-600 rounded-full mx-auto mt-1"></div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Create or select a play to view calendar events
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="library" className="mt-4">
          <div className="grid grid-cols-3 gap-4">
            {savedPlays.length === 0 ? (
              <Card className="col-span-3">
                <CardContent className="text-center py-12">
                  <Snowflake className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No saved plays yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first play system using the editor
                  </p>
                  <Button onClick={() => setActiveTab('editor')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Play
                  </Button>
                </CardContent>
              </Card>
            ) : (
              savedPlays.map((play) => (
                <Card key={play.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{play.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {play.description || 'No description'}
                        </CardDescription>
                      </div>
                      <Badge className={categoryColors[play.category]}>
                        {play.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {play.situation && (
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-muted-foreground" />
                          <span>{play.situation}</span>
                        </div>
                      )}
                      {play.formation && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{play.formation}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(play.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    {play.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {play.tags.map((tag, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex flex-col gap-2 mt-4">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => loadPlay(play)}
                          disabled={!permissions.canEditPlays}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          {permissions.canEditPlays ? 'Edit' : 'View'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setCurrentPlay(play);
                            setActiveTab('statistics');
                          }}
                          title="View play statistics"
                        >
                          <Target className="h-4 w-4" />
                        </Button>
                        {permissions.canSharePlays && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              setCurrentPlay(play);
                              setShowShareModal(true);
                            }}
                          >
                            <Share2 className="h-4 w-4 mr-1" />
                            Share
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setCurrentPlay(play);
                            setShowExportModal(true);
                          }}
                          title="Export this play"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {permissions.canDeletePlays && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deletePlay(play.id)}
                            title="Delete play"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      {/* Schedule Practice button */}
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={async () => {
                          if (!teamId) return;
                          try {
                            await schedulePlay(play, {
                              preferredDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                              preferredTime: '16:00',
                              duration: 90,
                              teamId: teamId,
                              organizationId: teamId,
                              intensity: 'medium',
                              objectives: [
                                `Practice ${play.name} execution`,
                                'Improve player positioning and timing'
                              ]
                            });
                          } catch (error) {
                            console.error('Failed to schedule practice:', error);
                          }
                        }}
                        disabled={!teamId || scheduling}
                      >
                        <Calendar className="h-4 w-4 mr-1" />
                        {scheduling ? 'Scheduling...' : 'Schedule Practice'}
                      </Button>
                      
                      {/* Play Statistics Summary */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="text-center bg-green-50 rounded p-2">
                          <div className="font-bold text-green-600">85.2%</div>
                          <div className="text-gray-600">Success Rate</div>
                        </div>
                        <div className="text-center bg-blue-50 rounded p-2">
                          <div className="font-bold text-blue-600">42</div>
                          <div className="text-gray-600">Times Used</div>
                        </div>
                      </div>

                      {/* Show upcoming events count */}
                      {getUpcomingEventsForPlay(play.id).length > 0 && (
                        <div className="text-xs text-center text-muted-foreground bg-blue-50 rounded p-1">
                          <CalendarCheck className="h-3 w-3 inline mr-1" />
                          {getUpcomingEventsForPlay(play.id).length} upcoming practice
                          {getUpcomingEventsForPlay(play.id).length > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {permissions.canViewAnalytics && (
          <TabsContent value="statistics" className="mt-4">
            <TacticalPermissionGuard permission="tactical.analytics.view">
              <TacticalAnalyticsDashboard 
                teamId={teamId} 
                dateRange={undefined}
                className="h-full"
              />
            </TacticalPermissionGuard>
          </TabsContent>
        )}

        <TabsContent value="medical" className="mt-4">
          <div className="space-y-6">
            {/* Medical Dashboard Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">Medical Safety Dashboard</h3>
                <p className="text-muted-foreground">Player availability and tactical safety assessment</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadMedicalData()}
                disabled={loadingMedical}
              >
                {loadingMedical ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh
              </Button>
            </div>

            {loadingMedical ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading medical data...</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Team Medical Overview */}
                {medicalDashboard && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Team Medical Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Status Distribution */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="text-center p-3 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">
                              {medicalDashboard.teamOverview.fullyAvailable}
                            </div>
                            <div className="text-sm text-green-700">Fully Available</div>
                          </div>
                          <div className="text-center p-3 bg-yellow-50 rounded-lg">
                            <div className="text-2xl font-bold text-yellow-600">
                              {medicalDashboard.teamOverview.limitedAvailability}
                            </div>
                            <div className="text-sm text-yellow-700">Limited</div>
                          </div>
                          <div className="text-center p-3 bg-orange-50 rounded-lg">
                            <div className="text-2xl font-bold text-orange-600">
                              {medicalDashboard.teamOverview.recovering}
                            </div>
                            <div className="text-sm text-orange-700">Recovering</div>
                          </div>
                          <div className="text-center p-3 bg-red-50 rounded-lg">
                            <div className="text-2xl font-bold text-red-600">
                              {medicalDashboard.teamOverview.unavailable}
                            </div>
                            <div className="text-sm text-red-700">Unavailable</div>
                          </div>
                        </div>

                        {/* Average Team Load */}
                        <div className="pt-3 border-t">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">Average Team Load</span>
                            <span className="text-sm font-bold text-blue-600">
                              {medicalDashboard.teamOverview.averageTeamLoad}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all" 
                              style={{ width: `${medicalDashboard.teamOverview.averageTeamLoad}%` }}
                            />
                          </div>
                        </div>

                        {/* Medical Trends */}
                        {medicalDashboard.teamOverview.medicalTrends.length > 0 && (
                          <div className="pt-3 border-t">
                            <h4 className="text-sm font-medium mb-2">Medical Trends</h4>
                            <div className="space-y-2">
                              {medicalDashboard.teamOverview.medicalTrends.map((trend, index) => (
                                <div key={index} className="flex justify-between items-center text-sm">
                                  <span>{trend.metric}</span>
                                  <div className="flex items-center gap-2">
                                    {trend.trend === 'improving' ? (
                                      <TrendingUp className="h-4 w-4 text-green-500" />
                                    ) : trend.trend === 'declining' ? (
                                      <TrendingDown className="h-4 w-4 text-red-500" />
                                    ) : (
                                      <Activity className="h-4 w-4 text-gray-500" />
                                    )}
                                    <span className={`font-medium ${
                                      trend.trend === 'improving' ? 'text-green-600' : 
                                      trend.trend === 'declining' ? 'text-red-600' : 
                                      'text-gray-600'
                                    }`}>
                                      {trend.changePercent > 0 ? '+' : ''}{trend.changePercent}%
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Player Medical Status List */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Player Medical Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-96">
                      <div className="space-y-3">
                        {playerMedicalStatus.map((player) => (
                          <div key={player.playerId} className="p-3 border rounded-lg">
                            {/* Player Header */}
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">
                                  {getMedicalStatusIcon(player.medicalClearance)}
                                </span>
                                <h4 className="font-medium">{player.playerName}</h4>
                              </div>
                              <Badge 
                                style={{ 
                                  backgroundColor: getMedicalStatusColor(player.medicalClearance),
                                  color: 'white'
                                }}
                                className="capitalize"
                              >
                                {player.medicalClearance.replace('-', ' ')}
                              </Badge>
                            </div>

                            {/* Medical Details */}
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Status:</span>
                                <span className="capitalize font-medium">{player.overallStatus}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Load Capacity:</span>
                                <span className="font-medium">{player.recommendedLoad}%</span>
                              </div>
                              
                              {/* Position Restrictions */}
                              {player.positionRestrictions.length > 0 && (
                                <div>
                                  <span className="text-muted-foreground">Restrictions:</span>
                                  <div className="mt-1">
                                    {player.positionRestrictions.map((restriction, index) => (
                                      <div key={index} className="text-xs bg-yellow-50 p-2 rounded border-l-2 border-yellow-400">
                                        <p className="font-medium text-yellow-800">{restriction.reason}</p>
                                        {restriction.alternativePositions.length > 0 && (
                                          <p className="text-yellow-700 mt-1">
                                            Alternatives: {restriction.alternativePositions.join(', ')}
                                          </p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Contact Limitations */}
                              {player.contactLimitations.length > 0 && (
                                <div>
                                  <span className="text-muted-foreground">Contact Limitations:</span>
                                  <div className="mt-1">
                                    {player.contactLimitations.map((limitation, index) => (
                                      <div key={index} className="text-xs bg-red-50 p-2 rounded border-l-2 border-red-400">
                                        <p className="font-medium text-red-800 capitalize">
                                          {limitation.type.replace('-', ' ')}
                                        </p>
                                        <p className="text-red-700">
                                          Duration: {limitation.duration} days
                                        </p>
                                        {limitation.alternatives.length > 0 && (
                                          <p className="text-red-700 mt-1">
                                            Alternatives: {limitation.alternatives.join(', ')}
                                          </p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Return to Play Phase */}
                              {player.returnToPlayPhase && (
                                <div>
                                  <span className="text-muted-foreground">Return to Play:</span>
                                  <div className="mt-1 text-xs bg-blue-50 p-2 rounded border-l-2 border-blue-400">
                                    <p className="font-medium text-blue-800">
                                      Phase {player.returnToPlayPhase.currentPhase}: {player.returnToPlayPhase.phaseDescription}
                                    </p>
                                    {player.returnToPlayPhase.nextPhaseDate && (
                                      <p className="text-blue-700 mt-1">
                                        Next evaluation: {new Date(player.returnToPlayPhase.nextPhaseDate).toLocaleDateString()}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Formation Medical Analysis */}
                {formationAnalysis && (
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Formation Medical Analysis
                      </CardTitle>
                      <CardDescription>
                        Medical compatibility assessment for current play system
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Overall Risk Assessment */}
                        <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
                          <div>
                            <h4 className="font-medium">Overall Risk Level</h4>
                            <p className="text-sm text-muted-foreground">
                              Based on current player assignments
                            </p>
                          </div>
                          <Badge 
                            variant={formationAnalysis.overallRiskLevel === 'critical' ? 'destructive' : 
                                    formationAnalysis.overallRiskLevel === 'high' ? 'destructive' : 
                                    formationAnalysis.overallRiskLevel === 'moderate' ? 'secondary' : 'default'}
                            className="text-lg px-3 py-1 capitalize"
                          >
                            {formationAnalysis.overallRiskLevel}
                          </Badge>
                        </div>

                        {/* Player Analysis Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {formationAnalysis.playerAnalysis.map((analysis) => {
                            const player = playerMedicalStatus.find(p => p.playerId === analysis.playerId);
                            return (
                              <div key={analysis.playerId} className="p-3 border rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm">
                                      {player ? getMedicalStatusIcon(player.medicalClearance) : '❓'}
                                    </span>
                                    <span className="font-medium">
                                      {player?.playerName || analysis.playerId}
                                    </span>
                                  </div>
                                  <Badge variant="outline" className="capitalize">
                                    {analysis.assignedPosition}
                                  </Badge>
                                </div>
                                
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Compatibility:</span>
                                    <div className="flex items-center gap-2">
                                      <div className="w-12 bg-gray-200 rounded-full h-1.5">
                                        <div 
                                          className={`h-1.5 rounded-full ${
                                            analysis.medicalCompatibility >= 80 ? 'bg-green-500' :
                                            analysis.medicalCompatibility >= 60 ? 'bg-yellow-500' :
                                            'bg-red-500'
                                          }`}
                                          style={{ width: `${analysis.medicalCompatibility}%` }}
                                        />
                                      </div>
                                      <span className="text-sm font-medium">
                                        {analysis.medicalCompatibility}%
                                      </span>
                                    </div>
                                  </div>
                                  
                                  {analysis.riskFactors.length > 0 && (
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-1">Risk Factors:</p>
                                      <div className="flex flex-wrap gap-1">
                                        {analysis.riskFactors.map((factor, index) => (
                                          <Badge key={index} variant="secondary" className="text-xs">
                                            {factor}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {analysis.recommendations.length > 0 && (
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-1">Recommendations:</p>
                                      <ul className="text-xs space-y-1">
                                        {analysis.recommendations.map((rec, index) => (
                                          <li key={index} className="flex items-start gap-1">
                                            <span className="text-blue-500 mt-0.5">•</span>
                                            <span>{rec}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Medical Recommendations */}
                        {formationAnalysis.recommendations.length > 0 && (
                          <div className="pt-4 border-t">
                            <h4 className="font-medium mb-3">Medical Recommendations</h4>
                            <div className="space-y-2">
                              {formationAnalysis.recommendations.map((rec, index) => (
                                <div key={index} className={`p-3 rounded-lg border-l-4 ${
                                  rec.priority === 'critical' ? 'bg-red-50 border-red-400' :
                                  rec.priority === 'high' ? 'bg-orange-50 border-orange-400' :
                                  rec.priority === 'medium' ? 'bg-yellow-50 border-yellow-400' :
                                  'bg-blue-50 border-blue-400'
                                }`}>
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <Badge 
                                          variant={rec.priority === 'critical' ? 'destructive' : 'secondary'}
                                          className="text-xs capitalize"
                                        >
                                          {rec.priority}
                                        </Badge>
                                        <span className="text-sm font-medium capitalize">
                                          {rec.type.replace('-', ' ')}
                                        </span>
                                      </div>
                                      <p className="text-sm mb-2">{rec.description}</p>
                                      <p className="text-xs text-muted-foreground">
                                        Action: {rec.actionRequired}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Risk Alerts */}
                {medicalDashboard && medicalDashboard.riskAlerts.length > 0 && (
                  <Card className="lg:col-span-2 border-red-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-red-700">
                        <AlertTriangle className="h-5 w-5" />
                        Active Risk Alerts
                      </CardTitle>
                      <CardDescription className="text-red-600">
                        Immediate attention required for player safety
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {medicalDashboard.riskAlerts.map((alert) => (
                          <div key={alert.id} className={`p-4 rounded-lg border ${
                            alert.severity === 'critical' ? 'bg-red-50 border-red-300' :
                            alert.severity === 'high' ? 'bg-orange-50 border-orange-300' :
                            alert.severity === 'medium' ? 'bg-yellow-50 border-yellow-300' :
                            'bg-blue-50 border-blue-300'
                          }`}>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge 
                                    variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}
                                    className="capitalize"
                                  >
                                    {alert.severity}
                                  </Badge>
                                  <span className="font-medium">{alert.playerName}</span>
                                  <span className="text-sm text-muted-foreground">
                                    {new Date(alert.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-sm mb-2">{alert.message}</p>
                                <p className="text-sm font-medium text-green-700">
                                  Action Required: {alert.actionRequired}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <div className="space-y-6">
            {/* Static Templates */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Standard Play Templates
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {staticTemplates.map((template, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <Badge className={categoryColors[template.category as PlaySystem['category']]}>
                    {template.category}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    {template.description}
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Formation: {template.formation} | {template.situation}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => {
                        setPlayName(template.name);
                        setPlayCategory(template.category as PlaySystem['category']);
                        setPlayFormation(template.formation);
                        setPlayDescription(template.description);
                        setCurrentPlayData(template); // Load the actual template data with players
                        setActiveTab('editor');
                      }}
                    >
                      Use Template
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        // Load template directly in animate mode
                        setPlayName(template.name);
                        setPlayCategory(template.category as PlaySystem['category']);
                        setPlayFormation(template.formation);
                        setPlayDescription(template.description);
                        setCurrentPlayData(template);
                        setBoardMode('animate'); // Switch to animate mode
                        setActiveTab('editor');
                      }}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Animate
                    </Button>
                  </div>
                </CardContent>
              </Card>
                ))}
              </div>
            </div>

            {/* Animated Templates */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <Play className="h-5 w-5 mr-2" />
                Animated Play Templates
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {animatedTemplates.map((template, index) => (
                  <Card key={`animated-${index}`} className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-primary/20">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        {template.name}
                        <Badge className="ml-2" variant="outline">Animated</Badge>
                      </CardTitle>
                      <Badge className={categoryColors[template.category as PlaySystem['category']]}>
                        {template.category}
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-2">
                        {template.description}
                      </p>
                      <p className="text-xs text-muted-foreground mb-2">
                        Formation: {template.formation} | {template.situation}
                      </p>
                      <p className="text-xs text-primary font-medium mb-4">
                        ✨ {template.phases?.length || 0} phases | {template.keyframes?.length || 0} keyframes
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setPlayName(template.name);
                            setPlayCategory(template.category as PlaySystem['category']);
                            setPlayFormation(template.formation);
                            setPlayDescription(template.description);
                            setCurrentPlayData(template);
                            setBoardMode('edit');
                            setActiveTab('editor');
                          }}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Load
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 bg-primary/10"
                          onClick={() => {
                            // Load animated template directly in animate mode
                            setPlayName(template.name);
                            setPlayCategory(template.category as PlaySystem['category']);
                            setPlayFormation(template.formation);
                            setPlayDescription(template.description);
                            setCurrentPlayData(template);
                            setBoardMode('animate'); // Switch to animate mode
                            setActiveTab('editor');
                          }}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Animate
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Tactical Calendar Management
                </CardTitle>
                <CardDescription>
                  Schedule practices, video reviews, and game preparations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <Button
                    className="h-20 flex-col gap-2"
                    onClick={() => {
                      // Quick schedule tactical practice
                      if (teamId) {
                        const tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        tacticalCalendarService.createTacticalPractice({
                          title: 'Tactical Practice Session',
                          startTime: `${tomorrow.toISOString().split('T')[0]}T16:00:00`,
                          endTime: `${tomorrow.toISOString().split('T')[0]}T17:30:00`,
                          teamId: teamId,
                          organizationId: teamId,
                          focus: 'mixed',
                          situation: '5v5',
                          intensity: 'medium',
                          objectives: ['Improve team coordination', 'Practice zone entries']
                        });
                      }
                    }}
                    disabled={!teamId}
                  >
                    <Target className="h-6 w-6" />
                    <span className="text-sm">Schedule Practice</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-20 flex-col gap-2"
                    onClick={() => {
                      // Quick schedule video review
                      if (teamId) {
                        const tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        tacticalCalendarService.createVideoReviewSession({
                          title: 'Video Review Session',
                          startTime: `${tomorrow.toISOString().split('T')[0]}T10:00:00`,
                          endTime: `${tomorrow.toISOString().split('T')[0]}T11:00:00`,
                          teamId: teamId,
                          organizationId: teamId,
                          videoClips: []
                        });
                      }
                    }}
                    disabled={!teamId}
                  >
                    <Play className="h-6 w-6" />
                    <span className="text-sm">Video Review</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-20 flex-col gap-2"
                    onClick={() => {
                      // Quick schedule game prep
                      if (teamId) {
                        const gameDay = new Date();
                        gameDay.setDate(gameDay.getDate() + 2);
                        tacticalCalendarService.createGamePreparation({
                          title: 'Pre-Game Tactical Briefing',
                          startTime: `${gameDay.toISOString().split('T')[0]}T18:00:00`,
                          endTime: `${gameDay.toISOString().split('T')[0]}T19:00:00`,
                          teamId: teamId,
                          organizationId: teamId,
                          gameId: 'next-game',
                          opponentTeamId: 'opponent-team',
                          opponentScouting: {
                            strengths: ['Strong power play', 'Fast transition'],
                            weaknesses: ['Penalty kill', 'Defensive zone coverage'],
                            keyPlayers: ['#87 Center', '#29 Goalie'],
                            tactics: ['1-3-1 Power play', 'Aggressive forecheck']
                          },
                          tacticalReminders: ['Watch for their quick breakouts', 'Pressure their point men'],
                          pregameRoutine: ['Team meeting', 'Warm-up', 'Line combinations review']
                        });
                      }
                    }}
                    disabled={!teamId}
                  >
                    <Users className="h-6 w-6" />
                    <span className="text-sm">Game Prep</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Tactical Events */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CalendarCheck className="h-5 w-5" />
                    Upcoming Tactical Events
                  </span>
                  <Badge variant="secondary">{upcomingEvents.length} events</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingEvents.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingEvents.slice(0, 5).map((event) => (
                      <div key={event.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50">
                        <div className="flex-shrink-0">
                          {event.tacticalMetadata?.focus === 'offensive' ? (
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          ) : event.tacticalMetadata?.focus === 'defensive' ? (
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          ) : event.tacticalMetadata?.focus === 'special-teams' ? (
                            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                          ) : (
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium truncate">{event.title}</h4>
                            <Badge variant="outline" className="text-xs">
                              {event.tacticalMetadata?.focus || 'general'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{new Date(event.startTime).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Target className="h-3 w-3" />
                              <span>{event.tacticalMetadata?.situation || '5v5'}</span>
                            </div>
                            {event.tacticalMetadata?.playSystemIds && event.tacticalMetadata.playSystemIds.length > 0 && (
                              <div className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                <span>{event.tacticalMetadata.playSystemIds.length} play{event.tacticalMetadata.playSystemIds.length > 1 ? 's' : ''}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {upcomingEvents.length > 5 && (
                      <div className="text-center pt-4 border-t">
                        <Button 
                          variant="outline" 
                          onClick={() => window.open('/coach/calendar', '_blank')}
                        >
                          View All Events ({upcomingEvents.length - 5} more)
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No upcoming tactical events</h3>
                    <p className="text-muted-foreground mb-4">
                      Schedule your first tactical practice or video review session
                    </p>
                    <Button onClick={() => setActiveTab('editor')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create and Schedule Play
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Calendar Integration Summary */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Calendar Integration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Events</span>
                    <Badge>{upcomingEvents.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Practices Scheduled</span>
                    <Badge variant="secondary">
                      {upcomingEvents.filter(e => e.type === 'practice').length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Video Reviews</span>
                    <Badge variant="secondary">
                      {upcomingEvents.filter(e => e.tacticalType === 'video_review').length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Game Preparations</span>
                    <Badge variant="secondary">
                      {upcomingEvents.filter(e => e.tacticalType === 'game_preparation').length}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => window.open('/coach/calendar', '_blank')}
                  >
                    <CalendarDays className="h-4 w-4 mr-2" />
                    Open Full Calendar
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => {
                      // Export tactical calendar
                      tacticalCalendarService.exportTacticalCalendar({
                        format: 'pdf',
                        dateRange: {
                          start: new Date().toISOString().split('T')[0],
                          end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                        },
                        includeMetadata: true,
                        includePlays: true,
                        includeFormations: true,
                        teamSpecific: true
                      });
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Calendar
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => {
                      // Share calendar with team
                      tacticalCalendarService.shareTacticalSchedule({
                        eventIds: upcomingEvents.map(e => e.id),
                        shareWith: 'team',
                        includeDetails: true,
                        message: 'Upcoming tactical schedule'
                      });
                    }}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share with Team
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {permissions.canUseAIAnalysis && (
          <TabsContent value="analysis" className="mt-4">
            <AIPermissionGuard feature="tactical_analysis">
              <div className="space-y-6">
            {!aiAnalysis.result && !aiAnalysis.isAnalyzing ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">AI Tactical Analysis</h3>
                  <p className="text-muted-foreground mb-6">
                    Get intelligent insights and suggestions for your play system using AI analysis.
                  </p>
                  <div className="space-y-3">
                    <div className="flex justify-center gap-3">
                      <Button
                        onClick={() => currentPlay?.data && aiAnalysis.analyzePlay(currentPlay.data, 'quick')}
                        disabled={!currentPlay}
                      >
                        <Lightbulb className="h-4 w-4 mr-2" />
                        Quick Analysis
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => currentPlay?.data && aiAnalysis.analyzePlay(currentPlay.data, 'detailed')}
                        disabled={!currentPlay}
                      >
                        <Target className="h-4 w-4 mr-2" />
                        Detailed Analysis
                      </Button>
                    </div>
                    {!currentPlay && (
                      <p className="text-sm text-muted-foreground">
                        Create or load a play system first to enable AI analysis
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {aiAnalysis.isAnalyzing && (
                  <Card>
                    <CardContent className="py-8">
                      <div className="text-center">
                        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Analyzing Play System...</h3>
                        <p className="text-muted-foreground mb-4">
                          AI is evaluating spacing, timing, positioning, and tactical effectiveness
                        </p>
                        <div className="w-full max-w-md mx-auto">
                          <div className="bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${aiAnalysis.progress}%` }}
                            />
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">{aiAnalysis.progress}% complete</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {aiAnalysis.result && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Overall Score */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="h-5 w-5" />
                          Overall Analysis Score
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center">
                          <div className={`text-4xl font-bold mb-2 ${
                            aiAnalysis.result.score.overall >= 70 ? 'text-green-600' :
                            aiAnalysis.result.score.overall >= 40 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {aiAnalysis.result.score.overall}
                          </div>
                          <p className="text-muted-foreground mb-4">out of 100</p>
                          <div className="space-y-2">
                            {Object.entries(aiAnalysis.result.score.categories).map(([category, score]) => (
                              <div key={category} className="flex justify-between items-center">
                                <span className="text-sm capitalize">{category}:</span>
                                <span className="text-sm font-medium">{score}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Top Suggestions */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Lightbulb className="h-5 w-5" />
                          Top AI Suggestions
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {aiAnalysis.result.suggestions.slice(0, 3).map((suggestion) => (
                            <div key={suggestion.id} className="p-3 border rounded-lg">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium text-sm">{suggestion.title}</h4>
                                <Badge 
                                  variant={suggestion.priority === 'high' ? 'destructive' : 
                                          suggestion.priority === 'medium' ? 'secondary' : 'outline'}
                                  className="text-xs"
                                >
                                  {suggestion.priority}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{suggestion.description}</p>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-green-600">+{suggestion.expectedImprovement} points</span>
                                <div className="flex gap-1">
                                  {suggestion.coordinates && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        analysisVisuals.highlightArea(suggestion.coordinates!, 'suggestion');
                                        setActiveTab('editor');
                                      }}
                                    >
                                      <Eye className="h-3 w-3 mr-1" />
                                      Show
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      const updatedPlay = suggestionHandler.applySuggestion(suggestion, currentPlay?.data);
                                      if (updatedPlay) {
                                        setCurrentPlay(prev => prev ? { ...prev, data: updatedPlay } : null);
                                      }
                                    }}
                                  >
                                    Apply
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
                
                {aiAnalysis.error && (
                  <Card className="border-red-200">
                    <CardContent className="py-6">
                      <div className="text-center">
                        <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                        <h3 className="text-lg font-semibold text-red-700 mb-2">Analysis Error</h3>
                        <p className="text-red-600 mb-4">{aiAnalysis.error}</p>
                        <Button
                          variant="outline"
                          onClick={() => {
                            aiAnalysis.clearResult();
                            if (currentPlay?.data) {
                              aiAnalysis.analyzePlay(currentPlay.data, 'quick');
                            }
                          }}
                        >
                          Try Again
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
              </div>
            </AIPermissionGuard>
          </TabsContent>
        )}

        {/* Video Analysis Tab */}
        <TabsContent value="video" className="mt-4">
          <div className="h-[800px] grid grid-cols-3 gap-4">
            {/* Video Player Section */}
            <div className="col-span-2 space-y-4">
              {videoSource ? (
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Video Analysis</h3>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant={isVideoSynced ? 'default' : 'outline'}
                        size="sm"
                        onClick={async () => {
                          if (!isVideoSynced && currentPlay?.id) {
                            const success = videoSyncService.startSync(
                              videoSource.id,
                              'tactical-board',
                              currentPlay.id
                            );
                            setIsVideoSynced(success);
                          } else {
                            videoSyncService.stopSync();
                            setIsVideoSynced(false);
                          }
                        }}
                        disabled={!currentPlay}
                      >
                        {isVideoSynced ? 'Synced' : 'Sync with Play'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setVideoSource(null)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <TacticalVideoPlayer
                      source={videoSource}
                      annotations={videoAnnotations}
                      showAnnotations={true}
                      onStateChange={(state) => {
                        setVideoCurrentTime(state.currentTime);
                      }}
                      onAnnotationAdd={(annotation) => {
                        setVideoAnnotations(prev => [...prev, annotation]);
                      }}
                      onAnnotationUpdate={(annotation) => {
                        setVideoAnnotations(prev => 
                          prev.map(a => a.id === annotation.id ? annotation : a)
                        );
                      }}
                      onAnnotationDelete={(annotationId) => {
                        setVideoAnnotations(prev => prev.filter(a => a.id !== annotationId));
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-center">
                    <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Video Loaded</h3>
                    <p className="text-gray-500 mb-4">
                      Upload a video or provide a URL to start video analysis
                    </p>
                    <div className="space-y-2">
                      <Button
                        onClick={() => {
                          // Mock video for demonstration
                          setVideoSource({
                            id: 'demo-video',
                            url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                            type: 'local',
                            format: 'mp4',
                            quality: 'hd',
                            thumbnailUrl: '/api/placeholder/320/180',
                            metadata: {
                              title: 'Demo Hockey Video',
                              description: 'Sample video for tactical analysis',
                              uploadedAt: new Date()
                            }
                          });
                        }}
                      >
                        Load Demo Video
                      </Button>
                      <div className="text-xs text-gray-400">
                        Or drag and drop a video file here
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Video Controls & Clip Manager */}
            <div className="space-y-4">
              {videoSource && (
                <>
                  {/* Video Info Panel */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Video Information</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                      <div>
                        <span className="font-medium">Title:</span> {videoSource.metadata?.title}
                      </div>
                      <div>
                        <span className="font-medium">Duration:</span> {videoSource.metadata?.duration || 'Unknown'}
                      </div>
                      <div>
                        <span className="font-medium">Quality:</span> {videoSource.quality}
                      </div>
                      <div>
                        <span className="font-medium">Current Time:</span> {videoCurrentTime.toFixed(2)}s
                      </div>
                      {isVideoSynced && (
                        <div className="flex items-center space-x-2 text-green-600">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          <span className="font-medium">Synchronized with Play</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Video Clip Manager */}
                  <div className="flex-1">
                    <VideoClipManager
                      videoSource={videoSource}
                      currentTime={videoCurrentTime}
                      duration={videoSource.metadata?.duration || 300}
                      annotations={videoAnnotations}
                      clips={videoClips}
                      collections={videoCollections}
                      onClipCreate={(clipData) => {
                        const newClip = {
                          id: `clip-${Date.now()}`,
                          createdAt: new Date(),
                          createdBy: 'current-user',
                          ...clipData
                        };
                        setVideoClips(prev => [...prev, newClip]);
                      }}
                      onClipUpdate={(clipId, updates) => {
                        setVideoClips(prev => 
                          prev.map(clip => clip.id === clipId ? { ...clip, ...updates } : clip)
                        );
                      }}
                      onClipDelete={(clipId) => {
                        setVideoClips(prev => prev.filter(clip => clip.id !== clipId));
                      }}
                      onCollectionCreate={(collectionData) => {
                        const newCollection = {
                          id: `collection-${Date.now()}`,
                          createdAt: new Date(),
                          createdBy: 'current-user',
                          ...collectionData
                        };
                        setVideoCollections(prev => [...prev, newCollection]);
                      }}
                      onCollectionUpdate={(collectionId, updates) => {
                        setVideoCollections(prev => 
                          prev.map(collection => 
                            collection.id === collectionId ? { ...collection, ...updates } : collection
                          )
                        );
                      }}
                      onClipPlay={(startTime, endTime) => {
                        // This would tell the video player to play the clip
                        console.log(`Playing clip from ${startTime}s to ${endTime}s`);
                      }}
                      onExport={(clips, format) => {
                        console.log(`Exporting ${clips.length} clips as ${format}`);
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Save confirmation dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Play System</DialogTitle>
            <DialogDescription>
              Confirm the details for this play system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Name</Label>
              <p className="text-sm font-medium">{playName || 'Unnamed Play'}</p>
            </div>
            <div>
              <Label>Category</Label>
              <Badge className={categoryColors[playCategory]}>
                {playCategory}
              </Badge>
            </div>
            {playDescription && (
              <div>
                <Label>Description</Label>
                <p className="text-sm">{playDescription}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmSave}>
              Save Play
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Legacy Export Manager Modal */}
      <ExportManager
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        playSystem={currentPlay}
        playSystems={savedPlays}
        tacticalBoardRef={tacticalBoardRef}
        onExportComplete={(exportData) => {
          console.log('Export completed:', exportData);
          // Could show success toast or trigger other actions
        }}
      />
      
      {/* Enhanced Export Manager Modal */}
      <EnhancedExportManager
        isOpen={showEnhancedExportModal}
        onClose={() => setShowEnhancedExportModal(false)}
        playSystem={currentPlay || undefined}
        playSystems={savedPlays}
        tacticalBoardRef={tacticalBoardRef}
        initialTemplate={selectedExportTemplate || undefined}
        showTemplateLibrary={true}
        showHistory={true}
        enableSharing={permissions.canSharePlays}
        onExportComplete={(exportData) => {
          console.log('Enhanced export completed:', exportData);
          // Update statistics or perform additional actions
        }}
      />
      
      {/* Template Selector Modal */}
      <Dialog open={showTemplateSelector} onOpenChange={setShowTemplateSelector}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Choose Export Template
            </DialogTitle>
            <DialogDescription>
              Select a template that matches your export needs
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-[60vh] overflow-y-auto">
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All Templates</TabsTrigger>
                <TabsTrigger value="practice">Practice</TabsTrigger>
                <TabsTrigger value="game-analysis">Game Analysis</TabsTrigger>
                <TabsTrigger value="reports">Reports</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {exportTemplates.map((template) => (
                    <Card 
                      key={template.id} 
                      className={`cursor-pointer transition-colors hover:border-primary ${
                        selectedExportTemplate === template.id ? 'border-primary bg-primary/5' : ''
                      }`}
                      onClick={() => {
                        setSelectedExportTemplate(template.id);
                        setShowTemplateSelector(false);
                        setShowEnhancedExportModal(true);
                      }}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          {template.icon}
                          {template.name}
                          {template.isPopular && <Badge variant="secondary" className="text-xs">Popular</Badge>}
                          {template.isPremium && <Badge variant="outline" className="text-xs">Premium</Badge>}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {template.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex gap-1 mb-2">
                          {template.features.slice(0, 3).map((feature, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span>{template.difficulty}</span>
                          <span>{template.estimatedTime}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              {['practice', 'game-analysis', 'reports'].map(category => (
                <TabsContent key={category} value={category} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {getTemplatesByCategory(category as any).map((template) => (
                      <Card 
                        key={template.id} 
                        className={`cursor-pointer transition-colors hover:border-primary ${
                          selectedExportTemplate === template.id ? 'border-primary bg-primary/5' : ''
                        }`}
                        onClick={() => {
                          setSelectedExportTemplate(template.id);
                          setShowTemplateSelector(false);
                          setShowEnhancedExportModal(true);
                        }}
                      >
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            {template.icon}
                            {template.name}
                            {template.isPopular && <Badge variant="secondary" className="text-xs">Popular</Badge>}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {template.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex gap-1 mb-2">
                            {template.features.slice(0, 3).map((feature, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex justify-between items-center text-xs text-muted-foreground">
                            <span>{template.difficulty}</span>
                            <span>{template.estimatedTime}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateSelector(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                setShowTemplateSelector(false);
                setShowEnhancedExportModal(true);
              }}
              disabled={!selectedExportTemplate}
            >
              Continue with Selected Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* QR Code Generator Modal */}
      <Dialog open={showQRGenerator} onOpenChange={setShowQRGenerator}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Generate QR Code for Play</DialogTitle>
            <DialogDescription>
              Create a QR code to share this tactical play
            </DialogDescription>
          </DialogHeader>
          
          <QRCodeGenerator
            initialUrl={currentPlay ? `https://hockeyhub.app/play/${currentPlay.id}` : ''}
            showPresets={true}
            showBatch={false}
            onGenerated={(qrCode, options) => {
              console.log('QR Code generated for play:', currentPlay?.name);
            }}
          />
        </DialogContent>
      </Dialog>
      
      {/* AI Analysis Panel */}
      <AIAnalysisPanel
        isOpen={showAIPanel}
        onToggle={() => setShowAIPanel(!showAIPanel)}
        isDocked={aiPanelDocked}
        onDockToggle={() => setAiPanelDocked(!aiPanelDocked)}
        currentPlay={currentPlay}
        onHighlightArea={(coordinates) => {
          analysisVisuals.highlightArea(coordinates, 'suggestion');
          setActiveTab('editor'); // Switch to editor to show highlight
        }}
        onApplySuggestion={(suggestion) => {
          const updatedPlay = suggestionHandler.applySuggestion(suggestion, currentPlay?.data);
          if (updatedPlay) {
            setCurrentPlay(prev => prev ? { ...prev, data: updatedPlay } : null);
          }
        }}
      />
      
      {/* Tactical Share Modal */}
      <TacticalShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        play={currentPlay}
        teamId={teamId}
        onShareComplete={(shareData) => {
          console.log('Play shared:', shareData);
          // Could show success notification or update UI
        }}
      />
    </div>
    </TacticalPermissionGuard>
  );
}