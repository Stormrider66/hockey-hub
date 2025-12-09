import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import {
  LoadingSpinner,
  LoadingSkeleton,
  LoadingOverlay,
  ProgressBar,
  LoadingDots
} from '../../components/ui/loading';

const meta: Meta = {
  title: 'Optimizations/Phase2/Loading Components',
  tags: ['autodocs'],
};

export default meta;

// LoadingSpinner Stories
export const SpinnerSizes: StoryObj = {
  render: () => (
    <div className="flex items-center space-x-8 p-4">
      <div className="text-center">
        <LoadingSpinner size="sm" />
        <p className="mt-2 text-sm text-gray-600">Small</p>
      </div>
      <div className="text-center">
        <LoadingSpinner size="md" />
        <p className="mt-2 text-sm text-gray-600">Medium</p>
      </div>
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-2 text-sm text-gray-600">Large</p>
      </div>
      <div className="text-center">
        <LoadingSpinner size="xl" />
        <p className="mt-2 text-sm text-gray-600">Extra Large</p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'LoadingSpinner component in all available sizes',
      },
    },
  },
};

export const SpinnerColors: StoryObj = {
  render: () => (
    <div className="flex items-center space-x-8 p-4">
      <div className="text-center">
        <LoadingSpinner className="text-blue-500" />
        <p className="mt-2 text-sm text-gray-600">Primary</p>
      </div>
      <div className="text-center">
        <LoadingSpinner className="text-green-500" />
        <p className="mt-2 text-sm text-gray-600">Success</p>
      </div>
      <div className="text-center">
        <LoadingSpinner className="text-red-500" />
        <p className="mt-2 text-sm text-gray-600">Error</p>
      </div>
      <div className="text-center">
        <LoadingSpinner className="text-gray-500" />
        <p className="mt-2 text-sm text-gray-600">Neutral</p>
      </div>
    </div>
  ),
};

// LoadingSkeleton Stories
export const SkeletonTypes: StoryObj = {
  render: () => (
    <div className="space-y-4 p-4">
      <div>
        <p className="mb-2 text-sm font-medium">Text Skeleton</p>
        <LoadingSkeleton type="text" />
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">Title Skeleton</p>
        <LoadingSkeleton type="title" />
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">Avatar Skeleton</p>
        <LoadingSkeleton type="avatar" />
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">Button Skeleton</p>
        <LoadingSkeleton type="button" />
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">Card Skeleton</p>
        <LoadingSkeleton type="card" />
      </div>
    </div>
  ),
};

export const SkeletonParagraph: StoryObj = {
  render: () => (
    <div className="space-y-2 p-4">
      <LoadingSkeleton type="title" />
      <LoadingSkeleton type="text" />
      <LoadingSkeleton type="text" className="w-5/6" />
      <LoadingSkeleton type="text" className="w-4/6" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Multiple skeletons combined to create a paragraph loading state',
      },
    },
  },
};

// LoadingOverlay Stories
export const OverlayDefault: StoryObj = {
  render: () => (
    <div className="relative h-64 bg-gray-100 rounded-lg">
      <div className="p-4">
        <h3 className="text-lg font-semibold">Background Content</h3>
        <p className="mt-2 text-gray-600">
          This content is behind the loading overlay and should appear blurred.
        </p>
      </div>
      <LoadingOverlay />
    </div>
  ),
};

export const OverlayWithMessage: StoryObj = {
  render: () => (
    <div className="relative h-64 bg-gray-100 rounded-lg">
      <div className="p-4">
        <h3 className="text-lg font-semibold">Form Content</h3>
        <p className="mt-2 text-gray-600">Submitting your data...</p>
      </div>
      <LoadingOverlay message="Saving changes..." />
    </div>
  ),
};

export const OverlayStates: StoryObj = {
  render: () => {
    const [visible, setVisible] = React.useState(false);
    
    return (
      <div>
        <button
          onClick={() => setVisible(!visible)}
          className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Toggle Overlay
        </button>
        <div className="relative h-64 bg-gray-100 rounded-lg">
          <div className="p-4">
            <h3 className="text-lg font-semibold">Interactive Demo</h3>
            <p className="mt-2 text-gray-600">
              Click the button to toggle the loading overlay.
            </p>
          </div>
          <LoadingOverlay visible={visible} message="Processing request..." />
        </div>
      </div>
    );
  },
};

