"use client";

import CoachDashboard from "@/src/features/coach/CoachDashboard";
import { DashboardHeader } from "@/src/components/shared/DashboardHeader";

export default function CoachPage() {
  return (
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
  );
} 