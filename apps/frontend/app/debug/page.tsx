"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DebugPage() {
  const auth = useAuth();
  const [storageData, setStorageData] = useState<any>({});

  useEffect(() => {
    // Read all storage data
    const data = {
      localStorage: {
        access_token: localStorage.getItem('access_token'),
        authToken: localStorage.getItem('authToken'),
        user_data: localStorage.getItem('user_data'),
        token_expiry: localStorage.getItem('token_expiry'),
        current_user_id: localStorage.getItem('current_user_id'),
        mock_user_role: localStorage.getItem('mock_user_role'),
      },
      sessionStorage: {
        user_data: sessionStorage.getItem('user_data'),
        token_expiry: sessionStorage.getItem('token_expiry'),
      },
      env: {
        NEXT_PUBLIC_ENABLE_MOCK_AUTH: process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH,
      }
    };
    setStorageData(data);
  }, []);

  const clearAll = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Auth Debug Page</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Auth Context State</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify({
                user: auth.user,
                loading: auth.loading,
                error: auth.error,
                isAuthenticated: auth.isAuthenticated,
              }, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Storage Data</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(storageData, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={clearAll} variant="destructive">
              Clear All Storage & Reload
            </Button>
            <Button onClick={() => window.location.href = '/login'}>
              Go to Login
            </Button>
            <Button onClick={() => window.location.href = '/player'}>
              Go to Player Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}