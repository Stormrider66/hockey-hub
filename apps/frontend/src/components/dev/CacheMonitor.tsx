import React, { useState } from 'react';
import { useHttpCache } from '@/store/api/hooks/useHttpCache';

export function CacheMonitor() {
  const [isOpen, setIsOpen] = useState(false);
  const { stats, clearCache, clearStale, refreshStats, isCacheEnabled } = useHttpCache();

  // Only show in development
  if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_SHOW_CACHE_MONITOR) {
    return null;
  }

  if (!isCacheEnabled) {
    return null;
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        title="HTTP Cache Monitor"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
          />
        </svg>
      </button>

      {/* Monitor panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 w-80">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              HTTP Cache Monitor
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="space-y-3">
            {/* Cache stats */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-100 dark:bg-gray-700 rounded p-2">
                <div className="text-gray-600 dark:text-gray-400">Total Entries</div>
                <div className="text-xl font-semibold text-gray-900 dark:text-white">
                  {stats.entries}
                </div>
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 rounded p-2">
                <div className="text-gray-600 dark:text-gray-400">Cache Size</div>
                <div className="text-xl font-semibold text-gray-900 dark:text-white">
                  {stats.size}
                </div>
              </div>
              <div className="bg-green-100 dark:bg-green-900 rounded p-2">
                <div className="text-green-700 dark:text-green-300">Fresh</div>
                <div className="text-xl font-semibold text-green-900 dark:text-green-100">
                  {stats.fresh}
                </div>
              </div>
              <div className="bg-yellow-100 dark:bg-yellow-900 rounded p-2">
                <div className="text-yellow-700 dark:text-yellow-300">Stale</div>
                <div className="text-xl font-semibold text-yellow-900 dark:text-yellow-100">
                  {stats.stale}
                </div>
              </div>
            </div>

            {/* Hit rate visualization */}
            {stats.entries > 0 && (
              <div className="bg-gray-100 dark:bg-gray-700 rounded p-2">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Cache Freshness
                </div>
                <div className="flex h-4 bg-gray-300 dark:bg-gray-600 rounded overflow-hidden">
                  <div
                    className="bg-green-500 transition-all duration-300"
                    style={{
                      width: `${(stats.fresh / stats.entries) * 100}%`,
                    }}
                  />
                  <div
                    className="bg-yellow-500 transition-all duration-300"
                    style={{
                      width: `${(stats.stale / stats.entries) * 100}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-green-600 dark:text-green-400">
                    {Math.round((stats.fresh / stats.entries) * 100)}% Fresh
                  </span>
                  <span className="text-yellow-600 dark:text-yellow-400">
                    {Math.round((stats.stale / stats.entries) * 100)}% Stale
                  </span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={refreshStats}
                className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Refresh
              </button>
              <button
                onClick={clearStale}
                className="flex-1 px-3 py-2 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
              >
                Clear Stale
              </button>
              <button
                onClick={clearCache}
                className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Clear All
              </button>
            </div>

            {/* Info */}
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              HTTP caching is {isCacheEnabled ? 'enabled' : 'disabled'}
            </div>
          </div>
        </div>
      )}
    </>
  );
}