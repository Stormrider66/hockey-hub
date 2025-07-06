"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, loading, user } = useAuth();

  useEffect(() => {
    // Wait for auth to finish loading
    if (loading) return;
    
    if (isAuthenticated && user) {
      // Redirect based on user role
      const roleToPath: Record<string, string> = {
        'player': '/player',
        'coach': '/coach',
        'parent': '/parent',
        'medical staff': '/medical-staff',
        'medical_staff': '/medical-staff',
        'equipment manager': '/equipment-manager',
        'equipment_manager': '/equipment-manager',
        'physical trainer': '/physical-trainer',
        'physical_trainer': '/physical-trainer',
        'club admin': '/club-admin',
        'club_admin': '/club-admin',
        'admin': '/admin'
      };
      
      const roleName = user.role?.name?.toLowerCase() || 'player';
      const path = roleToPath[roleName] || '/player';
      router.push(path);
    } else {
      // Redirect to login if not authenticated
      router.push("/login");
    }
  }, [isAuthenticated, loading, user, router]);

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