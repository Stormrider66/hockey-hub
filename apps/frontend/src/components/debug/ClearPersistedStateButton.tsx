'use client';

import React from 'react';
import { useDispatch } from 'react-redux';
import { persistor } from '@/store/store';

export const ClearPersistedStateButton: React.FC = () => {
  const dispatch = useDispatch();

  const clearPersistedState = async () => {
    try {
      // Clear all persisted state
      await persistor.purge();
      
      // Clear localStorage
      const keysToKeep = ['i18nextLng']; // Keep language preference
      Object.keys(localStorage).forEach(key => {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      });
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Reload the page
      window.location.reload();
    } catch (error) {
      console.error('Failed to clear persisted state:', error);
    }
  };

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 9999,
      background: '#f44336',
      color: 'white',
      padding: '10px 20px',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 'bold',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      opacity: 0.9
    }}
    onClick={clearPersistedState}
    title="Clear all persisted state and reload"
    >
      🗑️ Clear State
    </div>
  );
};