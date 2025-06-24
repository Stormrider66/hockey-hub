import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import PlayerDashboard from "./PlayerDashboard";

const meta: Meta<typeof PlayerDashboard> = {
  title: "Dashboards/PlayerDashboard",
  component: PlayerDashboard,
  parameters: {
    layout: "fullscreen",
  },
};
export default meta;

type Story = StoryObj<typeof PlayerDashboard>;

export const Default: Story = {
  render: () => <PlayerDashboard />,
}; 