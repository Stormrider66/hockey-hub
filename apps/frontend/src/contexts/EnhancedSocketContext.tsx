'use client';

import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { enhancedSocketService } from '@/services/EnhancedSocketService';
import { useAuth } from '@/hooks/useAuth';
import { selectIsConnected, selectConnectionQuality } from '@/store/slices/socketSlice';
import { RootState } from '@/store/store';

interface EnhancedSocketContextType {
  socket: typeof enhancedSocketService;
  isConnected: boolean;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'offline';
}

const EnhancedSocketContext = createContext<EnhancedSocketContextType | null>(null);

export function EnhancedSocketProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth();
  const isConnected = useSelector(selectIsConnected);
  const connectionQuality = useSelector(selectConnectionQuality);
  const hasConnected = useRef(false);

  useEffect(() => {
    if (user && token && !hasConnected.current) {
      hasConnected.current = true;
      enhancedSocketService.connect(token);
    }

    return () => {
      if (hasConnected.current) {
        hasConnected.current = false;
        enhancedSocketService.disconnect();
      }
    };
  }, [user, token]);

  const value: EnhancedSocketContextType = {
    socket: enhancedSocketService,
    isConnected,
    connectionQuality
  };

  return (
    <EnhancedSocketContext.Provider value={value}>
      {children}
    </EnhancedSocketContext.Provider>
  );
}

export function useEnhancedSocket() {
  const context = useContext(EnhancedSocketContext);
  if (!context) {
    throw new Error('useEnhancedSocket must be used within EnhancedSocketProvider');
  }
  return context;
}