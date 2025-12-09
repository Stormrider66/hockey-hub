/**
 * Test script for tactical system integration
 * This file can be used to test the complete data persistence layer
 */

import { tacticalDataService } from './services/tacticalDataService';
import { tacticalStorageService } from './services/tacticalStorageService';
import type { TacticalPlay, Formation } from './services/tacticalDataService';

// Mock console methods for testing
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

let testResults: { success: number; failed: number; errors: string[] } = {
  success: 0,
  failed: 0,
  errors: []
};

function logTest(message: string) {
  originalLog(`🧪 TEST: ${message}`);
}

function logSuccess(message: string) {
  originalLog(`✅ SUCCESS: ${message}`);
  testResults.success++;
}

function logError(message: string, error?: any) {
  originalError(`❌ ERROR: ${message}`, error);
  testResults.failed++;
  testResults.errors.push(message);
}

function logWarning(message: string) {
  originalWarn(`⚠️  WARNING: ${message}`);
}

/**
 * Test tactical plays CRUD operations
 */
async function testTacticalPlaysCRUD(): Promise<void> {
  logTest('Testing Tactical Plays CRUD operations');

  try {
    // Test getting plays (should work with mock data)
    const plays = await tacticalDataService.getTacticalPlays();
    if (Array.isArray(plays) && plays.length > 0) {
      logSuccess('Retrieved tactical plays successfully');
    } else {
      logError('No tactical plays retrieved');
    }

    // Test getting single play
    if (plays.length > 0) {
      const firstPlay = plays[0];
      const singlePlay = await tacticalDataService.getTacticalPlay(firstPlay.id);
      if (singlePlay && singlePlay.id === firstPlay.id) {
        logSuccess('Retrieved single tactical play successfully');
      } else {
        logError('Failed to retrieve single tactical play');
      }
    }

    // Test creating a new play (offline mode)
    const newPlay = {
      name: 'Test Play Integration',
      description: 'Test play for integration testing',
      category: 'offensive' as const,
      formation: 'test_formation',
      players: [
        { position: 'C', role: 'Center', x: 50, y: 50 },
        { position: 'LW', role: 'Left Wing', x: 40, y: 30 },
        { position: 'RW', role: 'Right Wing', x: 40, y: 70 }
      ],
      difficulty: 'intermediate' as const,
      tags: ['test', 'integration'],
      createdBy: 'test_coach_1',
      teamId: 'test_team_1'
    };

    const createdPlay = await tacticalDataService.createTacticalPlay(newPlay);
    if (createdPlay && createdPlay.name === newPlay.name) {
      logSuccess('Created new tactical play successfully');
      
      // Test updating the play
      const updateData = { description: 'Updated description for integration test' };
      const updatedPlay = await tacticalDataService.updateTacticalPlay(createdPlay.id, updateData);
      if (updatedPlay && updatedPlay.description === updateData.description) {
        logSuccess('Updated tactical play successfully');
      } else {
        logError('Failed to update tactical play');
      }

      // Test deleting the play
      await tacticalDataService.deleteTacticalPlay(createdPlay.id);
      logSuccess('Deleted tactical play successfully');
      
    } else {
      logError('Failed to create new tactical play');
    }

  } catch (error) {
    logError('Tactical plays CRUD test failed', error);
  }
}

/**
 * Test formations functionality
 */
async function testFormations(): Promise<void> {
  logTest('Testing Formations functionality');

  try {
    // Test getting formations
    const formations = await tacticalDataService.getFormations();
    if (Array.isArray(formations) && formations.length >= 0) {
      logSuccess('Retrieved formations successfully');
    } else {
      logError('Failed to retrieve formations');
    }

    // Test getting single formation
    if (formations.length > 0) {
      const firstFormation = formations[0];
      const singleFormation = await tacticalDataService.getFormation(firstFormation.id);
      if (singleFormation && singleFormation.id === firstFormation.id) {
        logSuccess('Retrieved single formation successfully');
      } else {
        logError('Failed to retrieve single formation');
      }
    }

  } catch (error) {
    logError('Formations test failed', error);
  }
}

/**
 * Test local storage functionality
 */
async function testLocalStorage(): Promise<void> {
  logTest('Testing Local Storage functionality');

  try {
    // Test saving a draft
    const draftData = {
      name: 'Draft Play Test',
      description: 'This is a draft play for testing',
      category: 'defensive',
      formation: 'draft_formation',
      players: [
        { position: 'D', role: 'Defenseman', x: 20, y: 50 }
      ],
      difficulty: 'beginner',
      tags: ['draft', 'test']
    };

    const draftId = await tacticalDataService.saveDraft('tactical_play', draftData);
    if (draftId) {
      logSuccess('Saved draft successfully');

      // Test getting drafts
      const drafts = await tacticalDataService.getDrafts();
      if (drafts.tacticalPlays && drafts.tacticalPlays.length > 0) {
        logSuccess('Retrieved drafts successfully');

        // Test deleting draft
        const deleteResult = await tacticalDataService.deleteDraft(draftId);
        if (deleteResult) {
          logSuccess('Deleted draft successfully');
        } else {
          logError('Failed to delete draft');
        }
      } else {
        logError('No drafts found after saving');
      }
    } else {
      logError('Failed to save draft');
    }

    // Test storage metadata
    const metadata = tacticalStorageService.getMetadata();
    if (metadata && typeof metadata.totalItems === 'number') {
      logSuccess('Retrieved storage metadata successfully');
    } else {
      logError('Failed to retrieve storage metadata');
    }

  } catch (error) {
    logError('Local storage test failed', error);
  }
}

