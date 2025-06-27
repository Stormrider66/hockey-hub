"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const authToken = localStorage.getItem("authToken");
    
    if (authToken) {
      // In a real app, decode the token to get user role
      // For now, redirect to player dashboard
      router.push("/player");
    } else {
      // Redirect to login if not authenticated
      router.push("/login");
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Hockey Hub</h1>
        <div className="flex items-center justify-center gap-2 text-gray-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <p>Loading...</p>
        </div>
      </div>
    </div>
  );
}