'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/loading';

// Use fixed dashboard with simplified architecture
const PhysicalTrainerDashboard = dynamic(
  () => import('@/features/physical-trainer/components/PhysicalTrainerDashboard'),
  {
    loading: () => (
      <div className="animate-pulse space-y-4">
        <div className="h-12 bg-muted rounded-lg w-full" />
        <div className="h-64 bg-muted rounded-lg w-full" />
      </div>
    ),
    ssr: false // This component needs client-side features
  }
);

interface PhysicalTrainerClientProps {
  initialData: {
    players: any[];
    sessions: any[];
    calendarEvents: any[];
    teams: any[];
    stats?: any;
    user: any;
  };
}

export function PhysicalTrainerClient({ initialData }: PhysicalTrainerClientProps) {
  const { user, isAuthenticated, loading: authLoading, login } = useAuth();
  const [isHydrated, setIsHydrated] = useState(false);

  // Progressive enhancement - show basic UI immediately
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Auto-login for mock mode development
  useEffect(() => {
    const isMockMode = process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH === 'true';
    if (isMockMode && !authLoading && !isAuthenticated && !user) {
      console.log('🔄 Mock mode detected - auto-logging in as Physical Trainer');
      login('trainer@hockeyhub.com', 'mock123', false).catch(err => {
        console.error('❌ Mock auto-login failed:', err);
      });
    }
  }, [isAuthenticated, authLoading, user, login]);

  // Store initial data in a way that the dashboard can access
  useEffect(() => {
    if (typeof window !== 'undefined' && initialData) {
      // Store in window for initial hydration with performance optimization
      (window as any).__PHYSICAL_TRAINER_INITIAL_DATA__ = initialData;
      
      // Cleanup after dashboard loads
      const cleanup = setTimeout(() => {
        delete (window as any).__PHYSICAL_TRAINER_INITIAL_DATA__;
      }, 5000);
      
      return () => clearTimeout(cleanup);
    }
    return undefined;
  }, [initialData]);

  // Show nothing until hydrated to prevent hydration mismatch
  if (!isHydrated) {
    return null;
  }

  if (authLoading) {
    return (
      <div className="py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-[40vh]">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Authentication Required</h2>
          <p className="text-muted-foreground">Please log in to access the Physical Trainer dashboard.</p>
        </div>
      </div>
    );
  }

  return <PhysicalTrainerDashboard />;
}