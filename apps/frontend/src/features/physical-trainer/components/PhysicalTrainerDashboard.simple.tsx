'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardHeader } from "@/components/shared/DashboardHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Activity, Calendar, Dumbbell, Library, TestTube2, User, FileText,
  Heart, Brain, Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingSpinner } from "@/components/ui/loading";

// Simple static components to avoid complex imports
const SimpleOverviewTab = () => (
  <Card>
    <CardHeader>
      <CardTitle>Physical Trainer Overview</CardTitle>
    </CardHeader>
    <CardContent>
      <p>Dashboard is loading successfully! This is a simplified version for testing.</p>
    </CardContent>
  </Card>
);

const SimpleCalendarTab = () => (
  <Card>
    <CardHeader>
      <CardTitle>Calendar</CardTitle>
    </CardHeader>
    <CardContent>
      <p>Calendar tab is working.</p>
    </CardContent>
  </Card>
);

const SimpleSessionsTab = () => (
  <Card>
    <CardHeader>
      <CardTitle>Sessions</CardTitle>
    </CardHeader>
    <CardContent>
      <p>Sessions tab is working.</p>
    </CardContent>
  </Card>
);

export default function PhysicalTrainerDashboardSimple() {
  const { t } = useTranslation(['physicalTrainer', 'common']);
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = React.useState('overview');

  // Handle auth loading state first
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="xl" text="Checking authentication..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader 
        title={t('physicalTrainer:dashboard.title')}
        subtitle={t('physicalTrainer:dashboard.subtitle')}
        role="physicaltrainer"
      />
      
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-700 font-medium">
                  ✅ Simplified Dashboard Loaded Successfully!
                </span>
              </div>
              <p className="text-green-600 text-sm mt-2">
                This confirms the basic dashboard structure works. We can now progressively add features back.
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="sessions" className="flex items-center gap-2">
              <Dumbbell className="h-4 w-4" />
              Sessions
            </TabsTrigger>
            <TabsTrigger value="library" className="flex items-center gap-2">
              <Library className="h-4 w-4" />
              Library
            </TabsTrigger>
            <TabsTrigger value="testing" className="flex items-center gap-2">
              <TestTube2 className="h-4 w-4" />
              Testing
            </TabsTrigger>
            <TabsTrigger value="status" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Status
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="overview">
              <SimpleOverviewTab />
            </TabsContent>
            
            <TabsContent value="calendar">
              <SimpleCalendarTab />
            </TabsContent>
            
            <TabsContent value="sessions">
              <SimpleSessionsTab />
            </TabsContent>
            
            <TabsContent value="library">
              <Card>
                <CardHeader>
                  <CardTitle>Exercise Library</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Exercise library tab is working.</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="testing">
              <Card>
                <CardHeader>
                  <CardTitle>Testing</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Testing tab is working.</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="status">
              <Card>
                <CardHeader>
                  <CardTitle>Player Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Player status tab is working.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}