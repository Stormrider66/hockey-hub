'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Users,
  Shield,
  Zap,
  Clock,
  Save,
  Copy,
  RotateCcw,
  AlertCircle,
  Star,
  TrendingUp,
  Activity,
  Calendar,
} from 'lucide-react';
import { CalendarEvent } from '@/store/api/calendarApi';

interface Player {
  id: string;
  name: string;
  number: number;
  position: 'C' | 'LW' | 'RW' | 'LD' | 'RD' | 'G';
  status: 'available' | 'injured' | 'scratched';
  stats?: {
    goals: number;
    assists: number;
    plusMinus: number;
    toi: string; // time on ice
  };
}

interface Line {
  center: Player | null;
  leftWing: Player | null;
  rightWing: Player | null;
  leftDefense: Player | null;
  rightDefense: Player | null;
}

interface LineConfiguration {
  id: string;
  name: string;
  evenStrength: {
    line1: Line;
    line2: Line;
    line3: Line;
    line4: Line;
    pair1: { ld: Player | null; rd: Player | null };
    pair2: { ld: Player | null; rd: Player | null };
    pair3: { ld: Player | null; rd: Player | null };
  };
  powerPlay: {
    pp1: Line;
    pp2: Line;
  };
  penaltyKill: {
    pk1: { forward1: Player | null; forward2: Player | null; defense1: Player | null; defense2: Player | null };
    pk2: { forward1: Player | null; forward2: Player | null; defense1: Player | null; defense2: Player | null };
  };
  goalies: {
    starter: Player | null;
    backup: Player | null;
  };
}

interface LineManagementOverlayProps {
  selectedEvent?: CalendarEvent;
  teamId?: string;
  onSaveLines?: (lines: LineConfiguration) => void;
}

// Mock player data
const mockPlayers: Player[] = [
  // Centers
  { id: 'p1', name: 'Connor McDavid', number: 97, position: 'C', status: 'available', stats: { goals: 32, assists: 48, plusMinus: 28, toi: '22:14' } },
  { id: 'p2', name: 'Leon Draisaitl', number: 29, position: 'C', status: 'available', stats: { goals: 28, assists: 42, plusMinus: 22, toi: '21:45' } },
  { id: 'p3', name: 'Ryan Nugent-Hopkins', number: 93, position: 'C', status: 'available', stats: { goals: 12, assists: 25, plusMinus: 10, toi: '18:30' } },
  { id: 'p4', name: 'Derek Ryan', number: 10, position: 'C', status: 'available', stats: { goals: 5, assists: 8, plusMinus: -2, toi: '12:15' } },
  // Wingers
  { id: 'p5', name: 'Zach Hyman', number: 18, position: 'LW', status: 'available', stats: { goals: 25, assists: 22, plusMinus: 18, toi: '19:45' } },
  { id: 'p6', name: 'Evander Kane', number: 91, position: 'LW', status: 'injured', stats: { goals: 18, assists: 15, plusMinus: 12, toi: '17:30' } },
  { id: 'p7', name: 'Warren Foegele', number: 37, position: 'LW', status: 'available', stats: { goals: 10, assists: 12, plusMinus: 4, toi: '14:20' } },
  { id: 'p8', name: 'Connor Brown', number: 28, position: 'RW', status: 'available', stats: { goals: 8, assists: 10, plusMinus: 2, toi: '15:10' } },
  // Defensemen
  { id: 'p9', name: 'Darnell Nurse', number: 25, position: 'LD', status: 'available', stats: { goals: 5, assists: 18, plusMinus: 8, toi: '23:30' } },
  { id: 'p10', name: 'Evan Bouchard', number: 2, position: 'RD', status: 'available', stats: { goals: 12, assists: 28, plusMinus: 15, toi: '22:45' } },
  { id: 'p11', name: 'Mattias Ekholm', number: 14, position: 'LD', status: 'available', stats: { goals: 4, assists: 15, plusMinus: 12, toi: '21:00' } },
  { id: 'p12', name: 'Cody Ceci', number: 5, position: 'RD', status: 'available', stats: { goals: 2, assists: 8, plusMinus: 6, toi: '18:45' } },
  // Goalies
  { id: 'p13', name: 'Stuart Skinner', number: 74, position: 'G', status: 'available', stats: { goals: 0, assists: 0, plusMinus: 0, toi: '60:00' } },
  { id: 'p14', name: 'Calvin Pickard', number: 30, position: 'G', status: 'available', stats: { goals: 0, assists: 0, plusMinus: 0, toi: '60:00' } },
];

