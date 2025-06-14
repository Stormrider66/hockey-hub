"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, BarChart, Activity, Calendar, MessageCircle, User, HeartPulse, Dumbbell, Shirt, Shield, Building } from "lucide-react";
import { LucideIcon } from "lucide-react";
import { getEventTypeColor, getStatusColor, cn } from "@/lib/design-utils";

interface DashboardCardProps {
  title: string;
  count: number;
  icon: React.ReactNode;
}

interface EventCardProps {
  title: string;
  time: string;
  location: string;
  type: string;
}

interface WorkoutCardProps {
  title: string;
  category: string;
  exercises: number;
  duration: number;
}

interface TestResultItemProps {
  name: string;
  value: string;
  change: number;
  isPositive: boolean;
}

interface PlayerAvailabilityProps {
  name: string;
  status: string;
  position: string;
  number: string;
  note?: string;
  return?: string;
}

const getEventTypeIcon = (type: string): LucideIcon => {
  const iconMap: Record<string, LucideIcon> = {
    ice: Calendar,
    physical: Activity,
    game: Users,
    medical: HeartPulse,
    meeting: MessageCircle,
    travel: Calendar,
    strength: Dumbbell,
    power: Activity,
    testing: BarChart,
    activation: Activity,
    recovery: Activity,
  };
  return iconMap[type.toLowerCase().split('-')[0]] || Activity;
};

const getPlayerStatusText = (status: string): string => {
  const textMap: Record<string, string> = {
    "full": "Full",
    "limited": "Limited",
    "individual": "Individual",
    "rehab": "Rehab",
    "unavailable": "Unavailable",
  };
  return textMap[status.toLowerCase()] || "Unknown";
};

const DashboardCard: React.FC<DashboardCardProps> = ({ title, count, icon }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{count}</div>
    </CardContent>
  </Card>
);

const EventCard: React.FC<EventCardProps> = ({ title, time, location, type }) => {
  const colorClasses = getEventTypeColor(type);
  const Icon = getEventTypeIcon(type);
  
  return (
    <Card>
      <CardHeader className="space-y-1.5 p-4">
        <Badge className={cn(colorClasses)}>
          <Icon className="mr-1 h-3 w-3" />
          {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
        </Badge>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 p-4 pt-0">
        <div className="flex items-center text-sm">
          <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
          {time}
        </div>
        <div className="text-sm text-muted-foreground">
          {location}
        </div>
      </CardContent>
    </Card>
  );
};

const WorkoutCard: React.FC<WorkoutCardProps> = ({ title, category, exercises, duration }) => (
  <Card>
    <CardHeader className="space-y-1.5 p-4">
      <Badge variant="outline">{category}</Badge>
      <CardTitle className="text-base">{title}</CardTitle>
    </CardHeader>
    <CardContent className="p-4 pt-0">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>{exercises} exercises</span>
        <span>{duration} min</span>
      </div>
    </CardContent>
  </Card>
);

const TestResultItem: React.FC<TestResultItemProps> = ({ name, value, change, isPositive }) => (
  <div className="flex items-center justify-between">
    <div className="space-y-1">
      <p className="text-sm font-medium leading-none">{name}</p>
      <p className="text-sm text-muted-foreground">{value}</p>
    </div>
    <div className={`text-sm ${isPositive ? "text-green-600" : "text-red-600"}`}>
      {change > 0 ? "+" : ""}{change}
    </div>
  </div>
);

const PlayerAvailability: React.FC<PlayerAvailabilityProps> = ({ 
  name, 
  status, 
  position, 
  number, 
  note, 
  return: returnDate 
}) => {
  const colorClasses = getStatusColor(status);
  const statusText = getPlayerStatusText(status);

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center space-x-4">
        <Avatar>
          <AvatarFallback>{number}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium leading-none">{name}</p>
          <p className="text-sm text-muted-foreground">{position}</p>
          {note && <p className="text-sm text-muted-foreground mt-1">{note}</p>}
          {returnDate && <p className="text-sm text-muted-foreground mt-1">Return: {returnDate}</p>}
        </div>
      </div>
      <Badge className={cn(colorClasses)}>
        {statusText}
      </Badge>
    </div>
  );
};

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "calendar", label: "Calendar" },
  { id: "training", label: "Training" },
  { id: "medical", label: "Medical" },
  { id: "communication", label: "Communication" },
] as const;

