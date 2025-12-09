'use client';

import React, { useState } from 'react';
import { DashboardHeader } from "@/components/shared/DashboardHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Activity, Calendar, Dumbbell, Library, TestTube2, User, FileText,
  AlertCircle, CheckCircle, ArrowRight
} from 'lucide-react';
import { useAuth } from "@/contexts/AuthContext";
import { LoadingSpinner } from "@/components/ui/loading";

// Simplified tab components (no complex imports)
const OverviewTab = () => (
  <div className="space-y-6">
    <Card className="bg-green-50 border-green-200">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-green-700">
          <CheckCircle className="h-5 w-5" />
          <span>Dashboard Restored Successfully!</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-green-600">
            ✅ The Physical Trainer dashboard is now working with a simplified architecture.
          </p>
          <div className="bg-white p-4 rounded border">
            <h4 className="font-semibold mb-2">Next Steps:</h4>
            <ul className="text-sm space-y-1">
              <li>• Add essential hooks progressively</li>
              <li>• Implement core workout functionality</li>
              <li>• Restore advanced features carefully</li>
              <li>• Test each addition thoroughly</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Today's Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">12</div>
            <div className="text-sm text-blue-600">Scheduled Sessions</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">8</div>
            <div className="text-sm text-green-600">Active Players</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">3</div>
            <div className="text-sm text-orange-600">Pending Tests</div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

const SessionsTab = () => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Training Sessions
          <Button size="sm">
            <Dumbbell className="h-4 w-4 mr-2" />
            Create Session
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold">Morning Strength Training</h4>
                <p className="text-sm text-muted-foreground">A-Team • 09:00 - 10:30</p>
              </div>
              <Button variant="outline" size="sm">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold">Conditioning Circuit</h4>
                <p className="text-sm text-muted-foreground">J20 Team • 14:00 - 15:00</p>
              </div>
              <Button variant="outline" size="sm">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

const CalendarTab = () => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>Training Calendar</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            Calendar integration will be restored in the next phase.
          </p>
        </div>
      </CardContent>
    </Card>
  </div>
);

const LibraryTab = () => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>Exercise Library</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <Library className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            Exercise library will be restored progressively.
          </p>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default function PhysicalTrainerDashboardV2() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Handle auth loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="xl" text="Checking authentication..." />
      </div>
    );
  }

  // Handle unauthenticated state
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
              <p className="text-muted-foreground">
                Please log in to access the Physical Trainer dashboard.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader 
        title="Physical Trainer Dashboard"
        subtitle="Simplified architecture - working version"
        role="physicaltrainer"
      />
      
      <div className="p-6 max-w-7xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="sessions" className="flex items-center gap-2">
              <Dumbbell className="h-4 w-4" />
              Sessions
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="library" className="flex items-center gap-2">
              <Library className="h-4 w-4" />
              Library
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="overview">
              <OverviewTab />
            </TabsContent>
            
            <TabsContent value="sessions">
              <SessionsTab />
            </TabsContent>
            
            <TabsContent value="calendar">
              <CalendarTab />
            </TabsContent>
            
            <TabsContent value="library">
              <LibraryTab />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}