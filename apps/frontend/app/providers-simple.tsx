"use client";

import { Provider } from "react-redux";
import { store } from "@/src/store/store";
import { AuthProvider } from "@/src/contexts/AuthContext";
import { MockAuthProvider } from "@/src/components/auth/MockAuthProvider";
import { Toaster } from "react-hot-toast";
import { I18nProvider } from "@hockey-hub/translations";

export function ProvidersSimple({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
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
          </AuthProvider>
        </MockAuthProvider>
      </Provider>
    </I18nProvider>
  );
}