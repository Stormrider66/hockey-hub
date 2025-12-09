/**
 * Migration Examples for Loading Components
 * This file shows before/after examples for common loading patterns
 */

import React from 'react';
import { LoadingSpinner, LoadingState } from './index';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RefreshCw, Loader2 } from 'lucide-react';

// Example 1: Simple spinner replacement
export const SimpleSpinnerExample = () => {
  // OLD
  const oldSpinner = (
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  );

  // NEW
  const newSpinner = <LoadingSpinner size="lg" />;

  return { oldSpinner, newSpinner };
};

// Example 2: Centered spinner with text
export const CenteredSpinnerExample = () => {
  // OLD
  const oldPattern = (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading data...</p>
      </div>
    </div>
  );

  // NEW
  const newPattern = <LoadingSpinner size="xl" text="Loading data..." />;

  return { oldPattern, newPattern };
};

// Example 3: Button with loading state
export const ButtonLoadingExample = ({ isLoading }: { isLoading: boolean }) => {
  // OLD
  const oldButton = (
    <Button disabled={isLoading}>
      {isLoading && <RefreshCw className="animate-spin h-4 w-4 mr-2" />}
      Save
    </Button>
  );

  // NEW
  const newButton = (
    <Button disabled={isLoading}>
      {isLoading && <LoadingSpinner size="sm" center={false} className="mr-2" />}
      Save
    </Button>
  );

  return { oldButton, newButton };
};

// Example 4: Complete loading state management
export const CompleteLoadingStateExample = ({ 
  isLoading, 
  error, 
  data,
  refetch 
}: { 
  isLoading: boolean;
  error?: Error | null;
  data?: any[];
  refetch?: () => void;
}) => {
  // OLD
  const oldPattern = (
    <>
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="text-center text-destructive">
          Error: {error.message}
        </div>
      ) : !data || data.length === 0 ? (
        <div className="text-center text-muted-foreground">
          No data available
        </div>
      ) : (
        <div>
          {/* Your content here */}
        </div>
      )}
    </>
  );

  // NEW
  const newPattern = (
    <LoadingState
      loading={isLoading}
      error={error || null}
      data={data || []}
      empty={!data || data.length === 0}
      onRetry={refetch}
      loadingMessage="Loading data..."
      emptyMessage="No data available"
    >
      {() => (
        <div>
          {/* Your content here */}
        </div>
      )}
    </LoadingState>
  );

  return { oldPattern, newPattern };
};

// Example 5: Card loading state
export const CardLoadingExample = ({ isLoading }: { isLoading: boolean }) => {
  // OLD
  const oldCard = isLoading ? (
    <Card className="p-8 text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
      <p className="text-sm text-muted-foreground">Loading players...</p>
    </Card>
  ) : (
    <Card>{/* Content */}</Card>
  );

  // NEW
  const newCard = isLoading ? (
    <Card className="p-8">
      <LoadingSpinner size="lg" text="Loading players..." />
    </Card>
  ) : (
    <Card>{/* Content */}</Card>
  );

  return { oldCard, newCard };
};

// Example 6: Inline icon replacement
export const InlineIconExample = ({ isRefreshing }: { isRefreshing: boolean }) => {
  // OLD
  const oldIcon = <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />;

  // NEW using conditional rendering
  const newIcon = isRefreshing ? (
    <LoadingSpinner size="sm" center={false} />
  ) : (
    <RefreshCw className="h-4 w-4" />
  );

  return { oldIcon, newIcon };
};

// Example 7: Custom loading component with LoadingState
export const CustomLoadingExample = ({ isLoading, data }: { isLoading: boolean; data?: any }) => {
  const CustomSkeleton = () => (
    <div className="space-y-4">
      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
      <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
    </div>
  );

  return (
    <LoadingState
      loading={isLoading}
      data={data}
      empty={!data}
      emptyMessage="No items found"
    >
      {() => <div>{/* Your content */}</div>}
    </LoadingState>
  );
};