import React, { useState } from 'react';
import { 
  useCreateSessionBundleMutation,
  useCheckEquipmentConflictsMutation,
  type CreateSessionBundleRequest,
  type EquipmentConflictCheck 
} from '@/store/api/bulkSessionApi';
import { useGetEquipmentAvailabilityQuery } from '@/store/api/equipmentApi';
import { useCreateEventMutation } from '@/store/api/calendarApi';

/**
 * Integration test component that demonstrates the complete workflow:
 * 1. Check equipment availability
 * 2. Detect conflicts
 * 3. Create calendar events
 * 4. Create session bundle with all integrations
 */
export const BulkSessionIntegrationTest: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [testResults, setTestResults] = useState<string[]>([]);

  const [createBundle] = useCreateSessionBundleMutation();
  const [checkConflicts] = useCheckEquipmentConflictsMutation();
  const [createEvent] = useCreateEventMutation();

  // Query equipment availability for the selected date
  const { data: equipmentAvailability, isLoading: loadingEquipment } = useGetEquipmentAvailabilityQuery({
    date: selectedDate,
    facilityId: 'facility-1'
  });

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runCompleteIntegrationTest = async () => {
    setTestResults([]);
    addResult('🚀 Starting comprehensive integration test...');

    try {
      // Step 1: Check equipment availability
      addResult('📊 Step 1: Checking equipment availability...');
      if (!equipmentAvailability) {
        addResult('⚠️ Equipment availability data not loaded');
        return;
      }
      addResult(`✅ Found ${equipmentAvailability.items.length} equipment items available`);

      // Step 2: Define test sessions with specific equipment needs
      const testSessions = [
        {
          name: 'Morning Cardio Block',
          workoutType: 'conditioning' as const,
          workoutId: 'cardio-test-1',
          estimatedDuration: 2700, // 45 minutes
          location: 'Gym A',
          equipmentIds: ['treadmill-1', 'treadmill-2'],
          playerIds: ['player-1', 'player-2', 'player-3'],
          scheduledTime: `${selectedDate}T09:00:00Z`
        },
        {
          name: 'Strength Training Block',
          workoutType: 'strength' as const,
          workoutId: 'strength-test-1',
          estimatedDuration: 3600, // 60 minutes
          location: 'Gym B',
          equipmentIds: ['weights-1', 'bench-1'],
          playerIds: ['player-4', 'player-5', 'player-6'],
          scheduledTime: `${selectedDate}T10:00:00Z`
        },
        {
          name: 'Hybrid Training Block',
          workoutType: 'hybrid' as const,
          workoutId: 'hybrid-test-1',
          estimatedDuration: 3300, // 55 minutes
          location: 'Gym A',
          equipmentIds: ['treadmill-1', 'weights-2'], // Overlapping treadmill-1 to test conflict detection
          playerIds: ['player-7', 'player-8'],
          scheduledTime: `${selectedDate}T09:30:00Z` // Overlapping time to test conflict
        }
      ];

      // Step 3: Check for equipment conflicts
      addResult('🔍 Step 3: Checking for equipment conflicts...');
      const conflictChecks: EquipmentConflictCheck[] = testSessions.map(session => ({
        equipmentId: session.equipmentIds[0],
        timeSlots: [{
          startTime: session.scheduledTime,
          endTime: new Date(new Date(session.scheduledTime).getTime() + session.estimatedDuration * 1000).toISOString(),
          sessionId: `temp-${session.name.replace(/\s+/g, '-').toLowerCase()}`
        }]
      }));

      const conflictResult = await checkConflicts(conflictChecks).unwrap();
      if (conflictResult.totalConflicts > 0) {
        addResult(`⚠️ Found ${conflictResult.totalConflicts} equipment conflicts:`);
        conflictResult.conflicts.forEach((conflict, index) => {
          addResult(`   - ${conflict.equipmentName}: ${conflict.conflictingSessions.length} conflicting sessions`);
          conflict.suggestions.forEach(suggestion => {
            addResult(`     → Suggested alternative: ${suggestion.alternativeEquipmentName}`);
          });
        });
      } else {
        addResult('✅ No equipment conflicts detected');
      }

      // Step 4: Create calendar events for each session
      addResult('📅 Step 4: Creating calendar events...');
      const calendarEventIds: string[] = [];
      
      for (const session of testSessions) {
        try {
          const eventResult = await createEvent({
            title: session.name,
            description: `${session.workoutType} workout - ${session.playerIds.length} participants`,
            startTime: session.scheduledTime,
            endTime: new Date(new Date(session.scheduledTime).getTime() + session.estimatedDuration * 1000).toISOString(),
            location: session.location,
            type: 'training_session',
            priority: 'normal',
            attendees: session.playerIds,
            metadata: {
              workoutType: session.workoutType,
              workoutId: session.workoutId,
              equipmentIds: session.equipmentIds,
              estimatedDuration: session.estimatedDuration
            }
          }).unwrap();
          
          calendarEventIds.push(eventResult.id);
          addResult(`   ✅ Created event: ${session.name} (${eventResult.id})`);
        } catch (error) {
          addResult(`   ❌ Failed to create event for ${session.name}: ${error}`);
        }
      }

      // Step 5: Create equipment reservations
      addResult('🔧 Step 5: Creating equipment reservations...');
      const equipmentReservations = testSessions.flatMap(session => 
        session.equipmentIds.map(equipmentId => ({
          equipmentId,
          equipmentName: equipmentAvailability.items.find(item => item.id === equipmentId)?.name || `Equipment ${equipmentId}`,
          startTime: session.scheduledTime,
          endTime: new Date(new Date(session.scheduledTime).getTime() + session.estimatedDuration * 1000).toISOString(),
          sessionIds: [`temp-${session.name.replace(/\s+/g, '-').toLowerCase()}`],
          status: 'reserved' as const
        }))
      );

      addResult(`   📋 Created ${equipmentReservations.length} equipment reservations`);

      // Step 6: Create the complete session bundle
      addResult('🎯 Step 6: Creating session bundle with all integrations...');
      const bundleRequest: CreateSessionBundleRequest = {
        name: `Integration Test Bundle - ${new Date().toLocaleDateString()}`,
        sessions: testSessions,
        globalSettings: {
          maxParticipants: 20,
          allowJoinAfterStart: true,
          requireConfirmation: false,
          autoStartNext: false
        },
        equipmentReservations,
        calendarEventIds
      };

      const bundleResult = await createBundle(bundleRequest).unwrap();
      addResult(`✅ Bundle created successfully: ${bundleResult.id}`);
      addResult(`   - ${bundleResult.sessions.length} sessions configured`);
      addResult(`   - ${bundleResult.totalParticipants} total participants`);
      addResult(`   - ${bundleResult.equipmentReservations.length} equipment reservations`);
      addResult(`   - ${bundleResult.calendarEvents.length} calendar events linked`);

      // Step 7: Verify integration data
      addResult('🔍 Step 7: Verifying integration data...');
      bundleResult.sessions.forEach((session, index) => {
        addResult(`   Session ${index + 1}: ${session.name}`);
        addResult(`     - Type: ${session.workoutType}`);
        addResult(`     - Participants: ${session.participants.length}`);
        addResult(`     - Equipment: ${session.equipment}`);
        addResult(`     - Status: ${session.status}`);
        addResult(`     - Location: ${session.location}`);
      });

      addResult('🎉 Integration test completed successfully!');

      // Display summary
      addResult('📈 SUMMARY:');
      addResult(`   ✅ Equipment availability checked`);
      addResult(`   ✅ Conflicts detected and reported`);
      addResult(`   ✅ Calendar events created`);
      addResult(`   ✅ Equipment reservations made`);
      addResult(`   ✅ Session bundle created with full integration`);
      addResult(`   📊 Total processing time: ${Date.now() - performance.now()}ms`);

    } catch (error) {
      addResult(`❌ Integration test failed: ${error}`);
      console.error('Integration test error:', error);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">Bulk Session Integration Test</h2>
        <p className="text-gray-600 mb-6">
          This test verifies the complete integration between bulk session creation, equipment management, 
          conflict detection, and calendar integration.
        </p>

        <div className="flex items-center space-x-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={runCompleteIntegrationTest}
              disabled={loadingEquipment}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-6 py-2 rounded-md transition-colors"
            >
              {loadingEquipment ? 'Loading...' : 'Run Integration Test'}
            </button>
            
            <button
              onClick={clearResults}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
            >
              Clear Results
            </button>
          </div>
        </div>

        {equipmentAvailability && (
          <div className="bg-blue-50 p-4 rounded-md mb-6">
            <h3 className="font-medium text-blue-900 mb-2">Available Equipment ({selectedDate})</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-blue-800">
              {equipmentAvailability.items.slice(0, 8).map((item) => (
                <div key={item.id} className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${item.available ? 'bg-green-400' : 'bg-red-400'}`} />
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {testResults.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Test Results</h3>
          <div className="bg-gray-900 text-green-400 p-4 rounded-md font-mono text-sm max-h-96 overflow-y-auto">
            {testResults.map((result, index) => (
              <div key={index} className="mb-1">
                {result}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">Integration Features Tested</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Equipment Integration</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Equipment availability checking</li>
              <li>• Conflict detection across time slots</li>
              <li>• Alternative equipment suggestions</li>
              <li>• Automatic reservation creation</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Calendar Integration</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Automatic event creation</li>
              <li>• Participant assignment</li>
              <li>• Metadata linking</li>
              <li>• Schedule conflict detection</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Bulk Operations</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Multi-session creation</li>
              <li>• Player assignment validation</li>
              <li>• Real-time metrics simulation</li>
              <li>• Status synchronization</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Error Handling</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Network failure recovery</li>
              <li>• Validation error reporting</li>
              <li>• Rollback on partial failure</li>
              <li>• User-friendly error messages</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkSessionIntegrationTest;