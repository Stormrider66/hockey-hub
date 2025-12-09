'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from "@/components/ui/badge";
import { Separator } from '@/components/ui/separator';
import { Copy, Users, Calendar, Settings, ChevronDown, ChevronUp } from '@/components/icons';

// Import the existing component without modification
import ConditioningWorkoutBuilderSimple from '../ConditioningWorkoutBuilderSimple';

import type { 
  BulkSessionWrapperProps, 
  BulkSessionConfig, 
  BulkSessionOptions, 
  SessionMode 
} from './bulk-sessions.types';

/**
 * BulkSessionWrapper - Safely wraps ConditioningWorkoutBuilderSimple
 * 
 * This component provides a bulk session creation interface while preserving
 * all existing functionality of the wrapped component in single mode.
 * 
 * Features:
 * - Feature flag controlled (NEXT_PUBLIC_ENABLE_BULK_SESSIONS)
 * - Seamless mode switching (single/bulk)
 * - Pass-through props in single mode
 * - No modifications to existing component
 */
export default function BulkSessionWrapper(props: BulkSessionWrapperProps) {
  const { t } = useTranslation('physicalTrainer');
  
  // Feature flag check
  const bulkSessionsEnabled = useMemo(() => {
    if (typeof window !== 'undefined') {
      return process.env.NEXT_PUBLIC_ENABLE_BULK_SESSIONS === 'true';
    }
    return false;
  }, []);

  // State management
  const [currentMode, setCurrentMode] = useState<SessionMode>('single');
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [bulkOptions, setBulkOptions] = useState<BulkSessionOptions>({
    sessionCount: 3,
    copyForTeams: [],
    namePattern: 'Conditioning Session #{count}',
    customizations: {
      allowIndividualEdits: true,
      preservePlayerAssignments: true,
      adjustIntensityBySession: false
    }
  });

  // Configuration
  const bulkConfig: BulkSessionConfig = useMemo(() => ({
    enabled: bulkSessionsEnabled,
    maxSessions: 10,
    allowTeamCopies: true,
    allowDateRange: true
  }), [bulkSessionsEnabled]);

  // Enhanced save handler for bulk mode
  const handleBulkSave = useCallback((program: any, playerIds?: string[], teamIds?: string[]) => {
    if (currentMode === 'single') {
      // Pass through to original handler in single mode
      props.onSave(program, playerIds, teamIds);
      return;
    }

    // Bulk mode: Create multiple sessions
    console.log('Bulk save requested:', {
      mode: currentMode,
      options: bulkOptions,
      program,
      playerIds,
      teamIds
    });

    // For now, delegate to original handler
    // TODO: Implement actual bulk creation logic
    props.onSave(program, playerIds, teamIds);
  }, [currentMode, bulkOptions, props]);

  // Mode toggle handler
  const handleModeToggle = useCallback((mode: SessionMode) => {
    setCurrentMode(mode);
    setShowModeSelector(false);
  }, []);

  // Render mode selector (only when feature flag is enabled)
  const renderModeSelector = () => {
    if (!bulkConfig.enabled) return null;

    return (
      <Card className="mb-4 border-blue-200 bg-blue-50/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-blue-600" />
              <CardTitle className="text-sm font-medium text-blue-900">
                {t('bulkSessions.sessionMode', 'Session Creation Mode')}
              </CardTitle>
              <Badge variant={currentMode === 'single' ? 'default' : 'secondary'} className="text-xs">
                {currentMode === 'single' ? t('bulkSessions.singleMode', 'Single') : t('bulkSessions.bulkMode', 'Bulk')}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowModeSelector(!showModeSelector)}
              className="h-8 px-2 text-blue-700 hover:text-blue-900 hover:bg-blue-100"
            >
              {showModeSelector ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        
        {showModeSelector && (
          <CardContent className="pt-0">
            <div className="flex gap-2">
              <Button
                variant={currentMode === 'single' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleModeToggle('single')}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                {t('bulkSessions.singleSession', 'Single Session')}
              </Button>
              
              <Button
                variant={currentMode === 'bulk' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleModeToggle('bulk')}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                {t('bulkSessions.bulkSessions', 'Multiple Sessions')}
              </Button>
            </div>
            
            {currentMode === 'bulk' && (
              <>
                <Separator className="my-3" />
                <div className="text-sm text-gray-600">
                  <p className="mb-2 font-medium">{t('bulkSessions.bulkModeDescription', 'Bulk Mode Features:')}</p>
                  <ul className="space-y-1 text-xs">
                    <li>• {t('bulkSessions.feature1', 'Create multiple sessions at once')}</li>
                    <li>• {t('bulkSessions.feature2', 'Copy for different teams')}</li>
                    <li>• {t('bulkSessions.feature3', 'Schedule across date ranges')}</li>
                    <li>• {t('bulkSessions.feature4', 'Customize each session individually')}</li>
                  </ul>
                </div>
              </>
            )}
          </CardContent>
        )}
      </Card>
    );
  };

  // Render bulk options panel (placeholder for future implementation)
  const renderBulkOptions = () => {
    if (currentMode !== 'bulk') return null;

    return (
      <Card className="mb-4 border-purple-200 bg-purple-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-purple-900 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {t('bulkSessions.bulkOptions', 'Bulk Creation Options')}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-sm text-purple-700 bg-purple-100 p-3 rounded-md">
            <p className="font-medium mb-1">{t('bulkSessions.comingSoon', 'Coming Soon!')}</p>
            <p className="text-xs">
              {t('bulkSessions.implementationNote', 'Bulk session creation options will be implemented in the next phase.')}
            </p>
            <div className="mt-2 text-xs text-purple-600">
              <p>{t('bulkSessions.currentSelection', 'Current selection:')} {bulkOptions.sessionCount} sessions</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* Mode selector - only shown when feature flag is enabled */}
      {renderModeSelector()}
      
      {/* Bulk options - only shown in bulk mode */}
      {renderBulkOptions()}
      
      {/* Original component - always rendered with pass-through props */}
      <ConditioningWorkoutBuilderSimple
        {...props}
        onSave={handleBulkSave}
      />
    </div>
  );
}