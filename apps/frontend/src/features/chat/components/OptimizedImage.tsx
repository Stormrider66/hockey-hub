import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2, ImageOff } from 'lucide-react';

interface OptimizedImageProps {
  src: string;
  thumbnailSrc?: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  onClick?: () => void;
  variants?: {
    small?: string;
    medium?: string;
    large?: string;
  };
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  thumbnailSrc,
  alt,
  width,
  height,
  className,
  onClick,
  variants,
}) => {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [currentSrc, setCurrentSrc] = useState(thumbnailSrc || src);
  const [isInView, setIsInView] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  // Progressive loading logic
  useEffect(() => {
    if (!isInView) return;

    const img = new Image();
    
    // Load thumbnail first if available
    if (thumbnailSrc && currentSrc === thumbnailSrc) {
      img.src = thumbnailSrc;
      img.onload = () => {
        setCurrentSrc(thumbnailSrc);
        setImageState('loaded');
        
        // After thumbnail loads, load the full image
        const fullImg = new Image();
        fullImg.src = src;
        fullImg.onload = () => {
          setCurrentSrc(src);
        };
      };
      img.onerror = () => {
        // If thumbnail fails, try loading full image
        loadFullImage();
      };
    } else {
      loadFullImage();
    }

    function loadFullImage() {
      const fullImg = new Image();
      fullImg.src = src;
      fullImg.onload = () => {
        setCurrentSrc(src);
        setImageState('loaded');
      };
      fullImg.onerror = () => {
        setImageState('error');
      };
    }
  }, [isInView, src, thumbnailSrc, currentSrc]);

  // Responsive image selection based on container size
  useEffect(() => {
    if (!variants || !containerRef.current || imageState !== 'loaded') return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        
        let selectedSrc = src;
        if (width <= 400 && variants.small) {
          selectedSrc = variants.small;
        } else if (width <= 800 && variants.medium) {
          selectedSrc = variants.medium;
        } else if (variants.large) {
          selectedSrc = variants.large;
        }

        if (selectedSrc !== currentSrc) {
          const img = new Image();
          img.src = selectedSrc;
          img.onload = () => {
            setCurrentSrc(selectedSrc);
          };
        }
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [variants, src, currentSrc, imageState]);

  const aspectRatio = width && height ? width / height : undefined;
  const paddingBottom = aspectRatio ? `${(1 / aspectRatio) * 100}%` : undefined;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden bg-muted",
        onClick && "cursor-pointer",
        className
      )}
      style={{
        width: width || '100%',
        paddingBottom: paddingBottom || undefined,
        height: paddingBottom ? 0 : height || 'auto',
      }}
      onClick={onClick}
    >
      {!isInView ? (
        // Placeholder while not in view
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 bg-muted-foreground/20 rounded animate-pulse" />
        </div>
      ) : imageState === 'loading' ? (
        // Loading state
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : imageState === 'error' ? (
        // Error state
        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
          <ImageOff className="h-8 w-8 mb-2" />
          <span className="text-xs">Failed to load image</span>
        </div>
      ) : (
        // Loaded image with blur-up effect
        <>
          {thumbnailSrc && currentSrc === src && (
            // Thumbnail as background for smooth transition
            <img
              src={thumbnailSrc}
              alt=""
              className="absolute inset-0 w-full h-full object-cover filter blur-sm scale-110"
              style={{ filter: 'blur(5px)' }}
            />
          )}
          <img
            ref={imageRef}
            src={currentSrc}
            alt={alt}
            className={cn(
              "absolute inset-0 w-full h-full object-cover transition-opacity duration-300",
              currentSrc === thumbnailSrc ? "opacity-0" : "opacity-100"
            )}
            loading="lazy"
            decoding="async"
          />
        </>
      )}
    </div>
  );
};

export default OptimizedImage;