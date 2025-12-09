import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Shield, 
  AlertTriangle, 
  Users, 
  Settings, 
  BarChart3, 
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Flag
} from 'lucide-react';
import { 
  useGetPendingContentQuery, 
  useGetModeratedUsersQuery, 
  useGetRulesQuery, 
  useGetModerationStatsQuery,
  ModerationStatus,
  UserModerationStatus 
} from '@/store/api/moderationApi';
import { PendingContent } from './PendingContent';
import { ModeratedUsers } from './ModeratedUsers';
import { ModerationRules } from './ModerationRules';
import { ModerationStats } from './ModerationStats';
import { CreateRuleModal } from './CreateRuleModal';

interface ModerationDashboardProps {
  className?: string;
}

export const ModerationDashboard: React.FC<ModerationDashboardProps> = ({
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState('pending');
  const [isCreateRuleOpen, setIsCreateRuleOpen] = useState(false);

  // Fetch data for dashboard overview
  const { data: pendingData } = useGetPendingContentQuery({ page: 1, limit: 5 });
  const { data: usersData } = useGetModeratedUsersQuery({ page: 1, limit: 5 });
  const { data: rulesData } = useGetRulesQuery({ isActive: true });
  const { data: statsData } = useGetModerationStatsQuery({ days: 30 });

  const pendingCount = pendingData?.data?.total || 0;
  const moderatedUsersCount = usersData?.data?.total || 0;
  const activeRulesCount = rulesData?.data?.length || 0;
  const stats = statsData?.data;

  const getStatusColor = (status: string) => {
    switch (status) {
      case ModerationStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case ModerationStatus.APPROVED:
        return 'bg-green-100 text-green-800';
      case ModerationStatus.REJECTED:
        return 'bg-red-100 text-red-800';
      case ModerationStatus.FLAGGED:
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUserStatusColor = (status: string) => {
    switch (status) {
      case UserModerationStatus.ACTIVE:
        return 'bg-green-100 text-green-800';
      case UserModerationStatus.WARNING:
        return 'bg-yellow-100 text-yellow-800';
      case UserModerationStatus.MUTED:
        return 'bg-orange-100 text-orange-800';
      case UserModerationStatus.SUSPENDED:
        return 'bg-red-100 text-red-800';
      case UserModerationStatus.BANNED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            Content Moderation
          </h1>
          <p className="text-gray-600 mt-1">
            Manage reported content, user moderation, and automated rules
          </p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isCreateRuleOpen} onOpenChange={setIsCreateRuleOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Moderation Rule</DialogTitle>
                <DialogDescription>
                  Create automated rules to help moderate content
                </DialogDescription>
              </DialogHeader>
              <CreateRuleModal onClose={() => setIsCreateRuleOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Moderated Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{moderatedUsersCount}</div>
            <p className="text-xs text-muted-foreground">
              Currently restricted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeRulesCount}</div>
            <p className="text-xs text-muted-foreground">
              Automated moderation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports (30d)</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalReports || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.resolvedReports || 0} resolved
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4 flex-wrap">
        <Button 
          variant={pendingCount > 0 ? "destructive" : "outline"}
          size="sm"
          onClick={() => setActiveTab('pending')}
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          Review {pendingCount} Pending
        </Button>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setActiveTab('users')}
        >
          <Users className="h-4 w-4 mr-2" />
          Manage Users
        </Button>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setActiveTab('rules')}
        >
          <Settings className="h-4 w-4 mr-2" />
          Configure Rules
        </Button>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Flag className="h-4 w-4" />
            Pending ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users ({moderatedUsersCount})
          </TabsTrigger>
          <TabsTrigger value="rules" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Rules ({activeRulesCount})
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Content Reports</CardTitle>
              <CardDescription>
                Review and take action on reported content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PendingContent />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Moderated Users</CardTitle>
              <CardDescription>
                Manage users with active moderation actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ModeratedUsers />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Moderation Rules</CardTitle>
              <CardDescription>
                Automated rules for content moderation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ModerationRules />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <ModerationStats />
        </TabsContent>
      </Tabs>
    </div>
  );
};