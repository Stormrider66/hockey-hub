import type { Meta, StoryObj } from '@storybook/react';
import PhysicalTrainerDashboard from './PhysicalTrainerDashboard';

const meta = {
  title: 'Dashboards/PhysicalTrainerDashboard',
  component: PhysicalTrainerDashboard,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof PhysicalTrainerDashboard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
}; 