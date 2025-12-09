import { useState, useEffect, useCallback } from 'react';
import { 
  generateBlurDataURL, 
  generateLQIP, 
  extractDominantColor,
  preloadImage,
  preloadImages,
  isImageCached 
} from '@/utils/imagePlaceholder';

interface UseImageOptimizationOptions {
  generateBlur?: boolean;
  generateLQIP?: boolean;
  extractColor?: boolean;
  preload?: boolean;
}

interface ImageOptimizationResult {
  blurDataURL?: string;
  lqip?: string;
  dominantColor?: string;
  isLoading: boolean;
  isError: boolean;
  isCached: boolean;
}

export const useImageOptimization = (
  src: string,
  options: UseImageOptimizationOptions = {}
) => {
  const [result, setResult] = useState<ImageOptimizationResult>({
    isLoading: false,
    isError: false,
    isCached: isImageCached(src),
  });

  useEffect(() => {
    if (!src || typeof window === 'undefined') return;

    const processImage = async () => {
      setResult(prev => ({ ...prev, isLoading: true, isError: false }));

      try {
        const updates: Partial<ImageOptimizationResult> = {};

        // Generate blur data URL
        if (options.generateBlur) {
          updates.blurDataURL = await generateBlurDataURL(src);
        }

        // Generate LQIP
        if (options.generateLQIP) {
          updates.lqip = await generateLQIP(src);
        }

        // Extract dominant color
        if (options.extractColor) {
          updates.dominantColor = await extractDominantColor(src);
        }

        // Preload image
        if (options.preload) {
          await preloadImage(src);
        }

        setResult(prev => ({
          ...prev,
          ...updates,
          isLoading: false,
          isCached: true,
        }));
      } catch (error) {
        console.error('Image optimization error:', error);
        setResult(prev => ({ ...prev, isLoading: false, isError: true }));
      }
    };

    processImage();
  }, [src, options.generateBlur, options.generateLQIP, options.extractColor, options.preload]);

  return result;
};

// Hook for batch preloading images
export const useImagePreloader = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState({ loaded: 0, total: 0 });

  const preload = useCallback(async (sources: string[]) => {
    setIsLoading(true);
    setProgress({ loaded: 0, total: sources.length });

    try {
      await preloadImages(sources, (loaded, total) => {
        setProgress({ loaded, total });
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { preload, isLoading, progress };
};

// Hook for responsive image sizing
export const useResponsiveImage = (originalWidth: number, originalHeight: number) => {
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getResponsiveSize = useCallback((maxWidth: number = windowWidth) => {
    const aspectRatio = originalHeight / originalWidth;
    const width = Math.min(originalWidth, maxWidth);
    const height = Math.round(width * aspectRatio);

    return { width, height };
  }, [originalWidth, originalHeight, windowWidth]);

  const getSizes = useCallback((breakpoints: { [key: number]: string }) => {
    const sortedBreakpoints = Object.keys(breakpoints)
      .map(Number)
      .sort((a, b) => b - a);

    const conditions = sortedBreakpoints.map(breakpoint => {
      return `(max-width: ${breakpoint}px) ${breakpoints[breakpoint]}`;
    });

    return conditions.join(', ');
  }, []);

  return { windowWidth, getResponsiveSize, getSizes };
};

// Hook for image lazy loading with Intersection Observer
export const useImageLazyLoad = (
  threshold: number = 0.1,
  rootMargin: string = '50px'
) => {
  const [isInView, setIsInView] = useState(false);
  const [ref, setRef] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!ref || typeof window === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(ref);

    return () => {
      observer.disconnect();
    };
  }, [ref, threshold, rootMargin]);

  return { isInView, setRef };
};

// Hook for progressive image loading
export const useProgressiveImage = (lowQualitySrc: string, highQualitySrc: string) => {
  const [src, setSrc] = useState(lowQualitySrc);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setSrc(lowQualitySrc);

    const img = new Image();
    img.src = highQualitySrc;

    img.onload = () => {
      setSrc(highQualitySrc);
      setIsLoading(false);
    };

    img.onerror = () => {
      setIsLoading(false);
    };
  }, [lowQualitySrc, highQualitySrc]);

  return { src, isLoading, blur: src === lowQualitySrc };
};