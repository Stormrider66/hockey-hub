'use client';

import React, { useEffect } from 'react';
import { isMockMode } from '@/utils/mockAuth';
import toast from 'react-hot-toast';

interface MockAuthProviderProps {
  children: React.ReactNode;
}

export const MockAuthProvider: React.FC<MockAuthProviderProps> = ({ children }) => {
  useEffect(() => {
    if (isMockMode()) {
      // Show a notification that mock mode is active
      const toastId = toast(
        (t) => (
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <p className="font-semibold text-sm">Mock Auth Mode Active</p>
              <p className="text-xs text-gray-600">Using simulated authentication</p>
            </div>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        ),
        {
          duration: 5000,
          position: 'top-right',
          style: {
            background: '#fef3c7',
            border: '1px solid #fbbf24',
            color: '#92400e',
          },
        }
      );

      // Log to console for developers
      console.log(
        '%c🔐 Mock Authentication Mode Active',
        'background: #fbbf24; color: #000; padding: 4px 8px; border-radius: 4px; font-weight: bold;'
      );
      console.log(
        '%cAuthentication is simulated. No real backend calls will be made.',
        'color: #92400e; font-style: italic;'
      );
      console.log(
        '%cTo disable mock mode, set NEXT_PUBLIC_ENABLE_MOCK_AUTH=false in .env.local',
        'color: #666; font-size: 11px;'
      );
    }
  }, []);

  return <>{children}</>;
};