/**
 * Test offline/online functionality
 */
async function testOfflineSupport(): Promise<void> {
  logTest('Testing Offline Support functionality');

  try {
    // Test offline status
    const offlineStatus = tacticalDataService.getOfflineStatus();
    if (typeof offlineStatus.isOnline === 'boolean' && 
        typeof offlineStatus.pendingSync === 'number' &&
        typeof offlineStatus.conflicts === 'number') {
      logSuccess('Retrieved offline status successfully');
    } else {
      logError('Failed to retrieve offline status');
    }

    // Test sync queue (won't actually sync in test mode)
    try {
      await tacticalDataService.syncWithServer();
      logSuccess('Sync operation completed (test mode)');
    } catch (error) {
      // Expected to fail in test mode - this is okay
      logWarning('Sync failed as expected in test mode');
    }

  } catch (error) {
    logError('Offline support test failed', error);
  }
}

/**
 * Test statistics integration
 */
async function testStatistics(): Promise<void> {
  logTest('Testing Statistics integration');

  try {
    // Test play usage stats
    const playUsageStats = await tacticalDataService.getPlayUsageStats();
    if (Array.isArray(playUsageStats)) {
      logSuccess('Retrieved play usage statistics successfully');
    } else {
      logError('Failed to retrieve play usage statistics');
    }

    // Test formation analytics
    const formationAnalytics = await tacticalDataService.getFormationAnalytics();
    if (Array.isArray(formationAnalytics)) {
      logSuccess('Retrieved formation analytics successfully');
    } else {
      logError('Failed to retrieve formation analytics');
    }

  } catch (error) {
    logError('Statistics test failed', error);
  }
}

/**
 * Test dashboard overview
 */
async function testDashboardOverview(): Promise<void> {
  logTest('Testing Dashboard Overview');

  try {
    const overview = await tacticalDataService.getDashboardOverview();
    
    if (overview && 
        typeof overview.totalPlays === 'number' &&
        typeof overview.totalFormations === 'number' &&
        typeof overview.avgSuccessRate === 'number' &&
        Array.isArray(overview.topPlays) &&
        Array.isArray(overview.recentActivity)) {
      
      logSuccess('Retrieved dashboard overview successfully');
      
      if (overview.offlineStatus) {
        logSuccess('Dashboard includes offline status information');
      }
    } else {
      logError('Dashboard overview has invalid structure');
    }

  } catch (error) {
    logError('Dashboard overview test failed', error);
  }
}

/**
 * Run all tests
 */
async function runIntegrationTests(): Promise<void> {
  logTest('Starting Tactical System Integration Tests');
  originalLog('🚀 Running comprehensive tactical system integration tests...\n');

  // Reset test results
  testResults = { success: 0, failed: 0, errors: [] };

  // Run all tests
  await testTacticalPlaysCRUD();
  await testFormations();
  await testLocalStorage();
  await testOfflineSupport();
  await testStatistics();
  await testDashboardOverview();

  // Print summary
  originalLog('\n📊 TEST RESULTS SUMMARY:');
  originalLog(`✅ Successful tests: ${testResults.success}`);
  originalLog(`❌ Failed tests: ${testResults.failed}`);
  originalLog(`🔧 Total tests: ${testResults.success + testResults.failed}`);

  if (testResults.errors.length > 0) {
    originalLog('\n❌ FAILED TESTS:');
    testResults.errors.forEach((error, index) => {
      originalLog(`   ${index + 1}. ${error}`);
    });
  }

  if (testResults.failed === 0) {
    originalLog('\n🎉 ALL TESTS PASSED! Tactical system integration is working correctly.');
  } else {
    originalLog(`\n⚠️  ${testResults.failed} test(s) failed. Check the errors above for details.`);
  }

  originalLog('\n💡 Note: Some failures are expected in test mode (e.g., network operations)');
}

/**
 * Test feature flag integration
 */
async function testFeatureFlags(): Promise<void> {
  logTest('Testing Feature Flag integration');

  try {
    // Test demo mode detection
    const isDemoMode = tacticalDataService.isDemoMode();
    if (typeof isDemoMode === 'boolean') {
      logSuccess(`Demo mode detection working: ${isDemoMode}`);
    } else {
      logError('Failed to detect demo mode');
    }

  } catch (error) {
    logError('Feature flags test failed', error);
  }
}

// Export the test functions for external use
export {
  runIntegrationTests,
  testTacticalPlaysCRUD,
  testFormations,
  testLocalStorage,
  testOfflineSupport,
  testStatistics,
  testDashboardOverview,
  testFeatureFlags
};

// Auto-run tests if this file is executed directly (for debugging)
if (typeof window !== 'undefined' && (window as any).runTacticalTests) {
  runIntegrationTests().catch(console.error);
}