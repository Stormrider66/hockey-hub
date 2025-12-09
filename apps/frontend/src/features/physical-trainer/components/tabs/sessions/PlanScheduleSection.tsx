'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, Package, Users, Zap, Plus, CalendarRange, 
  Repeat, Clock, TrendingUp, ChevronRight
} from '@/components/icons';
import { format, addDays } from 'date-fns';

interface SessionBundle {
  id: string;
  name: string;
  description: string;
  sessionCount: number;
  duration: string;
  frequency: string;
  tags: string[];
}

interface BundleCardProps {
  bundle: SessionBundle;
  onSelect: (bundle: SessionBundle) => void;
  onApply: () => void;
  draggable?: boolean;
}

const BundleCard: React.FC<BundleCardProps> = ({ bundle, onSelect, onApply, draggable }) => {
  const { t } = useTranslation(['physicalTrainer']);
  
  return (
    <div 
      className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.setData('bundle', JSON.stringify(bundle));
      }}
      onClick={() => onSelect(bundle)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h5 className="font-medium text-sm">{bundle.name}</h5>
          <p className="text-xs text-muted-foreground mt-1">{bundle.description}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="text-xs">
              {bundle.sessionCount} sessions
            </Badge>
            <Badge variant="outline" className="text-xs">
              {bundle.duration}
            </Badge>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onApply();
          }}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

interface QuickActionCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  onClick: () => void;
  badge?: string;
}

