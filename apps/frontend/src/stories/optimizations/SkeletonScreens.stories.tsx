import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import {
  PlayerCardSkeleton,
  WorkoutCardSkeleton,
  DashboardWidgetSkeleton,
  TableRowSkeleton,
  FormSkeleton
} from '../../components/ui/skeletons';

const meta: Meta = {
  title: 'Optimizations/Phase2/Skeleton Screens',
  tags: ['autodocs'],
};

export default meta;

// PlayerCardSkeleton Stories
export const PlayerCard: StoryObj = {
  render: () => <PlayerCardSkeleton />,
  parameters: {
    docs: {
      description: {
        story: 'Skeleton for player cards showing avatar, name, team, and status',
      },
    },
  },
};

export const PlayerCardGrid: StoryObj = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <PlayerCardSkeleton key={i} />
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Multiple player card skeletons in a responsive grid layout',
      },
    },
  },
};

// WorkoutCardSkeleton Stories
export const WorkoutCard: StoryObj = {
  render: () => <WorkoutCardSkeleton />,
};

export const WorkoutCardWithActions: StoryObj = {
  render: () => <WorkoutCardSkeleton showActions />,
  parameters: {
    docs: {
      description: {
        story: 'Workout card skeleton with action buttons',
      },
    },
  },
};

export const WorkoutCardVariations: StoryObj = {
  render: () => (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-sm font-medium text-gray-600">3 Exercises (Default)</p>
        <WorkoutCardSkeleton />
      </div>
      <div>
        <p className="mb-2 text-sm font-medium text-gray-600">5 Exercises</p>
        <WorkoutCardSkeleton exerciseCount={5} />
      </div>
      <div>
        <p className="mb-2 text-sm font-medium text-gray-600">8 Exercises with Actions</p>
        <WorkoutCardSkeleton exerciseCount={8} showActions />
      </div>
    </div>
  ),
};

// DashboardWidgetSkeleton Stories
export const DashboardWidget: StoryObj = {
  render: () => <DashboardWidgetSkeleton />,
};

export const DashboardWidgetSizes: StoryObj = {
  render: () => (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-sm font-medium text-gray-600">Small Widget</p>
        <DashboardWidgetSkeleton size="sm" />
      </div>
      <div>
        <p className="mb-2 text-sm font-medium text-gray-600">Medium Widget (Default)</p>
        <DashboardWidgetSkeleton size="md" />
      </div>
      <div>
        <p className="mb-2 text-sm font-medium text-gray-600">Large Widget</p>
        <DashboardWidgetSkeleton size="lg" />
      </div>
    </div>
  ),
};

export const DashboardWidgetWithAction: StoryObj = {
  render: () => <DashboardWidgetSkeleton showAction />,
  parameters: {
    docs: {
      description: {
        story: 'Dashboard widget skeleton with action button in header',
      },
    },
  },
};

export const DashboardLayout: StoryObj = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <DashboardWidgetSkeleton size="sm" />
      <DashboardWidgetSkeleton size="sm" showAction />
      <DashboardWidgetSkeleton size="sm" />
      <div className="md:col-span-2">
        <DashboardWidgetSkeleton size="lg" />
      </div>
      <DashboardWidgetSkeleton size="md" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Complete dashboard layout with various widget skeletons',
      },
    },
  },
};

// TableRowSkeleton Stories
export const TableRow: StoryObj = {
  render: () => (
    <table className="w-full">
      <thead>
        <tr className="border-b">
          <th className="text-left p-2">Name</th>
          <th className="text-left p-2">Team</th>
          <th className="text-left p-2">Position</th>
          <th className="text-left p-2">Status</th>
        </tr>
      </thead>
      <tbody>
        <TableRowSkeleton columns={4} />
      </tbody>
    </table>
  ),
};

export const TableMultipleRows: StoryObj = {
  render: () => (
    <table className="w-full">
      <thead>
        <tr className="border-b">
          <th className="text-left p-2">Name</th>
          <th className="text-left p-2">Team</th>
          <th className="text-left p-2">Position</th>
          <th className="text-left p-2">Status</th>
          <th className="text-left p-2">Action</th>
        </tr>
      </thead>
      <tbody>
        <TableRowSkeleton columns={5} rows={5} />
      </tbody>
    </table>
  ),
};

export const TableWithCheckbox: StoryObj = {
  render: () => (
    <table className="w-full">
      <thead>
        <tr className="border-b">
          <th className="w-12 p-2">
            <input type="checkbox" className="rounded" />
          </th>
          <th className="text-left p-2">Name</th>
          <th className="text-left p-2">Email</th>
          <th className="text-left p-2">Role</th>
          <th className="text-left p-2">Status</th>
        </tr>
      </thead>
      <tbody>
        <TableRowSkeleton 
          columns={4} 
          rows={3} 
          showCheckbox 
          columnWidths={['w-32', 'w-48', 'w-24', 'w-20']}
        />
      </tbody>
    </table>
  ),
};

// FormSkeleton Stories
export const Form: StoryObj = {
  render: () => <FormSkeleton />,
};

export const FormWithTitle: StoryObj = {
  render: () => <FormSkeleton title="User Settings" showSubmit />,
};

export const FormVariations: StoryObj = {
  render: () => (
    <div className="space-y-8">
      <div>
        <p className="mb-4 text-sm font-medium text-gray-600">Simple Form (3 fields)</p>
        <FormSkeleton />
      </div>
      <div>
        <p className="mb-4 text-sm font-medium text-gray-600">Complex Form (6 fields)</p>
        <FormSkeleton 
          fields={6} 
          fieldTypes={['text', 'text', 'textarea', 'select', 'checkbox', 'text']}
          showSubmit
        />
      </div>
      <div>
        <p className="mb-4 text-sm font-medium text-gray-600">Two Column Form</p>
        <FormSkeleton 
          title="Profile Information"
          fields={4} 
          columns={2}
          showSubmit
        />
      </div>
    </div>
  ),
};

// Complete Page Examples
export const CompletePageLoading: StoryObj = {
  render: () => (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <DashboardWidgetSkeleton size="sm" contentHeight="h-16" />
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <PlayerCardSkeleton />
          <DashboardWidgetSkeleton size="md" />
        </div>
        
        {/* Main Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4">
            <DashboardWidgetSkeleton size="sm" />
            <DashboardWidgetSkeleton size="sm" />
            <DashboardWidgetSkeleton size="sm" />
          </div>
          
          {/* Table */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="mb-4">
              <FormSkeleton fields={1} />
            </div>
            <table className="w-full">
              <tbody>
                <TableRowSkeleton columns={5} rows={5} />
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Complete dashboard page loading state using various skeleton components',
      },
    },
  },
};

export const ListPageLoading: StoryObj = {
  render: () => (
    <div className="p-6">
      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <FormSkeleton fields={1} />
        <div className="w-32">
          <FormSkeleton fields={1} fieldTypes={['select']} />
        </div>
      </div>
      
      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <WorkoutCardSkeleton key={i} showActions />
        ))}
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'List page with filters and card grid loading state',
      },
    },
  },
};

export const FormPageLoading: StoryObj = {
  render: () => (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <FormSkeleton 
          title="Create New Workout"
          fields={8}
          fieldTypes={['text', 'textarea', 'select', 'select', 'text', 'text', 'checkbox', 'checkbox']}
          columns={2}
          showSubmit
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Form page loading state with complex multi-column form',
      },
    },
  },
};