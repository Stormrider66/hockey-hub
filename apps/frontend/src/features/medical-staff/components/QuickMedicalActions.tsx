"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, Syringe, UserCheck, Users, X, 
  Clock, Calendar, ArrowRight, Stethoscope,
  Brain, Heart, Activity, Clipboard
} from "lucide-react";
import { format } from "date-fns";

interface QuickMedicalActionsProps {
  selectedSlot: { start: Date; end: Date };
  onClose: () => void;
  onAction: (actionType: string) => void;
}

export function QuickMedicalActions({ selectedSlot, onClose, onAction }: QuickMedicalActionsProps) {
  const duration = Math.round((selectedSlot.end.getTime() - selectedSlot.start.getTime()) / (1000 * 60));
  
  const quickActions = [
    {
      id: 'injury',
      title: 'Injury Assessment',
      icon: AlertTriangle,
      color: 'text-red-600 bg-red-50',
      description: 'New injury evaluation',
      duration: '30-45 min',
      urgency: 'high',
      requirements: ['Medical history', 'Physical exam', 'Imaging if needed']
    },
    {
      id: 'treatment',
      title: 'Treatment Session',
      icon: Syringe,
      color: 'text-blue-600 bg-blue-50',
      description: 'Scheduled treatment',
      duration: '30-60 min',
      urgency: 'medium',
      requirements: ['Treatment plan', 'Equipment prep', 'Progress notes']
    },
    {
      id: 'checkup',
      title: 'Routine Checkup',
      icon: UserCheck,
      color: 'text-green-600 bg-green-50',
      description: 'Regular health check',
      duration: '20-30 min',
      urgency: 'low',
      requirements: ['Vitals check', 'General assessment', 'Documentation']
    },
    {
      id: 'screening',
      title: 'Team Screening',
      icon: Users,
      color: 'text-purple-600 bg-purple-50',
      description: 'Group health screening',
      duration: '60-90 min',
      urgency: 'low',
      requirements: ['Multiple players', 'Standardized tests', 'Data collection']
    },
    {
      id: 'concussion',
      title: 'Concussion Protocol',
      icon: Brain,
      color: 'text-orange-600 bg-orange-50',
      description: 'Head injury assessment',
      duration: '45-60 min',
      urgency: 'high',
      requirements: ['SCAT5 test', 'Neurological exam', 'Baseline comparison']
    },
    {
      id: 'cardiac',
      title: 'Cardiac Screening',
      icon: Heart,
      color: 'text-pink-600 bg-pink-50',
      description: 'Heart health check',
      duration: '30-45 min',
      urgency: 'medium',
      requirements: ['ECG', 'Blood pressure', 'Exercise test if needed']
    }
  ];

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return <Badge variant="destructive" className="text-xs">Urgent</Badge>;
      case 'medium':
        return <Badge variant="default" className="text-xs">Standard</Badge>;
      case 'low':
        return <Badge variant="secondary" className="text-xs">Routine</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                Quick Medical Scheduling
              </CardTitle>
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {format(selectedSlot.start, 'PPP')}
                <span>•</span>
                <Clock className="h-4 w-4" />
                {format(selectedSlot.start, 'p')} - {format(selectedSlot.end, 'p')}
                <Badge variant="outline" className="ml-2">
                  {duration} minutes available
                </Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map(action => (
              <Card 
                key={action.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onAction(action.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2 rounded-lg ${action.color}`}>
                      <action.icon className="h-5 w-5" />
                    </div>
                    {getUrgencyBadge(action.urgency)}
                  </div>
                  
                  <h3 className="font-semibold text-base mb-1">{action.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{action.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span>Typical duration: {action.duration}</span>
                    </div>
                    
                    <div className="text-xs">
                      <div className="flex items-center gap-1 text-muted-foreground mb-1">
                        <Clipboard className="h-3 w-3" />
                        <span>Requirements:</span>
                      </div>
                      <ul className="ml-4 space-y-0.5">
                        {action.requirements.map((req, idx) => (
                          <li key={idx} className="text-muted-foreground">• {req}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full mt-3 justify-between group"
                  >
                    Schedule {action.title}
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => onAction('custom')}
            >
              <Activity className="h-4 w-4 mr-2" />
              Create Custom Appointment
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}