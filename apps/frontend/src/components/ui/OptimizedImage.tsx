import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  fallbackSrc?: string;
  onLoad?: () => void;
  onError?: () => void;
  sizes?: string;
  style?: React.CSSProperties;
  fill?: boolean;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  objectPosition?: string;
  unoptimized?: boolean;
}

// Default fallback images
const DEFAULT_FALLBACKS = {
  avatar: '/images/default/avatar.svg',
  team: '/images/default/team-logo.svg',
  general: '/images/default/placeholder.svg',
};

// Skeleton loader component
const SkeletonLoader: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('animate-pulse bg-gray-200 dark:bg-gray-700', className)} />
);

// Error fallback component
const ErrorFallback: React.FC<{ 
  className?: string; 
  fallbackType?: keyof typeof DEFAULT_FALLBACKS;
}> = ({ className, fallbackType = 'general' }) => (
  <div className={cn(
    'flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-400',
    className
  )}>
    <svg
      className="w-12 h-12"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  </div>
);

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  quality = 85,
  placeholder = 'blur',
  blurDataURL,
  fallbackSrc,
  onLoad,
  onError,
  sizes,
  style,
  fill = false,
  objectFit = 'cover',
  objectPosition = 'center',
  unoptimized = false,
}) => {
  const [imageSrc, setImageSrc] = useState<string>(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Detect fallback type based on image context
  const getFallbackType = (): keyof typeof DEFAULT_FALLBACKS => {
    if (src.includes('avatar') || src.includes('profile')) return 'avatar';
    if (src.includes('team') || src.includes('logo')) return 'team';
    return 'general';
  };

  // Reset states when src changes
  useEffect(() => {
    setImageSrc(src);
    setHasError(false);
    setIsLoading(true);
  }, [src]);

  // Handle image load
  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  };

  // Handle image error
  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    
    // Try fallback image
    if (fallbackSrc && imageSrc !== fallbackSrc) {
      setImageSrc(fallbackSrc);
      setHasError(false);
      setIsLoading(true);
    } else {
      onError?.();
    }
  };

  // Generate blur placeholder if not provided
  const getBlurDataURL = () => {
    if (blurDataURL) return blurDataURL;
    // Default blur placeholder (1x1 transparent pixel)
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  };

  // Container classes
  const containerClasses = cn(
    'relative overflow-hidden',
    className,
    {
      'w-full h-full': fill,
    }
  );

  // If error occurred and no fallback available, show error state
  if (hasError && (!fallbackSrc || imageSrc === fallbackSrc)) {
    return (
      <ErrorFallback 
        className={containerClasses} 
        fallbackType={getFallbackType()} 
      />
    );
  }

  return (
    <div className={containerClasses} style={style}>
      {/* Loading skeleton */}
      {isLoading && !hasError && (
        <SkeletonLoader className="absolute inset-0" />
      )}

      {/* Next.js Image component */}
      {fill ? (
        <Image
          src={imageSrc}
          alt={alt}
          fill
          priority={priority}
          quality={quality}
          placeholder={placeholder}
          blurDataURL={placeholder === 'blur' ? getBlurDataURL() : undefined}
          onLoad={handleLoad}
          onError={handleError}
          sizes={sizes || '100vw'}
          style={{
            objectFit,
            objectPosition,
          }}
          unoptimized={unoptimized}
          className={cn(
            'transition-opacity duration-300',
            {
              'opacity-0': isLoading,
              'opacity-100': !isLoading,
            }
          )}
        />
      ) : (
        <Image
          src={imageSrc}
          alt={alt}
          width={width || 0}
          height={height || 0}
          priority={priority}
          quality={quality}
          placeholder={placeholder}
          blurDataURL={placeholder === 'blur' ? getBlurDataURL() : undefined}
          onLoad={handleLoad}
          onError={handleError}
          sizes={sizes}
          style={{
            objectFit,
            objectPosition,
            ...style,
          }}
          unoptimized={unoptimized}
          className={cn(
            'transition-opacity duration-300',
            {
              'opacity-0': isLoading,
              'opacity-100': !isLoading,
            }
          )}
        />
      )}
    </div>
  );
};

// Specialized components for common use cases
export const Avatar: React.FC<{
  src: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  priority?: boolean;
}> = ({ src, alt, size = 'md', className, priority }) => {
  const sizeMap = {
    sm: 32,
    md: 40,
    lg: 56,
    xl: 80,
  };

  const dimension = sizeMap[size];

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={dimension}
      height={dimension}
      className={cn('rounded-full', className)}
      fallbackSrc={DEFAULT_FALLBACKS.avatar}
      priority={priority}
    />
  );
};

export const TeamLogo: React.FC<{
  src: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ src, alt, size = 'md', className }) => {
  const sizeMap = {
    sm: 48,
    md: 64,
    lg: 96,
  };

  const dimension = sizeMap[size];

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={dimension}
      height={dimension}
      className={cn('rounded-lg', className)}
      fallbackSrc={DEFAULT_FALLBACKS.team}
    />
  );
};

export const HeroImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}> = ({ src, alt, className, priority = true }) => {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      fill
      className={className}
      priority={priority}
      sizes="100vw"
    />
  );
};

export default OptimizedImage;