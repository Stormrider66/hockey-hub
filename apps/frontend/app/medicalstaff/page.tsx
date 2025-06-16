"use client";

import React from "react";
import { DashboardHeader } from "@/components/shared/DashboardHeader";
import MedicalStaffDashboard from "@/src/features/medical-staff/MedicalStaffDashboard";
import { useCurrentUserQuery } from "@/src/store/api/authApi";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function MedicalStaffPage() {
  const [retryCount, setRetryCount] = useState(0);
  const { data: user, isLoading, error, refetch } = useCurrentUserQuery();
  const router = useRouter();

  useEffect(() => {
    // If we get an auth error and haven't retried yet, try once more after a short delay
    if (error && retryCount === 0) {
      console.log('Authentication failed, retrying after delay...');
      setRetryCount(1);
      setTimeout(() => {
        // Only refetch if the query has been started
        if (refetch) {
          refetch();
        }
      }, 1000);
      return;
    }

    // If still failing after retry or no error, proceed with redirect logic
    if (!isLoading && (error || !user) && retryCount > 0) {
      console.log('Authentication failed after retry, redirecting to login');
      router.push('/login');
    }
  }, [user, isLoading, error, router, retryCount, refetch]);

  if (isLoading || (error && retryCount === 0)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {retryCount === 0 ? 'Loading...' : 'Verifying authentication...'}
          </p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return null; // Will redirect to login
  }

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