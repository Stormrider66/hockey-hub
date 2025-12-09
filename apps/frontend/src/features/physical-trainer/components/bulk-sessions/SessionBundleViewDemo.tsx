'use client';

import React from 'react';
import { SessionBundleView } from './SessionBundleView';
import type { BulkActionType } from './bulk-sessions.types';

/**
 * Demo component showcasing the SessionBundleView
 * 
 * This demonstrates how to use the SessionBundleView component
 * for monitoring and managing multiple parallel sessions.
 * 
 * Usage:
 * - View multiple sessions in a responsive grid (2x2 to 4x2)
 * - Real-time progress updates every 5 seconds
 * - Bulk actions: pause all, resume all, broadcast messages
 * - Filter and sort sessions by various criteria
 * - Click sessions to view detailed live monitoring
 */
export const SessionBundleViewDemo: React.FC = () => {
  const handleSessionClick = (sessionId: string) => {
    console.log('Session clicked:', sessionId);
    // In real implementation, navigate to live session monitoring
    // e.g., router.push(`/physicaltrainer/live-session/${sessionId}`);
  };

  const handleBulkAction = (action: BulkActionType, sessionIds: string[]) => {
    console.log('Bulk action:', action, 'for sessions:', sessionIds);
    
    // In real implementation, call API endpoints
    switch (action) {
      case 'pause_all':
        console.log('Pausing all sessions:', sessionIds);
        break;
      case 'resume_all':
        console.log('Resuming all sessions:', sessionIds);
        break;
      case 'broadcast_message':
        console.log('Broadcasting message to sessions:', sessionIds);
        break;
      case 'export_data':
        console.log('Exporting data for sessions:', sessionIds);
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <SessionBundleView
        bundleId="demo-bundle-001"
        onSessionClick={handleSessionClick}
        onBulkAction={handleBulkAction}
        className="max-w-7xl mx-auto"
      />
    </div>
  );
};

export default SessionBundleViewDemo;