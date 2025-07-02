'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Upload, X, File, Image, Video, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  maxFiles?: number;
  onUpload?: (files: File[]) => Promise<void>;
  onFileSelect?: (files: File[]) => void;
  className?: string;
  disabled?: boolean;
  showPreview?: boolean;
  category?: 'profile_photo' | 'medical_document' | 'training_video' | 'game_video' | 'team_document' | 'contract' | 'report' | 'other';
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  preview?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  accept = '*',
  multiple = false,
  maxSize = 52428800, // 50MB default
  maxFiles = 10,
  onUpload,
  onFileSelect,
  className,
  disabled = false,
  showPreview = true,
  category = 'other',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (file.type.startsWith('video/')) return <Video className="h-4 w-4" />;
    if (file.type.includes('pdf') || file.type.includes('document')) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFiles = (files: File[]): { valid: File[]; errors: string[] } => {
    const valid: File[] = [];
    const errors: string[] = [];

    if (!multiple && files.length > 1) {
      errors.push('Only one file can be uploaded at a time');
      return { valid: [files[0]], errors };
    }

    if (files.length > maxFiles) {
      errors.push(`Maximum ${maxFiles} files can be uploaded at once`);
      files = files.slice(0, maxFiles);
    }

    files.forEach((file) => {
      if (file.size > maxSize) {
        errors.push(`${file.name} exceeds maximum size of ${formatFileSize(maxSize)}`);
      } else if (accept !== '*' && !file.type.match(accept)) {
        errors.push(`${file.name} is not an accepted file type`);
      } else {
        valid.push(file);
      }
    });

    return { valid, errors };
  };

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const { valid, errors } = validateFiles(fileArray);

    if (errors.length > 0) {
      errors.forEach((error) => {
        toast({
          title: 'Upload Error',
          description: error,
          variant: 'destructive',
        });
      });
    }

    if (valid.length === 0) return;

    // Create preview URLs for images
    const newUploadingFiles: UploadingFile[] = valid.map((file) => {
      const uploadingFile: UploadingFile = {
        file,
        progress: 0,
        status: 'pending',
      };

      if (showPreview && file.type.startsWith('image/')) {
        uploadingFile.preview = URL.createObjectURL(file);
      }

      return uploadingFile;
    });

    setUploadingFiles((prev) => [...prev, ...newUploadingFiles]);

    // Call onFileSelect if provided
    if (onFileSelect) {
      onFileSelect(valid);
    }

    // Call onUpload if provided
    if (onUpload) {
      try {
        await onUpload(valid);
        
        // Update status to success
        setUploadingFiles((prev) =>
          prev.map((uf) =>
            newUploadingFiles.find((nuf) => nuf.file === uf.file)
              ? { ...uf, status: 'success', progress: 100 }
              : uf
          )
        );
      } catch (error) {
        // Update status to error
        setUploadingFiles((prev) =>
          prev.map((uf) =>
            newUploadingFiles.find((nuf) => nuf.file === uf.file)
              ? { ...uf, status: 'error', error: 'Upload failed' }
              : uf
          )
        );
      }
    }
  }, [accept, maxSize, maxFiles, multiple, onFileSelect, onUpload, showPreview, toast]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const { files } = e.dataTransfer;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  }, [disabled, handleFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target;
    if (files && files.length > 0) {
      handleFiles(files);
    }
    // Reset input to allow selecting the same file again
    e.target.value = '';
  }, [handleFiles]);

  const removeFile = useCallback((index: number) => {
    setUploadingFiles((prev) => {
      const newFiles = [...prev];
      const removed = newFiles.splice(index, 1)[0];
      
      // Clean up preview URL
      if (removed.preview) {
        URL.revokeObjectURL(removed.preview);
      }
      
      return newFiles;
    });
  }, []);

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Clean up preview URLs on unmount
  React.useEffect(() => {
    return () => {
      uploadingFiles.forEach((uf) => {
        if (uf.preview) {
          URL.revokeObjectURL(uf.preview);
        }
      });
    };
  }, [uploadingFiles]);

  return (
    <div className={className}>
      <div
        className={cn(
          'relative rounded-lg border-2 border-dashed p-6 transition-colors',
          isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-primary/50',
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          disabled={disabled}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-2">
          <Upload className="h-10 w-10 text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm font-medium">
              Drop files here or click to browse
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {multiple ? `Up to ${maxFiles} files, ` : ''}
              Maximum size: {formatFileSize(maxSize)}
            </p>
          </div>
        </div>
      </div>

      {uploadingFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          {uploadingFiles.map((uploadingFile, index) => (
            <div
              key={index}
              className="flex items-center space-x-3 rounded-lg border p-3"
            >
              {showPreview && uploadingFile.preview ? (
                <img
                  src={uploadingFile.preview}
                  alt={uploadingFile.file.name}
                  className="h-10 w-10 rounded object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                  {getFileIcon(uploadingFile.file)}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {uploadingFile.file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(uploadingFile.file.size)}
                </p>
                
                {uploadingFile.status === 'uploading' && (
                  <Progress value={uploadingFile.progress} className="mt-1 h-1" />
                )}
                
                {uploadingFile.status === 'error' && (
                  <p className="text-xs text-destructive mt-1">
                    {uploadingFile.error}
                  </p>
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                disabled={uploadingFile.status === 'uploading'}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};