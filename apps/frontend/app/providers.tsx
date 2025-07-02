"use client";

import { Provider } from "react-redux";
import { store } from "@/src/store/store";
import { AuthProvider } from "@/src/contexts/AuthContext";
import { SocketProvider } from "@/src/contexts/SocketContext";
import { TrainingSocketProvider } from "@/src/contexts/TrainingSocketContext";
import { NotificationProvider } from "@/src/contexts/NotificationContext";
import { ChatSocketProvider } from "@/src/contexts/ChatSocketContext";
import { ErrorBoundary } from "@/src/components/ErrorBoundary";
import { Toaster } from "react-hot-toast";
import { useEffect } from "react";
import { setupGlobalErrorHandler } from "@/src/hooks/useErrorHandler";
import { I18nProvider } from "@hockey-hub/translations";
import PushNotificationService from "@/src/services/PushNotificationService";
import { SessionTimeoutWarning } from "@/src/components/auth/SessionTimeoutWarning";
import { OfflineIndicator } from "@/src/components/common/OfflineIndicator";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    setupGlobalErrorHandler();
    
    // Initialize push notifications
    PushNotificationService.initialize().catch(error => {
      console.error('Failed to initialize push notifications:', error);
    });
  }, []);

  return (
    <I18nProvider>
      <Provider store={store}>
        <AuthProvider>
          <SocketProvider>
            <ErrorBoundary>
              <NotificationProvider>
                <TrainingSocketProvider>
                  <ChatSocketProvider>
                    {children}
                    <SessionTimeoutWarning />
                    <OfflineIndicator />
                    <Toaster 
                    position="top-right"
                    toastOptions={{
                      duration: 4000,
                      style: {
                        background: '#363636',
                        color: '#fff',
                      },
                      success: {
                        style: {
                          background: '#10b981',
                        },
                      },
                      error: {
                        style: {
                          background: '#ef4444',
                        },
                      },
                    }}
                  />
                </ChatSocketProvider>
              </TrainingSocketProvider>
            </NotificationProvider>
          </ErrorBoundary>
          </SocketProvider>
        </AuthProvider>
      </Provider>
    </I18nProvider>
  );
}