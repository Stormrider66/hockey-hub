"use client";

import React, { useState } from "react";
import { DashboardHeader } from "@/components/shared/DashboardHeader";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Calendar,
  AlertCircle,
  ChevronRight,
  Package,
  ShoppingBag,
  Scissors,
  Truck,
  FileText,
  Users,
  Search,
  Plus,
  Activity,
  Clock,
  Check,
  MapPin,
  Clipboard,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  ShoppingCart,
  Package2,
  Wrench,
} from "lucide-react";
// API imports commented out for now - using mock data
// import { 
//   useGetEquipmentOverviewQuery,
//   useCreateOrderMutation 
// } from "@/store/api/equipmentApi";
import { 
  getEventTypeColor, 
  getStatusColor, 
  getPriorityColor,
  spacing,
  grids,
  a11y,
  shadows
} from "@/lib/design-utils";

export default function EquipmentManagerDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedTeam, setSelectedTeam] = useState("senior");
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderItems, setOrderItems] = useState([
    { name: "", quantity: 1, priority: "Medium" as const, notes: "" }
  ]);

  // Mock API state for now
  const apiData = null;
  const isLoading = false;
  const error = null;
  const isCreatingOrder = false;

  const teams = [
    { id: "senior", name: "Senior Team" },
    { id: "junior", name: "Junior A" },
    { id: "u16", name: "U16 Boys" },
  ];

  // Rich fallback data that matches API structure
  const inventoryAlerts = apiData?.inventoryAlerts ?? [
    { item: "Hockey Tape (White)", status: "Low Stock" as const, remaining: 5, reorderLevel: 10, category: "Consumables", supplier: "Hockey Supply Co" },
    { item: "Practice Pucks", status: "Low Stock" as const, remaining: 12, reorderLevel: 20, category: "Practice Equipment", supplier: "Ice Sports Direct" },
    { item: "Game Jerseys (Away, Size L)", status: "Out of Stock" as const, remaining: 0, reorderLevel: 5, category: "Game Equipment", supplier: "Team Apparel Inc" },
  ];

  const upcomingEvents = apiData?.upcomingEvents ?? [
    { date: "Today", title: "Home Game Preparation", team: "Senior Team", time: "16:00", notes: "Set up equipment 2 hours before game", type: "preparation" as const, priority: "High" as const },
    { date: "Tomorrow", title: "Equipment Maintenance", team: "All Teams", time: "10:00", notes: "Sharpen skates for Junior A team", type: "maintenance" as const, priority: "Medium" as const },
  ];

  const maintenanceSchedule = apiData?.maintenanceSchedule ?? [
    { item: "Skate Sharpening", frequency: "Weekly", lastDone: "May 15", nextDue: "May 22", team: "Senior Team", priority: "High" as const, assignedTo: "Equipment Manager" },
    { item: "Helmet Inspection", frequency: "Monthly", lastDone: "May 1", nextDue: "June 1", team: "All Teams", priority: "Medium" as const, assignedTo: "Safety Officer" },
  ];

  const inventoryItems = apiData?.inventoryItems ?? [
    {
      category: "Game Equipment",
      items: [
        { name: "Game Jerseys (Home)", stock: 25, total: 25, condition: "Good" as const, location: "Storage A" },
        { name: "Game Jerseys (Away)", stock: 22, total: 25, condition: "Good" as const, location: "Storage A" },
      ]
    },
    {
      category: "Consumables",
      items: [
        { name: "Hockey Tape (White)", stock: 5, total: 30, condition: "Good" as const, location: "Supply Cabinet" },
        { name: "First Aid Supplies", stock: 4, total: 10, condition: "Good" as const, location: "Medical Kit" },
      ]
    }
  ];

  const maintenanceTasks = apiData?.maintenanceTasks ?? [
    { type: "Skate Sharpening", equipment: "Player Skates", assignedTo: "Equipment Manager", deadline: "May 19", priority: "High" as const, notes: "Sharpen skates before tonight's game", status: "Pending" as const, estimatedTime: "2 hours" },
    { type: "Equipment Inspection", equipment: "Helmets & Pads", assignedTo: "Safety Officer", deadline: "May 20", priority: "Medium" as const, notes: "Monthly safety inspection due", status: "In Progress" as const, estimatedTime: "3 hours" },
  ];

  const gameDayChecklist = apiData?.gameDayChecklist ?? [
    { task: "Set up team bench equipment", assigned: "Equipment Manager", deadline: "2 hours before game", status: "Pending" as const, notes: "Include water bottles, towels, first aid" },
    { task: "Prepare jerseys and socks", assigned: "Equipment Manager", deadline: "3 hours before game", status: "Completed" as const, notes: "Home jerseys ready in locker room" },
  ];

  const handleCreateOrder = async () => {
    try {
      const validItems = orderItems.filter(item => item.name.trim());
      if (validItems.length === 0) return;

      // Mock order creation for now
      console.log("Creating order:", {
        items: validItems,
        urgency: "Normal",
        expectedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });

      setIsOrderModalOpen(false);
      setOrderItems([{ name: "", quantity: 1, priority: "Medium", notes: "" }]);
    } catch (error) {
      console.error("Failed to create order:", error);
    }
  };

  const addOrderItem = () => {
    setOrderItems([...orderItems, { name: "", quantity: 1, priority: "Medium", notes: "" }]);
  };

  const updateOrderItem = (index: number, field: string, value: any) => {
    const updated = [...orderItems];
    updated[index] = { ...updated[index], [field]: value };
    setOrderItems(updated);
  };

  const removeOrderItem = (index: number) => {
    if (orderItems.length > 1) {
      setOrderItems(orderItems.filter((_, i) => i !== index));
    }
  };

  if (error) {
    return (
      <div className={`p-6 ${spacing.section}`} role="alert">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <p>Failed to load equipment dashboard data. Please try again.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader 
        title="Equipment Manager Dashboard"
        subtitle="Manage team equipment, inventory, and maintenance"
        role="equipmentmanager"
      />
      <div className={`p-4 md:p-6 ${spacing.section}`}>
        {/* Team Selector */}
        <div className="flex justify-end items-center gap-4 mb-6">
          <div className="flex items-center space-x-4">
            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
              {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                  {team.name}
                  </SelectItem>
              ))}
              </SelectContent>
            </Select>
          </div>
        </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className={spacing.card}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="gameday">Game Day</TabsTrigger>
          <TabsTrigger value="players">Players</TabsTrigger>
        </TabsList>

        {/* ───────────  OVERVIEW  ─────────── */}
        <TabsContent value="overview" className={spacing.card} role="tabpanel" aria-labelledby="overview-tab">
          <div className={grids.dashboard}>
            {/* Inventory Alerts */}
            <Card className={shadows.card}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" aria-hidden="true" />
                  Inventory Alerts
                </CardTitle>
                <CardDescription>Items requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={spacing.card} role="list" aria-label="Inventory alerts">
                  {isLoading ? (
                    <div className="space-y-3" aria-live="polite">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse flex items-center space-x-3">
                          <div className="h-4 w-4 bg-gray-200 rounded"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                        </div>
                      ))}
                      <span className={a11y.srOnly}>Loading alerts...</span>
                    </div>
                  ) : (
                    inventoryAlerts.map((alert: any, index: number) => (
                      <div key={index} className="flex items-start justify-between p-3 border rounded-lg" role="listitem">
                        <div className="flex items-start space-x-3">
                          <div className={`p-1 rounded ${getStatusColor(alert.status)}`}>
                            {alert.status === "Out of Stock" ? (
                              <XCircle className="h-4 w-4" />
                            ) : (
                              <AlertCircle className="h-4 w-4" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm">{alert.item}</p>
                            <p className="text-xs text-muted-foreground">
                              {alert.remaining} remaining • Reorder at {alert.reorderLevel}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Category: {alert.category} • Supplier: {alert.supplier}
                            </p>
                          </div>
                        </div>
                        <Badge className={getPriorityColor(alert.status)} aria-label={`Status: ${alert.status}`}>
                          {alert.status}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
                  <DialogTrigger asChild>
                    <Button className={a11y.focusVisible}>
                      <ShoppingCart className="mr-2 h-4 w-4" aria-hidden="true" />
                  Create Order
                </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Create Equipment Order</DialogTitle>
                      <DialogDescription>
                        Add items to your order. Orders will be submitted for approval.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto">
                      {orderItems.map((item: any, index: number) => (
                        <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 border rounded-lg">
                          <div className="col-span-5">
                            <Label htmlFor={`item-${index}`}>Item Name</Label>
                            <Input
                              id={`item-${index}`}
                              value={item.name}
                              onChange={(e) => updateOrderItem(index, "name", e.target.value)}
                              placeholder="Enter item name"
                              className="mt-1"
                            />
                          </div>
                          <div className="col-span-2">
                            <Label htmlFor={`quantity-${index}`}>Qty</Label>
                            <Input
                              id={`quantity-${index}`}
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateOrderItem(index, "quantity", parseInt(e.target.value) || 1)}
                              className="mt-1"
                            />
                          </div>
                          <div className="col-span-3">
                            <Label htmlFor={`priority-${index}`}>Priority</Label>
                            <Select
                              value={item.priority}
                              onValueChange={(value) => updateOrderItem(index, "priority", value)}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="High">High</SelectItem>
                                <SelectItem value="Medium">Medium</SelectItem>
                                <SelectItem value="Low">Low</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-2">
                            {orderItems.length > 1 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeOrderItem(index)}
                                className="w-full"
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                          <div className="col-span-12">
                            <Label htmlFor={`notes-${index}`}>Notes (optional)</Label>
                            <Textarea
                              id={`notes-${index}`}
                              value={item.notes}
                              onChange={(e) => updateOrderItem(index, "notes", e.target.value)}
                              placeholder="Additional specifications or notes"
                              className="mt-1"
                              rows={2}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between">
                      <Button variant="outline" onClick={addOrderItem}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Item
                      </Button>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsOrderModalOpen(false)}
                        disabled={isCreatingOrder}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleCreateOrder} disabled={isCreatingOrder}>
                        {isCreatingOrder ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            Create Order
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>

            {/* Upcoming Events */}
            <Card className={shadows.card}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" aria-hidden="true" />
                  Upcoming Events
                </CardTitle>
                <CardDescription>Equipment-related schedule</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={spacing.card} role="list" aria-label="Upcoming events">
                  {isLoading ? (
                    <div className="py-8 text-center" role="status" aria-live="polite">
                      <div className="animate-pulse space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <span className={a11y.srOnly}>Loading events...</span>
                    </div>
                  ) : (
                    upcomingEvents.map((event: any, index: number) => (
                      <div key={index} className="flex items-start space-x-3 border-b pb-3 last:border-0" role="listitem">
                        <div className={`p-2 rounded-md ${getEventTypeColor(event.type || '')}`}>
                          <Calendar className="h-4 w-4" aria-hidden="true" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                            <p className="font-medium text-sm">{event.title}</p>
                            <div className="flex items-center gap-2">
                              <Badge className={getPriorityColor(event.priority || 'Medium')}>
                                {event.priority}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {event.date} • {event.time}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {event.team}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {event.notes}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Maintenance Tasks */}
            <Card className={shadows.card}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" aria-hidden="true" />
                  Active Tasks
                </CardTitle>
                <CardDescription>Current maintenance and tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={spacing.card} role="list" aria-label="Maintenance tasks">
                  {isLoading ? (
                    <div className="space-y-3" aria-live="polite">
                      {[...Array(2)].map((_, i) => (
                        <div key={i} className="animate-pulse p-3 border rounded-lg">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      ))}
                      <span className={a11y.srOnly}>Loading tasks...</span>
                    </div>
                  ) : (
                    maintenanceTasks.map((task: any, index: number) => (
                      <div key={index} className="p-3 border rounded-lg" role="listitem">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium text-sm">{task.type}</p>
                            <p className="text-xs text-muted-foreground">{task.equipment}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getPriorityColor(task.priority)}>
                              {task.priority}
                            </Badge>
                            <Badge variant={task.status === "Completed" ? "secondary" : "outline"}>
                              {task.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>Assigned: {task.assignedTo} • Due: {task.deadline}</p>
                          <p>Est. Time: {task.estimatedTime}</p>
                          <p>{task.notes}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ───────────  INVENTORY  ─────────── */}
        <TabsContent value="inventory" className={spacing.card} role="tabpanel" aria-labelledby="inventory-tab">
          <div className="space-y-6">
            {inventoryItems.map((category: any, categoryIndex: number) => (
              <Card key={categoryIndex} className={shadows.card}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package2 className="h-5 w-5" aria-hidden="true" />
                    {category.category}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {category.items.map((item: any, itemIndex: number) => (
                      <div key={itemIndex} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-medium text-sm">{item.name}</p>
                          <Badge className={getStatusColor(item.condition || 'Good')}>
                            {item.condition}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span>Stock: {item.stock}/{item.total}</span>
                            <span>{item.location}</span>
                          </div>
                          <Progress 
                            value={(item.stock / item.total) * 100} 
                            className="h-2"
                            aria-label={`Stock level: ${item.stock} of ${item.total}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ───────────  MAINTENANCE  ─────────── */}
        <TabsContent value="maintenance" className={spacing.card} role="tabpanel" aria-labelledby="maintenance-tab">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Schedule</CardTitle>
              <CardDescription>Regular equipment maintenance and inspections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {maintenanceSchedule.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{item.item}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.frequency} • {item.team}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Last done: {item.lastDone} • Assigned: {item.assignedTo}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className={getPriorityColor(item.priority || 'Medium')}>
                        {item.priority}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-1">
                        Due: {item.nextDue}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ───────────  GAME DAY  ─────────── */}
        <TabsContent value="gameday" className={spacing.card} role="tabpanel" aria-labelledby="gameday-tab">
          <Card>
            <CardHeader>
              <CardTitle>Game Day Checklist</CardTitle>
              <CardDescription>Pre-game preparation tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {gameDayChecklist.map((item, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <div className={`p-1 rounded ${item.status === 'Completed' ? 'bg-green-100' : 'bg-gray-100'}`}>
                      {item.status === 'Completed' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.task}</p>
                      <p className="text-xs text-muted-foreground">
                        Assigned: {item.assigned} • Deadline: {item.deadline}
                      </p>
                      {item.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>
                      )}
                    </div>
                    <Badge variant={item.status === 'Completed' ? 'secondary' : 'outline'}>
                      {item.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ───────────  PLAYERS  ─────────── */}
        <TabsContent value="players" className={spacing.card} role="tabpanel" aria-labelledby="players-tab">
          <Card>
            <CardHeader>
              <CardTitle>Player Equipment</CardTitle>
              <CardDescription>Individual player equipment tracking</CardDescription>
            </CardHeader>
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">Player equipment tracking coming soon</p>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Equipment Record
                </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
} 