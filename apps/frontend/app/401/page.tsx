"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldOff, Home, LogIn, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function UnauthorizedPage() {
  const router = useRouter();
  const { isAuthenticated, logout } = useAuth();

  const handleRetry = () => {
    // Try to go back to the previous page
    router.back();
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <ShieldOff className="h-10 w-10 text-orange-600" />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">401 - Unauthorized</CardTitle>
          <CardDescription className="text-lg mt-2">
            You don't have permission to access this resource
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h3 className="font-semibold text-orange-900 mb-1">What happened?</h3>
            <p className="text-sm text-orange-800">
              This error occurs when:
            </p>
            <ul className="list-disc list-inside text-sm text-orange-800 mt-2 space-y-1">
              <li>Your session has expired</li>
              <li>You're not logged in</li>
              <li>Your account doesn't have the required permissions</li>
              <li>The authentication token is invalid</li>
            </ul>
          </div>

          <div className="space-y-3">
            {isAuthenticated ? (
              <>
                <Button
                  onClick={handleRetry}
                  className="w-full"
                  variant="default"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button
                  onClick={handleLogout}
                  className="w-full"
                  variant="outline"
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign Out and Sign In Again
                </Button>
              </>
            ) : (
              <Link href="/login" className="block">
                <Button className="w-full">
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In to Continue
                </Button>
              </Link>
            )}
            
            <Link href="/" className="block">
              <Button variant="ghost" className="w-full">
                <Home className="mr-2 h-4 w-4" />
                Go to Home
              </Button>
            </Link>
          </div>

          <div className="text-center text-sm text-gray-500">
            <p>
              If you believe this is an error, please{" "}
              <Link href="/contact" className="text-blue-600 hover:underline">
                contact support
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-orange-300 rounded-full opacity-20 blur-3xl"></div>
      </div>
    </div>
  );
}