"use client";

import React from "react";
import { createDynamicImport } from "@/utils/dynamicImports";

// Lazy load the EquipmentManagerDashboard component
const EquipmentManagerDashboard = createDynamicImport(
  () => import(
    /* webpackChunkName: "equipment-manager-dashboard" */
    "@/features/equipment-manager/EquipmentManagerDashboard"
  ),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Equipment Manager Dashboard...</p>
        </div>
      </div>
    ),
    ssr: false // Disable SSR for dashboard with charts
  }
);

export default function EquipmentManagerDashboardPage() {
  return <EquipmentManagerDashboard />;
}