"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ClipboardList, Search, Clock, Users, Activity,
  Zap, Heart, Brain, Shield, Stethoscope,
  Calendar, Star, TrendingUp, FileText, Plus,
  ChevronRight, Filter, CheckCircle, AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TreatmentTemplate {
  id: string;
  name: string;
  category: 'injury' | 'preventive' | 'recovery' | 'screening' | 'emergency';
  description: string;
  duration: number;
  sessions: number;
  frequency: string;
  equipment: string[];
  staffRequired: string[];
  protocols: string[];
  outcomes: string[];
  useCount: number;
  lastUsed: string;
  effectiveness: number;
}

interface TreatmentTemplatesProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: TreatmentTemplate) => void;
}

export function TreatmentTemplates({ isOpen, onClose, onSelectTemplate }: TreatmentTemplatesProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Mock template data
  const templates: TreatmentTemplate[] = [
    {
      id: "1",
      name: "ACL Rehabilitation Protocol",
      category: "injury",
      description: "Comprehensive 6-month ACL recovery program with progressive phases",
      duration: 45,
      sessions: 72,
      frequency: "3x per week",
      equipment: ["Resistance bands", "Balance board", "Leg press", "Bike"],
      staffRequired: ["Physiotherapist", "Athletic Therapist"],
      protocols: ["ROM exercises", "Strength training", "Balance work", "Sport-specific drills"],
      outcomes: ["Full ROM", "85% strength return", "Functional testing pass"],
      useCount: 24,
      lastUsed: "2 days ago",
      effectiveness: 92
    },
    {
      id: "2",
      name: "Concussion Return-to-Play",
      category: "injury",
      description: "Step-by-step concussion recovery protocol following latest guidelines",
      duration: 30,
      sessions: 10,
      frequency: "Daily monitoring",
      equipment: ["ImPACT system", "Balance assessment tools"],
      staffRequired: ["Team Physician", "Neuropsychologist"],
      protocols: ["Symptom monitoring", "Cognitive testing", "Gradual exertion", "Contact progression"],
      outcomes: ["Symptom-free", "Baseline cognitive scores", "Medical clearance"],
      useCount: 18,
      lastUsed: "1 week ago",
      effectiveness: 100
    },
    {
      id: "3",
      name: "Pre-Season Medical Screening",
      category: "screening",
      description: "Complete medical evaluation for all players before season start",
      duration: 60,
      sessions: 1,
      frequency: "Annual",
      equipment: ["ECG", "Spirometer", "Blood pressure monitor", "Lab tests"],
      staffRequired: ["Team Physician", "Nurse", "Lab Technician"],
      protocols: ["Cardiac screening", "Musculoskeletal exam", "Blood work", "Fitness testing"],
      outcomes: ["Medical clearance", "Baseline data", "Risk assessment"],
      useCount: 45,
      lastUsed: "3 months ago",
      effectiveness: 98
    },
    {
      id: "4",
      name: "Hamstring Strain Recovery",
      category: "injury",
      description: "Evidence-based hamstring rehabilitation program",
      duration: 30,
      sessions: 20,
      frequency: "4x per week",
      equipment: ["Ultrasound", "TENS", "Resistance equipment"],
      staffRequired: ["Physiotherapist"],
      protocols: ["Pain management", "Flexibility work", "Eccentric strengthening", "Running progression"],
      outcomes: ["Pain-free movement", "Full flexibility", "Return to sprint"],
      useCount: 36,
      lastUsed: "4 days ago",
      effectiveness: 88
    },
    {
      id: "5",
      name: "Recovery & Regeneration",
      category: "recovery",
      description: "Post-game recovery protocol to optimize player readiness",
      duration: 90,
      sessions: 1,
      frequency: "After each game",
      equipment: ["Ice bath", "Compression devices", "Foam rollers", "Massage table"],
      staffRequired: ["Athletic Therapist", "Massage Therapist"],
      protocols: ["Cold therapy", "Compression", "Massage", "Stretching", "Nutrition"],
      outcomes: ["Reduced soreness", "Improved recovery markers", "Player readiness"],
      useCount: 156,
      lastUsed: "Yesterday",
      effectiveness: 95
    },
    {
      id: "6",
      name: "Injury Prevention Program",
      category: "preventive",
      description: "Comprehensive injury prevention training for high-risk players",
      duration: 45,
      sessions: 24,
      frequency: "2x per week",
      equipment: ["Balance equipment", "Resistance bands", "Agility ladder"],
      staffRequired: ["Athletic Therapist", "Strength Coach"],
      protocols: ["Dynamic warm-up", "Balance training", "Core stability", "Flexibility"],
      outcomes: ["Reduced injury risk", "Improved stability", "Enhanced performance"],
      useCount: 67,
      lastUsed: "3 days ago",
      effectiveness: 85
    }
  ];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'injury': return <Activity className="h-4 w-4" />;
      case 'preventive': return <Shield className="h-4 w-4" />;
      case 'recovery': return <Heart className="h-4 w-4" />;
      case 'screening': return <Stethoscope className="h-4 w-4" />;
      case 'emergency': return <AlertCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'injury': return 'text-red-600 bg-red-50';
      case 'preventive': return 'text-blue-600 bg-blue-50';
      case 'recovery': return 'text-green-600 bg-green-50';
      case 'screening': return 'text-purple-600 bg-purple-50';
      case 'emergency': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Treatment Templates
          </DialogTitle>
          <DialogDescription>
            Select a pre-configured treatment protocol or screening template
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {/* Category Tabs */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid grid-cols-6 w-full">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="injury">Injury</TabsTrigger>
              <TabsTrigger value="preventive">Preventive</TabsTrigger>
              <TabsTrigger value="recovery">Recovery</TabsTrigger>
              <TabsTrigger value="screening">Screening</TabsTrigger>
              <TabsTrigger value="emergency">Emergency</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Templates Grid */}
          <ScrollArea className="h-[500px]">
            <div className="grid grid-cols-2 gap-4 pr-4">
              {filteredTemplates.map(template => (
                <Card 
                  key={template.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => onSelectTemplate(template)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn("p-1.5 rounded", getCategoryColor(template.category))}>
                          {getCategoryIcon(template.category)}
                        </div>
                        <div>
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          <p className="text-xs text-muted-foreground mt-1">
                            {template.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star className="h-3 w-3 fill-current" />
                        <span className="text-xs font-medium">{template.effectiveness}%</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span>{template.duration} min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span>{template.sessions} sessions</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-muted-foreground" />
                        <span>{template.frequency}</span>
                      </div>
                    </div>

                    {/* Protocols */}
                    <div>
                      <p className="text-xs font-medium mb-1">Key Protocols:</p>
                      <div className="flex flex-wrap gap-1">
                        {template.protocols.slice(0, 3).map((protocol, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {protocol}
                          </Badge>
                        ))}
                        {template.protocols.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{template.protocols.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Staff Requirements */}
                    <div className="flex items-center gap-2 text-xs">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Staff:</span>
                      <span>{template.staffRequired.join(", ")}</span>
                    </div>

                    {/* Usage Stats */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>Used {template.useCount} times</span>
                        <span>•</span>
                        <span>Last: {template.lastUsed}</span>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 text-xs">
                        Use Template
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>

          {/* Create New Template */}
          <div className="pt-4 border-t flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Can't find what you're looking for?
            </p>
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Create Custom Template
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}