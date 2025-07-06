"use client";

import { Provider } from "react-redux";
import { store } from "@/src/store/store";
import { AuthProvider } from "@/src/contexts/AuthContext";
import { MockAuthProvider } from "@/src/components/auth/MockAuthProvider";
import { Toaster } from "react-hot-toast";
import { I18nextProvider } from "react-i18next";
import i18n from "@/src/lib/i18n-client";
import { useEffect, useState } from "react";

export function ProvidersFixed({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Check if already initialized
    if (i18n.isInitialized) {
      setIsReady(true);
    } else {
      // Wait for initialization
      i18n.on('initialized', () => {
        setIsReady(true);
      });
    }
  }, []);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <I18nextProvider i18n={i18n}>
      <Provider store={store}>
        <MockAuthProvider>
          <AuthProvider>
            {children}
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
              }}
            />
          </AuthProvider>
        </MockAuthProvider>
      </Provider>
    </I18nextProvider>
  );
}