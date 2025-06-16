"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Package, AlertTriangle, TrendingUp, ShoppingCart, Wrench,
  Clock, CheckCircle2, XCircle, Plus, Edit, Search,
  Shirt, Shield, Zap, Target, Box, Truck
} from "lucide-react";

export function EquipmentManagerDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  // Mock data for equipment management
  const equipmentStats = {
    totalItems: 1247,
    lowStockItems: 23,
    pendingOrders: 8,
    maintenanceRequired: 12,
    totalValue: 485000,
    monthlyBudget: 25000
  };

  const inventoryCategories = [
    { name: "Jerseys & Uniforms", count: 245, lowStock: 5, value: 125000 },
    { name: "Protective Gear", count: 189, lowStock: 8, value: 180000 },
    { name: "Sticks & Equipment", count: 156, lowStock: 6, value: 95000 },
    { name: "Training Equipment", count: 89, lowStock: 3, value: 45000 },
    { name: "Maintenance Supplies", count: 234, lowStock: 1, value: 15000 },
    { name: "Medical Supplies", count: 78, lowStock: 0, value: 25000 }
  ];

  const lowStockItems = [
    { name: "Senior A Home Jerseys", category: "Jerseys", current: 8, minimum: 15, status: "critical" },
    { name: "Goalie Chest Protectors", category: "Protective Gear", current: 2, minimum: 5, status: "critical" },
    { name: "Practice Pucks", category: "Training", current: 45, minimum: 100, status: "low" },
    { name: "Helmet Visors", category: "Protective Gear", current: 12, minimum: 20, status: "low" },
    { name: "Stick Tape", category: "Supplies", current: 25, minimum: 50, status: "low" }
  ];

  const pendingOrders = [
    { 
      orderNumber: "ORD-2025-001", 
      supplier: "Hockey Pro Equipment", 
      items: 15, 
      value: 12500, 
      status: "shipped",
      expectedDelivery: "Tomorrow"
    },
    { 
      orderNumber: "ORD-2025-002", 
      supplier: "Nordic Sports", 
      items: 8, 
      value: 8900, 
      status: "processing",
      expectedDelivery: "Friday"
    },
    { 
      orderNumber: "ORD-2025-003", 
      supplier: "Elite Hockey Gear", 
      items: 22, 
      value: 15600, 
      status: "pending",
      expectedDelivery: "Next week"
    }
  ];

  const maintenanceItems = [
    { item: "Ice Resurfacer", type: "Machine", priority: "high", lastService: "2 weeks ago", nextService: "Overdue" },
    { item: "Skate Sharpener #1", type: "Equipment", priority: "medium", lastService: "1 month ago", nextService: "This week" },
    { item: "Washing Machine A", type: "Facility", priority: "low", lastService: "3 months ago", nextService: "Next month" },
    { item: "Dryer Unit B", type: "Facility", priority: "medium", lastService: "2 months ago", nextService: "2 weeks" }
  ];

  const recentActivity = [
    { action: "Stock received", details: "50 practice pucks delivered", time: "2 hours ago", type: "delivery" },
    { action: "Equipment issued", details: "New helmet assigned to Erik Lindqvist", time: "4 hours ago", type: "issue" },
    { action: "Maintenance completed", details: "Skate sharpener serviced", time: "1 day ago", type: "maintenance" },
    { action: "Order placed", details: "Emergency jersey order to Hockey Pro", time: "2 days ago", type: "order" },
    { action: "Equipment returned", details: "Damaged stick returned for replacement", time: "3 days ago", type: "return" }
  ];

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'low': return 'bg-amber-100 text-amber-800';
      case 'good': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-amber-100 text-amber-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-amber-100 text-amber-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{equipmentStats.totalItems}</div>
            <p className="text-xs text-muted-foreground mt-1">In inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{equipmentStats.lowStockItems}</div>
            <p className="text-xs text-muted-foreground mt-1">Need reorder</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{equipmentStats.pendingOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Maintenance Due</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{equipmentStats.maintenanceRequired}</div>
            <p className="text-xs text-muted-foreground mt-1">Items requiring service</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{equipmentStats.totalValue.toLocaleString()} SEK</div>
            <p className="text-xs text-muted-foreground mt-1">Inventory value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Monthly Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{equipmentStats.monthlyBudget.toLocaleString()} SEK</div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-xs text-green-600">65% remaining</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Categories */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Inventory Categories</CardTitle>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {inventoryCategories.map((category, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <Package className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <h3 className="font-semibold">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">{category.count} items</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-sm font-medium">{category.value.toLocaleString()} SEK</p>
                    <p className="text-xs text-muted-foreground">Value</p>
                  </div>
                  {category.lowStock > 0 && (
                    <Badge className="bg-red-100 text-red-800">
                      {category.lowStock} low stock
                    </Badge>
                  )}
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Low Stock Alert */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <CardTitle>Low Stock Alerts</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {lowStockItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">{item.category}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-sm font-medium">{item.current} / {item.minimum}</p>
                    <p className="text-xs text-muted-foreground">Current / Minimum</p>
                  </div>
                  <Badge className={getStockStatusColor(item.status)}>
                    {item.status}
                  </Badge>
                  <Button variant="outline" size="sm">
                    <ShoppingCart className="h-3 w-3 mr-1" />
                    Reorder
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className={`h-2 w-2 rounded-full mt-2 ${
                  activity.type === 'delivery' ? 'bg-green-500' :
                  activity.type === 'issue' ? 'bg-blue-500' :
                  activity.type === 'maintenance' ? 'bg-purple-500' :
                  activity.type === 'order' ? 'bg-orange-500' : 'bg-gray-500'
                }`} />
                <div className="flex-1">
                  <p className="font-medium text-sm">{activity.action}</p>
                  <p className="text-sm text-muted-foreground">{activity.details}</p>
                  <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderOrdersTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Pending Orders</CardTitle>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Order
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pendingOrders.map((order, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold">{order.orderNumber}</h3>
                    <p className="text-sm text-muted-foreground">{order.supplier}</p>
                  </div>
                  <Badge className={getOrderStatusColor(order.status)}>
                    {order.status}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Items</p>
                    <p className="font-medium">{order.items}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Value</p>
                    <p className="font-medium">{order.value.toLocaleString()} SEK</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Expected Delivery</p>
                    <p className="font-medium">{order.expectedDelivery}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-3 w-3 mr-1" />
                    Edit Order
                  </Button>
                  <Button variant="outline" size="sm">
                    <Truck className="h-3 w-3 mr-1" />
                    Track Shipment
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="inventory">Inventory</TabsTrigger>
        <TabsTrigger value="orders">Orders</TabsTrigger>
        <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        {renderOverviewTab()}
      </TabsContent>

      <TabsContent value="inventory">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Inventory Management</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Box className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Detailed inventory management coming soon</p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="orders">
        {renderOrdersTab()}
      </TabsContent>

      <TabsContent value="maintenance">
        <Card>
          <CardHeader>
            <CardTitle>Equipment Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {maintenanceItems.map((item, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold">{item.item}</h3>
                      <p className="text-sm text-muted-foreground">{item.type}</p>
                    </div>
                    <Badge className={getPriorityColor(item.priority)}>
                      {item.priority} priority
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Last Service</p>
                      <p className="font-medium">{item.lastService}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Next Service</p>
                      <p className="font-medium">{item.nextService}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Wrench className="h-3 w-3 mr-1" />
                      Schedule Service
                    </Button>
                    <Button variant="outline" size="sm">
                      <Clock className="h-3 w-3 mr-1" />
                      View History
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
} 