const QuickActionCard: React.FC<QuickActionCardProps> = ({ 
  icon: Icon, 
  title, 
  description, 
  onClick, 
  badge 
}) => {
  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-all"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-muted">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h5 className="font-medium text-sm">{title}</h5>
              {badge && (
                <Badge variant="secondary" className="text-xs">
                  {badge}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface DayData {
  date: Date;
  events: number;
  isToday: boolean;
}

interface MiniCalendarWidgetProps {
  showNextDays: number;
  allowDragDrop: boolean;
  onDrop: (item: any, date: Date) => void;
}

const MiniCalendarWidget: React.FC<MiniCalendarWidgetProps> = ({ 
  showNextDays, 
  allowDragDrop, 
  onDrop 
}) => {
  const { t } = useTranslation(['physicalTrainer']);
  
  const getNextDays = (days: number): DayData[] => {
    const result: DayData[] = [];
    const today = new Date();
    
    for (let i = 0; i < days; i++) {
      const date = addDays(today, i);
      result.push({
        date,
        events: Math.floor(Math.random() * 3), // Mock data
        isToday: i === 0
      });
    }
    
    return result;
  };
  
  const days = getNextDays(showNextDays);
  
  return (
    <div className="grid grid-cols-7 gap-1">
      {days.map((day, index) => (
        <div
          key={index}
          className={`
            min-h-[60px] border rounded p-2 hover:bg-accent transition-colors
            ${day.isToday ? 'border-primary bg-primary/5' : ''}
            ${allowDragDrop ? 'cursor-pointer' : ''}
          `}
          onDragOver={allowDragDrop ? (e) => e.preventDefault() : undefined}
          onDrop={allowDragDrop ? (e) => {
            e.preventDefault();
            const bundleData = e.dataTransfer.getData('bundle');
            const workoutData = e.dataTransfer.getData('workout');
            
            if (bundleData) {
              onDrop(JSON.parse(bundleData), day.date);
            } else if (workoutData) {
              onDrop(JSON.parse(workoutData), day.date);
            }
          } : undefined}
        >
          <div className="text-xs font-medium text-muted-foreground">
            {format(day.date, 'EEE')}
          </div>
          <div className="text-lg font-semibold">
            {format(day.date, 'd')}
          </div>
          {day.events > 0 && (
            <Badge variant="secondary" className="text-xs mt-1">
              {day.events}
            </Badge>
          )}
        </div>
      ))}
    </div>
  );
};

interface PlanScheduleSectionProps {
  onOpenBulkAssignment: () => void;
  onOpenWeeklyPlanner: () => void;
  onOpenRecurringSetup: () => void;
  onScheduleItem: (item: any, date: Date) => void;
  onCreateBundle: () => void;
  onApplyBundle: (bundle: SessionBundle) => void;
}

export const PlanScheduleSection: React.FC<PlanScheduleSectionProps> = ({
  onOpenBulkAssignment,
  onOpenWeeklyPlanner,
  onOpenRecurringSetup,
  onScheduleItem,
  onCreateBundle,
  onApplyBundle
}) => {
  const { t } = useTranslation(['physicalTrainer']);
  const [selectedBundle, setSelectedBundle] = useState<SessionBundle | null>(null);
  
  // Mock session bundles - replace with real data
  const SESSION_BUNDLES: SessionBundle[] = [
    {
      id: 'pre-season',
      name: t('sessions.bundles.preseason.name'),
      description: t('sessions.bundles.preseason.description'),
      sessionCount: 12,
      duration: '4 weeks',
      frequency: '3x/week',
      tags: ['strength', 'conditioning', 'agility']
    },
    {
      id: 'in-season',
      name: t('sessions.bundles.inseason.name'),
      description: t('sessions.bundles.inseason.description'),
      sessionCount: 24,
      duration: '8 weeks',
      frequency: '3x/week',
      tags: ['maintenance', 'recovery', 'tactical']
    },
    {
      id: 'recovery',
      name: t('sessions.bundles.recovery.name'),
      description: t('sessions.bundles.recovery.description'),
      sessionCount: 5,
      duration: '1 week',
      frequency: 'Daily',
      tags: ['flexibility', 'recovery', 'mobility']
    }
  ];
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-purple-500" />
          <CardTitle>{t('sessions.planSchedule.title')}</CardTitle>
        </div>
        <CardDescription>
          {t('sessions.planSchedule.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          {/* Left: Session Bundles */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Package className="h-4 w-4" />
              {t('sessions.planSchedule.sessionBundles')}
            </h4>
            <div className="space-y-2">
              {SESSION_BUNDLES.map(bundle => (
                <BundleCard
                  key={bundle.id}
                  bundle={bundle}
                  onSelect={setSelectedBundle}
                  onApply={() => onApplyBundle(bundle)}
                  draggable
                />
              ))}
            </div>
            <Button 
              variant="outline" 
              className="w-full mt-3"
              onClick={onCreateBundle}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('sessions.planSchedule.createBundle')}
            </Button>
          </div>
          
          {/* Right: Quick Actions */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              {t('sessions.planSchedule.quickActions')}
            </h4>
            <div className="space-y-3">
              <QuickActionCard
                icon={Users}
                title={t('sessions.planSchedule.bulkAssignment')}
                description={t('sessions.planSchedule.bulkAssignmentDesc')}
                onClick={onOpenBulkAssignment}
                badge={t('sessions.planSchedule.saveTime')}
              />
              
              <QuickActionCard
                icon={CalendarRange}
                title={t('sessions.planSchedule.weeklyPlanner')}
                description={t('sessions.planSchedule.weeklyPlannerDesc')}
                onClick={onOpenWeeklyPlanner}
              />
              
              <QuickActionCard
                icon={Repeat}
                title={t('sessions.planSchedule.recurringSessions')}
                description={t('sessions.planSchedule.recurringSessionsDesc')}
                onClick={onOpenRecurringSetup}
                badge={t('common:badges.new')}
              />
            </div>
          </div>
        </div>
        
        {/* Mini Calendar Preview */}
        <div className="mt-6 p-4 border rounded-lg bg-muted/30">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {t('sessions.planSchedule.quickSchedulePreview')}
            </h4>
            <p className="text-xs text-muted-foreground">
              {t('sessions.planSchedule.dragToSchedule')}
            </p>
          </div>
          <MiniCalendarWidget
            showNextDays={7}
            allowDragDrop={true}
            onDrop={onScheduleItem}
          />
        </div>
      </CardContent>
    </Card>
  );
};