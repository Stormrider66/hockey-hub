import React, { useState } from 'react';
import { 
  Download, 
  ExternalLink, 
  Eye, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Music, 
  Archive,
  X,
  Maximize2,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { MessageAttachment } from '@/store/api/chatApi';

interface AttachmentPreviewProps {
  attachments: MessageAttachment[];
  className?: string;
  maxPreviewSize?: number;
  showDownloadButton?: boolean;
  showFileName?: boolean;
  layout?: 'grid' | 'list' | 'inline';
}

const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({
  attachments,
  className,
  maxPreviewSize = 300,
  showDownloadButton = true,
  showFileName = true,
  layout = 'grid',
}) => {
  const [selectedAttachment, setSelectedAttachment] = useState<MessageAttachment | null>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    if (type.startsWith('video/')) return <Video className="h-4 w-4" />;
    if (type.startsWith('audio/')) return <Music className="h-4 w-4" />;
    if (type.includes('pdf')) return <FileText className="h-4 w-4" />;
    if (type.includes('zip') || type.includes('rar') || type.includes('7z')) {
      return <Archive className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const getFileTypeColor = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (type.startsWith('image/')) return 'text-green-600 dark:text-green-400';
    if (type.startsWith('video/')) return 'text-purple-600 dark:text-purple-400';
    if (type.startsWith('audio/')) return 'text-blue-600 dark:text-blue-400';
    if (type.includes('pdf')) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const isImage = (fileType: string) => fileType.startsWith('image/');
  const isVideo = (fileType: string) => fileType.startsWith('video/');
  const isAudio = (fileType: string) => fileType.startsWith('audio/');

  const handleDownload = (attachment: MessageAttachment) => {
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const ImagePreview: React.FC<{ attachment: MessageAttachment; size?: number }> = ({ 
    attachment, 
    size = maxPreviewSize 
  }) => (
    <div className="relative group">
      <img
        src={attachment.thumbnailUrl || attachment.url}
        alt={attachment.fileName}
        className={cn(
          "rounded-lg object-cover cursor-pointer transition-transform hover:scale-105",
          layout === 'inline' ? "max-h-32" : "max-w-full max-h-64"
        )}
        style={layout === 'grid' ? { maxWidth: size, maxHeight: size } : {}}
        onClick={() => setSelectedAttachment(attachment)}
      />
      
      {/* Overlay with actions */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedAttachment(attachment);
            }}
            className="h-8 w-8 p-0"
          >
            <Eye className="h-4 w-4" />
          </Button>
          {showDownloadButton && (
            <Button
              size="sm"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                handleDownload(attachment);
              }}
              className="h-8 w-8 p-0"
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      {showFileName && layout !== 'inline' && (
        <div className="mt-2 text-xs text-muted-foreground truncate">
          {attachment.fileName}
        </div>
      )}
    </div>
  );

  const VideoPreview: React.FC<{ attachment: MessageAttachment }> = ({ attachment }) => (
    <div className="relative">
      <video
        src={attachment.url}
        poster={attachment.thumbnailUrl}
        controls
        className="rounded-lg max-w-full max-h-64"
        style={layout === 'grid' ? { maxWidth: maxPreviewSize } : {}}
      />
      {showDownloadButton && (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => handleDownload(attachment)}
          className="absolute top-2 right-2 h-8 w-8 p-0"
        >
          <Download className="h-4 w-4" />
        </Button>
      )}
      {showFileName && (
        <div className="mt-2 text-xs text-muted-foreground truncate">
          {attachment.fileName}
        </div>
      )}
    </div>
  );

  const AudioPreview: React.FC<{ attachment: MessageAttachment }> = ({ attachment }) => (
    <div className="flex items-center gap-3 p-3 border rounded-lg">
      <div className={cn("flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20", getFileTypeColor(attachment.fileType))}>
        <Music className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{attachment.fileName}</div>
        <div className="text-xs text-muted-foreground">
          {formatFileSize(attachment.fileSize)}
        </div>
        <audio src={attachment.url} controls className="w-full mt-2" />
      </div>
      {showDownloadButton && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleDownload(attachment)}
          className="h-8 w-8 p-0"
        >
          <Download className="h-4 w-4" />
        </Button>
      )}
    </div>
  );

  const FilePreview: React.FC<{ attachment: MessageAttachment }> = ({ attachment }) => (
    <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors">
      <div className={cn("flex items-center justify-center w-10 h-10 rounded-lg bg-muted", getFileTypeColor(attachment.fileType))}>
        {getFileIcon(attachment.fileType)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{attachment.fileName}</div>
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <span>{formatFileSize(attachment.fileSize)}</span>
          <Badge variant="outline" className="text-xs">
            {attachment.fileType.split('/')[1]?.toUpperCase() || 'FILE'}
          </Badge>
        </div>
      </div>
      <div className="flex gap-1">
        <a
          href={attachment.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Download"
          className="inline-flex items-center justify-center rounded-md h-8 w-8 hover:bg-accent"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
        {showDownloadButton && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDownload(attachment)}
            className="h-8 w-8 p-0"
          >
            <Download className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );

  if (attachments.length === 0) return null;

  const renderAttachment = (attachment: MessageAttachment) => {
    if (isImage(attachment.fileType)) {
      return <ImagePreview key={attachment.id} attachment={attachment} />;
    } else if (isVideo(attachment.fileType)) {
      return <VideoPreview key={attachment.id} attachment={attachment} />;
    } else if (isAudio(attachment.fileType)) {
      return <AudioPreview key={attachment.id} attachment={attachment} />;
    } else {
      return <FilePreview key={attachment.id} attachment={attachment} />;
    }
  };

  return (
    <>
      <div className={cn(
        "space-y-2",
        layout === 'grid' && attachments.length > 1 && "grid grid-cols-2 gap-2 space-y-0",
        layout === 'inline' && "flex gap-2 overflow-x-auto",
        className
      )}>
        {attachments.map(renderAttachment)}
      </div>

      {/* Full-screen image viewer */}
      <Dialog open={!!selectedAttachment} onOpenChange={(open) => !open && setSelectedAttachment(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          {selectedAttachment && isImage(selectedAttachment.fileType) && (
            <div className="relative">
              <img
                src={selectedAttachment.url}
                alt={selectedAttachment.fileName}
                className="w-full h-auto max-h-[80vh] object-contain"
              />
              <div className="absolute top-4 right-4 flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleDownload(selectedAttachment)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setSelectedAttachment(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg">
                <div className="font-medium text-sm">{selectedAttachment.fileName}</div>
                <div className="text-xs opacity-75">
                  {formatFileSize(selectedAttachment.fileSize)}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AttachmentPreview;