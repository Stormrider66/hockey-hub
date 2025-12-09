"use client";

import React from "react";
import { createDynamicImport } from "@/utils/dynamicImports";

// Lazy load the AdminDashboard component
const AdminDashboard = createDynamicImport(
  () => import(
    /* webpackChunkName: "admin-dashboard" */
    "@/features/admin/AdminDashboard"
  ),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Admin Dashboard...</p>
        </div>
      </div>
    ),
    ssr: false // Disable SSR for dashboard with charts
  }
);

export default function AdminDashboardPage() {
  return <AdminDashboard />;
}