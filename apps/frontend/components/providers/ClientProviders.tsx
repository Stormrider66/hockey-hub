'use client';

import { SessionProvider } from "next-auth/react";
import { ReduxProvider } from "./ReduxProvider"; // Assuming it's in the same directory

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ReduxProvider>
        {children}
      </ReduxProvider>
    </SessionProvider>
  );
} 