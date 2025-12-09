'use client';

import React, { useState } from 'react';
import { LoadingSpinner } from '@/components/ui/loading/LoadingSpinner';
import { LoadingSkeleton } from '@/components/ui/loading/LoadingSkeleton';
import { LoadingOverlay } from '@/components/ui/loading/LoadingOverlay';
import { ProgressBar } from '@/components/ui/loading/ProgressBar';
import { LoadingDots } from '@/components/ui/loading/LoadingDots';
import { LoadingState } from '@/components/ui/loading/LoadingState';

// Import skeleton screens
import { PlayerCardSkeleton } from '@/components/ui/skeletons/PlayerCardSkeleton';
import { WorkoutCardSkeleton } from '@/components/ui/skeletons/WorkoutCardSkeleton';
import { DashboardWidgetSkeleton } from '@/components/ui/skeletons/DashboardWidgetSkeleton';
import { TableRowSkeleton } from '@/components/ui/skeletons/TableRowSkeleton';
import { FormSkeleton } from '@/components/ui/skeletons/FormSkeleton';
import { CalendarEventSkeleton } from '@/components/ui/skeletons/CalendarEventSkeleton';
import { ChatMessageSkeleton } from '@/components/ui/skeletons/ChatMessageSkeleton';
import { ExerciseCardSkeleton } from '@/components/ui/skeletons/ExerciseCardSkeleton';
import { StatCardSkeleton } from '@/components/ui/skeletons/StatCardSkeleton';
import { NavigationSkeleton } from '@/components/ui/skeletons/NavigationSkeleton';
import { DashboardSkeleton } from '@/components/ui/skeletons/DashboardSkeleton';
import { ListPageSkeleton } from '@/components/ui/skeletons/ListPageSkeleton';
import { DetailPageSkeleton } from '@/components/ui/skeletons/DetailPageSkeleton';
import { TeamRosterSkeleton } from '@/components/ui/skeletons/TeamRosterSkeleton';
import { ScheduleCardSkeleton } from '@/components/ui/skeletons/ScheduleCardSkeleton';
import { MedicalReportSkeleton } from '@/components/ui/skeletons/MedicalReportSkeleton';

