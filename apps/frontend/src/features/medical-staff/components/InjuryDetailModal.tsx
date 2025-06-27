import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Calendar, Clock, FileText, User } from 'lucide-react';

interface InjuryDetailModalProps {
  injury: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (injury: any) => void;
}

export function InjuryDetailModal({ injury, isOpen, onClose, onUpdate }: InjuryDetailModalProps) {
  if (!injury) return null;

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'severe':
        return <Badge className="bg-red-100 text-red-800">Severe</Badge>;
      case 'moderate':
        return <Badge className="bg-amber-100 text-amber-800">Moderate</Badge>;
      case 'mild':
        return <Badge className="bg-yellow-100 text-yellow-800">Mild</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Injury Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Player and Injury Info */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold">{injury.player}</h3>
              <p className="text-sm text-muted-foreground">Player #{injury.playerId}</p>
              <div className="flex items-center gap-2 mt-2">
                {getSeverityBadge(injury.severity)}
                <Badge variant="outline">{injury.status}</Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Occurred</p>
              <p className="font-medium">{injury.dateOccurred}</p>
            </div>
          </div>

          {/* Injury Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Injury Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Injury Type</p>
                  <p className="font-medium">{injury.injury}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Body Part</p>
                  <p className="font-medium">{injury.bodyPart}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mechanism</p>
                  <p className="font-medium">{injury.mechanism}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Est. Return</p>
                  <p className="font-medium">{injury.estimatedReturn}</p>
                </div>
              </div>
              {injury.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="text-sm mt-1">{injury.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recovery Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recovery Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Phase {injury.phase} of {injury.totalPhases}</span>
                    <span className="font-medium">{injury.progress}%</span>
                  </div>
                  <Progress value={injury.progress} className="h-2" />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="text-center p-3 bg-muted rounded">
                    <Clock className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Days Since Injury</p>
                    <p className="font-semibold">14</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded">
                    <Calendar className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Expected Return</p>
                    <p className="font-semibold">42 days</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Tabs */}
          <Tabs defaultValue="treatments" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="treatments">Treatments</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="treatments" className="mt-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Physiotherapy Session</p>
                      <p className="text-xs text-muted-foreground">Dr. Sarah Johnson • Today 14:00</p>
                    </div>
                  </div>
                  <Badge variant="outline">Scheduled</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">MRI Scan Review</p>
                      <p className="text-xs text-muted-foreground">Dr. Michael Chen • Yesterday</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-green-50">Completed</Badge>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="documents" className="mt-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Initial Assessment Report</p>
                      <p className="text-xs text-muted-foreground">2.4 MB • PDF</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">View</Button>
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">MRI Results</p>
                      <p className="text-xs text-muted-foreground">5.1 MB • DICOM</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">View</Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="timeline" className="mt-4">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-600 mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Injury Occurred</p>
                    <p className="text-xs text-muted-foreground">{injury.dateOccurred} • During game</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-600 mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Initial Assessment</p>
                    <p className="text-xs text-muted-foreground">{injury.dateOccurred} • Severity determined</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-gray-300 mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Begin Phase 2</p>
                    <p className="text-xs text-muted-foreground">Expected in 7 days</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={() => onUpdate(injury)}>
              Update Status
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}