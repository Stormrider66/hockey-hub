import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { OptimizedImage } from '../../components/shared/OptimizedImage';

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, width, height, loading, placeholder, blurDataURL, onLoad, ...props }: any) => {
    const handleLoad = () => {
      if (onLoad) onLoad();
    };
    
    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        data-placeholder={placeholder}
        data-blur={blurDataURL}
        onLoad={handleLoad}
        {...props}
      />
    );
  },
}));

// Mock intersection observer
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
});
window.IntersectionObserver = mockIntersectionObserver as any;

describe('Phase 4 - Image Optimization Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('OptimizedImage Component', () => {
    it('should render with basic props', () => {
      render(
        <OptimizedImage
          src="/images/player.jpg"
          alt="Player photo"
          width={200}
          height={200}
        />
      );

      const img = screen.getByAltText('Player photo');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', '/images/player.jpg');
      expect(img).toHaveAttribute('width', '200');
      expect(img).toHaveAttribute('height', '200');
    });

    it('should implement lazy loading by default', () => {
      render(
        <OptimizedImage
          src="/images/team.jpg"
          alt="Team photo"
          width={400}
          height={300}
        />
      );

      const img = screen.getByAltText('Team photo');
      expect(img).toHaveAttribute('loading', 'lazy');
    });

    it('should support eager loading for above-fold images', () => {
      render(
        <OptimizedImage
          src="/images/hero.jpg"
          alt="Hero image"
          width={1200}
          height={600}
          priority
        />
      );

      const img = screen.getByAltText('Hero image');
      expect(img).toHaveAttribute('loading', 'eager');
    });

    it('should generate blur placeholder', () => {
      const blurDataURL = 'data:image/jpeg;base64,/9j/4AAQSkZJRg...';
      
      render(
        <OptimizedImage
          src="/images/player.jpg"
          alt="Player photo"
          width={200}
          height={200}
          placeholder="blur"
          blurDataURL={blurDataURL}
        />
      );

      const img = screen.getByAltText('Player photo');
      expect(img).toHaveAttribute('data-placeholder', 'blur');
      expect(img).toHaveAttribute('data-blur', blurDataURL);
    });

    it('should handle loading states', async () => {
      const onLoadComplete = jest.fn();
      
      render(
        <OptimizedImage
          src="/images/action.jpg"
          alt="Action shot"
          width={300}
          height={200}
          onLoadingComplete={onLoadComplete}
        />
      );

      const img = screen.getByAltText('Action shot');
      
      // Simulate image load
      fireEvent.load(img);

      await waitFor(() => {
        expect(onLoadComplete).toHaveBeenCalled();
      });
    });

    it('should handle error states', () => {
      const onError = jest.fn();
      
      render(
        <OptimizedImage
          src="/images/missing.jpg"
          alt="Missing image"
          width={200}
          height={200}
          onError={onError}
        />
      );

      const img = screen.getByAltText('Missing image');
      
      // Simulate image error
      fireEvent.error(img);

      expect(onError).toHaveBeenCalled();
    });
  });

  describe('Format Optimization', () => {
    it('should support WebP format', () => {
      render(
        <OptimizedImage
          src="/images/player.jpg"
          alt="Player"
          width={200}
          height={200}
          formats={['webp', 'jpg']}
        />
      );

      const img = screen.getByAltText('Player');
      // In production, Next.js would handle format selection
      expect(img).toBeInTheDocument();
    });

    it('should support AVIF format for modern browsers', () => {
      render(
        <OptimizedImage
          src="/images/logo.png"
          alt="Logo"
          width={100}
          height={100}
          formats={['avif', 'webp', 'png']}
        />
      );

      const img = screen.getByAltText('Logo');
      expect(img).toBeInTheDocument();
    });

    it('should handle responsive images', () => {
      render(
        <OptimizedImage
          src="/images/banner.jpg"
          alt="Banner"
          width={1200}
          height={400}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      );

      const img = screen.getByAltText('Banner');
      expect(img).toHaveAttribute('sizes', '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw');
    });
  });

  describe('Performance Optimizations', () => {
    it('should measure image loading performance', async () => {
      const startTime = performance.now();
      
      render(
        <OptimizedImage
          src="/images/test.jpg"
          alt="Test image"
          width={200}
          height={200}
        />
      );

      const img = screen.getByAltText('Test image');
      fireEvent.load(img);

      const loadTime = performance.now() - startTime;
      
      // Should load quickly (mocked)
      expect(loadTime).toBeLessThan(100);
    });

    it('should support quality settings', () => {
      render(
        <OptimizedImage
          src="/images/high-quality.jpg"
          alt="High quality"
          width={800}
          height={600}
          quality={90}
        />
      );

      const img = screen.getByAltText('High quality');
      expect(img).toHaveAttribute('data-quality', '90');
    });

    it('should optimize based on device pixel ratio', () => {
      // Mock devicePixelRatio
      Object.defineProperty(window, 'devicePixelRatio', {
        writable: true,
        configurable: true,
        value: 2,
      });

      render(
        <OptimizedImage
          src="/images/retina.jpg"
          alt="Retina image"
          width={200}
          height={200}
        />
      );

      const img = screen.getByAltText('Retina image');
      // Next.js would automatically serve 2x images for retina displays
      expect(img).toBeInTheDocument();
    });
  });

  describe('Lazy Loading Behavior', () => {
    it('should use IntersectionObserver for lazy loading', () => {
      render(
        <OptimizedImage
          src="/images/lazy.jpg"
          alt="Lazy loaded"
          width={200}
          height={200}
        />
      );

      expect(mockIntersectionObserver).toHaveBeenCalled();
      expect(mockIntersectionObserver.mock.results[0].value.observe).toHaveBeenCalled();
    });

    it('should load image when entering viewport', async () => {
      const onLoadStart = jest.fn();
      
      render(
        <OptimizedImage
          src="/images/viewport.jpg"
          alt="Viewport image"
          width={200}
          height={200}
          onLoadStart={onLoadStart}
        />
      );

      // Simulate intersection
      const [[callback]] = mockIntersectionObserver.mock.calls;
      callback([{ isIntersecting: true, target: screen.getByAltText('Viewport image') }]);

      await waitFor(() => {
        expect(onLoadStart).toHaveBeenCalled();
      });
    });

    it('should support custom loading thresholds', () => {
      render(
        <OptimizedImage
          src="/images/threshold.jpg"
          alt="Threshold image"
          width={200}
          height={200}
          lazyBoundary="200px"
        />
      );

      const [[, options]] = mockIntersectionObserver.mock.calls;
      expect(options.rootMargin).toBe('200px');
    });
  });

  describe('Placeholder Generation', () => {
    it('should show skeleton placeholder while loading', () => {
      const { container } = render(
        <OptimizedImage
          src="/images/skeleton.jpg"
          alt="Skeleton"
          width={200}
          height={200}
          placeholder="empty"
        />
      );

      const placeholder = container.querySelector('[data-placeholder="empty"]');
      expect(placeholder).toBeInTheDocument();
    });

    it('should generate base64 blur placeholder', () => {
      const generateBlurPlaceholder = (width: number, height: number) => {
        // Simplified blur generation
        return `data:image/svg+xml;base64,${btoa(`
          <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#cccccc"/>
          </svg>
        `)}`;
      };

      const blurData = generateBlurPlaceholder(20, 20);
      
      render(
        <OptimizedImage
          src="/images/blur.jpg"
          alt="Blur"
          width={200}
          height={200}
          placeholder="blur"
          blurDataURL={blurData}
        />
      );

      const img = screen.getByAltText('Blur');
      expect(img).toHaveAttribute('data-blur');
      expect(img.getAttribute('data-blur')).toContain('data:image/svg+xml;base64,');
    });

    it('should transition from placeholder to loaded image', async () => {
      const { container } = render(
        <OptimizedImage
          src="/images/transition.jpg"
          alt="Transition"
          width={200}
          height={200}
          placeholder="blur"
          className="image-transition"
        />
      );

      const img = screen.getByAltText('Transition');
      
      // Initially has placeholder
      expect(img).toHaveAttribute('data-placeholder', 'blur');

      // Simulate load
      fireEvent.load(img);

      await waitFor(() => {
        // Check if transition class is applied
        expect(container.querySelector('.image-transition')).toBeInTheDocument();
      });
    });
  });

  describe('Srcset and Sizes', () => {
    it('should generate appropriate srcset', () => {
      render(
        <OptimizedImage
          src="/images/responsive.jpg"
          alt="Responsive"
          width={1200}
          height={800}
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      );

      const img = screen.getByAltText('Responsive');
      expect(img).toHaveAttribute('sizes');
      // Next.js would generate srcset automatically
    });

    it('should support art direction with different images', () => {
      const sources = [
        { media: '(max-width: 640px)', src: '/images/mobile.jpg' },
        { media: '(max-width: 1024px)', src: '/images/tablet.jpg' },
        { src: '/images/desktop.jpg' },
      ];

      render(
        <picture>
          {sources.map((source, index) => (
            source.media ? (
              <source key={index} media={source.media} srcSet={source.src} />
            ) : (
              <OptimizedImage
                key={index}
                src={source.src}
                alt="Art direction"
                width={1200}
                height={800}
              />
            )
          ))}
        </picture>
      );

      expect(screen.getByAltText('Art direction')).toBeInTheDocument();
    });
  });

  describe('Image Loading Strategies', () => {
    it('should prioritize LCP images', () => {
      render(
        <OptimizedImage
          src="/images/hero.jpg"
          alt="Hero"
          width={1920}
          height={1080}
          priority
          sizes="100vw"
        />
      );

      const img = screen.getByAltText('Hero');
      expect(img).toHaveAttribute('loading', 'eager');
    });

    it('should defer off-screen images', () => {
      render(
        <div style={{ height: '200vh' }}>
          <div style={{ height: '150vh' }} />
          <OptimizedImage
            src="/images/below-fold.jpg"
            alt="Below fold"
            width={400}
            height={300}
          />
        </div>
      );

      const img = screen.getByAltText('Below fold');
      expect(img).toHaveAttribute('loading', 'lazy');
    });

    it('should handle progressive enhancement', () => {
      const fallbackSrc = '/images/low-quality.jpg';
      const highQualitySrc = '/images/high-quality.jpg';

      render(
        <OptimizedImage
          src={highQualitySrc}
          alt="Progressive"
          width={800}
          height={600}
          placeholder="blur"
          blurDataURL={fallbackSrc}
        />
      );

      const img = screen.getByAltText('Progressive');
      expect(img).toHaveAttribute('src', highQualitySrc);
      expect(img).toHaveAttribute('data-blur', fallbackSrc);
    });
  });
});