export default function TestLoadingPage() {
  const [showOverlay, setShowOverlay] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState('components');

  // Simulate progress
  React.useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 0;
        return prev + 10;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">{title}</h2>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {children}
      </div>
    </div>
  );

  const TestCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{title}</h3>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-gray-100">
          Loading State Components Test Suite
        </h1>

        {/* Tabs */}
        <div className="flex space-x-1 mb-8 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          {['components', 'skeletons', 'pages', 'integration'].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`flex-1 px-4 py-2 rounded-md transition-colors capitalize ${
                selectedTab === tab
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {selectedTab === 'components' && (
          <>
            <Section title="1. Loading Spinner">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <TestCard title="Small">
                  <div className="flex justify-center py-4">
                    <LoadingSpinner size="sm" />
                  </div>
                </TestCard>
                <TestCard title="Medium">
                  <div className="flex justify-center py-4">
                    <LoadingSpinner size="md" />
                  </div>
                </TestCard>
                <TestCard title="Large">
                  <div className="flex justify-center py-4">
                    <LoadingSpinner size="lg" />
                  </div>
                </TestCard>
                <TestCard title="Extra Large">
                  <div className="flex justify-center py-4">
                    <LoadingSpinner size="xl" />
                  </div>
                </TestCard>
              </div>
            </Section>

            <Section title="2. Loading Skeleton">
              <div className="space-y-4">
                <TestCard title="Text Variant">
                  <LoadingSkeleton variant="text" className="mb-2" />
                  <LoadingSkeleton variant="text" className="mb-2 w-3/4" />
                  <LoadingSkeleton variant="text" className="w-1/2" />
                </TestCard>
                <TestCard title="Rectangular Variant">
                  <LoadingSkeleton variant="rectangular" className="h-32" />
                </TestCard>
                <TestCard title="Circular Variant">
                  <div className="flex space-x-4">
                    <LoadingSkeleton variant="circular" className="w-12 h-12" />
                    <LoadingSkeleton variant="circular" className="w-16 h-16" />
                    <LoadingSkeleton variant="circular" className="w-20 h-20" />
                  </div>
                </TestCard>
              </div>
            </Section>

            <Section title="3. Loading Overlay">
              <TestCard title="Click to show overlay">
                <button
                  onClick={() => setShowOverlay(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Show Loading Overlay
                </button>
                {showOverlay && (
                  <div className="relative h-40">
                    <LoadingOverlay
                      message="Processing your request..."
                    >
                      <button
                        onClick={() => setShowOverlay(false)}
                        className="px-3 py-1 text-sm bg-white border rounded shadow"
                      >
                        Cancel
                      </button>
                    </LoadingOverlay>
                  </div>
                )}
              </TestCard>
            </Section>

            <Section title="4. Progress Bar">
              <div className="space-y-4">
                <TestCard title="Determinate Progress">
                  <ProgressBar value={progress} showLabel />
                </TestCard>
                <TestCard title="Indeterminate Progress">
                  <ProgressBar />
                </TestCard>
                <TestCard title="Custom Height">
                  <ProgressBar value={progress} className="h-2" />
                </TestCard>
              </div>
            </Section>

            <Section title="5. Loading Dots">
              <TestCard title="Loading Animation">
                <div className="flex items-center space-x-4">
                  <span className="text-gray-600 dark:text-gray-400">Processing</span>
                  <LoadingDots />
                </div>
              </TestCard>
            </Section>

            <Section title="6. Loading State">
              <TestCard title="Complete Loading State">
                <button
                  onClick={() => setIsLoading(!isLoading)}
                  className="mb-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Toggle Loading State
                </button>
                <LoadingState
                  loading={isLoading}
                  error={null}
                  data={{ ok: true }}
                >{() => (
                  <div className="p-4 bg-green-100 dark:bg-green-900 rounded">
                    Content loaded successfully!
                  </div>
                )}</LoadingState>
              </TestCard>
            </Section>
          </>
        )}

        {selectedTab === 'skeletons' && (
          <>
            <Section title="Player & Workout Skeletons">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TestCard title="Player Card">
                  <PlayerCardSkeleton />
                </TestCard>
                <TestCard title="Workout Card">
                  <WorkoutCardSkeleton />
                </TestCard>
              </div>
            </Section>

            <Section title="Dashboard & Stats Skeletons">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TestCard title="Dashboard Widget">
                  <DashboardWidgetSkeleton />
                </TestCard>
                <TestCard title="Stat Card">
                  <StatCardSkeleton />
                </TestCard>
              </div>
            </Section>

            <Section title="Table & Form Skeletons">
              <div className="space-y-4">
                <TestCard title="Table Rows">
                  <table className="w-full">
                    <tbody>
                      <TableRowSkeleton columns={['text', 'text', 'badge', 'action']} />
                    </tbody>
                  </table>
                </TestCard>
                <TestCard title="Form Fields">
                  <FormSkeleton fields={3} />
                </TestCard>
              </div>
            </Section>

            <Section title="Communication Skeletons">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TestCard title="Chat Messages">
                  <div className="space-y-2">
                    <ChatMessageSkeleton isOwn={false} />
                    <ChatMessageSkeleton isOwn={true} />
                  </div>
                </TestCard>
                <TestCard title="Calendar Event">
                  <CalendarEventSkeleton />
                </TestCard>
              </div>
            </Section>

            <Section title="Exercise & Schedule Skeletons">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TestCard title="Exercise Card">
                  <ExerciseCardSkeleton />
                </TestCard>
                <TestCard title="Schedule Card">
                  <ScheduleCardSkeleton />
                </TestCard>
              </div>
            </Section>

            <Section title="Team & Medical Skeletons">
              <div className="space-y-4">
                <TestCard title="Team Roster">
                  <TeamRosterSkeleton />
                </TestCard>
                <TestCard title="Medical Report">
                  <MedicalReportSkeleton />
                </TestCard>
              </div>
            </Section>
          </>
        )}

        {selectedTab === 'pages' && (
          <>
            <Section title="Navigation Skeleton">
              <TestCard title="Full Navigation">
                <div className="h-64 overflow-hidden">
                  <NavigationSkeleton />
                </div>
              </TestCard>
            </Section>

            <Section title="Dashboard Skeleton">
              <TestCard title="Complete Dashboard">
                <div className="h-96 overflow-hidden">
                  <DashboardSkeleton />
                </div>
              </TestCard>
            </Section>

            <Section title="List & Detail Page Skeletons">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TestCard title="List Page">
                  <div className="h-64 overflow-hidden">
                    <ListPageSkeleton />
                  </div>
                </TestCard>
                <TestCard title="Detail Page">
                  <div className="h-64 overflow-hidden">
                    <DetailPageSkeleton />
                  </div>
                </TestCard>
              </div>
            </Section>
          </>
        )}

        {selectedTab === 'integration' && (
          <>
            <Section title="Accessibility Testing">
              <TestCard title="Screen Reader Support">
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <p className="text-sm mb-2">All loading components include:</p>
                    <ul className="text-sm space-y-1 ml-4">
                      <li>• aria-label for spinners</li>
                      <li>• role="status" for loading states</li>
                      <li>• sr-only text for screen readers</li>
                      <li>• Keyboard navigation support</li>
                    </ul>
                  </div>
                  <LoadingSpinner size="md" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Screen readers will announce: "Loading..."
                  </p>
                </div>
              </TestCard>
            </Section>

            <Section title="Responsive Testing">
              <TestCard title="Resize Window to Test">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded">
                      <LoadingSpinner size="sm" />
                      <p className="text-xs mt-2">Mobile</p>
                    </div>
                    <div className="p-4 border rounded">
                      <LoadingSpinner size="md" />
                      <p className="text-xs mt-2">Tablet</p>
                    </div>
                    <div className="p-4 border rounded">
                      <LoadingSpinner size="lg" />
                      <p className="text-xs mt-2">Desktop</p>
                    </div>
                  </div>
                  <PlayerCardSkeleton />
                </div>
              </TestCard>
            </Section>

            <Section title="Dark Mode Testing">
              <TestCard title="Toggle Dark Mode">
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    All components adapt to dark mode automatically
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white rounded border">
                      <LoadingSpinner size="md" />
                      <p className="text-xs mt-2 text-gray-700">Light Mode</p>
                    </div>
                    <div className="p-4 bg-gray-900 rounded border">
                      <LoadingSpinner size="md" />
                      <p className="text-xs mt-2 text-gray-300">Dark Mode</p>
                    </div>
                  </div>
                </div>
              </TestCard>
            </Section>

            <Section title="Performance Testing">
              <TestCard title="Multiple Loading States">
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Testing multiple concurrent loading animations
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <LoadingSpinner key={i} size="sm" />
                    ))}
                  </div>
                  <div className="space-y-1 mt-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <LoadingSkeleton key={i} variant="text" />
                    ))}
                  </div>
                </div>
              </TestCard>
            </Section>
          </>
        )}
      </div>
    </div>
  );
}