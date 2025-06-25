import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import EquipmentManagerDashboard from "./EquipmentManagerDashboard";

const meta: Meta<typeof EquipmentManagerDashboard> = {
  title: "Dashboards/EquipmentManagerDashboard",
  component: EquipmentManagerDashboard,
  parameters: {
    layout: "fullscreen",
  },
};
export default meta;

type Story = StoryObj<typeof EquipmentManagerDashboard>;

export const Default: Story = {
  render: () => <EquipmentManagerDashboard />,
}; 