import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  LoadingSpinner,
  LoadingSkeleton,
  LoadingOverlay,
  ProgressBar,
  LoadingDots
} from '../../components/ui/loading';

describe('Phase 2: Loading Components', () => {
  describe('LoadingSpinner', () => {
    it('renders with default size', () => {
      render(<LoadingSpinner />);
      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('h-4 w-4');
    });

    it('renders with all size variants', () => {
      const sizes = ['sm', 'md', 'lg', 'xl'] as const;
      const expectedClasses = {
        sm: 'h-4 w-4',
        md: 'h-6 w-6',
        lg: 'h-8 w-8',
        xl: 'h-12 w-12'
      };

      sizes.forEach(size => {
        const { container } = render(<LoadingSpinner size={size} />);
        const spinner = container.querySelector('svg');
        expect(spinner).toHaveClass(expectedClasses[size]);
      });
    });

    it('applies custom className', () => {
      render(<LoadingSpinner className="custom-class" />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('custom-class');
    });

    it('has proper accessibility attributes', () => {
      render(<LoadingSpinner />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('aria-label', 'Loading');
    });

    it('animates correctly', () => {
      render(<LoadingSpinner />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('animate-spin');
    });
  });

  describe('LoadingSkeleton', () => {
    it('renders with default type', () => {
      render(<LoadingSkeleton />);
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveClass('h-4 w-full');
    });

    it('renders all skeleton types correctly', () => {
      const types = ['text', 'title', 'avatar', 'button', 'card'] as const;
      const expectedClasses = {
        text: 'h-4 w-full',
        title: 'h-8 w-3/4',
        avatar: 'h-10 w-10 rounded-full',
        button: 'h-10 w-32',
        card: 'h-64 w-full'
      };

      types.forEach(type => {
        render(<LoadingSkeleton type={type} data-testid={`skeleton-${type}`} />);
        const skeleton = screen.getByTestId(`skeleton-${type}`);
        expect(skeleton).toHaveClass(expectedClasses[type]);
      });
    });

    it('has shimmer animation', () => {
      render(<LoadingSkeleton />);
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toHaveClass('animate-pulse');
      expect(skeleton).toHaveClass('bg-gradient-to-r');
    });

    it('supports custom dimensions', () => {
      render(<LoadingSkeleton className="h-20 w-40" />);
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toHaveClass('h-20 w-40');
    });
  });

  describe('LoadingOverlay', () => {
    it('renders when visible', () => {
      render(<LoadingOverlay />);
      const overlay = screen.getByTestId('loading-overlay');
      expect(overlay).toBeInTheDocument();
    });

    it('does not render when not visible', () => {
      render(<LoadingOverlay visible={false} />);
      expect(screen.queryByTestId('loading-overlay')).not.toBeInTheDocument();
    });

    it('renders with custom message', () => {
      render(<LoadingOverlay message="Loading data..." />);
      expect(screen.getByText('Loading data...')).toBeInTheDocument();
    });

    it('applies blur effect to background', () => {
      render(<LoadingOverlay />);
      const overlay = screen.getByTestId('loading-overlay');
      expect(overlay).toHaveClass('backdrop-blur-sm');
    });

    it('centers content properly', () => {
      render(<LoadingOverlay />);
      const content = screen.getByTestId('loading-overlay').firstChild;
      expect(content).toHaveClass('flex');
      expect(content).toHaveClass('items-center');
      expect(content).toHaveClass('justify-center');
    });

    it('has proper z-index for overlay', () => {
      render(<LoadingOverlay />);
      const overlay = screen.getByTestId('loading-overlay');
      expect(overlay).toHaveClass('z-50');
    });
  });

  describe('ProgressBar', () => {
    it('renders with 0% progress', () => {
      render(<ProgressBar progress={0} />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '0');
    });

    it('renders with 50% progress', () => {
      render(<ProgressBar progress={50} />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '50');
      const fill = progressBar.querySelector('.bg-primary');
      expect(fill).toHaveStyle({ width: '50%' });
    });

    it('renders with 100% progress', () => {
      render(<ProgressBar progress={100} />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '100');
      const fill = progressBar.querySelector('.bg-primary');
      expect(fill).toHaveStyle({ width: '100%' });
    });

    it('shows label when provided', () => {
      render(<ProgressBar progress={75} label="Uploading..." />);
      expect(screen.getByText('Uploading...')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('animates progress changes', async () => {
      const { rerender } = render(<ProgressBar progress={0} />);
      const progressBar = screen.getByRole('progressbar');
      const fill = progressBar.querySelector('.bg-primary');
      
      expect(fill).toHaveStyle({ width: '0%' });
      
      rerender(<ProgressBar progress={50} />);
      await waitFor(() => {
        expect(fill).toHaveStyle({ width: '50%' });
      });
      
      expect(fill).toHaveClass('transition-all');
    });

    it('handles invalid progress values', () => {
      render(<ProgressBar progress={150} />);
      const progressBar = screen.getByRole('progressbar');
      const fill = progressBar.querySelector('.bg-primary');
      expect(fill).toHaveStyle({ width: '100%' });
    });

    it('has proper accessibility attributes', () => {
      render(<ProgressBar progress={60} label="Processing" />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-label', 'Processing');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });
  });

  describe('LoadingDots', () => {
    it('renders inline by default', () => {
      const { container } = render(
        <div>
          Loading<LoadingDots />
        </div>
      );
      const dots = screen.getByTestId('loading-dots');
      expect(dots).toHaveClass('inline-flex');
      expect(container.textContent).toBe('Loading...');
    });

    it('renders three animated dots', () => {
      render(<LoadingDots />);
      const dots = screen.getByTestId('loading-dots');
      const dotElements = dots.querySelectorAll('.rounded-full');
      expect(dotElements).toHaveLength(3);
      
      dotElements.forEach((dot, index) => {
        expect(dot).toHaveClass('animate-bounce');
        expect(dot).toHaveStyle({ animationDelay: `${index * 0.1}s` });
      });
    });

    it('applies custom size', () => {
      render(<LoadingDots size="lg" />);
      const dots = screen.getByTestId('loading-dots');
      const dotElements = dots.querySelectorAll('.rounded-full');
      
      dotElements.forEach(dot => {
        expect(dot).toHaveClass('h-2 w-2');
      });
    });

    it('supports custom className', () => {
      render(<LoadingDots className="custom-dots" />);
      const dots = screen.getByTestId('loading-dots');
      expect(dots).toHaveClass('custom-dots');
    });

    it('has proper spacing between dots', () => {
      render(<LoadingDots />);
      const dots = screen.getByTestId('loading-dots');
      expect(dots).toHaveClass('space-x-1');
    });
  });

  describe('Component Integration', () => {
    it('LoadingOverlay can contain LoadingSpinner', () => {
      render(
        <LoadingOverlay message="Processing request">
          <LoadingSpinner size="lg" />
        </LoadingOverlay>
      );
      
      expect(screen.getByText('Processing request')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('Multiple loading components can coexist', () => {
      render(
        <div>
          <LoadingSpinner data-testid="spinner" />
          <LoadingSkeleton data-testid="skeleton" />
          <ProgressBar progress={50} data-testid="progress" />
          <LoadingDots data-testid="dots" />
        </div>
      );
      
      expect(screen.getByTestId('spinner')).toBeInTheDocument();
      expect(screen.getByTestId('skeleton')).toBeInTheDocument();
      expect(screen.getByTestId('progress')).toBeInTheDocument();
      expect(screen.getByTestId('dots')).toBeInTheDocument();
    });
  });
});