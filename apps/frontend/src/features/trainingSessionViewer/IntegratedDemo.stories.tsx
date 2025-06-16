import type { Meta, StoryObj } from '@storybook/react';
import IntegratedDemo from './IntegratedDemo';

const meta = {
  title: 'Features/TrainingSessionViewer/IntegratedDemo',
  component: IntegratedDemo,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof IntegratedDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'Working Dashboard → Session Flow',
}; 