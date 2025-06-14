'use client';

import { SessionProvider } from "next-auth/react";
import { ReduxProvider } from "./ReduxProvider"; // Assuming it's in the same directory
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  // Initialize MSW in development mode so the main Next.js app gets the same mock data as Storybook
  useEffect(() => {
    // TEMPORARILY DISABLED: MSW interfering with real backend integration
    // if (process.env.NODE_ENV === "development") {
    //   // Dynamically import to avoid including MSW in production bundles
    //   import("@/mocks/browser").then(({ worker }) => {
    //     worker.start({ onUnhandledRequest: "bypass" });
    //   });
    // }
  }, []);

  return (
    <SessionProvider>
      <ReduxProvider>
        {children}
        <Toaster position="top-right" />
      </ReduxProvider>
    </SessionProvider>
  );
} 