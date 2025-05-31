import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import CoachDashboard from "./CoachDashboard";

const meta: Meta<typeof CoachDashboard> = {
  title: "Dashboards/CoachDashboard",
  component: CoachDashboard,
  parameters: {
    layout: "fullscreen",
  },
};
export default meta;

type Story = StoryObj<typeof CoachDashboard>;

export const Default: Story = {
  render: () => <CoachDashboard />,
}; 