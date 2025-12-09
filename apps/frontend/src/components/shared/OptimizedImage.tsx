import React from 'react';
import Image, { ImageProps } from 'next/image';

interface OptimizedImageProps extends Omit<ImageProps, 'onLoadingComplete'> {
  fallbackSrc?: string;
  formats?: string[];
  lazyBoundary?: string;
  onLoadingComplete?: (result: { naturalWidth: number; naturalHeight: number }) => void;
  onLoadStart?: () => void;
  onError?: () => void;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  priority = false,
  loading,
  placeholder = 'empty',
  blurDataURL,
  className,
  quality = 75,
  sizes,
  onLoad,
  onLoadStart,
  onLoadingComplete,
  onError,
  fallbackSrc,
  formats,
  lazyBoundary = '200px',
  ...props
}) => {
  const [imgSrc, setImgSrc] = React.useState(src);
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    setImgSrc(src);
    setHasError(false);
  }, [src]);

  const handleLoadStart = () => {
    setIsLoading(true);
    onLoadStart?.();
  };

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoading(false);
    onLoad?.(e);
  };

  const handleLoadingComplete = (result: { naturalWidth: number; naturalHeight: number }) => {
    setIsLoading(false);
    onLoadingComplete?.(result);
  };

  const handleError = () => {
    setHasError(true);
    if (fallbackSrc && imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
    }
    onError?.();
  };

  // Determine loading strategy
  const loadingStrategy = priority ? 'eager' : loading || 'lazy';

  // Build data attributes for testing
  const dataAttributes: Record<string, any> = {
    'data-placeholder': placeholder,
  };

  if (blurDataURL) {
    dataAttributes['data-blur'] = blurDataURL;
  }

  if (quality !== 75) {
    dataAttributes['data-quality'] = quality;
  }

  return (
    <div className={`optimized-image-wrapper ${className || ''}`}>
      <Image
        src={imgSrc}
        alt={alt}
        width={width}
        height={height}
        loading={loadingStrategy}
        priority={priority}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        quality={quality}
        sizes={sizes}
        onLoad={handleLoad}
        onLoadingComplete={handleLoadingComplete}
        onError={handleError}
        {...dataAttributes}
        {...props}
      />
      
      {isLoading && placeholder === 'empty' && (
        <div 
          className="image-skeleton"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: '#f0f0f0',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
      )}
      
      {hasError && !fallbackSrc && (
        <div 
          className="image-error"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: width,
            height: height,
            backgroundColor: '#f5f5f5',
            color: '#999',
          }}
        >
          Failed to load image
        </div>
      )}
      
      <style>{`
        .optimized-image-wrapper {
          position: relative;
          display: inline-block;
        }
        
        @keyframes pulse {
          0% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0.6;
          }
        }
        
        .image-transition {
          transition: opacity 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

// Utility function to generate blur placeholder
export const generateBlurPlaceholder = (width: number, height: number, color = '#cccccc'): string => {
  return `data:image/svg+xml;base64,${Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${color}"/>
    </svg>
  `).toString('base64')}`;
};

// HOC for art direction with different images at different breakpoints
interface ArtDirectionSource {
  media?: string;
  src: string;
  width: number;
  height: number;
}

interface ArtDirectionImageProps {
  sources: ArtDirectionSource[];
  alt: string;
  className?: string;
}

export const ArtDirectionImage: React.FC<ArtDirectionImageProps> = ({
  sources,
  alt,
  className,
}) => {
  const defaultSource = sources.find(s => !s.media) || sources[sources.length - 1];
  
  return (
    <picture className={className}>
      {sources
        .filter(source => source.media)
        .map((source, index) => (
          <source
            key={index}
            media={source.media}
            srcSet={source.src}
          />
        ))}
      <OptimizedImage
        src={defaultSource.src}
        alt={alt}
        width={defaultSource.width}
        height={defaultSource.height}
      />
    </picture>
  );
};

// Preload critical images
export const preloadImage = (src: string) => {
  if (typeof window !== 'undefined') {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
  }
};

// Lazy load images with Intersection Observer
export const useLazyImageObserver = (
  imageRef: React.RefObject<HTMLImageElement>,
  options?: IntersectionObserverInit
) => {
  const [isIntersecting, setIsIntersecting] = React.useState(false);

  React.useEffect(() => {
    const element = imageRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.unobserve(element);
        }
      },
      {
        rootMargin: '200px',
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [imageRef, options]);

  return isIntersecting;
};