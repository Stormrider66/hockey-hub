'use client';

import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Video, Link, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface VideoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVideoUpdate: (videoUrl: string) => void;
  exerciseName: string;
  currentVideoUrl?: string;
}

export function VideoUploadModal({ 
  isOpen, 
  onClose, 
  onVideoUpdate, 
  exerciseName,
  currentVideoUrl 
}: VideoUploadModalProps) {
  const { t } = useTranslation(['physicalTrainer', 'common']);
  const [videoUrl, setVideoUrl] = useState(currentVideoUrl || '');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Convert YouTube watch URLs to embed URLs for preview
  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    
    // Check if it's a YouTube URL
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }
    
    // Check if it's a Vimeo URL
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
    
    // Return original URL for direct video files
    return url;
  };

  const renderVideoPreview = () => {
    const embedUrl = getEmbedUrl(videoUrl);
    const isEmbedVideo = embedUrl.includes('youtube.com/embed') || embedUrl.includes('vimeo.com');

    if (isEmbedVideo) {
      return (
        <iframe
          src={embedUrl}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Video Preview"
        />
      );
    }

    return (
      <video
        src={embedUrl}
        controls
        className="w-full h-full"
        onError={() => setUploadError(t('physicalTrainer:exercises.video.loadError'))}
      >
        {t('physicalTrainer:exercises.video.notSupported')}
      </video>
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    if (!validTypes.includes(file.type)) {
      setUploadError(t('physicalTrainer:exercises.video.invalidFileType'));
      return;
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      setUploadError(t('physicalTrainer:exercises.video.fileTooLarge'));
      return;
    }

    setIsUploading(true);
    setUploadError('');
    setUploadProgress(0);

    try {
      // In a real implementation, this would upload to a storage service
      // For now, we'll simulate an upload and use a blob URL
      const simulateUpload = new Promise<string>((resolve) => {
        let progress = 0;
        const interval = setInterval(() => {
          progress += 10;
          setUploadProgress(progress);
          if (progress >= 100) {
            clearInterval(interval);
            // Create a blob URL for local preview
            const blobUrl = URL.createObjectURL(file);
            resolve(blobUrl);
          }
        }, 200);
      });

      const uploadedUrl = await simulateUpload;
      setVideoUrl(uploadedUrl);
      setIsUploading(false);
    } catch (error) {
      setUploadError(t('physicalTrainer:exercises.video.uploadFailed'));
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    if (videoUrl) {
      onVideoUpdate(videoUrl);
      onClose();
    }
  };

  const handleClose = () => {
    setVideoUrl(currentVideoUrl || '');
    setUploadError('');
    setUploadProgress(0);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              {t('physicalTrainer:exercises.video.uploadTitle', { exercise: exerciseName })}
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* File Upload Section */}
          <div className="space-y-2">
            <Label>{t('physicalTrainer:exercises.video.uploadFile')}</Label>
            <div className="flex items-center gap-2">
              <Input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                disabled={isUploading}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading 
                  ? t('physicalTrainer:exercises.video.uploading', { progress: uploadProgress })
                  : t('physicalTrainer:exercises.video.selectFile')
                }
              </Button>
            </div>
          </div>

          {/* URL Input Section */}
          <div className="space-y-2">
            <Label>{t('physicalTrainer:exercises.video.orUseUrl')}</Label>
            <div className="flex items-center gap-2">
              <Link className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="https://example.com/video.mp4"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                disabled={isUploading}
              />
            </div>
          </div>

          {/* Error Alert */}
          {uploadError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{uploadError}</AlertDescription>
            </Alert>
          )}

          {/* Video Preview */}
          {videoUrl && !isUploading && (
            <div className="space-y-2">
              <Label>{t('physicalTrainer:exercises.video.preview')}</Label>
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                {renderVideoPreview()}
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                {t('physicalTrainer:exercises.video.uploading', { progress: uploadProgress })}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {t('common:actions.cancel')}
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!videoUrl || isUploading}
          >
            {t('common:actions.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}