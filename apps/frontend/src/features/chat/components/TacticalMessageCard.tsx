'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Play,
  Users,
  Target,
  Clock,
  MessageCircle,
  Eye,
  ThumbsUp,
  Share2,
  Calendar,
  AlertTriangle,
  CheckCircle,
  FileText,
  Video,
  Zap,
  ExternalLink,
  Download
} from '@/components/icons';
import { useTranslation } from '@hockey-hub/translations';
import { TacticalMessageMetadata, TacticalPlayData } from '../../coach/services/tacticalCommunicationService';

interface TacticalMessageCardProps {
  messageId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  timestamp: Date;
  metadata: TacticalMessageMetadata;
  isOwn?: boolean;
  onReact?: (emoji: string) => void;
  onAcknowledge?: () => void;
  onStartDiscussion?: () => void;
  onViewPlay?: (playId: string) => void;
  onViewVideo?: (videoUrl: string, timestamps: any[]) => void;
}

export default function TacticalMessageCard({
  messageId,
  senderId,
  senderName,
  senderAvatar,
  timestamp,
  metadata,
  isOwn = false,
  onReact,
  onAcknowledge,
  onStartDiscussion,
  onViewPlay,
  onViewVideo
}: TacticalMessageCardProps) {
  const { t } = useTranslation(['chat', 'coach']);
  const [showDetails, setShowDetails] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  // Handle acknowledgment
  const handleAcknowledge = () => {
    setAcknowledged(true);
    onAcknowledge?.();
  };

  // Get priority styling
  const getPriorityStyle = () => {
    if (metadata.tacticalType === 'game_plan' || metadata.gamePlanData) {
      return 'border-l-4 border-l-purple-500 bg-purple-50/50';
    }
    if (metadata.tacticalType === 'formation_update') {
      return 'border-l-4 border-l-orange-500 bg-orange-50/50';
    }
    if (metadata.playData?.category === 'offensive') {
      return 'border-l-4 border-l-green-500 bg-green-50/50';
    }
    if (metadata.playData?.category === 'defensive') {
      return 'border-l-4 border-l-red-500 bg-red-50/50';
    }
    if (metadata.playData?.category === 'special-teams') {
      return 'border-l-4 border-l-purple-500 bg-purple-50/50';
    }
    return 'border-l-4 border-l-blue-500 bg-blue-50/50';
  };

  // Get tactical type icon
  const getTacticalIcon = () => {
    switch (metadata.tacticalType) {
      case 'play_share':
        return <Play className="h-5 w-5" />;
      case 'formation_update':
        return <Users className="h-5 w-5" />;
      case 'video_analysis':
        return <Video className="h-5 w-5" />;
      case 'play_discussion':
        return <MessageCircle className="h-5 w-5" />;
      case 'game_plan':
        return <Target className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  // Render play share content
  const renderPlayShare = (playData: TacticalPlayData) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{playData.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={playData.category === 'offensive' ? 'default' : 'secondary'}>
              {playData.category}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {playData.situation} • {playData.formation}
            </span>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => onViewPlay?.(playData.id)}
          className="shrink-0"
        >
          <Eye className="h-4 w-4 mr-1" />
          View Play
        </Button>
      </div>

      {playData.description && (
        <p className="text-sm text-muted-foreground">{playData.description}</p>
      )}

      {playData.previewImage && (
        <div className="bg-muted/30 rounded-lg p-4 text-center">
          <img 
            src={playData.previewImage} 
            alt={`${playData.name} diagram`}
            className="max-w-full h-auto rounded border"
          />
        </div>
      )}

      {playData.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {playData.tags.map((tag, i) => (
            <Badge key={i} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t">
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => onReact?.('👍')}>
            <ThumbsUp className="h-4 w-4 mr-1" />
            Understood
          </Button>
          <Button size="sm" variant="outline" onClick={onStartDiscussion}>
            <MessageCircle className="h-4 w-4 mr-1" />
            Discuss
          </Button>
        </div>

        {metadata.requiresAcknowledgment && !acknowledged && (
          <Button size="sm" onClick={handleAcknowledge}>
            <CheckCircle className="h-4 w-4 mr-1" />
            Acknowledge
          </Button>
        )}
      </div>
    </div>
  );

  // Render formation update content
  const renderFormationUpdate = (formationData: any) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Formation Update
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary">{formationData.formationName}</Badge>
            <Badge variant="outline">{formationData.situationType}</Badge>
          </div>
        </div>
        <div className="text-right text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            Effective: {new Date(formationData.effectiveFrom).toLocaleDateString()}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium">Position Assignments:</h4>
        <div className="grid grid-cols-2 gap-2">
          {formationData.positions.slice(0, 6).map((pos: any, i: number) => (
            <div key={i} className="p-2 bg-muted/30 rounded text-sm">
              <div className="font-medium">{pos.position}</div>
              <div className="text-muted-foreground">{pos.role}</div>
              {pos.instructions && (
                <div className="text-xs text-blue-600 mt-1">{pos.instructions}</div>
              )}
            </div>
          ))}
        </div>
        {formationData.positions.length > 6 && (
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => setShowDetails(true)}
            className="w-full"
          >
            View All {formationData.positions.length} Positions
          </Button>
        )}
      </div>

      {formationData.notes && (
        <div className="p-3 bg-blue-50 rounded border-l-4 border-l-blue-500">
          <p className="text-sm">{formationData.notes}</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t">
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => onReact?.('✅')}>
            <CheckCircle className="h-4 w-4 mr-1" />
            Confirm
          </Button>
          <Button size="sm" variant="outline" onClick={onStartDiscussion}>
            <MessageCircle className="h-4 w-4 mr-1" />
            Questions
          </Button>
        </div>

        <Button size="sm" onClick={handleAcknowledge}>
          <CheckCircle className="h-4 w-4 mr-1" />
          Acknowledge Receipt
        </Button>
      </div>
    </div>
  );

  // Render video analysis content
  const renderVideoAnalysis = (videoData: any) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Video className="h-5 w-5" />
            {videoData.title}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary">Video Analysis</Badge>
            <span className="text-sm text-muted-foreground">
              {videoData.timestamps?.length || 0} key moments
            </span>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => onViewVideo?.(videoData.videoUrl, videoData.timestamps || [])}
        >
          <Play className="h-4 w-4 mr-1" />
          Watch Video
        </Button>
      </div>

      {videoData.analysisNotes && (
        <p className="text-sm text-muted-foreground">{videoData.analysisNotes}</p>
      )}

      {videoData.timestamps && videoData.timestamps.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Key Moments:</h4>
          <div className="space-y-1">
            {videoData.timestamps.slice(0, 3).map((ts: any, i: number) => {
              const minutes = Math.floor(ts.time / 60);
              const seconds = ts.time % 60;
              return (
                <div key={i} className="flex items-center gap-2 p-2 bg-muted/30 rounded text-sm">
                  <Badge variant="outline" className="font-mono text-xs">
                    {minutes}:{seconds.toString().padStart(2, '0')}
                  </Badge>
                  <span className="flex-1">{ts.title}</span>
                  {ts.playType && (
                    <Badge variant="secondary" className="text-xs">
                      {ts.playType}
                    </Badge>
                  )}
                </div>
              );
            })}
            {videoData.timestamps.length > 3 && (
              <div className="text-center">
                <Button size="sm" variant="ghost" onClick={() => setShowDetails(true)}>
                  +{videoData.timestamps.length - 3} more moments
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {videoData.relatedPlays && videoData.relatedPlays.length > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            References {videoData.relatedPlays.length} play system{videoData.relatedPlays.length > 1 ? 's' : ''}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t">
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => onReact?.('🎥')}>
            <Eye className="h-4 w-4 mr-1" />
            Watched
          </Button>
          <Button size="sm" variant="outline" onClick={onStartDiscussion}>
            <MessageCircle className="h-4 w-4 mr-1" />
            Discuss
          </Button>
        </div>

        {metadata.requiresAcknowledgment && !acknowledged && (
          <Button size="sm" onClick={handleAcknowledge}>
            <CheckCircle className="h-4 w-4 mr-1" />
            Acknowledge
          </Button>
        )}
      </div>
    </div>
  );

  // Render game plan content
  const renderGamePlan = (gamePlanData: any) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Target className="h-5 w-5" />
            Game Plan vs {gamePlanData.opponent}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="default">Game Plan</Badge>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {new Date(gamePlanData.gameDate).toLocaleDateString()}
            </div>
          </div>
        </div>
        {metadata.deadline && (
          <div className="text-right">
            <div className="text-sm text-amber-600 font-medium">
              Review by: {new Date(metadata.deadline).toLocaleDateString()}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium mb-2">Key Strategies</h4>
          <div className="space-y-1">
            {gamePlanData.keyStrategies.slice(0, 3).map((strategy: string, i: number) => (
              <div key={i} className="text-sm p-2 bg-green-50 border-l-2 border-l-green-500">
                {strategy}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">Focus Areas</h4>
          <div className="space-y-1">
            {gamePlanData.focusAreas.slice(0, 3).map((area: string, i: number) => (
              <div key={i} className="text-sm p-2 bg-blue-50 border-l-2 border-l-blue-500">
                {area}
              </div>
            ))}
          </div>
        </div>
      </div>

      {gamePlanData.lineupChanges && gamePlanData.lineupChanges.length > 0 && (
        <div className="p-3 bg-amber-50 rounded border-l-4 border-l-amber-500">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Lineup Changes
          </h4>
          {gamePlanData.lineupChanges.slice(0, 2).map((change: any, i: number) => (
            <div key={i} className="text-sm">
              <span className="font-medium">{change.line}:</span> {change.players.join(', ')}
              <span className="text-muted-foreground"> - {change.reason}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t">
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => onReact?.('🏒')}>
            <Target className="h-4 w-4 mr-1" />
            Ready
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowDetails(true)}>
            <FileText className="h-4 w-4 mr-1" />
            Full Plan
          </Button>
        </div>

        <Button size="sm" onClick={handleAcknowledge} className="bg-green-600 hover:bg-green-700">
          <CheckCircle className="h-4 w-4 mr-1" />
          Acknowledge
        </Button>
      </div>
    </div>
  );

  // Main render logic
  const renderTacticalContent = () => {
    if (metadata.playData) {
      return renderPlayShare(metadata.playData);
    }
    if (metadata.formationData) {
      return renderFormationUpdate(metadata.formationData);
    }
    if (metadata.videoData) {
      return renderVideoAnalysis(metadata.videoData);
    }
    if (metadata.gamePlanData) {
      return renderGamePlan(metadata.gamePlanData);
    }
    return null;
  };

  return (
    <>
      <Card className={`tactical-message ${getPriorityStyle()} ${isOwn ? 'ml-12' : 'mr-12'}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {getTacticalIcon()}
              <Avatar className="h-8 w-8">
                <AvatarImage src={senderAvatar} />
                <AvatarFallback>{senderName.charAt(0)}</AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{senderName}</span>
                <Badge variant="secondary" className="text-xs">
                  {metadata.tacticalType.replace('_', ' ')}
                </Badge>
                {metadata.requiresAcknowledgment && (
                  <Badge variant="destructive" className="text-xs">
                    Action Required
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <Clock className="h-3 w-3" />
                <span>{timestamp.toLocaleString()}</span>
                {metadata.deadline && (
                  <>
                    <span>•</span>
                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                    <span className="text-amber-600">
                      Due: {new Date(metadata.deadline).toLocaleDateString()}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {renderTacticalContent()}
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {getTacticalIcon()}
              {metadata.playData?.name || 
               metadata.formationData?.formationName ||
               metadata.videoData?.title ||
               `Game Plan vs ${metadata.gamePlanData?.opponent}` ||
               'Tactical Details'}
            </DialogTitle>
            <DialogDescription>
              Shared by {senderName} • {timestamp.toLocaleString()}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-6">
              {/* Full content would be rendered here with more details */}
              {metadata.formationData && (
                <div>
                  <h3 className="font-semibold mb-3">All Position Assignments</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {metadata.formationData.positions.map((pos: any, i: number) => (
                      <Card key={i}>
                        <CardContent className="p-3">
                          <div className="font-medium">{pos.position}</div>
                          <div className="text-sm text-muted-foreground mb-1">{pos.role}</div>
                          {pos.instructions && (
                            <div className="text-xs bg-blue-50 p-2 rounded mt-2">
                              {pos.instructions}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {metadata.videoData && (
                <div>
                  <h3 className="font-semibold mb-3">All Key Moments</h3>
                  <div className="space-y-2">
                    {metadata.videoData.timestamps.map((ts: any, i: number) => {
                      const minutes = Math.floor(ts.time / 60);
                      const seconds = ts.time % 60;
                      return (
                        <Card key={i}>
                          <CardContent className="p-3">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="font-mono">
                                {minutes}:{seconds.toString().padStart(2, '0')}
                              </Badge>
                              <div className="flex-1">
                                <div className="font-medium text-sm">{ts.title}</div>
                                <div className="text-xs text-muted-foreground">{ts.description}</div>
                              </div>
                              {ts.playType && (
                                <Badge variant="secondary" className="text-xs">
                                  {ts.playType}
                                </Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}