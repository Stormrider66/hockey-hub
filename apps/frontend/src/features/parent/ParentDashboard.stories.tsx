import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import ParentDashboard from "./ParentDashboard";

const meta: Meta<typeof ParentDashboard> = {
  title: "Dashboards/ParentDashboard",
  component: ParentDashboard,
  parameters: {
    layout: "fullscreen",
  },
};
export default meta;

type Story = StoryObj<typeof ParentDashboard>;

export const Default: Story = {
  render: () => <ParentDashboard />,
}; 