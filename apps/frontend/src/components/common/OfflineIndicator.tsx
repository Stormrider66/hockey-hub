"use client";

import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOffline } from '@/hooks/useOffline';

export function OfflineIndicator() {
  const { isOnline } = useOffline();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 animate-in slide-in-from-bottom-2">
      <div className="bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
        <WifiOff className="h-5 w-5" />
        <div>
          <p className="font-medium text-sm">You're offline</p>
          <p className="text-xs text-gray-300">Some features may be unavailable</p>
        </div>
      </div>
    </div>
  );
}