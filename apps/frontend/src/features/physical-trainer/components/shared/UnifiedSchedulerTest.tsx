'use client';

import React, { useState } from 'react';
import { UnifiedScheduler, UnifiedSchedule } from './UnifiedScheduler';

export function UnifiedSchedulerTest() {
  const [schedule, setSchedule] = useState<UnifiedSchedule>({
    startDate: new Date(),
    startTime: '09:00',
    location: 'Main Gym',
    participants: {
      playerIds: [],
      teamIds: []
    }
  });

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">UnifiedScheduler Test</h2>
      <UnifiedScheduler
        schedule={schedule}
        onScheduleUpdate={setSchedule}
        duration={60}
        title="Test Scheduler"
        description="This is a test of the UnifiedScheduler component"
      />
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <h3 className="font-bold">Current Schedule:</h3>
        <pre>{JSON.stringify(schedule, null, 2)}</pre>
      </div>
    </div>
  );
}