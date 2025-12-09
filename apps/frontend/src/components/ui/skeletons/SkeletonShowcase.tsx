import React from 'react';
import {
  PlayerCardSkeleton,
  WorkoutCardSkeleton,
  DashboardWidgetSkeleton,
  TableRowSkeleton,
  FormSkeleton,
  CalendarEventSkeleton,
  ChatMessageSkeleton,
  ExerciseCardSkeleton,
  StatCardSkeleton,
  NavigationSkeleton,
  DashboardSkeleton,
  ListPageSkeleton,
  DetailPageSkeleton,
  TeamRosterSkeleton,
  ScheduleCardSkeleton,
  MedicalReportSkeleton
} from './index';

export const SkeletonShowcase: React.FC = () => {
  return (
    <div className="p-8 space-y-8 bg-gray-100 dark:bg-gray-900">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Hockey Hub Skeleton Components
      </h1>
      
      {/* Individual Components */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Individual Components
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Player Card
            </h3>
            <PlayerCardSkeleton />
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Workout Card
            </h3>
            <WorkoutCardSkeleton />
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Stat Card
            </h3>
            <StatCardSkeleton />
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Exercise Card
            </h3>
            <ExerciseCardSkeleton />
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Calendar Event
            </h3>
            <CalendarEventSkeleton />
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Schedule Card
            </h3>
            <ScheduleCardSkeleton />
          </div>
        </div>
      </section>
      
      {/* Chat Messages */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Chat Messages
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 max-w-2xl">
          <ChatMessageSkeleton />
          <ChatMessageSkeleton isOwn={true} />
          <ChatMessageSkeleton />
        </div>
      </section>
      
      {/* Form */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Form
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md">
          <FormSkeleton fields={4} includeButtons={true} />
        </div>
      </section>
      
      {/* Table */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Table Rows
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <tbody>
              <TableRowSkeleton />
              <TableRowSkeleton />
              <TableRowSkeleton />
            </tbody>
          </table>
        </div>
      </section>
      
      {/* Dashboard Widget */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Dashboard Widget
        </h2>
        <div className="max-w-lg">
          <DashboardWidgetSkeleton rows={5} />
        </div>
      </section>
      
      {/* Team Roster */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Team Roster
        </h2>
        <div className="max-w-3xl">
          <TeamRosterSkeleton />
        </div>
      </section>
      
      {/* Medical Report */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Medical Report
        </h2>
        <div className="max-w-3xl">
          <MedicalReportSkeleton />
        </div>
      </section>
      
      {/* Navigation */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Navigation
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Vertical Navigation
            </h3>
            <div className="h-96 relative">
              <NavigationSkeleton orientation="vertical" items={6} />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Horizontal Navigation
            </h3>
            <NavigationSkeleton orientation="horizontal" items={4} />
          </div>
        </div>
      </section>
      
      {/* Full Page Skeletons */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Full Page Skeletons
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          The following are full-page skeleton layouts:
        </p>
        <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2">
          <li><code>DashboardSkeleton</code> - Complete dashboard with stats and widgets</li>
          <li><code>ListPageSkeleton</code> - List view with filters and pagination</li>
          <li><code>DetailPageSkeleton</code> - Profile/detail page with tabs</li>
        </ul>
      </section>
    </div>
  );
};