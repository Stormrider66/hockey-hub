"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DebugAuthPage() {
  const [authInfo, setAuthInfo] = useState<any>({});

  useEffect(() => {
    // Check localStorage
    const localStorageTokens = {
      authToken: localStorage.getItem('authToken'),
      access_token: localStorage.getItem('access_token'),
      refresh_token: localStorage.getItem('refresh_token'),
    };

    // Check cookies
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      if (key) acc[key] = value;
      return acc;
    }, {} as any);

    setAuthInfo({
      localStorage: localStorageTokens,
      cookies: cookies,
      hasAuthToken: !!(localStorageTokens.authToken || cookies.authToken),
    });
  }, []);

  const clearAll = () => {
    // Clear localStorage
    localStorage.clear();
    
    // Clear all cookies
    document.cookie.split(";").forEach((c) => {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    window.location.reload();
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Debug Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">LocalStorage Tokens:</h3>
              <pre className="bg-gray-100 p-4 rounded overflow-auto">
                {JSON.stringify(authInfo.localStorage, null, 2)}
              </pre>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Cookies:</h3>
              <pre className="bg-gray-100 p-4 rounded overflow-auto">
                {JSON.stringify(authInfo.cookies, null, 2)}
              </pre>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Status:</h3>
              <p className={authInfo.hasAuthToken ? "text-green-600" : "text-red-600"}>
                {authInfo.hasAuthToken ? "✓ Auth token found" : "✗ No auth token found"}
              </p>
            </div>
            
            <div className="flex gap-4 pt-4">
              <Button onClick={clearAll} variant="destructive">
                Clear All Auth Data
              </Button>
              <Button onClick={() => window.location.href = '/login'} variant="outline">
                Go to Login
              </Button>
              <Button onClick={() => window.location.href = '/player'} variant="outline">
                Go to Player Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}