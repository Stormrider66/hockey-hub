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
import { SessionTimeoutWarning } from "@/src/components/auth/SessionTimeoutWarning";
import { OfflineIndicator } from "@/src/components/common/OfflineIndicator";
import { MockAuthProvider } from "@/src/components/auth/MockAuthProvider";
// import "@/src/utils/debugAuth";

export function Providers({ children }: { children: React.ReactNode }) {
  const isMockMode = process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH === 'true';
  
  useEffect(() => {
    setupGlobalErrorHandler();
    
    // Register service worker for push notifications (only on client)
    if (typeof window !== 'undefined' && !isMockMode) {
      // Delay dynamic import to avoid chunk loading issues
      setTimeout(() => {
        import("@/src/services/PushNotificationService").then(({ pushNotificationService }) => {
          pushNotificationService.registerServiceWorker().catch(error => {
            console.error('Failed to register service worker:', error);
          });
        }).catch(error => {
          console.error('Failed to load PushNotificationService:', error);
        });
      }, 100);
    }
  }, [isMockMode]);

  return (
    <I18nProvider>
      <Provider store={store}>
        <MockAuthProvider>
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
        </MockAuthProvider>
      </Provider>
    </I18nProvider>
  );
}