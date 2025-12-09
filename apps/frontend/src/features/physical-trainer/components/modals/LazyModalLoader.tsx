'use client';

import React, { Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading';

// Lazy load modals
const CreateSessionModal = React.lazy(() => import('../CreateSessionModal'));
const MigrationDashboard = React.lazy(() => import('../migration/MigrationDashboard'));
const HelpModal = React.lazy(() => 
  import('../shared').then(module => ({ default: module.HelpModal }))
);
const SettingsModal = React.lazy(() => 
  import('../shared').then(module => ({ default: module.SettingsModal }))
);
const KeyboardShortcutsOverlay = React.lazy(() => 
  import('../shared').then(module => ({ default: module.KeyboardShortcutsOverlay }))
);

export type ModalType = 'createSession' | 'migration' | 'help' | 'settings' | 'shortcuts';

interface LazyModalLoaderProps {
  modalType: ModalType;
  isOpen: boolean;
  onClose: () => void;
  [key: string]: any; // Allow additional props specific to each modal
}

export const LazyModalLoader = React.memo(function LazyModalLoader({
  modalType,
  isOpen,
  onClose,
  ...modalProps
}: LazyModalLoaderProps) {
  if (!isOpen) return null;

  const LoadingFallback = (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 flex flex-col items-center">
        <LoadingSpinner className="mb-4" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );

  return (
    <Suspense fallback={LoadingFallback}>
      {modalType === 'createSession' && (
        <CreateSessionModal
          isOpen={isOpen}
          onClose={onClose}
          {...modalProps}
        />
      )}
      {modalType === 'migration' && (
        <MigrationDashboard
          isOpen={isOpen}
          onClose={onClose}
          {...modalProps}
        />
      )}
      {modalType === 'help' && (
        <HelpModal
          isOpen={isOpen}
          onClose={onClose}
          {...modalProps}
        />
      )}
      {modalType === 'settings' && (
        <SettingsModal
          isOpen={isOpen}
          onClose={onClose}
          {...modalProps}
        />
      )}
      {modalType === 'shortcuts' && (
        <KeyboardShortcutsOverlay
          isOpen={isOpen}
          onClose={onClose}
          {...modalProps}
        />
      )}
    </Suspense>
  );
});