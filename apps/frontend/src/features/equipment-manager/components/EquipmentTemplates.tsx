"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileText, Search, Clock, Users, Calendar,
  ShirtIcon, Wrench, Package, Truck, Activity,
  ChevronRight, Star, TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EquipmentTemplate {
  id: string;
  name: string;
  description: string;
  category: 'fitting' | 'maintenance' | 'inventory' | 'seasonal';
  icon: React.ComponentType<{ className?: string }>;
  duration: number; // in minutes
  frequency?: string;
  lastUsed?: string;
  usageCount: number;
  tasks: string[];
  requiredEquipment: string[];
  estimatedParticipants?: string;
}

interface EquipmentTemplatesProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: EquipmentTemplate) => void;
}

export function EquipmentTemplates({ isOpen, onClose, onSelectTemplate }: EquipmentTemplatesProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Mock templates - would come from API
  const templates: EquipmentTemplate[] = [
    {
      id: "1",
      name: "Pre-Season Equipment Check",
      description: "Comprehensive equipment inspection and fitting for all players before season start",
      category: "seasonal",
      icon: Activity,
      duration: 240,
      frequency: "Yearly",
      lastUsed: "August 15, 2024",
      usageCount: 3,
      tasks: [
        "Inspect all player equipment for safety",
        "Update player measurements",
        "Check equipment certification dates",
        "Replace worn-out items",
        "Document equipment assignments"
      ],
      requiredEquipment: ["Measurement tools", "Inspection checklist", "Replacement equipment"],
      estimatedParticipants: "Full team (25-30 players)"
    },
    {
      id: "2",
      name: "New Player Equipment Setup",
      description: "Complete equipment fitting and assignment for new team members",
      category: "fitting",
      icon: ShirtIcon,
      duration: 60,
      lastUsed: "January 10, 2025",
      usageCount: 12,
      tasks: [
        "Take all measurements",
        "Assign equipment from inventory",
        "Order custom items if needed",
        "Create equipment card",
        "Schedule follow-up fitting"
      ],
      requiredEquipment: ["Size charts", "Equipment samples", "Assignment forms"],
      estimatedParticipants: "1-3 players"
    },
    {
      id: "3",
      name: "Weekly Skate Maintenance",
      description: "Regular skate sharpening and blade inspection routine",
      category: "maintenance",
      icon: Wrench,
      duration: 120,
      frequency: "Weekly",
      lastUsed: "June 26, 2025",
      usageCount: 45,
      tasks: [
        "Collect skates from players",
        "Inspect blades for damage",
        "Sharpen to player preferences",
        "Check boot condition",
        "Return to players"
      ],
      requiredEquipment: ["Skate sharpener", "Blade gauge", "Work orders"],
      estimatedParticipants: "20-25 players"
    },
    {
      id: "4",
      name: "Monthly Inventory Count",
      description: "Complete inventory audit and reorder assessment",
      category: "inventory",
      icon: Package,
      duration: 180,
      frequency: "Monthly",
      lastUsed: "June 1, 2025",
      usageCount: 18,
      tasks: [
        "Count all equipment categories",
        "Update inventory system",
        "Identify items below reorder level",
        "Check for damaged items",
        "Generate reorder report"
      ],
      requiredEquipment: ["Inventory sheets", "Scanner", "Database access"],
      estimatedParticipants: "Equipment staff (2-3 people)"
    },
    {
      id: "5",
      name: "Game Day Equipment Prep",
      description: "Pre-game equipment setup and distribution",
      category: "seasonal",
      icon: Activity,
      duration: 90,
      lastUsed: "June 25, 2025",
      usageCount: 32,
      tasks: [
        "Set up jerseys in locker room",
        "Prepare water bottles and towels",
        "Check emergency equipment",
        "Distribute tape and accessories",
        "Prepare backup equipment"
      ],
      requiredEquipment: ["Game jerseys", "Accessories", "Emergency kit"],
      estimatedParticipants: "Full team"
    },
    {
      id: "6",
      name: "Equipment Delivery Processing",
      description: "Receive and process new equipment shipments",
      category: "inventory",
      icon: Truck,
      duration: 60,
      lastUsed: "June 20, 2025",
      usageCount: 8,
      tasks: [
        "Verify shipment against order",
        "Inspect for damage",
        "Update inventory system",
        "Store in appropriate locations",
        "Notify relevant staff"
      ],
      requiredEquipment: ["Purchase orders", "Scanner", "Storage labels"],
      estimatedParticipants: "Equipment staff"
    },
    {
      id: "7",
      name: "Helmet Safety Inspection",
      description: "Mandatory safety inspection of all helmets and protective gear",
      category: "maintenance",
      icon: Wrench,
      duration: 150,
      frequency: "Quarterly",
      lastUsed: "May 1, 2025",
      usageCount: 9,
      tasks: [
        "Visual inspection for cracks",
        "Check certification dates",
        "Test fit on players",
        "Document findings",
        "Replace non-compliant items"
      ],
      requiredEquipment: ["Inspection forms", "Certification guide", "Replacement helmets"],
      estimatedParticipants: "All players"
    },
    {
      id: "8",
      name: "Try-Out Equipment Session",
      description: "Equipment testing session for new products or brands",
      category: "fitting",
      icon: ShirtIcon,
      duration: 90,
      lastUsed: "April 15, 2025",
      usageCount: 4,
      tasks: [
        "Set up testing stations",
        "Brief players on evaluation criteria",
        "Distribute test equipment",
        "Collect feedback forms",
        "Compile evaluation report"
      ],
      requiredEquipment: ["Test equipment", "Feedback forms", "Comparison charts"],
      estimatedParticipants: "8-12 volunteer players"
    }
  ];

  const categories = [
    { id: "all", label: "All Templates", count: templates.length },
    { id: "fitting", label: "Fitting", count: templates.filter(t => t.category === 'fitting').length },
    { id: "maintenance", label: "Maintenance", count: templates.filter(t => t.category === 'maintenance').length },
    { id: "inventory", label: "Inventory", count: templates.filter(t => t.category === 'inventory').length },
    { id: "seasonal", label: "Seasonal", count: templates.filter(t => t.category === 'seasonal').length }
  ];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'fitting':
        return 'text-blue-600 bg-blue-50';
      case 'maintenance':
        return 'text-amber-600 bg-amber-50';
      case 'inventory':
        return 'text-green-600 bg-green-50';
      case 'seasonal':
        return 'text-purple-600 bg-purple-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Equipment Task Templates
          </DialogTitle>
          <DialogDescription>
            Select a pre-configured template to quickly schedule common equipment tasks
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 pb-2 border-b">
            {categories.map(category => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="gap-2"
              >
                {category.label}
                <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                  {category.count}
                </Badge>
              </Button>
            ))}
          </div>
        </div>

        <ScrollArea className="flex-1 mt-4">
          <div className="grid grid-cols-1 gap-3 pr-4">
            {filteredTemplates.map(template => (
              <Card 
                key={template.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onSelectTemplate(template)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={cn("p-2 rounded-lg", getCategoryColor(template.category))}>
                        <template.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <CardDescription className="text-sm mt-1">
                          {template.description}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="outline" className="text-xs">
                        {template.frequency || 'One-time'}
                      </Badge>
                      {template.usageCount > 10 && (
                        <div className="flex items-center gap-1 text-amber-600">
                          <Star className="h-3 w-3 fill-current" />
                          <span className="text-xs">Popular</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{template.duration} minutes</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{template.estimatedParticipants}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      <span>Used {template.usageCount} times</span>
                    </div>
                    {template.lastUsed && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Last: {template.lastUsed}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Key Tasks:</p>
                      <div className="flex flex-wrap gap-1">
                        {template.tasks.slice(0, 3).map((task, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {task}
                          </Badge>
                        ))}
                        {template.tasks.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{template.tasks.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full mt-3 justify-between group"
                  >
                    Use This Template
                    <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}