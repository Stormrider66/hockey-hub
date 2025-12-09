"use client";

import { DashboardHeader } from '@/components/shared/DashboardHeader';

export default function TestCalendarPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader 
        title="Test Calendar"
        subtitle="Testing calendar functionality"
        role="player"
      />
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Calendar Test Page</h2>
          <p>If you can see this, the routing is working!</p>
          
          <div className="mt-8 p-4 border rounded">
            <h3 className="font-semibold mb-2">Debug Info:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Page loaded successfully</li>
              <li>No translation dependencies</li>
              <li>Simple HTML only</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}