'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Calendar, 
  Clock, 
  Activity, 
  Play, 
  Edit, 
  Copy, 
  Trash2,
  TrendingUp,
  BarChart3
} from '@/components/icons';
import { toast } from 'react-hot-toast';

interface SessionBundle {
  id: string;
  name: string;
  description: string;
  sessionCount: number;
  totalParticipants: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'scheduled' | 'cancelled';
  completedSessions: number;
  workoutTypes: string[];
  teams: string[];
  createdAt: string;
  lastActivity?: string;
}

interface SessionBundleListProps {
  bundles?: SessionBundle[];
  isLoading?: boolean;
  onViewBundle: (bundleId: string) => void;
  onEditBundle?: (bundleId: string) => void;
  onDuplicateBundle?: (bundleId: string) => void;
  onDeleteBundle?: (bundleId: string) => void;
}

// Mock data for demonstration
const MOCK_BUNDLES: SessionBundle[] = [
  {
    id: 'bundle-001',
    name: 'Off-Season Conditioning Program',
    description: 'Comprehensive 4-week conditioning program for all teams',
    sessionCount: 16,
    totalParticipants: 72,
    startDate: '2025-01-15',
    endDate: '2025-02-12',
    status: 'active',
    completedSessions: 8,
    workoutTypes: ['conditioning', 'hybrid'],
    teams: ['Pittsburgh Penguins', 'Colorado Avalanche'],
    createdAt: '2025-01-10T10:00:00Z',
    lastActivity: '2025-01-22T14:30:00Z'
  },
  {
    id: 'bundle-002',
    name: 'Pre-Season Strength Block',
    description: 'Progressive strength training for core players',
    sessionCount: 20,
    totalParticipants: 45,
    startDate: '2025-02-01',
    endDate: '2025-03-01',
    status: 'scheduled',
    completedSessions: 0,
    workoutTypes: ['strength', 'agility'],
    teams: ['Toronto Maple Leafs'],
    createdAt: '2025-01-20T09:15:00Z'
  },
  {
    id: 'bundle-003',
    name: 'Recovery Protocol - Week 3',
    description: 'Light recovery sessions following injury protocol',
    sessionCount: 6,
    totalParticipants: 12,
    startDate: '2025-01-08',
    endDate: '2025-01-14',
    status: 'completed',
    completedSessions: 6,
    workoutTypes: ['conditioning'],
    teams: ['Pittsburgh Penguins'],
    createdAt: '2025-01-05T16:00:00Z',
    lastActivity: '2025-01-14T11:00:00Z'
  }
];

const getStatusColor = (status: SessionBundle['status']) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'completed':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'scheduled':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getWorkoutTypeIcon = (type: string) => {
  switch (type) {
    case 'strength':
      return <Activity className="h-3 w-3" />;
    case 'conditioning':
      return <TrendingUp className="h-3 w-3" />;
    case 'hybrid':
      return <BarChart3 className="h-3 w-3" />;
    case 'agility':
      return <Clock className="h-3 w-3" />;
    default:
      return <Activity className="h-3 w-3" />;
  }
};

export const SessionBundleList: React.FC<SessionBundleListProps> = ({
  bundles = MOCK_BUNDLES,
  isLoading = false,
  onViewBundle,
  onEditBundle,
  onDuplicateBundle,
  onDeleteBundle
}) => {
  const { t } = useTranslation(['physicalTrainer']);

  const handleQuickAction = (action: string, bundleId: string, bundleName: string) => {
    switch (action) {
      case 'view':
        onViewBundle(bundleId);
        break;
      case 'edit':
        onEditBundle?.(bundleId);
        toast.success(`Opening ${bundleName} for editing`);
        break;
      case 'duplicate':
        onDuplicateBundle?.(bundleId);
        toast.success(`Duplicating ${bundleName}`);
        break;
      case 'delete':
        if (window.confirm(`Are you sure you want to delete "${bundleName}"?`)) {
          onDeleteBundle?.(bundleId);
          toast.success(`Deleted ${bundleName}`);
        }
        break;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (bundles.length === 0) {
    return (
      <Card className="text-center py-8">
        <CardContent>
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Session Bundles</h3>
          <p className="text-muted-foreground mb-4">
            Create your first bulk session to manage multiple workouts across teams and players.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {bundles.map((bundle) => (
        <Card key={bundle.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  {bundle.name}
                  <Badge 
                    variant="outline" 
                    className={getStatusColor(bundle.status)}
                  >
                    {bundle.status}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {bundle.description}
                </p>
              </div>
              <div className="flex items-center gap-1 ml-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuickAction('view', bundle.id, bundle.name)}
                  className="h-8 w-8 p-0"
                >
                  <Play className="h-4 w-4" />
                </Button>
                {onEditBundle && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQuickAction('edit', bundle.id, bundle.name)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                {onDuplicateBundle && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQuickAction('duplicate', bundle.id, bundle.name)}
                    className="h-8 w-8 p-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
                {onDeleteBundle && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQuickAction('delete', bundle.id, bundle.name)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">Progress</div>
                  <div className="text-muted-foreground">
                    {bundle.completedSessions}/{bundle.sessionCount} sessions
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">Participants</div>
                  <div className="text-muted-foreground">
                    {bundle.totalParticipants} players
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">Duration</div>
                  <div className="text-muted-foreground">
                    {new Date(bundle.startDate).toLocaleDateString()} - {new Date(bundle.endDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
              
              <div>
                <div className="font-medium mb-1">Workout Types</div>
                <div className="flex gap-1 flex-wrap">
                  {bundle.workoutTypes.map((type) => (
                    <Badge key={type} variant="outline" className="text-xs flex items-center gap-1">
                      {getWorkoutTypeIcon(type)}
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            
            {bundle.teams.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <div className="text-sm">
                  <span className="font-medium">Teams: </span>
                  <span className="text-muted-foreground">
                    {bundle.teams.join(', ')}
                  </span>
                </div>
              </div>
            )}
            
            {bundle.status === 'active' && bundle.completedSessions > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Progress</span>
                  <span>{Math.round((bundle.completedSessions / bundle.sessionCount) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${(bundle.completedSessions / bundle.sessionCount) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SessionBundleList;