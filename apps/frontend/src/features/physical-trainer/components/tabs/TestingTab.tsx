'use client';

import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { TestTube2 } from 'lucide-react';
import PhysicalAnalysisCharts from '../PhysicalAnalysisCharts';
import PhysicalTestingForm from '../PhysicalTestingForm';
import type { Player, TestFormData } from '../../types';

interface TestingTabProps {
  players: Player[];
  onSubmitTest: (data: TestFormData) => void;
  onSaveDraft: (data: TestFormData) => void;
}

export default function TestingTab({ players, onSubmitTest, onSaveDraft }: TestingTabProps) {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="collection" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="collection">Test Collection</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="form">New Test</TabsTrigger>
        </TabsList>
        
        <TabsContent value="collection" className="mt-6">
          {/* TestCollectionDashboard would go here */}
          <Card>
            <CardHeader>
              <CardTitle>Test Collection Dashboard</CardTitle>
              <CardDescription>Recent test sessions and results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96 border rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <TestTube2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Test collection interface</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analysis" className="mt-6">
          <PhysicalAnalysisCharts />
        </TabsContent>
        
        <TabsContent value="form" className="mt-6">
          <PhysicalTestingForm 
            players={players}
            onSubmit={onSubmitTest}
            onSaveDraft={onSaveDraft}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}