export default function HockeyAppUIComponents() {
  const [activeTab, setActiveTab] = React.useState<typeof tabs[number]["id"]>("overview");

  return (
    <div className="p-4 space-y-10 max-w-7xl mx-auto">
      <header className="space-y-4">
        <h1 className="text-3xl font-bold">Hockey App UI Components</h1>
        <p className="text-muted-foreground">
          Based on shadcn/ui and Tailwind CSS
        </p>
      </header>

      <div>
        <div className="flex space-x-1 rounded-lg bg-muted p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors
                ${activeTab === tab.id 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {activeTab === "overview" && (
            <div className="space-y-8">
              <section className="space-y-3">
                <h2 className="text-xl font-semibold">Hockey App Color Scheme</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {Object.entries({
                    "Primary": "bg-primary text-primary-foreground",
                    "Secondary": "bg-secondary text-secondary-foreground",
                    "Accent": "bg-accent text-accent-foreground",
                    "Muted": "bg-muted text-muted-foreground",
                    "Destructive": "bg-destructive text-destructive-foreground",
                  }).map(([name, classes]) => (
                    <div key={name} className="space-y-1.5">
                      <div className={`h-16 rounded-md flex items-center justify-center ${classes}`}>
                        {name}
                      </div>
                      <p className="text-xs text-center text-muted-foreground">{name}</p>
                    </div>
                  ))}
                </div>
              </section>
              
              <section className="space-y-3">
                <h2 className="text-xl font-semibold">Overview Dashboard</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <DashboardCard 
                    title="Upcoming Sessions" 
                    count={8} 
                    icon={<Calendar className="h-4 w-4" />} 
                  />
                  <DashboardCard 
                    title="Active Players" 
                    count={32} 
                    icon={<Users className="h-4 w-4" />} 
                  />
                  <DashboardCard 
                    title="New Messages" 
                    count={12} 
                    icon={<MessageCircle className="h-4 w-4" />} 
                  />
                </div>
              </section>
              
              <section className="space-y-3">
                <h2 className="text-xl font-semibold">Basic Components</h2>
                <div className="flex flex-wrap gap-4">
                  <Button>Standard</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="destructive">Delete</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="link">Link</Button>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-4">
                  <Badge>Standard</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="destructive">Warning</Badge>
                  <Badge variant="outline">Outline</Badge>
                  <Badge className={cn(getEventTypeColor('ice-training'))}>Ice Training</Badge>
                  <Badge className={cn(getEventTypeColor('physical-training'))}>Physical Training</Badge>
                  <Badge className={cn(getEventTypeColor('game'))}>Game</Badge>
                  <Badge className={cn(getEventTypeColor('medical'))}>Rehab</Badge>
                  <Badge className={cn(getEventTypeColor('meeting'))}>Meeting</Badge>
                  <Badge className={cn(getEventTypeColor('strength-training'))}>Strength Training</Badge>
                  <Badge className={cn(getEventTypeColor('testing-session'))}>Testing Session</Badge>
                </div>
              </section>
            </div>
          )}
          
          {activeTab === "calendar" && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Calendar Module UI</h2>
              
              <section className="space-y-3">
                <h3 className="text-lg font-medium">Event Types</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <EventCard
                    title="Ice Training - Technique"
                    time="13:00 - 14:30"
                    location="Skellefteå Kraft Arena, Rink A"
                    type="ice-training"
                  />
                  <EventCard
                    title="Physical Training - Strength"
                    time="15:00 - 16:00"
                    location="Gym, Skellefteå Kraft Arena"
                    type="physical-training"
                  />
                  <EventCard
                    title="Game vs Luleå HF"
                    time="19:00 - 21:30"
                    location="Skellefteå Kraft Arena"
                    type="game"
                  />
                  <EventCard
                    title="Rehab Training - Shoulder"
                    time="10:00 - 11:00"
                    location="Physiotherapy Room"
                    type="medical"
                  />
                  <EventCard
                    title="Team Meeting - Tactics"
                    time="17:00 - 18:00"
                    location="Conference Room 3"
                    type="meeting"
                  />
                  <EventCard
                    title="Away Travel - Bus"
                    time="08:00 - 12:00"
                    location="Meeting at arena entrance"
                    type="travel"
                  />
                  <EventCard
                    title="Strength Workout"
                    time="10:00 - 11:00"
                    location="Gym"
                    type="strength-training"
                  />
                  <EventCard
                    title="Recovery Routine"
                    time="10:00 - 11:00"
                    location="Recovery Room"
                    type="recovery-session"
                  />
                </div>
              </section>
            </div>
          )}
          
          {activeTab === "training" && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Training Module UI</h2>
              
              <section className="space-y-3">
                <h3 className="text-lg font-medium">Training Sessions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <WorkoutCard
                    title="Explosive Strength - Lower"
                    category="Strength"
                    exercises={8}
                    duration={45}
                  />
                  <WorkoutCard
                    title="Quick Feet & Agility"
                    category="Mobility"
                    exercises={6}
                    duration={30}
                  />
                  <WorkoutCard
                    title="Max Strength - Upper"
                    category="Strength"
                    exercises={10}
                    duration={60}
                  />
                </div>
              </section>
              
              <section className="space-y-3">
                <h3 className="text-lg font-medium">Test Results</h3>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Latest Test Results - Erik Andersson</CardTitle>
                    <CardDescription>Updated April 12, 2025</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <TestResultItem name="5-10-5 Agility" value="4.2s" change={-0.3} isPositive={true} />
                      <TestResultItem name="Bench Press" value="120kg" change={5} isPositive={true} />
                      <TestResultItem name="Squat" value="160kg" change={0} isPositive={false} />
                      <TestResultItem name="VO2 Max" value="58.3" change={1.2} isPositive={true} />
                    </div>
                  </CardContent>
                </Card>
              </section>
            </div>
          )}
          
          {activeTab === "medical" && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Medical Module UI</h2>
              
              <section className="space-y-3">
                <h3 className="text-lg font-medium">Player Availability</h3>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Team Status - A-Team</CardTitle>
                    <CardDescription>16 of 22 players fully available</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <PlayerAvailability 
                        name="Viktor Lindgren" 
                        status="full" 
                        position="Forward"
                        number="21"
                      />
                      <PlayerAvailability 
                        name="Magnus Olsson" 
                        status="limited" 
                        position="Defense"
                        number="44"
                        note="Minor wrist pain - Avoid contact"
                      />
                      <PlayerAvailability 
                        name="Jesper Karlsson" 
                        status="rehab" 
                        position="Forward"
                        number="17"
                        note="Knee injury - Rehab as planned"
                        return="April 22, 2025"
                      />
                      <PlayerAvailability 
                        name="Oliver Nilsson" 
                        status="unavailable" 
                        position="Defense"
                        number="5"
                        note="Concussion protocol"
                        return="TBD"
                      />
                    </div>
                  </CardContent>
                </Card>
              </section>
            </div>
          )}
          
          {activeTab === "communication" && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Communication Module UI</h2>
              
              <section className="space-y-3">
                <h3 className="text-lg font-medium">Team Chat</h3>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">A-Team General</CardTitle>
                    <CardDescription>32 members</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Chat messages would go here */}
                      <p className="text-sm text-muted-foreground">Chat interface to be implemented</p>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full">Open Chat</Button>
                  </CardFooter>
                </Card>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}