// Draggable Player Component
const DraggablePlayer: React.FC<{ player: Player }> = ({ player }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useSortable({ id: player.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`p-2 bg-card border rounded-lg cursor-move ${
        player.status !== 'available' ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs">
            {player.number}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{player.name}</div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Badge variant="outline" className="text-xs px-1">
              {player.position}
            </Badge>
            {player.stats && (
              <>
                <span>{player.stats.goals}G</span>
                <span>{player.stats.assists}A</span>
              </>
            )}
          </div>
        </div>
        {player.status === 'injured' && (
          <AlertCircle className="w-4 h-4 text-red-500" />
        )}
      </div>
    </div>
  );
};

// Position Slot Component
const PositionSlot: React.FC<{
  position: string;
  player: Player | null;
  onDrop: (player: Player) => void;
}> = ({ position, player, onDrop }) => {
  const { setNodeRef, isOver } = useSortable({
    id: `slot-${position}`,
    data: { type: 'slot', accepts: position },
  });

  return (
    <div
      ref={setNodeRef}
      className={`p-3 border-2 border-dashed rounded-lg min-h-[60px] ${
        isOver ? 'border-primary bg-primary/10' : 'border-muted-foreground/30'
      }`}
    >
      <div className="text-xs text-muted-foreground mb-1">{position}</div>
      {player ? (
        <DraggablePlayer player={player} />
      ) : (
        <div className="text-sm text-muted-foreground">Empty</div>
      )}
    </div>
  );
};

export const LineManagementOverlay: React.FC<LineManagementOverlayProps> = ({
  selectedEvent,
  teamId,
  onSaveLines,
}) => {
  const [activeTab, setActiveTab] = useState<'even' | 'pp' | 'pk'>('even');
  const [selectedPreset, setSelectedPreset] = useState<string>('current');
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Initialize with some default lines
  const [lines, setLines] = useState<LineConfiguration>({
    id: 'current',
    name: 'Current Lines',
    evenStrength: {
      line1: {
        center: mockPlayers[0],
        leftWing: mockPlayers[4],
        rightWing: mockPlayers[7],
        leftDefense: mockPlayers[8],
        rightDefense: mockPlayers[9],
      },
      line2: {
        center: mockPlayers[1],
        leftWing: mockPlayers[6],
        rightWing: null,
        leftDefense: mockPlayers[10],
        rightDefense: mockPlayers[11],
      },
      line3: {
        center: mockPlayers[2],
        leftWing: null,
        rightWing: null,
        leftDefense: null,
        rightDefense: null,
      },
      line4: {
        center: mockPlayers[3],
        leftWing: null,
        rightWing: null,
        leftDefense: null,
        rightDefense: null,
      },
      pair1: { ld: mockPlayers[8], rd: mockPlayers[9] },
      pair2: { ld: mockPlayers[10], rd: mockPlayers[11] },
      pair3: { ld: null, rd: null },
    },
    powerPlay: {
      pp1: {
        center: mockPlayers[0],
        leftWing: mockPlayers[1],
        rightWing: mockPlayers[4],
        leftDefense: mockPlayers[8],
        rightDefense: mockPlayers[9],
      },
      pp2: {
        center: mockPlayers[2],
        leftWing: null,
        rightWing: null,
        leftDefense: mockPlayers[10],
        rightDefense: mockPlayers[11],
      },
    },
    penaltyKill: {
      pk1: {
        forward1: mockPlayers[2],
        forward2: mockPlayers[7],
        defense1: mockPlayers[8],
        defense2: mockPlayers[9],
      },
      pk2: {
        forward1: mockPlayers[3],
        forward2: null,
        defense1: mockPlayers[10],
        defense2: mockPlayers[11],
      },
    },
    goalies: {
      starter: mockPlayers[12],
      backup: mockPlayers[13],
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && over.id !== active.id) {
      // Handle the drop logic here
      console.log('Dropped', active.id, 'on', over.id);
    }
    
    setActiveId(null);
  };

  const availablePlayers = mockPlayers.filter(
    p => p.status === 'available'
  );

  const handleSaveLines = () => {
    if (onSaveLines) {
      onSaveLines(lines);
    }
  };

  return (
    <Card className="p-4 w-full">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Line Management
            </h3>
            {selectedEvent && (
              <p className="text-sm text-muted-foreground mt-1">
                {selectedEvent.title} - {new Date(selectedEvent.startTime).toLocaleDateString()}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedPreset} onValueChange={setSelectedPreset}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Current Lines</SelectItem>
                <SelectItem value="pp-heavy">PP Heavy</SelectItem>
                <SelectItem value="defensive">Defensive</SelectItem>
                <SelectItem value="speed">Speed Lines</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline">
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
            <Button size="sm" onClick={handleSaveLines}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </div>

        {/* Line Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="even" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Even Strength
            </TabsTrigger>
            <TabsTrigger value="pp" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Power Play
            </TabsTrigger>
            <TabsTrigger value="pk" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Penalty Kill
            </TabsTrigger>
          </TabsList>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <TabsContent value="even" className="mt-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Forward Lines */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Forward Lines</h4>
                  {[1, 2, 3, 4].map((lineNum) => (
                    <Card key={lineNum} className="p-3">
                      <div className="text-xs font-medium mb-2">Line {lineNum}</div>
                      <div className="grid grid-cols-3 gap-2">
                        <PositionSlot
                          position="LW"
                          player={null}
                          onDrop={() => {}}
                        />
                        <PositionSlot
                          position="C"
                          player={lineNum === 1 ? mockPlayers[0] : null}
                          onDrop={() => {}}
                        />
                        <PositionSlot
                          position="RW"
                          player={null}
                          onDrop={() => {}}
                        />
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Defense Pairs */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Defense Pairs</h4>
                  {[1, 2, 3].map((pairNum) => (
                    <Card key={pairNum} className="p-3">
                      <div className="text-xs font-medium mb-2">Pair {pairNum}</div>
                      <div className="grid grid-cols-2 gap-2">
                        <PositionSlot
                          position="LD"
                          player={pairNum === 1 ? mockPlayers[8] : null}
                          onDrop={() => {}}
                        />
                        <PositionSlot
                          position="RD"
                          player={pairNum === 1 ? mockPlayers[9] : null}
                          onDrop={() => {}}
                        />
                      </div>
                    </Card>
                  ))}
                  
                  {/* Goalies */}
                  <Card className="p-3">
                    <div className="text-xs font-medium mb-2">Goalies</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Starter</div>
                        <PositionSlot
                          position="G"
                          player={mockPlayers[12]}
                          onDrop={() => {}}
                        />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Backup</div>
                        <PositionSlot
                          position="G"
                          player={mockPlayers[13]}
                          onDrop={() => {}}
                        />
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="pp" className="mt-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-3">
                  <div className="text-sm font-medium mb-2">Power Play Unit 1</div>
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <PositionSlot position="LW" player={mockPlayers[1]} onDrop={() => {}} />
                      <PositionSlot position="C" player={mockPlayers[0]} onDrop={() => {}} />
                      <PositionSlot position="RW" player={mockPlayers[4]} onDrop={() => {}} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <PositionSlot position="LD" player={mockPlayers[8]} onDrop={() => {}} />
                      <PositionSlot position="RD" player={mockPlayers[9]} onDrop={() => {}} />
                    </div>
                  </div>
                </Card>
                
                <Card className="p-3">
                  <div className="text-sm font-medium mb-2">Power Play Unit 2</div>
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <PositionSlot position="LW" player={null} onDrop={() => {}} />
                      <PositionSlot position="C" player={mockPlayers[2]} onDrop={() => {}} />
                      <PositionSlot position="RW" player={null} onDrop={() => {}} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <PositionSlot position="LD" player={mockPlayers[10]} onDrop={() => {}} />
                      <PositionSlot position="RD" player={mockPlayers[11]} onDrop={() => {}} />
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="pk" className="mt-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-3">
                  <div className="text-sm font-medium mb-2">Penalty Kill Unit 1</div>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <PositionSlot position="F" player={mockPlayers[2]} onDrop={() => {}} />
                      <PositionSlot position="F" player={mockPlayers[7]} onDrop={() => {}} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <PositionSlot position="D" player={mockPlayers[8]} onDrop={() => {}} />
                      <PositionSlot position="D" player={mockPlayers[9]} onDrop={() => {}} />
                    </div>
                  </div>
                </Card>
                
                <Card className="p-3">
                  <div className="text-sm font-medium mb-2">Penalty Kill Unit 2</div>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <PositionSlot position="F" player={mockPlayers[3]} onDrop={() => {}} />
                      <PositionSlot position="F" player={null} onDrop={() => {}} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <PositionSlot position="D" player={mockPlayers[10]} onDrop={() => {}} />
                      <PositionSlot position="D" player={mockPlayers[11]} onDrop={() => {}} />
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>
          </DndContext>
        </Tabs>

        {/* Available Players */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-2">Available Players</h4>
          <ScrollArea className="h-24">
            <div className="flex gap-2 flex-wrap">
              {availablePlayers.map((player) => (
                <Badge key={player.id} variant="secondary" className="cursor-move">
                  <Avatar className="h-6 w-6 mr-1">
                    <AvatarFallback className="text-xs">{player.number}</AvatarFallback>
                  </Avatar>
                  {player.name} ({player.position})
                </Badge>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              Avg TOI: 18:45
            </span>
            <span className="flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              +/- Avg: +12.5
            </span>
          </div>
          <Button size="sm" variant="ghost">
            <RotateCcw className="w-3 h-3 mr-1" />
            Reset
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default LineManagementOverlay;