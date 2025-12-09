/**
 * Image optimization components and utilities
 * @module components/ui/image
 */

// Main components
export { 
  OptimizedImage, 
  Avatar, 
  TeamLogo, 
  HeroImage 
} from '../OptimizedImage';

export { 
  DynamicImage, 
  FilePreviewImage 
} from '../DynamicImage';

// Hooks
export {
  useImageOptimization,
  useImagePreloader,
  useResponsiveImage,
  useImageLazyLoad,
  useProgressiveImage,
} from '@/hooks/useImageOptimization';

// Utilities
export {
  generateSolidPlaceholder,
  generateGradientPlaceholder,
  generateShimmerPlaceholder,
  generateBlurDataURL,
  generateLQIP,
  extractDominantColor,
  PRESET_PLACEHOLDERS,
  isImageCached,
  preloadImage,
  preloadImages,
} from '@/utils/imagePlaceholder';

// Types
export type { OptimizedImageProps } from '../OptimizedImage';
export type { DynamicImageProps } from '../DynamicImage';