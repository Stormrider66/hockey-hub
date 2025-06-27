"use client";

import React from "react";
import { DashboardHeader } from "@/components/shared/DashboardHeader";
import MedicalStaffDashboard from "@/src/features/medical-staff/MedicalStaffDashboard";

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