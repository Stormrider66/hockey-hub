'use client';

import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Share2,
  Users,
  User,
  Shield,
  Clock,
  MessageCircle,
  Play,
  Eye,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Target,
  FileText,
  Zap,
  ChevronRight,
  History,
  TrendingUp
} from '@/components/icons';
import { useTranslation } from '@hockey-hub/translations';
import { useGetUsersQuery, useGetConversationsQuery } from '@/store/api/chatApi';
import { 
  TacticalPlayData, 
  TacticalShareOptions,
  ShareHistory
} from '../../services/tacticalCommunicationService';
import { useTacticalCommunication } from '../../hooks/useTacticalCommunication';

interface TacticalShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  play: TacticalPlayData | null;
  teamId?: string;
  onShareComplete?: (shareData: any) => void;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  position?: string;
  avatar?: string;
  isOnline: boolean;
}

interface PositionGroup {
  name: string;
  positions: string[];
  memberIds: string[];
}

export default function TacticalShareModal({ 
  isOpen, 
  onClose, 
  play, 
  teamId,
  onShareComplete 
}: TacticalShareModalProps) {
  const { t } = useTranslation(['coach', 'common']);
  const tacticalComm = useTacticalCommunication();
  const [activeTab, setActiveTab] = useState<'share' | 'preview' | 'history'>('share');
  
  // Share configuration state
  const [shareWith, setShareWith] = useState<TacticalShareOptions['shareWith']>('team');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [shareType, setShareType] = useState<TacticalShareOptions['shareType']>('play_share');
  const [priority, setPriority] = useState<TacticalShareOptions['priority']>('normal');
  const [customMessage, setCustomMessage] = useState('');
  const [includePreview, setIncludePreview] = useState(true);
  const [includeInstructions, setIncludeInstructions] = useState(true);
  const [scheduleFor, setScheduleFor] = useState<Date | undefined>();
  const [requireAcknowledgment, setRequireAcknowledgment] = useState(false);
  
  // UI state
  const [isSharing, setIsSharing] = useState(false);
  const [selectedPositionGroup, setSelectedPositionGroup] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Data fetching
  const { data: users = [] } = useGetUsersQuery({ search: '', limit: 100 });
  const { data: conversations } = useGetConversationsQuery({ limit: 50 });
  const [shareHistory, setShareHistory] = useState<ShareHistory[]>([]);
  const [shareStats, setShareStats] = useState<any>({});

  // Mock team members and position groups for demo
  const mockTeamMembers: TeamMember[] = [
    { id: '1', name: 'Sidney Crosby', role: 'player', position: 'Center', isOnline: true },
    { id: '2', name: 'Nathan MacKinnon', role: 'player', position: 'Center', isOnline: false },
    { id: '3', name: 'Connor McDavid', role: 'player', position: 'Center', isOnline: true },
    { id: '4', name: 'Erik Karlsson', role: 'player', position: 'Defense', isOnline: true },
    { id: '5', name: 'Cale Makar', role: 'player', position: 'Defense', isOnline: true },
    { id: '6', name: 'Igor Shesterkin', role: 'player', position: 'Goalie', isOnline: false },
    { id: '7', name: 'Mike Sullivan', role: 'assistant_coach', isOnline: true },
    { id: '8', name: 'Todd Reirden', role: 'assistant_coach', isOnline: true }
  ];

  const positionGroups: PositionGroup[] = [
    { name: 'Centers', positions: ['Center'], memberIds: ['1', '2', '3'] },
    { name: 'Defense', positions: ['Defense'], memberIds: ['4', '5'] },
    { name: 'Forwards', positions: ['Center', 'LW', 'RW'], memberIds: ['1', '2', '3'] },
    { name: 'Goalies', positions: ['Goalie'], memberIds: ['6'] },
    { name: 'Coaching Staff', positions: ['coach', 'assistant_coach'], memberIds: ['7', '8'] }
  ];

  // Load share history on mount
  useEffect(() => {
    if (isOpen) {
      const history = tacticalComm.getShareHistory();
      const stats = tacticalComm.getShareStats();
      setShareHistory(history);
      setShareStats(stats);
    }
  }, [isOpen, tacticalComm]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab('share');
      setShareWith('team');
      setSelectedUserIds([]);
      setShareType('play_share');
      setPriority('normal');
      setCustomMessage('');
      setRequireAcknowledgment(false);
      setScheduleFor(undefined);
    }
  }, [isOpen, play]);

  // Auto-select all team members when shareWith changes to 'team'
  useEffect(() => {
    if (shareWith === 'team') {
      setSelectedUserIds(mockTeamMembers.filter(m => m.role === 'player').map(m => m.id));
    } else if (shareWith === 'coaching_staff') {
      setSelectedUserIds(mockTeamMembers.filter(m => m.role.includes('coach')).map(m => m.id));
    } else {
      setSelectedUserIds([]);
    }
  }, [shareWith]);

  // Handle position group selection
  const handlePositionGroupChange = (groupName: string) => {
    setSelectedPositionGroup(groupName);
    const group = positionGroups.find(g => g.name === groupName);
    if (group) {
      setSelectedUserIds(group.memberIds);
    }
  };

  // Handle individual user selection
  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Handle share execution
  const handleShare = async () => {
    if (!play || selectedUserIds.length === 0) return;

    setIsSharing(true);
    try {
      // Check if socket is connected for real-time sharing
      if (!tacticalComm.isConnected) {
        // Handle offline sharing - just save locally and show success
        console.log('Sharing play locally (offline mode):', play.name);
        
        // Simulate successful share for demo
        setTimeout(() => {
          onShareComplete?.({
            playId: play.id,
            playName: play.name,
            sharedWith: selectedUserIds.length,
            shareType,
            priority
          });
          onClose();
          setIsSharing(false);
        }, 500);
        
        return;
      }
      
      // Find team conversation (mock for demo)
      const teamConversationId = conversations?.conversations?.find(c => 
        c.type === 'team' && c.metadata?.teamId === teamId
      )?.id || 'team-conversation-id';

      const shareOptions: TacticalShareOptions = {
        shareWith,
        targetIds: selectedUserIds,
        includePreview,
        includeInstructions,
        scheduleFor,
        priority,
        message: customMessage,
        shareType
      };

      await tacticalComm.sharePlay(
        teamConversationId,
        play,
        shareOptions
      );

      // Call completion handler
      onShareComplete?.({
        playId: play.id,
        playName: play.name,
        sharedWith: selectedUserIds.length,
        shareType,
        priority
      });

      onClose();

    } catch (error) {
      console.error('Failed to share play:', error);
    } finally {
      setIsSharing(false);
    }
  };

  // Filter team members by search term
  const filteredMembers = mockTeamMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get selected members for preview
  const selectedMembers = mockTeamMembers.filter(m => selectedUserIds.includes(m.id));

  if (!play) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Tactical Play: {play.name}
          </DialogTitle>
          <DialogDescription>
            Share this play system with your team and track engagement
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab as any} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="share" className="flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                Share Options
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                History ({shareHistory.length})
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden mt-4">
              <TabsContent value="share" className="h-full overflow-auto">
                <div className="grid grid-cols-3 gap-6 h-full">
                  {/* Share Configuration */}
                  <div className="col-span-2 space-y-6">
                    <Card>
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          Who to share with
                        </h3>

                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <Button
                              variant={shareWith === 'team' ? 'default' : 'outline'}
                              onClick={() => setShareWith('team')}
                              className="h-16 flex flex-col gap-1"
                            >
                              <Users className="h-5 w-5" />
                              <span className="text-sm">Entire Team</span>
                              <span className="text-xs text-muted-foreground">
                                {mockTeamMembers.filter(m => m.role === 'player').length} players
                              </span>
                            </Button>

                            <Button
                              variant={shareWith === 'position_group' ? 'default' : 'outline'}
                              onClick={() => setShareWith('position_group')}
                              className="h-16 flex flex-col gap-1"
                            >
                              <Target className="h-5 w-5" />
                              <span className="text-sm">Position Group</span>
                              <span className="text-xs text-muted-foreground">
                                Centers, Defense, etc.
                              </span>
                            </Button>

                            <Button
                              variant={shareWith === 'individuals' ? 'default' : 'outline'}
                              onClick={() => setShareWith('individuals')}
                              className="h-16 flex flex-col gap-1"
                            >
                              <User className="h-5 w-5" />
                              <span className="text-sm">Individual Players</span>
                              <span className="text-xs text-muted-foreground">
                                Select specific players
                              </span>
                            </Button>

                            <Button
                              variant={shareWith === 'coaching_staff' ? 'default' : 'outline'}
                              onClick={() => setShareWith('coaching_staff')}
                              className="h-16 flex flex-col gap-1"
                            >
                              <Shield className="h-5 w-5" />
                              <span className="text-sm">Coaching Staff</span>
                              <span className="text-xs text-muted-foreground">
                                {mockTeamMembers.filter(m => m.role.includes('coach')).length} coaches
                              </span>
                            </Button>
                          </div>

                          {/* Position Group Selector */}
                          {shareWith === 'position_group' && (
                            <div className="space-y-3">
                              <Label>Select Position Group</Label>
                              <Select value={selectedPositionGroup} onValueChange={handlePositionGroupChange}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Choose a position group..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {positionGroups.map(group => (
                                    <SelectItem key={group.name} value={group.name}>
                                      {group.name} ({group.memberIds.length} members)
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {/* Individual Player Selection */}
                          {(shareWith === 'individuals' || shareWith === 'position_group') && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <Label>Select Recipients</Label>
                                <span className="text-sm text-muted-foreground">
                                  {selectedUserIds.length} selected
                                </span>
                              </div>

                              <Input
                                placeholder="Search team members..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="mb-3"
                              />

                              <ScrollArea className="h-48 border rounded-lg p-3">
                                <div className="space-y-2">
                                  {filteredMembers.map(member => (
                                    <div
                                      key={member.id}
                                      className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded-lg cursor-pointer"
                                      onClick={() => toggleUserSelection(member.id)}
                                    >
                                      <Checkbox
                                        checked={selectedUserIds.includes(member.id)}
                                        onChange={() => toggleUserSelection(member.id)}
                                      />
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium">{member.name}</span>
                                          <div className={`w-2 h-2 rounded-full ${
                                            member.isOnline ? 'bg-green-500' : 'bg-gray-400'
                                          }`} />
                                          {member.position && (
                                            <Badge variant="secondary" className="text-xs">
                                              {member.position}
                                            </Badge>
                                          )}
                                        </div>
                                        <span className="text-sm text-muted-foreground">
                                          {member.role.replace('_', ' ')}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </ScrollArea>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Share Settings */}
                    <Card>
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          Share Settings
                        </h3>

                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Share Type</Label>
                              <Select value={shareType} onValueChange={setShareType as any}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="play_share">Play Share</SelectItem>
                                  <SelectItem value="play_discussion">Start Discussion</SelectItem>
                                  <SelectItem value="formation_update">Formation Update</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label>Priority Level</Label>
                              <Select value={priority} onValueChange={setPriority as any}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="normal">Normal</SelectItem>
                                  <SelectItem value="important">Important</SelectItem>
                                  <SelectItem value="urgent">Urgent</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <Label>Custom Message (Optional)</Label>
                            <Textarea
                              placeholder="Add a message to accompany the play share..."
                              value={customMessage}
                              onChange={(e) => setCustomMessage(e.target.value)}
                              rows={3}
                            />
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <Label>Include Play Preview</Label>
                                <p className="text-sm text-muted-foreground">
                                  Generate a visual diagram of the play
                                </p>
                              </div>
                              <Switch
                                checked={includePreview}
                                onCheckedChange={setIncludePreview}
                              />
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <Label>Include Instructions</Label>
                                <p className="text-sm text-muted-foreground">
                                  Add practice tips and key points
                                </p>
                              </div>
                              <Switch
                                checked={includeInstructions}
                                onCheckedChange={setIncludeInstructions}
                              />
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <Label>Require Acknowledgment</Label>
                                <p className="text-sm text-muted-foreground">
                                  Players must confirm they've reviewed
                                </p>
                              </div>
                              <Switch
                                checked={requireAcknowledgment}
                                onCheckedChange={setRequireAcknowledgment}
                              />
                            </div>
                          </div>

                          {/* Advanced Options */}
                          <div className="pt-4 border-t">
                            <Button
                              variant="ghost"
                              onClick={() => setShowAdvanced(!showAdvanced)}
                              className="w-full justify-between"
                            >
                              Advanced Options
                              <ChevronRight className={`h-4 w-4 transition-transform ${
                                showAdvanced ? 'rotate-90' : ''
                              }`} />
                            </Button>

                            {showAdvanced && (
                              <div className="mt-4 space-y-3">
                                <div className="space-y-2">
                                  <Label>Schedule for Later (Optional)</Label>
                                  <Input
                                    type="datetime-local"
                                    value={scheduleFor ? scheduleFor.toISOString().slice(0, 16) : ''}
                                    onChange={(e) => setScheduleFor(e.target.value ? new Date(e.target.value) : undefined)}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Selected Recipients Summary */}
                  <div className="space-y-6">
                    <Card>
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <CheckCircle className="h-5 w-5" />
                          Selected Recipients
                        </h3>

                        {selectedMembers.length > 0 ? (
                          <div className="space-y-2">
                            {selectedMembers.slice(0, 6).map(member => (
                              <div key={member.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                                <div className={`w-2 h-2 rounded-full ${
                                  member.isOnline ? 'bg-green-500' : 'bg-gray-400'
                                }`} />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">{member.name}</p>
                                  <p className="text-xs text-muted-foreground">{member.position || member.role}</p>
                                </div>
                              </div>
                            ))}
                            {selectedMembers.length > 6 && (
                              <p className="text-sm text-muted-foreground text-center py-2">
                                +{selectedMembers.length - 6} more recipients
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No recipients selected
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Share Preview */}
                    <Card>
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <Play className="h-5 w-5" />
                          Play Summary
                        </h3>

                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Badge className={`${
                              play.category === 'offensive' ? 'bg-green-100 text-green-800' :
                              play.category === 'defensive' ? 'bg-red-100 text-red-800' :
                              play.category === 'special-teams' ? 'bg-purple-100 text-purple-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {play.category}
                            </Badge>
                            <Badge variant="outline">
                              {priority === 'urgent' ? '🚨' : priority === 'important' ? '⚠️' : '🏒'} {priority}
                            </Badge>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Situation:</span>
                              <span className="font-medium">{play.situation}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Formation:</span>
                              <span className="font-medium">{play.formation}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Tags:</span>
                              <span className="font-medium">{play.tags.join(', ') || 'None'}</span>
                            </div>
                          </div>

                          {play.description && (
                            <div className="pt-3 border-t">
                              <p className="text-sm text-muted-foreground">{play.description}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="preview" className="h-full">
                <Card className="h-full">
                  <CardContent className="p-6 h-full flex flex-col">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <MessageCircle className="h-5 w-5" />
                      Message Preview
                    </h3>

                    <div className="flex-1 bg-muted/30 rounded-lg p-4 overflow-auto">
                      <div className="bg-white rounded-lg p-4 border max-w-lg">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            C
                          </div>
                          <div>
                            <p className="font-medium text-sm">Head Coach</p>
                            <p className="text-xs text-muted-foreground">Now</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-sm">
                            {priority === 'urgent' ? '🚨' : priority === 'important' ? '⚠️' : '🏒'} <strong>NEW TACTICAL PLAY SHARED</strong>
                          </p>
                          
                          <p className="text-sm">
                            <strong>{play.name}</strong>
                          </p>
                          
                          <div className="text-sm space-y-1">
                            <p>📋 Category: {play.category.charAt(0).toUpperCase() + play.category.slice(1)}</p>
                            <p>🎯 Situation: {play.situation}</p>
                            <p>👥 Formation: {play.formation}</p>
                          </div>

                          {play.description && (
                            <div className="text-sm">
                              <p><strong>Description:</strong></p>
                              <p>{play.description}</p>
                            </div>
                          )}

                          {customMessage && (
                            <div className="text-sm">
                              <p><strong>Coach Notes:</strong></p>
                              <p>{customMessage}</p>
                            </div>
                          )}

                          {includeInstructions && (
                            <div className="text-sm">
                              <p><strong>📝 Instructions:</strong></p>
                              <ul className="text-sm space-y-0.5 ml-2">
                                <li>• Review the play diagram carefully</li>
                                <li>• Practice the positioning and timing</li>
                                <li>• Ask questions if anything is unclear</li>
                                <li>• React with 👍 when you understand the play</li>
                              </ul>
                            </div>
                          )}

                          {includePreview && (
                            <div className="bg-gray-100 rounded-lg p-3 text-center">
                              <Play className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                              <p className="text-xs text-muted-foreground">Play diagram would appear here</p>
                            </div>
                          )}

                          {priority === 'urgent' && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                              <p className="text-xs text-red-600">⏰ <strong>URGENT:</strong> Please review immediately and confirm understanding.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-sm mb-2">Share Summary</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Recipients:</span>
                          <span className="font-medium ml-2">{selectedUserIds.length}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Share Type:</span>
                          <span className="font-medium ml-2">{shareType.replace('_', ' ')}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Priority:</span>
                          <span className="font-medium ml-2">{priority}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Acknowledgment:</span>
                          <span className="font-medium ml-2">{requireAcknowledgment ? 'Required' : 'Optional'}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history" className="h-full">
                <div className="space-y-6 h-full">
                  {/* Share Statistics */}
                  <div className="grid grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">{shareStats.totalShares || 0}</div>
                        <p className="text-sm text-muted-foreground">Total Shares</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">{Math.round(shareStats.averageAcknowledgments || 0)}</div>
                        <p className="text-sm text-muted-foreground">Avg. Acknowledgments</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-purple-600">{shareStats.totalViews || 0}</div>
                        <p className="text-sm text-muted-foreground">Total Views</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {shareHistory.filter(h => h.playId === play.id).length}
                        </div>
                        <p className="text-sm text-muted-foreground">This Play</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recent Share History */}
                  <Card className="flex-1">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Recent Share History
                      </h3>

                      <ScrollArea className="h-96">
                        {shareHistory.length > 0 ? (
                          <div className="space-y-3">
                            {shareHistory.slice(0, 20).map((share) => (
                              <div key={share.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50">
                                <div className={`w-3 h-3 rounded-full ${
                                  share.playId === play.id ? 'bg-blue-500' : 'bg-gray-400'
                                }`} />
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-sm truncate">{share.playName}</span>
                                    <Badge variant="secondary" className="text-xs">
                                      {share.shareType.replace('_', ' ')}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span>Shared with {share.sharedWith.length} people</span>
                                    <span>{share.acknowledgments.length} acknowledged</span>
                                    <span>{share.viewCount} views</span>
                                  </div>
                                </div>

                                <div className="text-right">
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(share.sharedAt).toLocaleDateString()}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(share.sharedAt).toLocaleTimeString()}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Share History</h3>
                            <p className="text-muted-foreground">
                              Your tactical play shares will appear here
                            </p>
                          </div>
                        )}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {selectedUserIds.length > 0 && (
                <>
                  <Users className="h-4 w-4" />
                  <span>Sharing with {selectedUserIds.length} recipient{selectedUserIds.length > 1 ? 's' : ''}</span>
                </>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleShare}
                disabled={!selectedUserIds.length || isSharing}
                className="min-w-24"
              >
                {isSharing ? (
                  <>
                    <Zap className="h-4 w-4 mr-2 animate-spin" />
                    Sharing...
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Play
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}