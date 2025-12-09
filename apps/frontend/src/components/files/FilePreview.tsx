'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Share2,
  Maximize2,
  RotateCw,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  FileText,
  File,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useGetFileQuery, useGetSignedUrlMutation } from '@/store/api/fileApi';
import { format } from 'date-fns';

interface FilePreviewProps {
  fileId?: string;
  file?: any; // Can pass file object directly
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload?: () => void;
  onShare?: () => void;
  showFileList?: boolean;
  files?: any[]; // List of files for navigation
  currentIndex?: number;
  onNavigate?: (index: number) => void;
}

const FilePreview: React.FC<FilePreviewProps> = ({
  fileId,
  file: propFile,
  open,
  onOpenChange,
  onDownload,
  onShare,
  showFileList = false,
  files = [],
  currentIndex = 0,
  onNavigate,
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const { data: fetchedFile, isLoading: isLoadingFile } = useGetFileQuery(fileId!, {
    skip: !fileId || !!propFile,
  });
  const [getSignedUrl, { isLoading: isLoadingUrl }] = useGetSignedUrlMutation();

  const file = propFile || fetchedFile;
  const isLoading = isLoadingFile || isLoadingUrl;

  // Reset state when file changes
  useEffect(() => {
    setZoom(1);
    setRotation(0);
    setImageError(false);
    setPdfUrl(null);
  }, [file?.id]);

  // Load PDF URL if file is PDF
  useEffect(() => {
    const loadPdfUrl = async () => {
      if (file && file.mimeType === 'application/pdf') {
        try {
          const { url } = await getSignedUrl({ 
            fileId: file.id, 
            action: 'download' 
          }).unwrap();
          setPdfUrl(url);
        } catch (error) {
          console.error('Failed to load PDF URL:', error);
        }
      }
    };

    loadPdfUrl();
  }, [file, getSignedUrl]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const handlePrevious = () => {
    if (onNavigate && currentIndex > 0) {
      onNavigate(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (onNavigate && currentIndex < files.length - 1) {
      onNavigate(currentIndex + 1);
    }
  };

  const handleDownload = async () => {
    if (onDownload) {
      onDownload();
    } else if (file) {
      try {
        const { url } = await getSignedUrl({ 
          fileId: file.id, 
          action: 'download' 
        }).unwrap();
        window.open(url, '_blank');
      } catch (error) {
        console.error('Failed to download file:', error);
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderPreview = () => {
    if (!file) return null;

    if (file.mimeType.startsWith('image/') && !imageError) {
      return (
        <div className="relative flex items-center justify-center h-full bg-black">
          <img
            src={file.url}
            alt={file.name}
            className="max-w-full max-h-full object-contain"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transition: 'transform 0.2s',
            }}
            onError={() => setImageError(true)}
          />
        </div>
      );
    }

    if (file.mimeType === 'application/pdf' && pdfUrl) {
      return (
        <div className="relative h-full">
          <iframe
            src={`${pdfUrl}#toolbar=0`}
            className="w-full h-full"
            title={file.name}
          />
        </div>
      );
    }

    if (file.mimeType.startsWith('video/')) {
      return (
        <div className="relative flex items-center justify-center h-full bg-black">
          <video
            src={file.url}
            controls
            className="max-w-full max-h-full"
          />
        </div>
      );
    }

    if (file.mimeType.startsWith('text/') || 
        file.mimeType.includes('javascript') ||
        file.mimeType.includes('json')) {
      return (
        <div className="h-full overflow-auto p-4 bg-muted/50 rounded-lg">
          <pre className="text-sm font-mono">
            <code>File preview not available. Click download to view the file.</code>
          </pre>
        </div>
      );
    }

    // Default fallback
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        {file.mimeType.includes('document') || file.mimeType.includes('pdf') ? (
          <FileText className="h-24 w-24 text-muted-foreground" />
        ) : (
          <File className="h-24 w-24 text-muted-foreground" />
        )}
        <div className="text-center">
          <p className="text-lg font-medium">{file.name}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Preview not available for this file type
          </p>
          <Button onClick={handleDownload} className="mt-4">
            <Download className="h-4 w-4 mr-2" />
            Download File
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Skeleton className="w-full h-full" />
          </div>
        ) : file ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold truncate">{file.name}</h2>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                  <span>{formatFileSize(file.size)}</span>
                  <span>•</span>
                  <span>{format(new Date(file.createdAt), 'MMM d, yyyy h:mm a')}</span>
                  {file.accessCount && (
                    <>
                      <span>•</span>
                      <span>{file.accessCount} views</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {file.mimeType.startsWith('image/') && !imageError && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleZoomOut}
                      disabled={zoom <= 0.5}
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-sm w-12 text-center">{Math.round(zoom * 100)}%</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleZoomIn}
                      disabled={zoom >= 3}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleRotate}
                    >
                      <RotateCw className="h-4 w-4" />
                    </Button>
                  </>
                )}

                <Button variant="ghost" size="icon" onClick={handleDownload}>
                  <Download className="h-4 w-4" />
                </Button>

                {onShare && (
                  <Button variant="ghost" size="icon" onClick={onShare}>
                    <Share2 className="h-4 w-4" />
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onOpenChange(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 relative overflow-hidden">
              {renderPreview()}

              {/* Navigation arrows */}
              {showFileList && files.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2"
                    onClick={handlePrevious}
                    disabled={currentIndex === 0}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                    onClick={handleNext}
                    disabled={currentIndex === files.length - 1}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </>
              )}
            </div>

            {/* File info footer */}
            {file.description && (
              <div className="p-4 border-t">
                <p className="text-sm text-muted-foreground">{file.description}</p>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">File not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};