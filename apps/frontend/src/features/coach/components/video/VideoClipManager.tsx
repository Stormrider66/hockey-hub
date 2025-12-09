/**
 * VideoClipManager Component
 * 
 * Comprehensive video clip creation, management, and organization system
 * Supports tagging, collections, and export functionality
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import {
  Play,
  Pause,
  Scissors,
  Download,
  Share2,
  Tag,
  Folder,
  Search,
  Grid3X3,
  List,
  Star,
  Clock,
  Users,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Copy
} from '@/components/icons';
import type {
  VideoClip,
  ClipCollection,
  VideoSource,
  VideoAnnotation,
  VideoExport
} from '@/types/tactical/video.types';
import { cn, formatDuration } from '@/lib/utils';

export interface VideoClipManagerProps {
  videoSource: VideoSource;
  currentTime: number;
  duration: number;
  annotations: VideoAnnotation[];
  clips: VideoClip[];
  collections: ClipCollection[];
  onClipCreate: (clip: Omit<VideoClip, 'id' | 'createdAt' | 'createdBy'>) => void;
  onClipUpdate: (clipId: string, updates: Partial<VideoClip>) => void;
  onClipDelete: (clipId: string) => void;
  onCollectionCreate: (collection: Omit<ClipCollection, 'id' | 'createdAt' | 'createdBy'>) => void;
  onCollectionUpdate: (collectionId: string, updates: Partial<ClipCollection>) => void;
  onClipPlay: (startTime: number, endTime: number) => void;
  onExport: (clips: VideoClip[], format: VideoExport['format']) => void;
  className?: string;
}

interface ClipFormData {
  name: string;
  description: string;
  startTime: number;
  endTime: number;
  tags: string[];
  playIds: string[];
  formations: string[];
}

const DEFAULT_CLIP_FORM: ClipFormData = {
  name: '',
  description: '',
  startTime: 0,
  endTime: 0,
  tags: [],
  playIds: [],
  formations: []
};

const COMMON_TAGS = [
  'power-play',
  'penalty-kill',
  'offensive-zone',
  'defensive-zone',
  'breakout',
  'forechecking',
  'face-off',
  'goal',
  'save',
  'turnover',
  'zone-entry',
  'zone-exit'
];

const FORMATION_OPTIONS = [
  '2-1-2',
  '1-2-2',
  '1-3-1',
  '2-3',
  '1-4',
  'diamond',
  'box',
  'triangle'
];

export const VideoClipManager: React.FC<VideoClipManagerProps> = ({
  videoSource,
  currentTime,
  duration,
  annotations,
  clips,
  collections,
  onClipCreate,
  onClipUpdate,
  onClipDelete,
  onCollectionCreate,
  onCollectionUpdate,
  onClipPlay,
  onExport,
  className
}) => {
  const [activeTab, setActiveTab] = useState<'clips' | 'collections' | 'create'>('clips');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'duration' | 'tags'>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedClips, setSelectedClips] = useState<string[]>([]);
  
  const [clipForm, setClipForm] = useState<ClipFormData>(DEFAULT_CLIP_FORM);
  const [isCreatingClip, setIsCreatingClip] = useState(false);
  const [editingClip, setEditingClip] = useState<VideoClip | null>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);

  const previewRef = useRef<HTMLVideoElement>(null);

  // Initialize clip form with current time
  useEffect(() => {
    if (activeTab === 'create' && clipForm.startTime === 0 && clipForm.endTime === 0) {
      const start = Math.max(0, currentTime - 5);
      const end = Math.min(duration, currentTime + 5);
      
      setClipForm(prev => ({
        ...prev,
        startTime: start,
        endTime: end
      }));
    }
  }, [activeTab, currentTime, duration]);

  // Filter and sort clips
  const filteredClips = React.useMemo(() => {
    let filtered = clips.filter(clip => {
      // Search query filter
      if (searchQuery && !clip.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !clip.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Tags filter
      if (selectedTags.length > 0 && !selectedTags.some(tag => clip.tags.includes(tag))) {
        return false;
      }

      return true;
    });

    // Sort clips
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'created':
          aValue = a.createdAt.getTime();
          bValue = b.createdAt.getTime();
          break;
        case 'duration':
          aValue = a.endTime - a.startTime;
          bValue = b.endTime - b.startTime;
          break;
        case 'tags':
          aValue = a.tags.length;
          bValue = b.tags.length;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [clips, searchQuery, selectedTags, sortBy, sortOrder]);

  const handleCreateClip = () => {
    if (!clipForm.name.trim()) {
      alert('Please enter a clip name');
      return;
    }

    if (clipForm.startTime >= clipForm.endTime) {
      alert('End time must be after start time');
      return;
    }

    setIsCreatingClip(true);

    // Get annotations within clip time range
    const clipAnnotations = annotations.filter(annotation => 
      annotation.timestamp >= clipForm.startTime && 
      annotation.timestamp <= clipForm.endTime
    );

    const newClip: Omit<VideoClip, 'id' | 'createdAt' | 'createdBy'> = {
      videoId: videoSource.id,
      name: clipForm.name,
      description: clipForm.description || undefined,
      startTime: clipForm.startTime,
      endTime: clipForm.endTime,
      tags: clipForm.tags,
      playIds: clipForm.playIds,
      formations: clipForm.formations,
      shared: false,
      annotations: clipAnnotations
    };

    onClipCreate(newClip);
    setClipForm(DEFAULT_CLIP_FORM);
    setIsCreatingClip(false);
    setActiveTab('clips');
  };

  const handleUpdateClip = (clip: VideoClip, updates: Partial<VideoClip>) => {
    onClipUpdate(clip.id, updates);
    setEditingClip(null);
  };

  const handleDeleteClip = (clipId: string) => {
    if (confirm('Are you sure you want to delete this clip?')) {
      onClipDelete(clipId);
      setSelectedClips(prev => prev.filter(id => id !== clipId));
    }
  };

  const handleTagAdd = (tag: string) => {
    if (tag && !clipForm.tags.includes(tag)) {
      setClipForm(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const handleTagRemove = (tag: string) => {
    setClipForm(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleBulkAction = (action: 'delete' | 'export' | 'collection') => {
    const selectedClipObjects = clips.filter(clip => selectedClips.includes(clip.id));

    switch (action) {
      case 'delete':
        if (confirm(`Delete ${selectedClips.length} clips?`)) {
          selectedClips.forEach(clipId => onClipDelete(clipId));
          setSelectedClips([]);
        }
        break;
      case 'export':
        setShowExportDialog(true);
        break;
      case 'collection':
        // Would show collection creation dialog
        break;
    }
  };

  const generateThumbnail = (clip: VideoClip): string => {
    // In a real implementation, this would generate actual video thumbnails
    // For now, return a placeholder or use video poster
    return videoSource.thumbnailUrl || '/api/placeholder/160/90';
  };

  return (
    <div className={cn("w-full h-full bg-background", className)}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold">Video Clips</h2>
            <Badge variant="secondary">{clips.length} clips</Badge>
          </div>

          <div className="flex items-center space-x-2">
            {/* View Mode Toggle */}
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>

            {/* Bulk Actions */}
            {selectedClips.length > 0 && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-blue-50 rounded-md">
                <span className="text-sm">{selectedClips.length} selected</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleBulkAction('export')}
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleBulkAction('delete')}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="clips">Clips ({clips.length})</TabsTrigger>
            <TabsTrigger value="collections">Collections ({collections.length})</TabsTrigger>
            <TabsTrigger value="create">Create Clip</TabsTrigger>
          </TabsList>

          <TabsContent value="clips" className="flex-1 flex flex-col space-y-4 p-4">
            {/* Search and Filters */}
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search clips..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created">Created</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="duration">Duration</SelectItem>
                  <SelectItem value="tags">Tags</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>

            {/* Tag Filters */}
            <div className="flex items-center space-x-2 flex-wrap">
              <Label className="text-sm font-medium">Filter by tags:</Label>
              {COMMON_TAGS.slice(0, 6).map(tag => (
                <Button
                  key={tag}
                  variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setSelectedTags(prev => 
                      prev.includes(tag)
                        ? prev.filter(t => t !== tag)
                        : [...prev, tag]
                    );
                  }}
                  className="text-xs"
                >
                  {tag}
                </Button>
              ))}
              {selectedTags.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTags([])}
                  className="text-xs text-gray-500"
                >
                  Clear filters
                </Button>
              )}
            </div>

            {/* Clips Grid/List */}
            <div className="flex-1 overflow-auto">
              {filteredClips.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Scissors className="w-16 h-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-500 mb-2">No clips found</h3>
                  <p className="text-gray-400 mb-4">
                    {searchQuery || selectedTags.length > 0
                      ? 'Try adjusting your search or filters'
                      : 'Create your first clip to get started'
                    }
                  </p>
                  <Button onClick={() => setActiveTab('create')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Clip
                  </Button>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredClips.map(clip => (
                    <ClipCard
                      key={clip.id}
                      clip={clip}
                      thumbnail={generateThumbnail(clip)}
                      isSelected={selectedClips.includes(clip.id)}
                      onSelect={(selected) => {
                        setSelectedClips(prev => 
                          selected 
                            ? [...prev, clip.id]
                            : prev.filter(id => id !== clip.id)
                        );
                      }}
                      onPlay={() => onClipPlay(clip.startTime, clip.endTime)}
                      onEdit={() => setEditingClip(clip)}
                      onDelete={() => handleDeleteClip(clip.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredClips.map(clip => (
                    <ClipListItem
                      key={clip.id}
                      clip={clip}
                      isSelected={selectedClips.includes(clip.id)}
                      onSelect={(selected) => {
                        setSelectedClips(prev => 
                          selected 
                            ? [...prev, clip.id]
                            : prev.filter(id => id !== clip.id)
                        );
                      }}
                      onPlay={() => onClipPlay(clip.startTime, clip.endTime)}
                      onEdit={() => setEditingClip(clip)}
                      onDelete={() => handleDeleteClip(clip.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="collections" className="flex-1 p-4">
            <div className="text-center py-8">
              <Folder className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-500 mb-2">Collections</h3>
              <p className="text-gray-400">Organize your clips into collections</p>
              <Button className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Create Collection
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="create" className="flex-1 p-4">
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Create New Clip</h3>
                
                <div className="space-y-4">
                  {/* Basic Info */}
                  <div className="space-y-2">
                    <Label>Clip Name *</Label>
                    <Input
                      value={clipForm.name}
                      onChange={(e) => setClipForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter clip name..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={clipForm.description}
                      onChange={(e) => setClipForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Optional description..."
                      rows={2}
                    />
                  </div>

                  {/* Time Range */}
                  <div className="space-y-4">
                    <Label>Time Range</Label>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-600">Start Time</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            min="0"
                            max={duration}
                            step="0.1"
                            value={clipForm.startTime.toFixed(1)}
                            onChange={(e) => setClipForm(prev => ({ 
                              ...prev, 
                              startTime: Math.max(0, parseFloat(e.target.value) || 0)
                            }))}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setClipForm(prev => ({ ...prev, startTime: currentTime }))}
                          >
                            Current
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm text-gray-600">End Time</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            min={clipForm.startTime}
                            max={duration}
                            step="0.1"
                            value={clipForm.endTime.toFixed(1)}
                            onChange={(e) => setClipForm(prev => ({ 
                              ...prev, 
                              endTime: Math.min(duration, parseFloat(e.target.value) || 0)
                            }))}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setClipForm(prev => ({ ...prev, endTime: currentTime }))}
                          >
                            Current
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="text-sm text-gray-500">
                      Duration: {formatDuration(clipForm.endTime - clipForm.startTime)}
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {clipForm.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="cursor-pointer">
                          {tag}
                          <button
                            onClick={() => handleTagRemove(tag)}
                            className="ml-1 hover:text-red-500"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {COMMON_TAGS.filter(tag => !clipForm.tags.includes(tag)).map(tag => (
                        <Button
                          key={tag}
                          variant="outline"
                          size="sm"
                          onClick={() => handleTagAdd(tag)}
                          className="text-xs"
                        >
                          + {tag}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between pt-4">
                    <Button
                      variant="outline"
                      onClick={() => onClipPlay(clipForm.startTime, clipForm.endTime)}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Preview
                    </Button>

                    <div className="space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setClipForm(DEFAULT_CLIP_FORM);
                          setActiveTab('clips');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCreateClip}
                        disabled={isCreatingClip || !clipForm.name.trim()}
                      >
                        {isCreatingClip ? 'Creating...' : 'Create Clip'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Export Dialog */}
      {showExportDialog && (
        <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Export Clips</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>Export {selectedClips.length} selected clips</p>
              <Select onValueChange={(format) => {
                const selectedClipObjects = clips.filter(clip => selectedClips.includes(clip.id));
                onExport(selectedClipObjects, format as VideoExport['format']);
                setShowExportDialog(false);
                setSelectedClips([]);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select format..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mp4">MP4 Video</SelectItem>
                  <SelectItem value="webm">WebM Video</SelectItem>
                  <SelectItem value="gif">Animated GIF</SelectItem>
                  <SelectItem value="pdf">PDF Report</SelectItem>
                  <SelectItem value="json">Data Export (JSON)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

// Clip Card Component (Grid View)
interface ClipCardProps {
  clip: VideoClip;
  thumbnail: string;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onPlay: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const ClipCard: React.FC<ClipCardProps> = ({
  clip,
  thumbnail,
  isSelected,
  onSelect,
  onPlay,
  onEdit,
  onDelete
}) => {
  return (
    <Card className={cn(
      "group cursor-pointer transition-all hover:shadow-md",
      isSelected && "ring-2 ring-blue-500"
    )}>
      <CardContent className="p-0">
        {/* Thumbnail */}
        <div className="relative">
          <img
            src={thumbnail}
            alt={clip.name}
            className="w-full h-24 object-cover rounded-t-md"
          />
          
          {/* Overlay Controls */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
            <Button size="sm" onClick={onPlay} className="bg-white/20">
              <Play className="w-4 h-4" />
            </Button>
          </div>

          {/* Duration Badge */}
          <Badge className="absolute bottom-1 right-1 text-xs">
            {formatDuration(clip.endTime - clip.startTime)}
          </Badge>

          {/* Selection Checkbox */}
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(e.target.checked)}
            className="absolute top-1 left-1"
          />
        </div>

        {/* Content */}
        <div className="p-3">
          <h4 className="font-medium text-sm truncate">{clip.name}</h4>
          {clip.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{clip.description}</p>
          )}
          
          {/* Tags */}
          {clip.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {clip.tags.slice(0, 3).map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {clip.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{clip.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center mt-2">
            <div className="flex items-center space-x-1">
              <Button variant="ghost" size="sm" onClick={onEdit} className="p-1">
                <Edit2 className="w-3 h-3" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onDelete} className="p-1 text-red-500">
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
            <span className="text-xs text-gray-400">
              {clip.createdAt.toLocaleDateString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Clip List Item Component (List View)
interface ClipListItemProps {
  clip: VideoClip;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onPlay: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const ClipListItem: React.FC<ClipListItemProps> = ({
  clip,
  isSelected,
  onSelect,
  onPlay,
  onEdit,
  onDelete
}) => {
  return (
    <div className={cn(
      "flex items-center space-x-4 p-3 border rounded-md hover:bg-gray-50 transition-colors",
      isSelected && "bg-blue-50 border-blue-300"
    )}>
      <input
        type="checkbox"
        checked={isSelected}
        onChange={(e) => onSelect(e.target.checked)}
      />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <h4 className="font-medium truncate">{clip.name}</h4>
          <Badge variant="outline" className="text-xs">
            {formatDuration(clip.endTime - clip.startTime)}
          </Badge>
        </div>
        
        {clip.description && (
          <p className="text-sm text-gray-500 truncate mt-1">{clip.description}</p>
        )}
        
        <div className="flex items-center space-x-4 mt-1 text-xs text-gray-400">
          <span>{clip.createdAt.toLocaleDateString()}</span>
          <span>{clip.tags.length} tags</span>
          {clip.annotations.length > 0 && (
            <span>{clip.annotations.length} annotations</span>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="sm" onClick={onPlay}>
          <Play className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Edit2 className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-500">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default VideoClipManager;