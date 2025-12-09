'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { isMockMode, mockUsers } from '@/utils/mockAuth';
import { 
  User, Shield, Users, Heart, Package, Dumbbell, Building2, Settings,
  ChevronDown, ChevronUp, Zap
} from 'lucide-react';

interface MockUserInfo {
  role: string;
  icon: React.ReactNode;
  email: string;
  name: string;
  description: string;
  color: string;
}

const mockUserProfiles: MockUserInfo[] = [
  {
    role: 'player',
    icon: <User className="h-4 w-4" />,
    email: 'player@hockeyhub.com',
    name: 'Erik Johansson',
    description: 'Access player dashboard, training, and wellness features',
    color: 'bg-blue-500'
  },
  {
    role: 'coach',
    icon: <Shield className="h-4 w-4" />,
    email: 'coach@hockeyhub.com',
    name: 'Lars Andersson',
    description: 'Manage teams, create training plans, view analytics',
    color: 'bg-green-500'
  },
  {
    role: 'parent',
    icon: <Users className="h-4 w-4" />,
    email: 'parent@hockeyhub.com',
    name: 'Anna Nilsson',
    description: 'View child activities, manage payments, communicate',
    color: 'bg-purple-500'
  },
  {
    role: 'medical_staff',
    icon: <Heart className="h-4 w-4" />,
    email: 'medical@hockeyhub.com',
    name: 'Dr. Maria Svensson',
    description: 'Manage medical records, track injuries, wellness monitoring',
    color: 'bg-red-500'
  },
  {
    role: 'equipment_manager',
    icon: <Package className="h-4 w-4" />,
    email: 'equipment@hockeyhub.com',
    name: 'Johan Berg',
    description: 'Inventory management, equipment assignments, maintenance',
    color: 'bg-orange-500'
  },
  {
    role: 'physical_trainer',
    icon: <Dumbbell className="h-4 w-4" />,
    email: 'trainer@hockeyhub.com',
    name: 'Magnus Lindgren',
    description: 'Create training programs, physical tests, performance tracking',
    color: 'bg-indigo-500'
  },
  {
    role: 'club_admin',
    icon: <Building2 className="h-4 w-4" />,
    email: 'clubadmin@hockeyhub.com',
    name: 'Karin Olsson',
    description: 'Organization management, user administration, analytics',
    color: 'bg-teal-500'
  },
  {
    role: 'admin',
    icon: <Settings className="h-4 w-4" />,
    email: 'admin@hockeyhub.com',
    name: 'System Administrator',
    description: 'Full system access, all permissions, configuration',
    color: 'bg-gray-700'
  }
];

export const DevLoginPanel: React.FC = () => {
  const { login, loading } = useAuth();
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  if (!isMockMode()) {
    return null;
  }

  const handleQuickLogin = async (email: string, role: string) => {
    console.log(`🔐 Attempting mock login for ${role} with email: ${email}`);
    setSelectedRole(role);
    try {
      // Use any password - mock mode accepts any password
      await login(email, 'mock123', false);
      console.log(`✅ Mock login successful for ${role}`);
    } catch (error) {
      console.error('❌ Mock login failed:', error);
    } finally {
      setSelectedRole(null);
    }
  };

  return (
    <Card className="mt-6 border-2 border-dashed border-amber-400 bg-amber-50">
      <CardHeader 
        className="cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-amber-900">Development Quick Login</CardTitle>
            <Badge variant="outline" className="ml-2 border-amber-600 text-amber-700">
              MOCK MODE
            </Badge>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-amber-600" />
          ) : (
            <ChevronDown className="h-4 w-4 text-amber-600" />
          )}
        </div>
        {!isExpanded && (
          <CardDescription className="text-amber-700 mt-1">
            Click to expand quick login options
          </CardDescription>
        )}
      </CardHeader>
      
      {isExpanded && (
        <CardContent>
          <p className="text-sm text-amber-700 mb-4">
            Click any role below to instantly log in with mock credentials. 
            No backend required!
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {mockUserProfiles.map((profile) => (
              <button
                key={profile.role}
                onClick={() => handleQuickLogin(profile.email, profile.role)}
                disabled={loading && selectedRole === profile.role}
                className="text-left p-3 rounded-lg border border-amber-200 hover:border-amber-400 hover:bg-amber-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${profile.color} text-white flex-shrink-0`}>
                    {profile.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm text-gray-900 group-hover:text-amber-900">
                        {profile.name}
                      </h4>
                      {loading && selectedRole === profile.role && (
                        <div className="h-3 w-3 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                      )}
                    </div>
                    <p className="text-xs text-gray-600 truncate">{profile.email}</p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {profile.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-amber-200">
            <p className="text-xs text-amber-700">
              <strong>Note:</strong> This panel only appears in development mode with mock authentication enabled. 
              Set <code className="bg-amber-200 px-1 rounded">NEXT_PUBLIC_ENABLE_MOCK_AUTH=false</code> to disable.
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
};