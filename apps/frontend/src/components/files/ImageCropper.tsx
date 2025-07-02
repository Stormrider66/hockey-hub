'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Crop, RotateCw, ZoomIn, ZoomOut, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageCropperProps {
  image: string | File;
  aspectRatio?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  cropShape?: 'rect' | 'round';
  onCrop?: (croppedImage: Blob, cropArea: CropArea) => void;
  onCancel?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const ImageCropper: React.FC<ImageCropperProps> = ({
  image,
  aspectRatio,
  minWidth = 100,
  minHeight = 100,
  maxWidth = 1920,
  maxHeight = 1920,
  cropShape = 'rect',
  onCrop,
  onCancel,
  open = true,
  onOpenChange,
}) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [crop, setCrop] = useState<CropArea>({ x: 0, y: 0, width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load image
  useEffect(() => {
    const loadImage = async () => {
      if (typeof image === 'string') {
        setImageSrc(image);
      } else if (image instanceof File) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImageSrc(e.target?.result as string);
        };
        reader.readAsDataURL(image);
      }
    };

    loadImage();
  }, [image]);

  // Initialize crop area when image loads
  const handleImageLoad = useCallback(() => {
    if (!imageRef.current || !containerRef.current) return;

    const img = imageRef.current;
    const container = containerRef.current;
    
    setImageSize({ width: img.naturalWidth, height: img.naturalHeight });

    // Calculate initial crop area
    const containerRect = container.getBoundingClientRect();
    const scale = Math.min(
      containerRect.width / img.naturalWidth,
      containerRect.height / img.naturalHeight
    );

    const displayWidth = img.naturalWidth * scale;
    const displayHeight = img.naturalHeight * scale;

    let cropWidth = displayWidth * 0.8;
    let cropHeight = displayHeight * 0.8;

    if (aspectRatio) {
      if (cropWidth / cropHeight > aspectRatio) {
        cropWidth = cropHeight * aspectRatio;
      } else {
        cropHeight = cropWidth / aspectRatio;
      }
    }

    setCrop({
      x: (displayWidth - cropWidth) / 2,
      y: (displayHeight - cropHeight) / 2,
      width: cropWidth,
      height: cropHeight,
    });
  }, [aspectRatio]);

  // Handle mouse events for dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - crop.x, y: e.clientY - crop.y });
  }, [crop]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();

    const newX = Math.max(0, Math.min(e.clientX - dragStart.x, containerRect.width - crop.width));
    const newY = Math.max(0, Math.min(e.clientY - dragStart.y, containerRect.height - crop.height));

    setCrop(prev => ({ ...prev, x: newX, y: newY }));
  }, [isDragging, dragStart, crop.width, crop.height]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle rotation
  const handleRotate = useCallback(() => {
    setRotation(prev => (prev + 90) % 360);
  }, []);

  // Handle zoom
  const handleZoomChange = useCallback((value: number[]) => {
    setZoom(value[0]);
  }, []);

  // Crop image
  const handleCrop = useCallback(async () => {
    if (!canvasRef.current || !imageRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imageRef.current;
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();

    // Calculate scale factor between display and actual image
    const scale = Math.min(
      containerRect.width / img.naturalWidth,
      containerRect.height / img.naturalHeight
    );

    // Convert crop area from display coordinates to image coordinates
    const actualCrop = {
      x: crop.x / (scale * zoom),
      y: crop.y / (scale * zoom),
      width: crop.width / (scale * zoom),
      height: crop.height / (scale * zoom),
    };

    // Set canvas size to the crop area
    canvas.width = actualCrop.width;
    canvas.height = actualCrop.height;

    // Apply transformations
    ctx.save();
    
    if (rotation !== 0) {
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
    }

    // Draw the cropped image
    ctx.drawImage(
      img,
      actualCrop.x,
      actualCrop.y,
      actualCrop.width,
      actualCrop.height,
      0,
      0,
      actualCrop.width,
      actualCrop.height
    );

    ctx.restore();

    // Convert to blob
    canvas.toBlob((blob) => {
      if (blob && onCrop) {
        onCrop(blob, actualCrop);
      }
    }, 'image/jpeg', 0.9);
  }, [crop, zoom, rotation, onCrop]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Crop Image</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Image container */}
          <div
            ref={containerRef}
            className="relative h-[500px] bg-muted overflow-hidden rounded-lg"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {imageSrc && (
              <>
                <img
                  ref={imageRef}
                  src={imageSrc}
                  alt="Crop preview"
                  className="absolute inset-0 w-full h-full object-contain"
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    transformOrigin: 'center',
                  }}
                  onLoad={handleImageLoad}
                />

                {/* Crop overlay */}
                <div
                  className={cn(
                    'absolute border-2 border-primary cursor-move',
                    cropShape === 'round' && 'rounded-full'
                  )}
                  style={{
                    left: crop.x,
                    top: crop.y,
                    width: crop.width,
                    height: crop.height,
                  }}
                  onMouseDown={handleMouseDown}
                >
                  {/* Crop grid */}
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} className="border border-primary/20" />
                    ))}
                  </div>
                </div>

                {/* Dark overlay outside crop area */}
                <div
                  className="absolute inset-0 bg-black/50 pointer-events-none"
                  style={{
                    clipPath: `polygon(
                      0 0,
                      0 100%,
                      ${crop.x}px 100%,
                      ${crop.x}px ${crop.y}px,
                      ${crop.x + crop.width}px ${crop.y}px,
                      ${crop.x + crop.width}px ${crop.y + crop.height}px,
                      ${crop.x}px ${crop.y + crop.height}px,
                      ${crop.x}px 100%,
                      100% 100%,
                      100% 0
                    )`,
                  }}
                />
              </>
            )}
          </div>

          {/* Controls */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ZoomOut className="h-4 w-4" />
                <Slider
                  value={[zoom]}
                  onValueChange={handleZoomChange}
                  min={1}
                  max={3}
                  step={0.1}
                  className="w-32"
                />
                <ZoomIn className="h-4 w-4" />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleRotate}
              >
                <RotateCw className="h-4 w-4 mr-2" />
                Rotate
              </Button>
            </div>
          </div>

          <canvas
            ref={canvasRef}
            className="hidden"
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onCancel?.();
              onOpenChange?.(false);
            }}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleCrop}>
            <Check className="h-4 w-4 mr-2" />
            Crop Image
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};