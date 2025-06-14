import type { Meta, StoryObj } from '@storybook/react';
import SessionRouter, { ExampleAppWithRouting } from './SessionRouter';

const meta = {
  title: 'Features/TrainingSessionViewer/SessionRouter',
  component: SessionRouter,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof SessionRouter>;

export default meta;
type Story = StoryObj<typeof meta>;

// Physical Trainer launching a session
export const PhysicalTrainerSession: Story = {
  args: {
    userRole: 'physical-trainer',
    onBack: () => console.log('Navigate back to physical trainer dashboard'),
  },
};

// Coach monitoring team training
export const CoachSession: Story = {
  args: {
    userRole: 'coach',
    onBack: () => console.log('Navigate back to coach dashboard'),
  },
};

// Player doing individual training
export const PlayerSession: Story = {
  args: {
    userRole: 'player',
    onBack: () => console.log('Navigate back to player dashboard'),
  },
};

// Parent monitoring child's training
export const ParentSession: Story = {
  args: {
    userRole: 'parent',
    onBack: () => console.log('Navigate back to parent dashboard'),
  },
};

// Full app flow example
export const FullAppFlow: Story = {
  render: () => <ExampleAppWithRouting />,
  name: 'Complete App Flow Example',
}; 