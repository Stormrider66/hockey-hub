import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import MedicalStaffDashboard from "./MedicalStaffDashboard";

const meta: Meta<typeof MedicalStaffDashboard> = {
  title: "Dashboards/MedicalStaffDashboard",
  component: MedicalStaffDashboard,
  parameters: {
    layout: "fullscreen",
  },
};
export default meta;

type Story = StoryObj<typeof MedicalStaffDashboard>;

export const Default: Story = {
  render: () => <MedicalStaffDashboard />,
}; 