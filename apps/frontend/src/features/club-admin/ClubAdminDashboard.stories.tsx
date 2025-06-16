import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import ClubAdminDashboard from "./ClubAdminDashboard";

const meta: Meta<typeof ClubAdminDashboard> = {
  title: "Dashboards/ClubAdminDashboard",
  component: ClubAdminDashboard,
  parameters: {
    layout: "fullscreen",
  },
};
export default meta;

type Story = StoryObj<typeof ClubAdminDashboard>;

export const Default: Story = {
  render: () => <ClubAdminDashboard />,
}; 