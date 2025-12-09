'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Share2 } from '@/components/icons';
import { PracticePlanBuilder } from './PracticePlanBuilder';
import type { UseCoachDashboardReturn } from '../hooks/useCoachDashboard';
import type { TacticalCategory, FormationType } from '@/store/api/coachApi';

interface CoachDashboardModalsProps {
  dashboard: UseCoachDashboardReturn;
}

export function CoachDashboardModals({ dashboard }: CoachDashboardModalsProps) {
  const {
    showCreatePracticeModal,
    setShowCreatePracticeModal,
    selectedPracticePlan,
    handleCreatePracticePlan,
    showCreateTacticalModal,
    setShowCreateTacticalModal,
    handleCreateTacticalPlan,
    showSharePlaybookModal,
    setShowSharePlaybookModal,
    handleSharePlaybook,
  } = dashboard;

  return (
    <>
      {/* Practice Plan Modal */}
      <Dialog open={showCreatePracticeModal} onOpenChange={setShowCreatePracticeModal}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {selectedPracticePlan ? 'Edit Practice Plan' : 'Create Practice Plan'}
            </DialogTitle>
            <DialogDescription>
              Build a comprehensive practice plan with drills and objectives
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <PracticePlanBuilder
              onSavePlan={handleCreatePracticePlan}
              existingPlan={selectedPracticePlan}
            />
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Create Tactical Plan Modal */}
      <Dialog open={showCreateTacticalModal} onOpenChange={setShowCreateTacticalModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Tactical Plan</DialogTitle>
            <DialogDescription>Design and save tactical plays for your team</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Play Name</Label>
              <Input placeholder="e.g., Power Play Formation A" />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select defaultValue="powerplay">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="powerplay">Power Play</SelectItem>
                  <SelectItem value="penalty_kill">Penalty Kill</SelectItem>
                  <SelectItem value="even_strength">Even Strength</SelectItem>
                  <SelectItem value="offensive_zone">Offensive Zone</SelectItem>
                  <SelectItem value="defensive_zone">Defensive Zone</SelectItem>
                  <SelectItem value="neutral_zone">Neutral Zone</SelectItem>
                  <SelectItem value="faceoff">Faceoff</SelectItem>
                  <SelectItem value="breakout">Breakout</SelectItem>
                  <SelectItem value="forecheck">Forecheck</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="Describe the tactical play..." rows={3} />
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground text-center">
                Interactive tactical board would appear here
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateTacticalModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                handleCreateTacticalPlan({
                  name: 'Power Play Formation A',
                  category: 'powerplay' as TacticalCategory,
                  formation: {
                    type: 'powerplay' as FormationType,
                    zones: {
                      offensive: [],
                      neutral: [],
                      defensive: [],
                    },
                  },
                  playerAssignments: [],
                  description: 'Basic power play setup',
                });
              }}
            >
              Save Tactical Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Playbook Modal */}
      <Dialog open={showSharePlaybookModal} onOpenChange={setShowSharePlaybookModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Playbook</DialogTitle>
            <DialogDescription>
              Share your tactical playbook with players and assistant coaches
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Share With</Label>
              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Players</SelectItem>
                  <SelectItem value="available">Available Players Only</SelectItem>
                  <SelectItem value="coaches">Coaching Staff</SelectItem>
                  <SelectItem value="selected">Selected Players</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Access Level</Label>
              <Select defaultValue="view">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">View Only</SelectItem>
                  <SelectItem value="comment">View and Comment</SelectItem>
                  <SelectItem value="edit">Full Edit Access</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Expiry</Label>
              <Select defaultValue="never">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">Never</SelectItem>
                  <SelectItem value="24h">24 Hours</SelectItem>
                  <SelectItem value="7d">7 Days</SelectItem>
                  <SelectItem value="30d">30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSharePlaybookModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSharePlaybook}>
              <Share2 className="h-4 w-4 mr-2" />
              Generate Share Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default CoachDashboardModals;



