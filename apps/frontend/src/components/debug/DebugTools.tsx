'use client';

import dynamic from 'next/dynamic';

// Dynamically import the debug button to avoid SSR issues
const ClearPersistedStateButton = dynamic(
  () => import('./ClearPersistedStateButton').then(mod => mod.ClearPersistedStateButton),
  { ssr: false }
);

export const DebugTools = () => {
  const isDev = process.env.NODE_ENV === 'development';
  
  if (!isDev) return null;
  
  return (
    <>
      <div className="fixed bottom-0 left-0 p-2 bg-yellow-100 text-xs z-50">
        DEV MODE - Try: /debug/routes
      </div>
      <ClearPersistedStateButton />
    </>
  );
};