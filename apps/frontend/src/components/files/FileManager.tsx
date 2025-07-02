'use client';

import React, { useState, useMemo } from 'react';
import {
  File,
  Image,
  Video,
  FileText,
  Download,
  Share2,
  Trash2,
  Eye,
  Search,
  Filter,
  Grid,
  List,
  MoreVertical,
  Calendar,
  Tag,
  Folder,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useSearchFilesQuery, useDeleteFileMutation, useGetSignedUrlMutation } from '@/store/api/fileApi';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface FileManagerProps {
  category?: string;
  userId?: string;
  organizationId?: string;
  teamId?: string;
  viewMode?: 'grid' | 'list';
  showFilters?: boolean;
  selectable?: boolean;
  onFileSelect?: (file: any) => void;
  onFilesSelect?: (files: any[]) => void;
  className?: string;
}

const FileManager: React.FC<FileManagerProps> = ({
  category,
  userId,
  organizationId,
  teamId,
  viewMode: initialViewMode = 'list',
  showFilters = true,
  selectable = false,
  onFileSelect,
  onFilesSelect,
  className,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(initialViewMode);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(category || 'all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'name' | 'size'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 20;

  const { toast } = useToast();
  const [deleteFile] = useDeleteFileMutation();
  const [getSignedUrl] = useGetSignedUrlMutation();

  // Query parameters
  const queryParams = {
    userId,
    organizationId,
    teamId,
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
    search: searchTerm || undefined,
    sortBy,
    sortOrder,
    limit: pageSize,
    offset: currentPage * pageSize,
  };

  const { data, isLoading, error, refetch } = useSearchFilesQuery(queryParams);

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="h-5 w-5" />;
    if (mimeType.startsWith('video/')) return <Video className="h-5 w-5" />;
    if (mimeType.includes('pdf') || mimeType.includes('document')) return <FileText className="h-5 w-5" />;
    return <File className="h-5 w-5" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      profile_photo: 'bg-blue-500',
      medical_document: 'bg-red-500',
      training_video: 'bg-green-500',
      game_video: 'bg-purple-500',
      team_document: 'bg-orange-500',
      contract: 'bg-pink-500',
      report: 'bg-yellow-500',
      other: 'bg-gray-500',
    };
    return colors[category] || colors.other;
  };

  const handleFileSelect = (file: any) => {
    if (selectable) {
      const newSelectedFiles = new Set(selectedFiles);
      if (newSelectedFiles.has(file.id)) {
        newSelectedFiles.delete(file.id);
      } else {
        newSelectedFiles.add(file.id);
      }
      setSelectedFiles(newSelectedFiles);
      
      if (onFilesSelect) {
        const selected = data?.files.filter(f => newSelectedFiles.has(f.id)) || [];
        onFilesSelect(selected);
      }
    } else if (onFileSelect) {
      onFileSelect(file);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(data?.files.map(f => f.id) || []);
      setSelectedFiles(allIds);
      if (onFilesSelect) {
        onFilesSelect(data?.files || []);
      }
    } else {
      setSelectedFiles(new Set());
      if (onFilesSelect) {
        onFilesSelect([]);
      }
    }
  };

  const handleDelete = async (fileId: string) => {
    try {
      await deleteFile(fileId).unwrap();
      toast({
        title: 'File deleted',
        description: 'The file has been deleted successfully.',
      });
      refetch();
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: 'Failed to delete the file. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDownload = async (file: any) => {
    try {
      const { url } = await getSignedUrl({ fileId: file.id, action: 'download' }).unwrap();
      window.open(url, '_blank');
    } catch (error) {
      toast({
        title: 'Download failed',
        description: 'Failed to generate download link. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const renderGridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {data?.files.map((file) => (
        <Card
          key={file.id}
          className={cn(
            'cursor-pointer transition-all hover:shadow-lg',
            selectedFiles.has(file.id) && 'ring-2 ring-primary'
          )}
          onClick={() => handleFileSelect(file)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className={cn('p-2 rounded-lg', getCategoryColor(file.category), 'bg-opacity-10')}>
                {getFileIcon(file.mimeType)}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleDownload(file)}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleDelete(file.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {file.thumbnailUrl && file.mimeType.startsWith('image/') ? (
              <img
                src={file.thumbnailUrl}
                alt={file.name}
                className="w-full h-32 object-cover rounded-md mb-3"
              />
            ) : (
              <div className="w-full h-32 bg-muted rounded-md mb-3 flex items-center justify-center">
                {getFileIcon(file.mimeType)}
              </div>
            )}

            <h4 className="font-medium text-sm truncate mb-1">{file.name}</h4>
            <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(file.createdAt), 'MMM d, yyyy')}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderListView = () => (
    <Table>
      <TableHeader>
        <TableRow>
          {selectable && (
            <TableHead className="w-12">
              <Checkbox
                checked={selectedFiles.size === data?.files.length && data?.files.length > 0}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
          )}
          <TableHead>Name</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Size</TableHead>
          <TableHead>Modified</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data?.files.map((file) => (
          <TableRow
            key={file.id}
            className={cn(
              'cursor-pointer',
              selectedFiles.has(file.id) && 'bg-muted'
            )}
            onClick={() => handleFileSelect(file)}
          >
            {selectable && (
              <TableCell>
                <Checkbox
                  checked={selectedFiles.has(file.id)}
                  onClick={(e) => e.stopPropagation()}
                />
              </TableCell>
            )}
            <TableCell>
              <div className="flex items-center space-x-3">
                {getFileIcon(file.mimeType)}
                <span className="font-medium">{file.name}</span>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline" className="capitalize">
                {file.category.replace('_', ' ')}
              </Badge>
            </TableCell>
            <TableCell>{formatFileSize(file.size)}</TableCell>
            <TableCell>{format(new Date(file.createdAt), 'MMM d, yyyy h:mm a')}</TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleDownload(file)}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleDelete(file.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Failed to load files</p>
        <Button onClick={() => refetch()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {showFilters && (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              <SelectItem value="profile_photo">Profile Photos</SelectItem>
              <SelectItem value="medical_document">Medical Documents</SelectItem>
              <SelectItem value="training_video">Training Videos</SelectItem>
              <SelectItem value="game_video">Game Videos</SelectItem>
              <SelectItem value="team_document">Team Documents</SelectItem>
              <SelectItem value="contract">Contracts</SelectItem>
              <SelectItem value="report">Reports</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Date</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="size">Size</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? renderGridView() : renderListView()}

          {data && data.total > pageSize && (
            <div className="flex justify-between items-center mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {currentPage * pageSize + 1} to{' '}
                {Math.min((currentPage + 1) * pageSize, data.total)} of {data.total} files
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                  disabled={currentPage === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={(currentPage + 1) * pageSize >= data.total}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};