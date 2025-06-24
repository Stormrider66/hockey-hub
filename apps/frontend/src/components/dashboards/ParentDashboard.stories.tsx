import type { Meta, StoryObj } from '@storybook/react';
import ParentDashboard from './ParentDashboard';

const meta = {
  title: 'Dashboards/ParentDashboard',
  component: ParentDashboard,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof ParentDashboard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
}; 