// ProgressBar Stories
export const ProgressBarStates: StoryObj = {
  render: () => (
    <div className="space-y-4 p-4">
      <div>
        <p className="mb-2 text-sm font-medium">0% Progress</p>
        <ProgressBar progress={0} />
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">25% Progress</p>
        <ProgressBar progress={25} />
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">50% Progress</p>
        <ProgressBar progress={50} />
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">75% Progress</p>
        <ProgressBar progress={75} />
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">100% Progress</p>
        <ProgressBar progress={100} />
      </div>
    </div>
  ),
};

export const ProgressBarWithLabel: StoryObj = {
  render: () => (
    <div className="space-y-4 p-4">
      <ProgressBar progress={33} label="Uploading files..." />
      <ProgressBar progress={67} label="Processing data..." />
      <ProgressBar progress={100} label="Complete!" />
    </div>
  ),
};

export const ProgressBarAnimated: StoryObj = {
  render: () => {
    const [progress, setProgress] = React.useState(0);
    
    React.useEffect(() => {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) return 0;
          return prev + 10;
        });
      }, 500);
      
      return () => clearInterval(interval);
    }, []);
    
    return (
      <div className="p-4">
        <ProgressBar progress={progress} label="Simulating upload..." />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Animated progress bar that automatically increments',
      },
    },
  },
};

// LoadingDots Stories
export const DotsInline: StoryObj = {
  render: () => (
    <div className="p-4">
      <p className="text-gray-700">
        Loading your data<LoadingDots />
      </p>
    </div>
  ),
};

export const DotsSizes: StoryObj = {
  render: () => (
    <div className="space-y-4 p-4">
      <div className="flex items-center">
        <span className="mr-2">Small:</span>
        <LoadingDots size="sm" />
      </div>
      <div className="flex items-center">
        <span className="mr-2">Medium:</span>
        <LoadingDots size="md" />
      </div>
      <div className="flex items-center">
        <span className="mr-2">Large:</span>
        <LoadingDots size="lg" />
      </div>
    </div>
  ),
};

export const DotsColors: StoryObj = {
  render: () => (
    <div className="space-y-4 p-4">
      <div className="flex items-center">
        <span className="mr-2">Primary:</span>
        <LoadingDots className="text-blue-500" />
      </div>
      <div className="flex items-center">
        <span className="mr-2">Success:</span>
        <LoadingDots className="text-green-500" />
      </div>
      <div className="flex items-center">
        <span className="mr-2">Error:</span>
        <LoadingDots className="text-red-500" />
      </div>
    </div>
  ),
};

// Combined Examples
export const RealWorldExamples: StoryObj = {
  render: () => (
    <div className="space-y-8 p-4">
      {/* Button with spinner */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">Button Loading States</h3>
        <div className="flex space-x-4">
          <button className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            <LoadingSpinner size="sm" className="mr-2" />
            Saving...
          </button>
          <button className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded" disabled>
            <LoadingSpinner size="sm" className="mr-2" />
            Processing...
          </button>
        </div>
      </div>
      
      {/* Card loading state */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">Card Loading State</h3>
        <div className="max-w-sm rounded-lg border border-gray-200 p-4">
          <LoadingSkeleton type="title" className="mb-4" />
          <LoadingSkeleton type="text" className="mb-2" />
          <LoadingSkeleton type="text" className="mb-2 w-4/5" />
          <LoadingSkeleton type="text" className="w-3/5" />
          <div className="mt-4 flex justify-between">
            <LoadingSkeleton type="button" />
            <LoadingSkeleton type="button" className="w-24" />
          </div>
        </div>
      </div>
      
      {/* List loading state */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">List Loading State</h3>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center p-3 rounded border border-gray-200">
              <LoadingSkeleton type="avatar" className="mr-3" />
              <div className="flex-1">
                <LoadingSkeleton type="text" className="mb-1 w-32" />
                <LoadingSkeleton type="text" className="w-24 h-3" />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Status message with dots */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">Status Messages</h3>
        <div className="space-y-2">
          <p className="text-blue-600">
            Connecting to server<LoadingDots />
          </p>
          <p className="text-green-600">
            Verifying credentials<LoadingDots />
          </p>
          <p className="text-gray-600">
            Please wait<LoadingDots />
          </p>
        </div>
      </div>
    </div>
  ),
};