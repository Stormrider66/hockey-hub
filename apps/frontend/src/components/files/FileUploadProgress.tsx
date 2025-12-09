'use client';

import React, { useEffect, useState } from 'react';
import { Upload, X, CheckCircle, AlertCircle, FileIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingDots, LoadingSpinner } from '@/components/ui/loading';

export interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'success' | 'error';
  error?: string;
  uploadedUrl?: string;
  startTime?: number;
  endTime?: number;
}

interface FileUploadProgressProps {
  files: UploadingFile[];
  onCancel?: (fileId: string) => void;
  onRetry?: (fileId: string) => void;
  onRemove?: (fileId: string) => void;
  className?: string;
  compact?: boolean;
  position?: 'fixed' | 'relative';
}

const FileUploadProgress: React.FC<FileUploadProgressProps> = ({
  files,
  onCancel,
  onRetry,
  onRemove,
  className,
  compact = false,
  position = 'relative',
}) => {
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getUploadSpeed = (file: UploadingFile): string => {
    if (!file.startTime || file.status !== 'uploading') return '';
    
    const elapsed = (Date.now() - file.startTime) / 1000; // seconds
    const bytesUploaded = (file.file.size * file.progress) / 100;
    const speed = bytesUploaded / elapsed;
    
    return `${formatFileSize(Math.round(speed))}/s`;
  };

  const getTimeRemaining = (file: UploadingFile): string => {
    if (!file.startTime || file.status !== 'uploading' || file.progress === 0) return '';
    
    const elapsed = (Date.now() - file.startTime) / 1000;
    const rate = file.progress / elapsed;
    const remaining = (100 - file.progress) / rate;
    
    if (remaining < 60) {
      return `${Math.round(remaining)}s remaining`;
    } else {
      return `${Math.round(remaining / 60)}m remaining`;
    }
  };

  const getStatusIcon = (status: UploadingFile['status']) => {
    switch (status) {
      case 'pending':
        return <FileIcon className="h-4 w-4 text-muted-foreground" />;
      case 'uploading':
        return <Upload className="h-4 w-4 text-primary animate-pulse" />;
      case 'processing':
        return <LoadingSpinner size="sm" variant="primary" center={false} />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
    }
  };

  const getStatusText = (file: UploadingFile): string => {
    switch (file.status) {
      case 'pending':
        return 'Waiting...';
      case 'uploading':
        return `Uploading ${file.progress}%`;
      case 'processing':
        return 'Processing...';
      case 'success':
        return 'Uploaded';
      case 'error':
        return file.error || 'Upload failed';
    }
  };

  const toggleExpanded = (fileId: string) => {
    setExpandedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  if (files.length === 0) return null;

  const containerClasses = cn(
    'space-y-2',
    position === 'fixed' && 'fixed bottom-4 right-4 z-50 w-96',
    className
  );

  return (
    <div className={containerClasses}>
      <AnimatePresence>
        {files.map((file) => (
          <motion.div
            key={file.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="p-3">
              <div className="space-y-2">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    {getStatusIcon(file.status)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {file.file.name}
                      </p>
                      {!compact && (
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.file.size)}
                          {file.status === 'uploading' && ` • ${getUploadSpeed(file)}`}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    {file.status === 'uploading' && onCancel && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => onCancel(file.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    {file.status === 'error' && onRetry && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRetry(file.id)}
                      >
                        Retry
                      </Button>
                    )}
                    {(file.status === 'success' || file.status === 'error') && onRemove && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => onRemove(file.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Progress */}
                {file.status === 'uploading' && (
                  <div className="space-y-1">
                    <Progress value={file.progress} className="h-2" />
                    {!compact && (
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{getStatusText(file)}</span>
                        <span>{getTimeRemaining(file)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Status text for non-uploading states */}
                {file.status !== 'uploading' && !compact && (
                  <p className={cn(
                    'text-xs',
                    file.status === 'success' && 'text-green-600',
                    file.status === 'error' && 'text-destructive'
                  )}>
                    {getStatusText(file)}
                  </p>
                )}
              </div>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Summary */}
      {files.length > 3 && (
        <Card className="p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {files.filter(f => f.status === 'success').length} of {files.length} uploaded
            </span>
            {files.some(f => f.status === 'uploading') && (
              <span className="text-primary inline-flex items-center gap-1">
                {files.filter(f => f.status === 'uploading').length} uploading
                <LoadingDots size="xs" color="primary" />
              </span>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

// Hook for managing upload progress
export const useFileUploadProgress = () => {
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, UploadingFile>>(new Map());

  const addFile = (file: File): string => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const uploadingFile: UploadingFile = {
      id,
      file,
      progress: 0,
      status: 'pending',
      startTime: Date.now(),
    };

    setUploadingFiles(prev => new Map(prev).set(id, uploadingFile));
    return id;
  };

  const updateProgress = (fileId: string, progress: number) => {
    setUploadingFiles(prev => {
      const newMap = new Map(prev);
      const file = newMap.get(fileId);
      if (file) {
        newMap.set(fileId, {
          ...file,
          progress,
          status: 'uploading',
        });
      }
      return newMap;
    });
  };

  const setFileStatus = (
    fileId: string,
    status: UploadingFile['status'],
    error?: string,
    uploadedUrl?: string
  ) => {
    setUploadingFiles(prev => {
      const newMap = new Map(prev);
      const file = newMap.get(fileId);
      if (file) {
        newMap.set(fileId, {
          ...file,
          status,
          error,
          uploadedUrl,
          endTime: Date.now(),
        });
      }
      return newMap;
    });
  };

  const removeFile = (fileId: string) => {
    setUploadingFiles(prev => {
      const newMap = new Map(prev);
      newMap.delete(fileId);
      return newMap;
    });
  };

  const clearCompleted = () => {
    setUploadingFiles(prev => {
      const newMap = new Map(prev);
      Array.from(newMap.entries()).forEach(([id, file]) => {
        if (file.status === 'success' || file.status === 'error') {
          newMap.delete(id);
        }
      });
      return newMap;
    });
  };

  return {
    uploadingFiles: Array.from(uploadingFiles.values()),
    addFile,
    updateProgress,
    setFileStatus,
    removeFile,
    clearCompleted,
  };
};