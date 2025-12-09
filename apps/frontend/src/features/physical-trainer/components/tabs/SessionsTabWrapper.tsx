'use client';

import React from 'react';
import { useFeatureFlag } from '../../utils/featureFlags';
import SessionsTab from './SessionsTab';
import SessionsTabOptimized from './SessionsTabOptimized';

interface SessionsTabWrapperProps {
  selectedTeamId: string | null;
  onCreateSession: () => void;
  onNavigateToCalendar: () => void;
}

/**
 * Wrapper component that switches between original and optimized SessionsTab
 * based on the LAZY_LOAD_MODALS feature flag
 */
export default function SessionsTabWrapper(props: SessionsTabWrapperProps) {
  const isLazyLoadModals = useFeatureFlag('LAZY_LOAD_MODALS');

  if (isLazyLoadModals) {
    return <SessionsTabOptimized {...props} />;
  }

  return <SessionsTab {...props} />;
}