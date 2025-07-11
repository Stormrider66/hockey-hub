'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, Users, Clock, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { format, addDays, startOfWeek, eachDayOfInterval } from "date-fns";
import { toast } from 'react-hot-toast';
import { useAuth } from "@/contexts/AuthContext";
import { useBulkAssignTemplateMutation } from '@/store/api/trainingApi';
import { useGetPlayersQuery } from '@/store/api/playerApi';

interface BulkTemplateAssignmentProps {
  templateId: string;
  templateName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (result: { created: number; errors: any[] }) => void;
}

interface SelectedDate {
  date: Date;
  selected: boolean;
}

export default function BulkTemplateAssignment({
  templateId,
  templateName,
  open,
  onOpenChange,
  onSuccess
}: BulkTemplateAssignmentProps) {
  const { user } = useAuth();
  const [bulkAssign, { isLoading }] = useBulkAssignTemplateMutation();
  const { data: playersData, isLoading: playersLoading } = useGetPlayersQuery({
    organizationId: user?.organizationId || '',
    includeStats: false
  });
  
  const [activeTab, setActiveTab] = useState('players');
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [selectedDates, setSelectedDates] = useState<SelectedDate[]>([]);
  const [selectAllPlayers, setSelectAllPlayers] = useState(false);
  
  const players = playersData?.players || [];

  // Initialize with next 7 days
  React.useEffect(() => {
    if (open && selectedDates.length === 0) {
      const dates = Array.from({ length: 7 }, (_, i) => ({
        date: addDays(new Date(), i + 1),
        selected: false
      }));
      setSelectedDates(dates);
    }
  }, [open]);

  const handlePlayerToggle = (playerId: string) => {
    setSelectedPlayerIds(prev => 
      prev.includes(playerId) 
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const handleSelectAllPlayers = () => {
    if (selectAllPlayers) {
      setSelectedPlayerIds([]);
    } else {
      setSelectedPlayerIds(players.map(p => p.id));
    }
    setSelectAllPlayers(!selectAllPlayers);
  };

  const handleDateToggle = (index: number) => {
    setSelectedDates(prev => 
      prev.map((item, i) => 
        i === index ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const handleAddWeek = () => {
    const lastDate = selectedDates[selectedDates.length - 1]?.date || new Date();
    const newDates = Array.from({ length: 7 }, (_, i) => ({
      date: addDays(lastDate, i + 1),
      selected: false
    }));
    setSelectedDates(prev => [...prev, ...newDates]);
  };

  const handleSelectWeek = (startDate: Date) => {
    const weekStart = startOfWeek(startDate, { weekStartsOn: 1 }); // Monday
    const weekDates = eachDayOfInterval({
      start: weekStart,
      end: addDays(weekStart, 6)
    });
    
    setSelectedDates(prev => 
      prev.map(item => ({
        ...item,
        selected: weekDates.some(d => 
          format(d, 'yyyy-MM-dd') === format(item.date, 'yyyy-MM-dd')
        ) ? true : item.selected
      }))
    );
  };

  const handleSubmit = async () => {
    const selectedDateValues = selectedDates
      .filter(d => d.selected)
      .map(d => d.date.toISOString());
    
    if (selectedPlayerIds.length === 0) {
      toast.error('Please select at least one player');
      return;
    }
    
    if (selectedDateValues.length === 0) {
      toast.error('Please select at least one date');
      return;
    }
    
    try {
      const result = await bulkAssign({
        templateId,
        data: {
          playerIds: selectedPlayerIds,
          teamId: user?.teams?.[0]?.id || '',
          scheduledDates: selectedDateValues
        }
      }).unwrap();
      
      if (result.created > 0) {
        toast.success(`Successfully created ${result.created} workout sessions`);
      }
      
      if (result.errors && result.errors.length > 0) {
        toast.error(`Failed to create ${result.errors.length} sessions. Check console for details.`);
        console.error('Bulk assignment errors:', result.errors);
      }
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      onOpenChange(false);
      
      // Reset selections
      setSelectedPlayerIds([]);
      setSelectedDates([]);
      setSelectAllPlayers(false);
    } catch (error) {
      console.error('Failed to bulk assign template:', error);
      toast.error('Failed to assign template. Please try again.');
    }
  };

  const selectedCount = selectedPlayerIds.length * selectedDates.filter(d => d.selected).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Bulk Assign Template</DialogTitle>
          <DialogDescription>
            Assign "{templateName}" to multiple players and dates
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="players" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Players ({selectedPlayerIds.length})
            </TabsTrigger>
            <TabsTrigger value="dates" className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Dates ({selectedDates.filter(d => d.selected).length})
            </TabsTrigger>
            <TabsTrigger value="summary" className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Summary
            </TabsTrigger>
          </TabsList>

          <TabsContent value="players" className="flex-1 overflow-hidden">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Select Players</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAllPlayers}
                  >
                    {selectAllPlayers ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden">
                {playersLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <ScrollArea className="h-full">
                    <div className="space-y-2">
                      {players.map((player) => (
                        <div
                          key={player.id}
                          className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent cursor-pointer"
                          onClick={() => handlePlayerToggle(player.id)}
                        >
                          <Checkbox
                            checked={selectedPlayerIds.includes(player.id)}
                            onCheckedChange={() => handlePlayerToggle(player.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex-1">
                            <div className="font-medium">
                              {player.firstName} {player.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {player.jerseyNumber && `#${player.jerseyNumber}`} {player.position && `- ${player.position}`}
                            </div>
                          </div>
                          {player.teamName && (
                            <Badge variant="secondary" className="text-xs">
                              {player.teamName}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dates" className="flex-1 overflow-hidden">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Select Training Dates</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddWeek}
                  >
                    Add Week
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="space-y-4">
                    {/* Quick select weeks */}
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectWeek(new Date())}
                      >
                        This Week
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectWeek(addDays(new Date(), 7))}
                      >
                        Next Week
                      </Button>
                    </div>
                    
                    {/* Date list */}
                    <div className="space-y-2">
                      {selectedDates.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent cursor-pointer"
                          onClick={() => handleDateToggle(index)}
                        >
                          <Checkbox
                            checked={item.selected}
                            onCheckedChange={() => handleDateToggle(index)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex-1">
                            <div className="font-medium">
                              {format(item.date, 'EEEE, MMMM d, yyyy')}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {format(item.date, 'EEEE')}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="summary" className="flex-1 overflow-hidden">
            <Card className="h-full flex flex-col">
              <CardHeader>
                <CardTitle className="text-base">Assignment Summary</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You are about to create <strong>{selectedCount}</strong> workout sessions
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Template</h4>
                    <p className="text-sm text-muted-foreground">{templateName}</p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Selected Players ({selectedPlayerIds.length})</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedPlayerIds.map(id => {
                        const player = players.find(p => p.id === id);
                        return player ? (
                          <Badge key={id} variant="secondary">
                            {player.firstName} {player.lastName}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">
                      Selected Dates ({selectedDates.filter(d => d.selected).length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedDates
                        .filter(d => d.selected)
                        .map((item, index) => (
                          <Badge key={index} variant="secondary">
                            {format(item.date, 'MMM d')}
                          </Badge>
                        ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || selectedCount === 0}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create {selectedCount} Sessions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}