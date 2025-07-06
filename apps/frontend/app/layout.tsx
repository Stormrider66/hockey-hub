import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ProvidersFixed } from "./providers-fixed";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Hockey Hub",
  description: "Professional hockey team management platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isDev = process.env.NODE_ENV === 'development';
  
  return (
    <html lang="en">
      <body className={inter.className}>
        <ProvidersFixed>
          {children}
          {isDev && (
            <div className="fixed bottom-0 left-0 p-2 bg-yellow-100 text-xs">
              DEV MODE - Try: /debug/routes
            </div>
          )}
        </ProvidersFixed>
      </body>
    </html>
  );
}
