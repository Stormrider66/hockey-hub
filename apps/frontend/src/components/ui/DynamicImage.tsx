import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { OptimizedImage } from './OptimizedImage';

export interface DynamicImageProps {
  src: string | File | Blob;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallbackSrc?: string;
  onLoad?: () => void;
  onError?: () => void;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  fill?: boolean;
}

/**
 * DynamicImage component for handling dynamic image sources
 * Supports File, Blob, data URLs, and blob URLs
 * Falls back to regular img tag for dynamic sources
 */
export const DynamicImage: React.FC<DynamicImageProps> = ({
  src,
  alt,
  width,
  height,
  className,
  fallbackSrc,
  onLoad,
  onError,
  objectFit = 'cover',
  fill = false,
}) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [isDataUrl, setIsDataUrl] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Clean up previous blob URL if any
    return () => {
      if (imageSrc && imageSrc.startsWith('blob:')) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [imageSrc]);

  useEffect(() => {
    const processSource = async () => {
      setError(false);
      
      try {
        // Handle File or Blob objects
        if (src instanceof File || src instanceof Blob) {
          const url = URL.createObjectURL(src);
          setImageSrc(url);
          setIsDataUrl(true);
          return;
        }

        // Handle string sources
        if (typeof src === 'string') {
          // Check if it's a data URL or blob URL
          if (src.startsWith('data:') || src.startsWith('blob:')) {
            setImageSrc(src);
            setIsDataUrl(true);
          } else {
            // Regular URL - can use OptimizedImage
            setImageSrc(src);
            setIsDataUrl(false);
          }
        }
      } catch (err) {
        console.error('Error processing image source:', err);
        setError(true);
        onError?.();
      }
    };

    processSource();
  }, [src, onError]);

  const handleError = () => {
    setError(true);
    if (fallbackSrc) {
      setImageSrc(fallbackSrc);
      setError(false);
    } else {
      onError?.();
    }
  };

  const handleLoad = () => {
    setError(false);
    onLoad?.();
  };

  // For data URLs and blob URLs, use regular img tag
  if (isDataUrl || error) {
    if (fill) {
      return (
        <div className={cn('relative', className)}>
          <img
            src={error && fallbackSrc ? fallbackSrc : imageSrc}
            alt={alt}
            className={cn(
              'absolute inset-0 w-full h-full',
              {
                'object-contain': objectFit === 'contain',
                'object-cover': objectFit === 'cover',
                'object-fill': objectFit === 'fill',
                'object-none': objectFit === 'none',
                'object-scale-down': objectFit === 'scale-down',
              }
            )}
            onLoad={handleLoad}
            onError={handleError}
          />
        </div>
      );
    }

    return (
      <img
        src={error && fallbackSrc ? fallbackSrc : imageSrc}
        alt={alt}
        width={width}
        height={height}
        className={className}
        style={{ objectFit }}
        onLoad={handleLoad}
        onError={handleError}
      />
    );
  }

  // For regular URLs, use OptimizedImage
  return (
    <OptimizedImage
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      fallbackSrc={fallbackSrc}
      onLoad={handleLoad}
      onError={handleError}
      fill={fill}
      objectFit={objectFit}
    />
  );
};

// Helper component for file previews
export const FilePreviewImage: React.FC<{
  file: File;
  alt?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}> = ({ file, alt, className, size = 'md' }) => {
  const sizeMap = {
    sm: { width: 64, height: 64 },
    md: { width: 128, height: 128 },
    lg: { width: 256, height: 256 },
  };

  const { width, height } = sizeMap[size];

  return (
    <DynamicImage
      src={file}
      alt={alt || file.name}
      width={width}
      height={height}
      className={cn('rounded-lg', className)}
      objectFit="cover"
    />
  );
};