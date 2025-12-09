"use client";

import React from "react";
import { createDynamicImport } from "@/utils/dynamicImports";

// Lazy load the PlayerDashboard component (using refactored version)
const PlayerDashboard = createDynamicImport(
  () => import(
    /* webpackChunkName: "player-dashboard" */
    "@/features/player/PlayerDashboardRefactored"
  ),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Player Dashboard...</p>
        </div>
      </div>
    ),
    ssr: false // Disable SSR for dashboard with charts
  }
);

export default function PlayerDashboardPage() {
  return <PlayerDashboard />;
}