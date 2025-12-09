"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { 
  Package, Search, AlertCircle, CheckCircle, 
  XCircle, ShirtIcon, Users, MapPin,
  Activity, ChevronRight, Wrench, Clock,
  ShoppingCart, TrendingDown, TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EquipmentItem {
  id: string;
  name: string;
  category: string;
  totalStock: number;
  available: number;
  inUse: number;
  maintenance: number;
  location: string;
  status: 'good' | 'low' | 'critical' | 'out';
  lastRestocked?: string;
  reorderLevel: number;
  supplier?: string;
}

interface TeamEquipment {
  teamId: string;
  teamName: string;
  equipmentIssued: number;
  equipmentReturned: number;
  outstandingItems: number;
}

export function EquipmentAvailabilityOverlay() {
  const [activeTab, setActiveTab] = useState("inventory");
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data - would come from API
  const equipmentItems: EquipmentItem[] = [
    {
      id: "1",
      name: "Game Jerseys (Home)",
      category: "Game Equipment",
      totalStock: 25,
      available: 20,
      inUse: 5,
      maintenance: 0,
      location: "Storage A",
      status: "good",
      reorderLevel: 10,
      supplier: "Team Apparel Inc"
    },
    {
      id: "2",
      name: "Hockey Sticks (Senior)",
      category: "Player Equipment",
      totalStock: 40,
      available: 8,
      inUse: 30,
      maintenance: 2,
      location: "Equipment Room",
      status: "low",
      reorderLevel: 15,
      supplier: "Hockey Supply Co"
    },
    {
      id: "3",
      name: "Practice Pucks",
      category: "Practice Equipment",
      totalStock: 200,
      available: 45,
      inUse: 155,
      maintenance: 0,
      location: "Rink Storage",
      status: "low",
      reorderLevel: 100,
      supplier: "Ice Sports Direct"
    },
    {
      id: "4",
      name: "Goalie Pads (Senior)",
      category: "Goalie Equipment",
      totalStock: 6,
      available: 1,
      inUse: 4,
      maintenance: 1,
      location: "Goalie Room",
      status: "critical",
      reorderLevel: 3,
      supplier: "Goalie Gear Pro"
    },
    {
      id: "5",
      name: "Hockey Tape (White)",
      category: "Consumables",
      totalStock: 50,
      available: 5,
      inUse: 45,
      maintenance: 0,
      location: "Supply Cabinet",
      status: "critical",
      reorderLevel: 20,
      supplier: "Hockey Supply Co"
    },
    {
      id: "6",
      name: "First Aid Supplies",
      category: "Medical",
      totalStock: 10,
      available: 2,
      inUse: 8,
      maintenance: 0,
      location: "Medical Kit",
      status: "critical",
      reorderLevel: 5,
      supplier: "Medical Supply Direct"
    }
  ];

  const teamEquipment: TeamEquipment[] = [
    {
      teamId: "1",
      teamName: "Senior Team",
      equipmentIssued: 125,
      equipmentReturned: 110,
      outstandingItems: 15
    },
    {
      teamId: "2",
      teamName: "Junior A",
      equipmentIssued: 98,
      equipmentReturned: 95,
      outstandingItems: 3
    },
    {
      teamId: "3",
      teamName: "U16 Boys",
      equipmentIssued: 85,
      equipmentReturned: 82,
      outstandingItems: 3
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-600 bg-green-50';
      case 'low':
        return 'text-amber-600 bg-amber-50';
      case 'critical':
        return 'text-red-600 bg-red-50';
      case 'out':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="h-3 w-3" />;
      case 'low':
        return <AlertCircle className="h-3 w-3" />;
      case 'critical':
        return <XCircle className="h-3 w-3" />;
      case 'out':
        return <XCircle className="h-3 w-3" />;
      default:
        return <Activity className="h-3 w-3" />;
    }
  };

  const filteredItems = equipmentItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const criticalItems = equipmentItems.filter(item => item.status === 'critical' || item.status === 'out');
  const lowStockItems = equipmentItems.filter(item => item.status === 'low');

  return (
    <Card className="w-96 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5" />
            Equipment Availability
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="text-xs">
              {criticalItems.length} Critical
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {lowStockItems.length} Low
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="teams">By Team</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="inventory" className="px-4 pb-4 mt-4">
            <div className="mb-3">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search equipment..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
            </div>

            <ScrollArea className="h-80">
              <div className="space-y-2 pr-4">
                {filteredItems.map(item => (
                  <Card key={item.id} className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.category}</p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs gap-1", getStatusColor(item.status))}
                      >
                        {getStatusIcon(item.status)}
                        {item.status.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Available</span>
                        <span className="font-medium">{item.available}/{item.totalStock}</span>
                      </div>
                      <Progress 
                        value={(item.available / item.totalStock) * 100} 
                        className="h-2"
                      />
                      
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {item.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {item.inUse} in use
                        </span>
                      </div>

                      {item.maintenance > 0 && (
                        <div className="flex items-center gap-1 text-xs text-amber-600">
                          <Wrench className="h-3 w-3" />
                          {item.maintenance} in maintenance
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="teams" className="px-4 pb-4 mt-4">
            <ScrollArea className="h-80">
              <div className="space-y-3 pr-4">
                {teamEquipment.map(team => (
                  <Card key={team.teamId} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">{team.teamName}</h4>
                      {team.outstandingItems > 0 && (
                        <Badge variant="outline" className="text-xs text-amber-600 border-amber-600">
                          {team.outstandingItems} Outstanding
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Equipment Issued</span>
                        <span className="font-medium">{team.equipmentIssued}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Equipment Returned</span>
                        <span className="font-medium">{team.equipmentReturned}</span>
                      </div>
                      
                      <div className="pt-2 border-t">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Return Rate</span>
                          <span className="text-sm font-bold">
                            {Math.round((team.equipmentReturned / team.equipmentIssued) * 100)}%
                          </span>
                        </div>
                        <Progress 
                          value={(team.equipmentReturned / team.equipmentIssued) * 100} 
                          className="h-2 mt-1"
                        />
                      </div>
                    </div>

                    <Button variant="ghost" size="sm" className="w-full mt-3 justify-between">
                      View Details
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="alerts" className="px-4 pb-4 mt-4">
            <ScrollArea className="h-80">
              <div className="space-y-3 pr-4">
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    Critical Stock Levels
                  </h4>
                  <div className="space-y-2">
                    {criticalItems.map(item => (
                      <Card key={item.id} className="p-3 border-red-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Only {item.available} of {item.totalStock} available
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Reorder level: {item.reorderLevel} • {item.supplier}
                            </p>
                          </div>
                          <Button size="sm" variant="outline" className="text-xs">
                            <ShoppingCart className="h-3 w-3 mr-1" />
                            Order
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="pt-3">
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-amber-600" />
                    Low Stock Warning
                  </h4>
                  <div className="space-y-2">
                    {lowStockItems.map(item => (
                      <Card key={item.id} className="p-3 border-amber-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.available} available ({Math.round((item.available / item.totalStock) * 100)}% stock)
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs text-amber-600 border-amber-600">
                            Low Stock
                          </Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}