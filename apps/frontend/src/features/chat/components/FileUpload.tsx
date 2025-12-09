import React, { useCallback, useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  File, 
  Image, 
  X, 
  AlertCircle, 
  CheckCircle,
  FileText,
  Video,
  Music
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { LoadingText } from '@/components/ui/loading/LoadingDots';
import { LoadingSpinner } from '@/components/ui/loading';

interface FileUploadItem {
  id: string;
  file: File;
  preview?: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

interface FileUploadProps {
  onFilesSelect: (files: File[]) => void;
  onUpload?: (files: FileUploadItem[]) => Promise<void>;
  acceptedFileTypes?: string[];
  maxFileSize?: number; // in bytes
  maxFiles?: number;
  trigger?: React.ReactNode;
  className?: string;
  showPreview?: boolean;
  allowMultiple?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFilesSelect,
  onUpload,
  acceptedFileTypes = ['image/*', '.pdf', '.doc', '.docx', '.txt', '.mp4', '.mp3'],
  maxFileSize = 10 * 1024 * 1024, // 10MB
  maxFiles = 5,
  trigger,
  className,
  showPreview = true,
  allowMultiple = true,
}) => {
  const [files, setFiles] = useState<FileUploadItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const uploadIdCounter = useRef(0);

  // Get file type icon
  const getFileIcon = (file: File) => {
    const type = file.type.toLowerCase();
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (type.startsWith('video/')) return <Video className="h-4 w-4" />;
    if (type.startsWith('audio/')) return <Music className="h-4 w-4" />;
    if (type.includes('pdf')) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Validate file
  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSize) {
      return `File size exceeds ${formatFileSize(maxFileSize)}`;
    }
    
    const isAccepted = acceptedFileTypes.some(type => {
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type.toLowerCase());
      }
      return file.type.match(type.replace('*', '.*'));
    });
    
    if (!isAccepted) {
      return 'File type not supported';
    }
    
    return null;
  };

  // Handle file drop/selection
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: FileUploadItem[] = [];
    
    acceptedFiles.forEach((file) => {
      const error = validateFile(file);
      const id = `file-${++uploadIdCounter.current}`;
      
      const uploadItem: FileUploadItem = {
        id,
        file,
        progress: 0,
        status: error ? 'error' : 'pending',
        error,
      };
      
      // Generate preview for images
      if (file.type.startsWith('image/') && !error) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFiles(prev => prev.map(f => 
            f.id === id ? { ...f, preview: e.target?.result as string } : f
          ));
        };
        reader.readAsDataURL(file);
      }
      
      newFiles.push(uploadItem);
    });
    
    setFiles(prev => {
      const combined = [...prev, ...newFiles];
      if (combined.length > maxFiles) {
        return combined.slice(0, maxFiles);
      }
      return combined;
    });
    
    // Auto-notify parent of valid files
    const validFiles = newFiles.filter(f => f.status !== 'error').map(f => f.file);
    if (validFiles.length > 0) {
      onFilesSelect(validFiles);
    }
  }, [maxFileSize, maxFiles, acceptedFileTypes, onFilesSelect]);

  const { getRootProps, getInputProps, isDragActive: dropzoneActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    maxSize: maxFileSize,
    maxFiles: maxFiles,
    multiple: allowMultiple,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
  });

  // Remove file
  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  // Clear all files
  const clearFiles = () => {
    setFiles([]);
  };

  // Upload files (if upload handler provided)
  const handleUpload = async () => {
    if (!onUpload) return;
    
    const filesToUpload = files.filter(f => f.status === 'pending');
    if (filesToUpload.length === 0) return;
    
    // Set all files to uploading
    setFiles(prev => prev.map(f => 
      f.status === 'pending' ? { ...f, status: 'uploading', progress: 0 } : f
    ));
    
    try {
      // Simulate upload progress (in real app, you'd track actual progress)
      for (const file of filesToUpload) {
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          setFiles(prev => prev.map(f => 
            f.id === file.id ? { ...f, progress } : f
          ));
        }
        
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'completed', progress: 100 } : f
        ));
      }
      
      await onUpload(filesToUpload);
    } catch (error) {
      setFiles(prev => prev.map(f => 
        filesToUpload.find(upload => upload.id === f.id) 
          ? { ...f, status: 'error', error: 'Upload failed' }
          : f
      ));
    }
  };

  const hasFiles = files.length > 0;
  const hasValidFiles = files.some(f => f.status !== 'error');
  const isUploading = files.some(f => f.status === 'uploading');

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <Upload className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
          <DialogDescription>
            Upload files to share in the conversation. Max {maxFiles} files, {formatFileSize(maxFileSize)} each.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Drop zone */}
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              dropzoneActive || isDragActive
                ? "border-primary bg-primary/5"
                : "border-muted hover:border-muted-foreground/50",
              className
            )}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            {dropzoneActive ? (
              <p className="text-primary font-medium">Drop files here...</p>
            ) : (
              <div>
                <p className="font-medium mb-1">
                  Click to select files or drag and drop
                </p>
                <p className="text-sm text-muted-foreground">
                  {acceptedFileTypes.join(', ')} up to {formatFileSize(maxFileSize)}
                </p>
              </div>
            )}
          </div>

          {/* File list */}
          {hasFiles && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Selected Files ({files.length})</h4>
                <Button variant="ghost" size="sm" onClick={clearFiles}>
                  Clear All
                </Button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {files.map((fileItem) => (
                  <div
                    key={fileItem.id}
                    className="flex items-center gap-3 p-3 border rounded-lg"
                  >
                    {/* File icon/preview */}
                    <div className="shrink-0">
                      {fileItem.preview ? (
                        <img
                          src={fileItem.preview}
                          alt={fileItem.file.name}
                          className="w-10 h-10 object-cover rounded"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                          {getFileIcon(fileItem.file)}
                        </div>
                      )}
                    </div>

                    {/* File info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {fileItem.file.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatFileSize(fileItem.file.size)}
                      </div>
                      
                      {/* Progress bar */}
                      {fileItem.status === 'uploading' && (
                        <Progress value={fileItem.progress} className="h-1 mt-1" />
                      )}
                    </div>

                    {/* Status */}
                    <div className="shrink-0 flex items-center gap-2">
                      {fileItem.status === 'error' ? (
                        <Badge variant="destructive" className="text-xs">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Error
                        </Badge>
                      ) : fileItem.status === 'completed' ? (
                        <Badge variant="default" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Done
                        </Badge>
                      ) : fileItem.status === 'uploading' ? (
                        <Badge variant="secondary" className="text-xs">
                          <LoadingSpinner size="xs" center={false} className="mr-1" />
                          {fileItem.progress}%
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Ready
                        </Badge>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(fileItem.id)}
                        className="h-6 w-6 p-0"
                        disabled={fileItem.status === 'uploading'}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Error messages */}
              {files.some(f => f.error) && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Some files have errors. Please check file size and type requirements.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Actions */}
          {hasFiles && (
            <div className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                {files.filter(f => f.status !== 'error').length} of {files.length} files valid
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                {onUpload && (
                  <Button
                    onClick={handleUpload}
                    disabled={!hasValidFiles || isUploading}
                  >
                    {isUploading ? (
                      <>
                        <LoadingSpinner size="sm" center={false} className="mr-2" />
                        <LoadingText text="Uploading" dotSize="sm" />
                      </>
                    ) : (
                      'Upload Files'
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FileUpload;