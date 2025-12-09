'use client';

import React from 'react';
import { BulkSessionWrapper } from './index';
import type { IntervalProgram } from '../../types';

/**
 * BulkSessionExample - Demonstrates how to use BulkSessionWrapper
 * 
 * This component shows how to integrate the BulkSessionWrapper into
 * existing code paths without modifying the underlying components.
 */
export default function BulkSessionExample() {
  // Example handlers that would normally be in your parent component
  const handleSave = (program: IntervalProgram, playerIds?: string[], teamIds?: string[]) => {
    console.log('Save called with:', { program, playerIds, teamIds });
    // In real implementation, this would save to your backend
  };

  const handleCancel = () => {
    console.log('Cancel called');
    // In real implementation, this would navigate away or close modal
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Bulk Session Wrapper Example
        </h1>
        <p className="text-gray-600">
          This demonstrates how the BulkSessionWrapper safely wraps existing components.
          Set NEXT_PUBLIC_ENABLE_BULK_SESSIONS=true to see bulk features.
        </p>
      </div>

      <BulkSessionWrapper
        onSave={handleSave}
        onCancel={handleCancel}
        isLoading={false}
      />
    </div>
  );
}