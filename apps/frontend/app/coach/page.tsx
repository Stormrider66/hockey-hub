"use client";

import React from "react";
import { createDynamicImport } from "@/utils/dynamicImports";
import { DashboardHeader } from "@/components/shared/DashboardHeader";
import { ChatSocketProvider } from "@/contexts/ChatSocketWrapper";

// Lazy load the CoachDashboard component (using refactored version)
const CoachDashboard = createDynamicImport(
  () => import(
    /* webpackChunkName: "coach-dashboard" */
    "@/features/coach/CoachDashboardRefactored"
  ),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Coach Dashboard...</p>
        </div>
      </div>
    ),
    ssr: false
  }
);

export default function CoachPage() {
  return (
    <ChatSocketProvider>
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader 
          title="Coach Dashboard" 
          subtitle="Manage your team's performance and development"
          role="coach"
        />
        <div className="p-6 max-w-7xl mx-auto">
          <CoachDashboard />
        </div>
      </div>
    </ChatSocketProvider>
  );
} 