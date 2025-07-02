'use client';

import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Clock, LogOut, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function SessionTimeoutWarning() {
  const {
    showWarning,
    formattedTimeRemaining,
    handleRefreshToken,
    handleLogout,
    isRefreshing,
  } = useSessionTimeout();

  if (!showWarning) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-4 right-4 z-50 max-w-md"
      >
        <Alert className="border-orange-500 bg-orange-50 shadow-lg">
          <Clock className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-800">Session Expiring Soon</AlertTitle>
          <AlertDescription className="text-orange-700">
            Your session will expire in <span className="font-mono font-bold">{formattedTimeRemaining}</span>.
            Would you like to stay logged in?
          </AlertDescription>
          
          <div className="mt-4 flex gap-2">
            <Button
              size="sm"
              onClick={handleRefreshToken}
              disabled={isRefreshing}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isRefreshing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Extending...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Stay Logged In
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleLogout}
              className="border-orange-300 hover:bg-orange-100"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </Button>
          </div>
        </Alert>
      </motion.div>
    </AnimatePresence>
  );
}