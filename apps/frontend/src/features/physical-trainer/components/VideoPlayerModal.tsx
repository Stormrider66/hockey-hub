'use client';

import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Maximize2, Volume2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface VideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  exerciseName: string;
}

export function VideoPlayerModal({ 
  isOpen, 
  onClose, 
  videoUrl, 
  exerciseName 
}: VideoPlayerModalProps) {
  const { t } = useTranslation(['physicalTrainer', 'common']);

  // Convert YouTube watch URLs to embed URLs
  const embedUrl = useMemo(() => {
    if (!videoUrl) return '';
    
    // Check if it's a YouTube URL
    const youtubeMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }
    
    // Check if it's a Vimeo URL
    const vimeoMatch = videoUrl.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
    
    // Return original URL for direct video files
    return videoUrl;
  }, [videoUrl]);

  const isEmbedVideo = embedUrl.includes('youtube.com/embed') || embedUrl.includes('vimeo.com');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[90vw] lg:max-w-[1000px] p-0">
        <DialogHeader className="p-4 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5" />
              {exerciseName}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="relative bg-black">
          {isEmbedVideo ? (
            <iframe
              src={embedUrl}
              className="w-full aspect-video max-h-[70vh]"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={exerciseName}
            />
          ) : (
            <video
              src={embedUrl}
              controls
              autoPlay
              className="w-full max-h-[70vh]"
              onError={(e) => {
                console.error('Video playback error:', e);
              }}
            >
              {t('physicalTrainer:exercises.video.notSupported')}
            </video>
          )}
        </div>

        <div className="p-4 bg-secondary/10">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {t('physicalTrainer:exercises.video.playbackTip')}
            </p>
            {!isEmbedVideo && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const video = document.querySelector('video');
                  if (video?.requestFullscreen) {
                    video.requestFullscreen();
                  }
                }}
              >
                <Maximize2 className="h-4 w-4 mr-2" />
                {t('physicalTrainer:exercises.video.fullscreen')}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}