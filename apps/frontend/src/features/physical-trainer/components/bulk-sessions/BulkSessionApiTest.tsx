import React from 'react';
import { 
  useCreateSessionBundleMutation,
  useGetSessionBundlesQuery,
  useGetBundleStatusQuery,
  useBulkControlSessionsMutation,
  useCheckEquipmentConflictsMutation,
  type CreateSessionBundleRequest 
} from '@/store/api/bulkSessionApi';

/**
 * Test component to verify bulk session API integration
 * This component demonstrates all the API endpoints working correctly
 */
export const BulkSessionApiTest: React.FC = () => {
  const [createBundle] = useCreateSessionBundleMutation();
  const [bulkControl] = useBulkControlSessionsMutation();
  const [checkConflicts] = useCheckEquipmentConflictsMutation();
  
  const { data: bundles, isLoading: bundlesLoading } = useGetSessionBundlesQuery({
    limit: 5
  });
  
  const { data: bundleStatus, isLoading: statusLoading } = useGetBundleStatusQuery(
    'bundle-sample-1',
    {
      pollingInterval: 5000, // Poll every 5 seconds
    }
  );

  const handleCreateTestBundle = async () => {
    try {
      const request: CreateSessionBundleRequest = {
        name: 'Test Bundle - API Integration',
        sessions: [
          {
            name: 'Morning Cardio',
            workoutType: 'conditioning',
            workoutId: 'workout-1',
            estimatedDuration: 2700, // 45 minutes
            location: 'Gym A',
            equipmentIds: ['treadmill-1', 'treadmill-2'],
            playerIds: ['player-1', 'player-2', 'player-3'],
            teamIds: ['team-1']
          },
          {
            name: 'Strength Training',
            workoutType: 'strength',
            workoutId: 'workout-2',
            estimatedDuration: 3600, // 60 minutes
            location: 'Gym B',
            equipmentIds: ['weights-1'],
            playerIds: ['player-4', 'player-5', 'player-6'],
            teamIds: ['team-1']
          }
        ],
        globalSettings: {
          maxParticipants: 20,
          allowJoinAfterStart: true,
          requireConfirmation: false,
          autoStartNext: true
        },
        equipmentReservations: [
          {
            equipmentId: 'treadmill-1',
            equipmentName: 'Treadmill #1',
            startTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
            endTime: new Date(Date.now() + 7200000).toISOString(), // 2 hours from now
            sessionIds: ['session-1'],
            status: 'reserved'
          }
        ]
      };

      const result = await createBundle(request).unwrap();
      console.log('Bundle created:', result);
      alert(`Bundle created successfully: ${result.id}`);
    } catch (error) {
      console.error('Failed to create bundle:', error);
      alert('Failed to create bundle. Check console for details.');
    }
  };

  const handleBulkPause = async () => {
    if (!bundleStatus) return;
    
    try {
      const result = await bulkControl({
        bundleId: bundleStatus.bundleId,
        request: {
          action: 'pause_all',
          sessionIds: bundleStatus.sessions.map(s => s.id),
          parameters: {
            message: 'Pausing all sessions for equipment maintenance'
          }
        }
      }).unwrap();
      
      console.log('Bulk pause result:', result);
      alert(`Paused ${result.affectedSessions.length} sessions`);
    } catch (error) {
      console.error('Failed to pause sessions:', error);
    }
  };

  const handleCheckConflicts = async () => {
    try {
      const result = await checkConflicts([
        {
          equipmentId: 'treadmill-1',
          timeSlots: [
            {
              startTime: new Date(Date.now() + 3600000).toISOString(),
              endTime: new Date(Date.now() + 7200000).toISOString(),
              sessionId: 'session-test-1'
            },
            {
              startTime: new Date(Date.now() + 5400000).toISOString(),
              endTime: new Date(Date.now() + 9000000).toISOString(),
              sessionId: 'session-test-2'
            }
          ]
        }
      ]).unwrap();
      
      console.log('Conflict check result:', result);
      alert(`Found ${result.totalConflicts} equipment conflicts`);
    } catch (error) {
      console.error('Failed to check conflicts:', error);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">Bulk Session API Integration Test</h2>
        <p className="text-gray-600 mb-6">
          This component tests all bulk session API endpoints and demonstrates real-time polling.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button
            onClick={handleCreateTestBundle}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            Create Test Bundle
          </button>
          
          <button
            onClick={handleBulkPause}
            disabled={!bundleStatus}
            className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-md transition-colors"
          >
            Bulk Pause Sessions
          </button>
          
          <button
            onClick={handleCheckConflicts}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            Check Equipment Conflicts
          </button>
        </div>
      </div>

      {/* Bundle List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">Session Bundles</h3>
        {bundlesLoading ? (
          <div className="animate-pulse">Loading bundles...</div>
        ) : bundles?.bundles ? (
          <div className="space-y-3">
            {bundles.bundles.map((bundle) => (
              <div key={bundle.id} className="border rounded-md p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">{bundle.name}</h4>
                    <p className="text-sm text-gray-600">
                      {bundle.sessions.length} sessions • {bundle.totalParticipants} participants
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    bundle.status === 'active' ? 'bg-green-100 text-green-800' :
                    bundle.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                    bundle.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {bundle.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No bundles found</p>
        )}
      </div>

      {/* Real-time Bundle Status */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">
          Real-time Status 
          <span className="text-sm text-gray-500 ml-2">(polls every 5s)</span>
        </h3>
        {statusLoading ? (
          <div className="animate-pulse">Loading status...</div>
        ) : bundleStatus ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-3 rounded-md">
                <div className="text-sm text-blue-600">Total Sessions</div>
                <div className="text-2xl font-bold text-blue-900">
                  {bundleStatus.metrics.totalSessions}
                </div>
              </div>
              <div className="bg-green-50 p-3 rounded-md">
                <div className="text-sm text-green-600">Active Sessions</div>
                <div className="text-2xl font-bold text-green-900">
                  {bundleStatus.metrics.activeSessions}
                </div>
              </div>
              <div className="bg-purple-50 p-3 rounded-md">
                <div className="text-sm text-purple-600">Active Participants</div>
                <div className="text-2xl font-bold text-purple-900">
                  {bundleStatus.metrics.activeParticipants}
                </div>
              </div>
              <div className="bg-orange-50 p-3 rounded-md">
                <div className="text-sm text-orange-600">Avg Progress</div>
                <div className="text-2xl font-bold text-orange-900">
                  {Math.round(bundleStatus.metrics.averageProgress)}%
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Sessions Status:</h4>
              {bundleStatus.sessions.map((session) => (
                <div key={session.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-md">
                  <div>
                    <span className="font-medium">Session {session.id.split('-').pop()}</span>
                    <span className="text-sm text-gray-600 ml-2">
                      {session.currentPhase} • {session.activeParticipants}/{session.participantCount} active
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${session.progress}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{session.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="text-xs text-gray-500">
              Last updated: {new Date(bundleStatus.lastUpdated).toLocaleTimeString()}
            </div>
          </div>
        ) : (
          <p className="text-gray-500">No bundle status available</p>
        )}
      </div>
    </div>
  );
};

export default BulkSessionApiTest;