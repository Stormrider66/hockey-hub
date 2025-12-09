import { Suspense } from "react";
import { Metadata } from "next";
import { PhysicalTrainerLayout } from "./components/PhysicalTrainerLayout";
import { PhysicalTrainerClient } from "./components/PhysicalTrainerClient";
import { DashboardSkeleton } from "./components/DashboardSkeleton";
import { prefetchTrainerData } from "./actions/prefetchTrainerData";

export const metadata: Metadata = {
  title: "Physical Trainer Dashboard - Hockey Hub",
  description: "Manage training sessions, workouts, and player fitness",
};

// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic';

// This is a Server Component - it runs on the server
export default async function PhysicalTrainerPage() {
  // Prefetch initial data on the server
  const initialData = await prefetchTrainerData();

  return (
    <PhysicalTrainerLayout>
      <Suspense fallback={<DashboardSkeleton />}>
        <PhysicalTrainerClient initialData={initialData} />
      </Suspense>
    </PhysicalTrainerLayout>
  );
}