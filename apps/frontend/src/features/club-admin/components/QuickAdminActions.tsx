"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Calendar, Briefcase, Users, Home, DollarSign,
  AlertCircle, GraduationCap, Trophy, FileText,
  Building, Clock, TrendingUp
} from "lucide-react";
import { format } from "date-fns";

interface QuickAdminActionsProps {
  onClose: () => void;
  onSelectAction: (action: string) => void;
  selectedSlot: { start: Date; end: Date };
  pendingCount: number;
}

export function QuickAdminActions({
  onClose,
  onSelectAction,
  selectedSlot,
  pendingCount
}: QuickAdminActionsProps) {
  const actions = [
    {
      id: 'review-pending',
      title: 'Review Pending Events',
      description: `${pendingCount} events awaiting approval`,
      icon: AlertCircle,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 hover:bg-amber-100',
      priority: pendingCount > 0
    },
    {
      id: 'organization-event',
      title: 'Organization Event',
      description: 'Schedule club-wide event or tournament',
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 hover:bg-purple-100'
    },
    {
      id: 'board-meeting',
      title: 'Board Meeting',
      description: 'Schedule board or committee meeting',
      icon: Users,
      color: 'text-slate-600',
      bgColor: 'bg-slate-50 hover:bg-slate-100'
    },
    {
      id: 'meeting',
      title: 'Book Meeting Room',
      description: 'Reserve conference room or facility',
      icon: Briefcase,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100'
    },
    {
      id: 'ice-time',
      title: 'Ice Time Allocation',
      description: 'Manage ice rink scheduling',
      icon: Home,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50 hover:bg-cyan-100'
    },
    {
      id: 'fundraiser',
      title: 'Fundraising Event',
      description: 'Plan fundraiser or sponsor event',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50 hover:bg-green-100'
    },
    {
      id: 'training-camp',
      title: 'Training Camp',
      description: 'Schedule camps or clinics',
      icon: GraduationCap,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 hover:bg-indigo-100'
    },
    {
      id: 'tournament',
      title: 'Tournament',
      description: 'Plan tournament or competition',
      icon: Trophy,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 hover:bg-yellow-100'
    },
    {
      id: 'facility-maintenance',
      title: 'Facility Maintenance',
      description: 'Schedule facility work or closure',
      icon: Building,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 hover:bg-orange-100'
    }
  ];

  // Sort to put priority items first
  const sortedActions = [...actions].sort((a, b) => {
    if (a.priority && !b.priority) return -1;
    if (!a.priority && b.priority) return 1;
    return 0;
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Quick Admin Actions</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {format(selectedSlot.start, "MMM d, yyyy")} at {format(selectedSlot.start, "h:mm a")}
          </p>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-3 mt-4">
          {sortedActions.map((action) => (
            <Card
              key={action.id}
              className={`p-4 cursor-pointer transition-colors ${action.bgColor} ${
                action.priority ? 'ring-2 ring-amber-500' : ''
              }`}
              onClick={() => onSelectAction(action.id)}
            >
              <div className="flex flex-col items-center text-center space-y-2">
                <div className={`p-3 rounded-full ${action.bgColor}`}>
                  <action.icon className={`h-6 w-6 ${action.color}`} />
                </div>
                <h3 className="font-medium text-sm">{action.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {action.description}
                </p>
                {action.priority && (
                  <div className="absolute top-2 right-2">
                    <span className="flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        <div className="flex justify-between items-center mt-4 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <div className="text-sm text-muted-foreground">
            <Clock className="inline h-3 w-3 mr-1" />
            Or drag on calendar to adjust time
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}