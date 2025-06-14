import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { TestAnalyticsPanel } from './TestAnalyticsPanel';
import { http, HttpResponse } from 'msw';

const meta: Meta<typeof TestAnalyticsPanel> = {
  title: 'Components/TestAnalyticsPanel',
  component: TestAnalyticsPanel,
  parameters: {
    layout: 'centered',
  },
};

export default meta;

type Story = StoryObj<typeof TestAnalyticsPanel>;

export const Default: Story = {
  args: {
    playerId: 'player-123',
  },
};

// Loading state: override fetch to never resolve /tests
export const Loading: Story = {
  parameters: {
    msw: {
      handlers: [
        // Delay definitions to simulate loading
        http.get('/tests', async () => {
          return new Promise(() => {}); // Never resolve
        }),
      ],
    },
  },
  args: { playerId: 'player-123' },
};

// Error state: override fetch to return 500 for /tests
export const Error: Story = {
  parameters: {
    msw: {
      handlers: [
        // Return 500 for definitions to simulate error
        http.get('/tests', async () => {
          return new HttpResponse(null, { status: 500 });
        }),
      ],
    },
  },
  args: { playerId: 'player-123' },
}; 