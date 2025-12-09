import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ProvidersFixed } from "./providers-fixed";
// Import debug tools as a client component
import { DebugTools } from "@/components/debug/DebugTools";

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  preload: true,
  adjustFontFallback: true
});

export const metadata: Metadata = {
  title: "Hockey Hub",
  description: "Professional hockey team management platform",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#3b82f6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ProvidersFixed>
          {children}
          <DebugTools />
        </ProvidersFixed>
      </body>
    </html>
  );
}
