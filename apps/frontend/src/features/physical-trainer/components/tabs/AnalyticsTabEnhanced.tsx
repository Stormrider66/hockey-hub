import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Brain, BarChart3, TrendingUp, Activity } from 'lucide-react';
import { PredictiveAnalyticsTab } from './PredictiveAnalyticsTab';
import { WorkoutAnalyticsDashboard } from '../analytics/WorkoutAnalyticsDashboard';

interface AnalyticsTabEnhancedProps {
  selectedTeamId?: string;
  organizationId: string;
  className?: string;
}

export function AnalyticsTabEnhanced({ 
  selectedTeamId, 
  organizationId,
  className = '' 
}: AnalyticsTabEnhancedProps) {
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState('workout-analytics');

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            Phase 6 Complete
          </Badge>
        </div>
      </div>

      {/* Analytics Type Tabs */}
      <Tabs value={activeAnalyticsTab} onValueChange={setActiveAnalyticsTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="workout-analytics" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Workout Analytics
            <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800 text-xs">
              New
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="predictive-analytics" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Predictive Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workout-analytics" className="mt-6">
          <WorkoutAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="predictive-analytics" className="mt-6">
          <PredictiveAnalyticsTab
            selectedTeamId={selectedTeamId}
            organizationId={organizationId}
          />
        </TabsContent>
      </Tabs>

      {/* Footer Information */}
      <div className="text-xs text-muted-foreground bg-gray-50 p-4 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold mb-2">Workout Analytics Features:</h4>
            <ul className="space-y-1">
              <li>• Real-time session summaries with completion rates</li>
              <li>• Individual player progress tracking with milestones</li>
              <li>• Team performance reports with rankings</li>
              <li>• Heart rate zone analysis and intensity metrics</li>
              <li>• Comprehensive trend analysis and recommendations</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Predictive Analytics Features:</h4>
            <ul className="space-y-1">
              <li>• AI-powered injury risk assessment</li>
              <li>• Fatigue monitoring and recovery recommendations</li>
              <li>• Load management optimization with ML models</li>
              <li>• Performance plateau detection</li>
              <li>• Personalized training recommendations</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}