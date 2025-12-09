'use client';

import React from 'react';
import { BroadcastManagement } from '@/features/chat/components/BroadcastManagement';

interface BroadcastsTabProps {
  selectedTeamId: string | null;
}

export function BroadcastsTab({ selectedTeamId }: BroadcastsTabProps) {
  return (
    <BroadcastManagement
      teamId={selectedTeamId || 'team-123'}
      organizationId="org-123"
      coachId="coach-123"
    />
  );
}

export default BroadcastsTab;



