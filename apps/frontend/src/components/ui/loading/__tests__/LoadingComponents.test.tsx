import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoadingSpinner } from '../LoadingSpinner';
import { LoadingSkeleton } from '../LoadingSkeleton';
import { LoadingOverlay } from '../LoadingOverlay';
import { ProgressBar } from '../ProgressBar';
import { LoadingDots } from '../LoadingDots';
import { LoadingState } from '../LoadingState';

describe('Loading Components Test Suite', () => {
  describe('LoadingSpinner', () => {
    it('renders with all size variants', () => {
      const { rerender } = render(<LoadingSpinner size="sm" />);
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByLabelText('Loading...')).toBeInTheDocument();
      
      rerender(<LoadingSpinner size="md" />);
      expect(screen.getByRole('status')).toBeInTheDocument();
      
      rerender(<LoadingSpinner size="lg" />);
      expect(screen.getByRole('status')).toBeInTheDocument();
      
      rerender(<LoadingSpinner size="xl" />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('includes screen reader text', () => {
      render(<LoadingSpinner />);
      expect(screen.getByText('Loading...')).toHaveClass('sr-only');
    });

    it('applies custom className', () => {
      render(<LoadingSpinner className="custom-class" />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('custom-class');
    });
  });

  describe('LoadingSkeleton', () => {
    it('renders text variant', () => {
      render(<LoadingSkeleton variant="text" />);
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toHaveClass('h-4', 'rounded');
    });

    it('renders rectangular variant', () => {
      render(<LoadingSkeleton variant="rectangular" />);
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toHaveClass('rounded-md');
    });

    it('renders circular variant', () => {
      render(<LoadingSkeleton variant="circular" />);
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toHaveClass('rounded-full');
    });

    it('applies custom dimensions', () => {
      render(<LoadingSkeleton className="w-32 h-32" />);
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toHaveClass('w-32', 'h-32');
    });
  });

  describe('LoadingOverlay', () => {
    it('renders with message', () => {
      render(<LoadingOverlay message="Loading data..." />);
      expect(screen.getByText('Loading data...')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('shows cancel button when onCancel provided', async () => {
      const onCancel = jest.fn();
      render(<LoadingOverlay message="Loading..." onCancel={onCancel} />);
      
      const cancelButton = screen.getByText('Cancel');
      expect(cancelButton).toBeInTheDocument();
      
      await userEvent.click(cancelButton);
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('does not show cancel button when onCancel not provided', () => {
      render(<LoadingOverlay message="Loading..." />);
      expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
    });

    it('has proper ARIA attributes', () => {
      render(<LoadingOverlay message="Loading..." />);
      const overlay = screen.getByRole('status');
      expect(overlay).toHaveAttribute('aria-live', 'polite');
      expect(overlay).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('ProgressBar', () => {
    it('renders determinate progress', () => {
      render(<ProgressBar value={50} />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '50');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });

    it('renders indeterminate progress', () => {
      render(<ProgressBar />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).not.toHaveAttribute('aria-valuenow');
    });

    it('shows label when showLabel is true', () => {
      render(<ProgressBar value={75} showLabel />);
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('clamps values between 0 and 100', () => {
      const { rerender } = render(<ProgressBar value={-10} />);
      let progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '0');
      
      rerender(<ProgressBar value={150} />);
      progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '100');
    });
  });

  describe('LoadingDots', () => {
    it('renders three animated dots', () => {
      render(<LoadingDots />);
      const dots = screen.getAllByTestId(/loading-dot-/);
      expect(dots).toHaveLength(3);
      
      dots.forEach(dot => {
        expect(dot).toHaveClass('animate-bounce');
      });
    });

    it('applies staggered animation delays', () => {
      render(<LoadingDots />);
      const dots = screen.getAllByTestId(/loading-dot-/);
      
      expect(dots[0]).toHaveStyle({ animationDelay: '0ms' });
      expect(dots[1]).toHaveStyle({ animationDelay: '150ms' });
      expect(dots[2]).toHaveStyle({ animationDelay: '300ms' });
    });
  });

  describe('LoadingState', () => {
    it('shows loading component when isLoading is true', () => {
      render(
        <LoadingState
          isLoading={true}
          loadingComponent={<div>Loading...</div>}
        >
          <div>Content</div>
        </LoadingState>
      );
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByText('Content')).not.toBeInTheDocument();
    });

    it('shows error component when error exists', () => {
      render(
        <LoadingState
          isLoading={false}
          error="Something went wrong"
          errorComponent={<div>Error occurred</div>}
        >
          <div>Content</div>
        </LoadingState>
      );
      
      expect(screen.getByText('Error occurred')).toBeInTheDocument();
      expect(screen.queryByText('Content')).not.toBeInTheDocument();
    });

    it('shows empty component when isEmpty is true', () => {
      render(
        <LoadingState
          isLoading={false}
          isEmpty={true}
          emptyComponent={<div>No data</div>}
        >
          <div>Content</div>
        </LoadingState>
      );
      
      expect(screen.getByText('No data')).toBeInTheDocument();
      expect(screen.queryByText('Content')).not.toBeInTheDocument();
    });

    it('shows children when not loading, no error, and not empty', () => {
      render(
        <LoadingState
          isLoading={false}
          isEmpty={false}
          error={null}
        >
          <div>Content</div>
        </LoadingState>
      );
      
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('uses default components when custom ones not provided', () => {
      render(
        <LoadingState isLoading={true}>
          <div>Content</div>
        </LoadingState>
      );
      
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('all loading components are keyboard accessible', async () => {
      const onCancel = jest.fn();
      render(
        <div>
          <LoadingSpinner />
          <LoadingOverlay message="Loading..." onCancel={onCancel} />
          <ProgressBar value={50} />
        </div>
      );

      // Tab through components
      const user = userEvent.setup();
      await user.tab();
      
      // Cancel button should be focusable
      const cancelButton = screen.getByText('Cancel');
      expect(cancelButton).toHaveFocus();
    });

    it('announces loading state changes to screen readers', () => {
      const { rerender } = render(
        <LoadingState isLoading={true}>
          <div>Content</div>
        </LoadingState>
      );

      // Loading state should be announced
      expect(screen.getByRole('status')).toBeInTheDocument();

      // Content state should remove loading announcement
      rerender(
        <LoadingState isLoading={false}>
          <div>Content</div>
        </LoadingState>
      );

      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('components adapt to container size', () => {
      // Mock window resize
      global.innerWidth = 320;
      global.dispatchEvent(new Event('resize'));

      render(<LoadingSpinner size="lg" />);
      const spinner = screen.getByRole('status');
      
      // Component should still render properly on small screens
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('multiple loading components render without performance issues', () => {
      const startTime = performance.now();
      
      render(
        <div>
          {Array.from({ length: 20 }).map((_, i) => (
            <LoadingSpinner key={i} size="sm" />
          ))}
        </div>
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render 20 spinners in less than 100ms
      expect(renderTime).toBeLessThan(100);
      expect(screen.getAllByRole('status')).toHaveLength(20);
    });
  });
});