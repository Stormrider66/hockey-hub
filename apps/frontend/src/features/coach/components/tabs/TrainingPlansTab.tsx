'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import {
  Plus,
  Play,
  Edit,
  Copy,
  Trash2,
  Clipboard,
  Timer,
  Users,
  Share2,
  ChevronRight,
} from '@/components/icons';
import { useTranslation } from '@hockey-hub/translations';
import PracticeTemplates from '../PracticeTemplates';
import type { PracticePlan } from '@/store/api/coachApi';

interface TrainingPlansTabProps {
  selectedTeamId: string | null;
  practicePlans: { data?: PracticePlan[] } | undefined;
  onShowCreatePracticeModal: (plan?: any) => void;
  onShowDrillLibraryModal: () => void;
  onShowSessionTimerModal: () => void;
  onShowLineGeneratorModal: () => void;
  onEditPracticePlan: (planId: string) => void;
  onDuplicatePracticePlan: (planId: string) => void;
  onDeletePracticePlan: (planId: string) => void;
  onRefetchPlans: () => void;
}

export function TrainingPlansTab({
  selectedTeamId,
  practicePlans,
  onShowCreatePracticeModal,
  onShowDrillLibraryModal,
  onShowSessionTimerModal,
  onShowLineGeneratorModal,
  onEditPracticePlan,
  onDuplicatePracticePlan,
  onDeletePracticePlan,
  onRefetchPlans,
}: TrainingPlansTabProps) {
  const { t } = useTranslation(['coach', 'common']);

  const handleApplyTemplate = (template: any, date?: Date, time?: string) => {
    const newPlan = {
      ...template,
      date: date,
      teamId: selectedTeamId || 'team-senior',
    };
    onShowCreatePracticeModal(newPlan);
  };

  return (
    <div className="space-y-6">
      {/* Practice Templates */}
      <PracticeTemplates onApplyTemplate={handleApplyTemplate} />

      {/* Ice Training Sessions */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{t('coach:training.iceTrainingTitle')}</CardTitle>
              <CardDescription>{t('coach:training.iceTrainingDescription')}</CardDescription>
            </div>
            <Button onClick={() => onShowCreatePracticeModal(null)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('coach:training.createSession')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Session Templates Card */}
            <SessionTemplatesCard />

            {/* Drill Library Card */}
            <DrillLibraryCard onBrowseDrills={onShowDrillLibraryModal} />
          </div>

          {/* Upcoming Sessions */}
          <WeeklyScheduleSection />
        </CardContent>
      </Card>

      {/* Practice Planning Tools */}
      <PlanningToolsCard
        onShowDrillBuilder={() => onShowCreatePracticeModal(null)}
        onShowSessionTimer={onShowSessionTimerModal}
        onShowLineGenerator={onShowLineGeneratorModal}
      />

      {/* Recent Practice Plans */}
      {practicePlans?.data && practicePlans.data.length > 0 && (
        <RecentPracticePlansCard
          plans={practicePlans.data}
          onEdit={onEditPracticePlan}
          onDuplicate={onDuplicatePracticePlan}
          onDelete={onDeletePracticePlan}
          onViewAll={onRefetchPlans}
        />
      )}
    </div>
  );
}

function SessionTemplatesCard() {
  const { t } = useTranslation(['coach']);

  const templates = [
    { name: 'Power Play Systems', duration: 45, drills: 6 },
    { name: 'Defensive Zone Coverage', duration: 60, drills: 8 },
    { name: 'Breakout Patterns', duration: 40, drills: 5 },
    { name: 'Special Teams Practice', duration: 50, drills: 7 },
    { name: 'Game Day Morning Skate', duration: 30, drills: 4 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('coach:training.sessionTemplates')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {templates.map((template, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
            >
              <div>
                <p className="font-medium text-sm">{template.name}</p>
                <p className="text-xs text-muted-foreground">
                  {template.duration} min • {template.drills} drills
                </p>
              </div>
              <Button size="sm" variant="ghost">
                <Play className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function DrillLibraryCard({ onBrowseDrills }: { onBrowseDrills: () => void }) {
  const { t } = useTranslation(['coach']);

  const categories = [
    { category: 'Offensive Drills', count: 24 },
    { category: 'Defensive Drills', count: 18 },
    { category: 'Transition Drills', count: 15 },
    { category: 'Goalie Drills', count: 12 },
    { category: 'Conditioning', count: 10 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('coach:training.drillLibrary')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {categories.map((category, index) => (
            <div key={index} className="flex items-center justify-between p-2">
              <span className="text-sm">{category.category}</span>
              <Badge variant="outline">{category.count}</Badge>
            </div>
          ))}
        </div>
        <Button variant="outline" className="w-full mt-4" onClick={onBrowseDrills}>
          {t('coach:training.browseAllDrills')}
        </Button>
      </CardContent>
    </Card>
  );
}

function WeeklyScheduleSection() {
  const { t } = useTranslation(['coach']);

  const sessions = [
    { day: 'Monday', time: '16:00', focus: 'Power Play', rink: 'Main' },
    { day: 'Tuesday', time: '06:00', focus: 'Morning Skate', rink: 'Main' },
    { day: 'Wednesday', time: '16:00', focus: 'Full Practice', rink: 'Main' },
    { day: 'Thursday', time: '16:00', focus: 'Special Teams', rink: 'Practice' },
    { day: 'Friday', time: '10:00', focus: 'Pre-Game Skate', rink: 'Main' },
  ];

  return (
    <div>
      <h3 className="font-semibold mb-3">{t('coach:training.thisWeeksSchedule')}</h3>
      <div className="space-y-2">
        {sessions.map((session, index) => (
          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-4">
              <div>
                <p className="font-medium">{session.day}</p>
                <p className="text-sm text-muted-foreground">{session.time}</p>
              </div>
              <div>
                <p className="text-sm">{session.focus}</p>
                <p className="text-xs text-muted-foreground">{session.rink} Rink</p>
              </div>
            </div>
            <Button size="sm" variant="outline">
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlanningToolsCard({
  onShowDrillBuilder,
  onShowSessionTimer,
  onShowLineGenerator,
}: {
  onShowDrillBuilder: () => void;
  onShowSessionTimer: () => void;
  onShowLineGenerator: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Practice Planning Tools</CardTitle>
        <CardDescription>Resources for effective training sessions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4">
          <Button
            variant="outline"
            className="h-24 flex flex-col items-center justify-center gap-2"
            onClick={onShowDrillBuilder}
          >
            <Clipboard className="h-6 w-6" />
            <span className="text-xs">Drill Builder</span>
          </Button>
          <Button
            variant="outline"
            className="h-24 flex flex-col items-center justify-center gap-2"
            onClick={onShowSessionTimer}
          >
            <Timer className="h-6 w-6" />
            <span className="text-xs">Session Timer</span>
          </Button>
          <Button
            variant="outline"
            className="h-24 flex flex-col items-center justify-center gap-2"
            onClick={onShowLineGenerator}
          >
            <Users className="h-6 w-6" />
            <span className="text-xs">Line Generator</span>
          </Button>
          <Button
            variant="outline"
            className="h-24 flex flex-col items-center justify-center gap-2"
            onClick={() => {
              toast({
                title: 'Share Plans',
                description: 'Practice plan sharing functionality coming soon!',
              });
            }}
          >
            <Share2 className="h-6 w-6" />
            <span className="text-xs">Share Plans</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function RecentPracticePlansCard({
  plans,
  onEdit,
  onDuplicate,
  onDelete,
  onViewAll,
}: {
  plans: PracticePlan[];
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onViewAll: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Recent Practice Plans</CardTitle>
          <Button variant="outline" size="sm" onClick={onViewAll}>
            <ChevronRight className="h-4 w-4 mr-1" />
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {plans.slice(0, 5).map((plan) => (
            <div
              key={plan.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div>
                <p className="font-medium">{plan.name}</p>
                <p className="text-sm text-muted-foreground">
                  {plan.duration} min • {plan.drills?.length || 0} drills
                </p>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => onEdit(plan.id)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onDuplicate(plan.id)}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onDelete(plan.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default TrainingPlansTab;



