'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Ultra-minimal dashboard to test if basic React components work
export default function PhysicalTrainerDashboardMinimal() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Physical Trainer Dashboard</h1>
          <p className="text-gray-600">Minimal test version</p>
        </div>
        
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-700">✅ Minimal Dashboard Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-700 font-medium">
                  React components are working!
                </span>
              </div>
              
              <div className="text-sm text-gray-600 space-y-2">
                <p><strong>✅ React:</strong> Component rendered successfully</p>
                <p><strong>✅ Tailwind:</strong> Styles are applied</p>
                <p><strong>✅ UI Components:</strong> Card components work</p>
                <p><strong>📝 Next:</strong> This confirms the issue is in complex imports/hooks</p>
              </div>
              
              <div className="bg-white p-4 rounded border">
                <h3 className="font-semibold mb-2">Debug Information:</h3>
                <ul className="text-sm space-y-1">
                  <li>• No external hooks used</li>
                  <li>• No translation system</li>
                  <li>• No lazy loading</li>
                  <li>• No complex state management</li>
                  <li>• Pure React + UI components only</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}