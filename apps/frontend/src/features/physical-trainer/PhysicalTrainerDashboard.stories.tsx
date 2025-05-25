import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import PhysicalTrainerDashboard from "./PhysicalTrainerDashboard";

const meta: Meta<typeof PhysicalTrainerDashboard> = {
  title: "Dashboards/PhysicalTrainerDashboard",
  component: PhysicalTrainerDashboard,
  parameters: {
    layout: "fullscreen",
  },
};
export default meta;

type Story = StoryObj<typeof PhysicalTrainerDashboard>;

export const Default: Story = {
  render: () => <PhysicalTrainerDashboard />,
}; 