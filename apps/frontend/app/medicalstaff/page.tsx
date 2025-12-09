"use client";

import React from "react";
import { DashboardHeader } from "@/components/shared/DashboardHeader";
import { createDynamicImport } from "@/utils/dynamicImports";

// Lazy load the MedicalStaffDashboard component
const MedicalStaffDashboard = createDynamicImport(
  () => import(
    /* webpackChunkName: "medical-staff-dashboard" */
    "@/features/medical-staff/MedicalStaffDashboard"
  ),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Medical Dashboard...</p>
        </div>
      </div>
    ),
    ssr: false
  }
);

export default function MedicalStaffPage() {
  // For now, we'll skip the auth check to allow testing
  // In production, you would uncomment the auth logic
  
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader 
        title="Medical Dashboard"
        subtitle="Manage injuries, treatments, and player health"
        role="medicalstaff"
      />
      <MedicalStaffDashboard />
    </div>
  );
} 