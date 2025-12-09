import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Calendar, TrendingUp } from 'lucide-react';

export function RecoveryManagement() {
  // Mock data
  const recoveryPlans = [
    {
      id: 1,
      player: 'Erik Andersson',
      injury: 'ACL Tear',
      phase: 'Phase 2',
      progress: 35,
      weeksRemaining: 12,
      status: 'on-track',
    },
    {
      id: 2,
      player: 'Marcus Lindberg',
      injury: 'Hamstring Strain',
      phase: 'Phase 4',
      progress: 80,
      weeksRemaining: 2,
      status: 'ahead',
    },
    {
      id: 3,
      player: 'Viktor Nilsson',
      injury: 'Concussion',
      phase: 'Phase 1',
      progress: 20,
      weeksRemaining: 4,
      status: 'monitoring',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-track':
        return 'bg-blue-100 text-blue-800';
      case 'ahead':
        return 'bg-green-100 text-green-800';
      case 'behind':
        return 'bg-red-100 text-red-800';
      case 'monitoring':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Recovery Management</CardTitle>
          <CardDescription>Track and manage player recovery programs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recoveryPlans.map((plan) => (
              <Card key={plan.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{plan.player}</h4>
                        <Badge variant="outline">{plan.phase}</Badge>
                        <Badge className={getStatusColor(plan.status)}>
                          {plan.status.replace('-', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {plan.injury} • {plan.weeksRemaining} weeks remaining
                      </p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Overall Progress</span>
                          <span className="font-medium">{plan.progress}%</span>
                        </div>
                        <Progress value={plan.progress} className="h-2" />
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button size="sm" variant="outline">
                        <Activity className="h-4 w-4 mr-1" />
                        View Plan
                      </Button>
                      <Button size="sm" variant="outline">
                        <Calendar className="h-4 w-4 mr-1" />
                        Schedule
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Recovery Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">3 in critical phase</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Average Recovery Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6.5 weeks</div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-xs text-green-600">15% faster than average</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Return to Play Success</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94%</div>
            <p className="text-xs text-muted-foreground">No re-injuries</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}