import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Lightbulb, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  Users, 
  Calendar,
  Target,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  BarChart3,
  Zap,
  Shield,
  Brain,
  Sparkles,
  Cpu,
  Settings
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface OptimizationSuggestion {
  id: string;
  title: string;
  description: string;
  category: 'efficiency' | 'cost' | 'utilization' | 'workload' | 'conflict';
  priority: 'high' | 'medium' | 'low';
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  potentialSavings: number;
  timeToImplement: string;
  affectedResources: string[];
  currentMetric: number;
  projectedMetric: number;
  confidence: number;
  actions: string[];
  status: 'new' | 'in-progress' | 'implemented' | 'dismissed';
}

interface OptimizationMetrics {
  totalPotentialSavings: number;
  implementedSavings: number;
  avgConfidence: number;
  completedSuggestions: number;
  totalSuggestions: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const ScheduleOptimizationSuggestions: React.FC = () => {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Mock data - in real implementation, this would come from AI-powered optimization engine
  const suggestions: OptimizationSuggestion[] = [
    {
      id: '1',
      title: 'Implement Dynamic Ice Time Pricing',
      description: 'Peak hours (6-8 PM) have 95% utilization while morning slots (6-8 AM) only reach 35%. Implement surge pricing to balance demand and increase revenue.',
      category: 'cost',
      priority: 'high',
      impact: 'high',
      effort: 'medium',
      potentialSavings: 15000,
      timeToImplement: '2-3 weeks',
      affectedResources: ['Main Ice Rink', 'Practice Rink'],
      currentMetric: 50400,
      projectedMetric: 65400,
      confidence: 87,
      actions: [
        'Analyze historical booking patterns',
        'Set up tiered pricing structure',
        'Implement booking system changes',
        'Communicate changes to users'
      ],
      status: 'new'
    },
    {
      id: '2',
      title: 'Optimize Training Load Distribution',
      description: 'Nathan MacKinnon has 92% training load while Erik Karlsson is at 48%. Redistribute workload to prevent overuse injury and improve team balance.',
      category: 'workload',
      priority: 'high',
      impact: 'medium',
      effort: 'low',
      potentialSavings: 0,
      timeToImplement: 'Immediate',
      affectedResources: ['Nathan MacKinnon', 'Erik Karlsson', 'Training Staff'],
      currentMetric: 92,
      projectedMetric: 78,
      confidence: 92,
      actions: [
        'Reduce MacKinnon\'s intensity by 15%',
        'Increase Karlsson\'s training if medically cleared',
        'Add recovery days for high-load players',
        'Monitor weekly load progression'
      ],
      status: 'new'
    },
    {
      id: '3',
      title: 'Consolidate Conference Room Bookings',
      description: 'Conference Room A has only 45% utilization. Merge smaller meetings into this room and repurpose other spaces for revenue-generating activities.',
      category: 'utilization',
      priority: 'medium',
      impact: 'medium',
      effort: 'low',
      potentialSavings: 5000,
      timeToImplement: '1 week',
      affectedResources: ['Conference Room A', 'Meeting Spaces'],
      currentMetric: 45,
      projectedMetric: 75,
      confidence: 78,
      actions: [
        'Review meeting patterns',
        'Consolidate recurring meetings',
        'Repurpose underutilized spaces',
        'Update booking policies'
      ],
      status: 'in-progress'
    },
    {
      id: '4',
      title: 'Automate Equipment Maintenance Scheduling',
      description: 'Training Equipment Set A has 3 pending issues and 70% maintenance score. Implement predictive maintenance to reduce downtime and costs.',
      category: 'efficiency',
      priority: 'medium',
      impact: 'high',
      effort: 'high',
      potentialSavings: 8000,
      timeToImplement: '4-6 weeks',
      affectedResources: ['All Training Equipment', 'Maintenance Staff'],
      currentMetric: 70,
      projectedMetric: 90,
      confidence: 82,
      actions: [
        'Implement IoT sensors for equipment monitoring',
        'Set up automated scheduling system',
        'Train staff on predictive maintenance',
        'Create maintenance dashboards'
      ],
      status: 'new'
    },
    {
      id: '5',
      title: 'Resolve Weekly Schedule Conflicts',
      description: 'Players have 12 schedule conflicts weekly. Implement buffer times and better coordination to reduce conflicts and improve attendance.',
      category: 'conflict',
      priority: 'high',
      impact: 'medium',
      effort: 'medium',
      potentialSavings: 3000,
      timeToImplement: '1-2 weeks',
      affectedResources: ['All Players', 'Scheduling System'],
      currentMetric: 12,
      projectedMetric: 4,
      confidence: 85,
      actions: [
        'Add 15-minute buffers between sessions',
        'Implement conflict detection alerts',
        'Coordinate with external activities',
        'Set up automated notifications'
      ],
      status: 'new'
    },
    {
      id: '6',
      title: 'Optimize Staff Utilization',
      description: 'Head Coach Smith is at 78% utilization while assistant coaches are underutilized. Better distribute coaching responsibilities.',
      category: 'utilization',
      priority: 'low',
      impact: 'low',
      effort: 'low',
      potentialSavings: 2000,
      timeToImplement: 'Immediate',
      affectedResources: ['Coaching Staff'],
      currentMetric: 78,
      projectedMetric: 68,
      confidence: 70,
      actions: [
        'Delegate specific training sessions',
        'Cross-train assistant coaches',
        'Create coaching rotation schedule',
        'Monitor workload distribution'
      ],
      status: 'implemented'
    }
  ];

  const metrics: OptimizationMetrics = {
    totalPotentialSavings: suggestions.reduce((sum, s) => sum + s.potentialSavings, 0),
    implementedSavings: suggestions.filter(s => s.status === 'implemented').reduce((sum, s) => sum + s.potentialSavings, 0),
    avgConfidence: suggestions.reduce((sum, s) => sum + s.confidence, 0) / suggestions.length,
    completedSuggestions: suggestions.filter(s => s.status === 'implemented').length,
    totalSuggestions: suggestions.length
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'efficiency':
        return <Zap className="h-5 w-5 text-blue-600" />;
      case 'cost':
        return <DollarSign className="h-5 w-5 text-green-600" />;
      case 'utilization':
        return <BarChart3 className="h-5 w-5 text-purple-600" />;
      case 'workload':
        return <Users className="h-5 w-5 text-orange-600" />;
      case 'conflict':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Target className="h-5 w-5 text-gray-600" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">High Priority</Badge>;
      case 'medium':
        return <Badge variant="default" className="bg-orange-100 text-orange-800">Medium Priority</Badge>;
      default:
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Low Priority</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge variant="outline">New</Badge>;
      case 'in-progress':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case 'implemented':
        return <Badge variant="default" className="bg-green-100 text-green-800">Implemented</Badge>;
      case 'dismissed':
        return <Badge variant="secondary">Dismissed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const categoryDistribution = [
    { name: 'Cost Optimization', value: 2, color: '#10b981' },
    { name: 'Resource Utilization', value: 2, color: '#8b5cf6' },
    { name: 'Workload Management', value: 1, color: '#f59e0b' },
    { name: 'Efficiency', value: 1, color: '#3b82f6' },
    { name: 'Conflict Resolution', value: 1, color: '#ef4444' }
  ];

  const impactData = [
    { category: 'High Impact', count: 3, savings: 23000 },
    { category: 'Medium Impact', count: 2, savings: 8000 },
    { category: 'Low Impact', count: 1, savings: 2000 }
  ];

  const filteredSuggestions = suggestions.filter(suggestion => {
    if (categoryFilter !== 'all' && suggestion.category !== categoryFilter) return false;
    if (priorityFilter !== 'all' && suggestion.priority !== priorityFilter) return false;
    if (statusFilter !== 'all' && suggestion.status !== statusFilter) return false;
    return true;
  });

  const implementSuggestion = (id: string) => {
    console.log(`Implementing suggestion: ${id}`);
  };

  const dismissSuggestion = (id: string) => {
    console.log(`Dismissing suggestion: ${id}`);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Brain className="h-8 w-8 text-purple-600 mr-3" />
            Schedule Optimization Suggestions
          </h2>
          <p className="text-gray-600">AI-powered recommendations to improve efficiency and reduce costs</p>
        </div>
        <div className="flex gap-3">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="cost">Cost Optimization</SelectItem>
              <SelectItem value="utilization">Utilization</SelectItem>
              <SelectItem value="efficiency">Efficiency</SelectItem>
              <SelectItem value="workload">Workload</SelectItem>
              <SelectItem value="conflict">Conflicts</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Potential Savings</p>
                <p className="text-2xl font-bold text-gray-900">${metrics.totalPotentialSavings.toLocaleString()}</p>
                <p className="text-xs text-green-600">From {metrics.totalSuggestions} suggestions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Implementation Rate</p>
                <p className="text-2xl font-bold text-gray-900">{((metrics.completedSuggestions / metrics.totalSuggestions) * 100).toFixed(0)}%</p>
                <p className="text-xs text-blue-600">{metrics.completedSuggestions} of {metrics.totalSuggestions} completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Confidence</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.avgConfidence.toFixed(0)}%</p>
                <p className="text-xs text-purple-600">AI prediction accuracy</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Sparkles className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Realized Savings</p>
                <p className="text-2xl font-bold text-gray-900">${metrics.implementedSavings.toLocaleString()}</p>
                <p className="text-xs text-orange-600">From implemented suggestions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="suggestions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="suggestions">Active Suggestions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="implemented">Implemented</TabsTrigger>
        </TabsList>

        <TabsContent value="suggestions" className="space-y-4">
          <div className="grid gap-4">
            {filteredSuggestions.filter(s => s.status !== 'implemented').map((suggestion) => (
              <Card key={suggestion.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        {getCategoryIcon(suggestion.category)}
                        <h3 className="font-semibold text-lg">{suggestion.title}</h3>
                        {getPriorityBadge(suggestion.priority)}
                        {getStatusBadge(suggestion.status)}
                      </div>
                      
                      <p className="text-gray-600 mb-4">{suggestion.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Potential Savings</p>
                          <p className="text-lg font-bold text-green-600">
                            {suggestion.potentialSavings > 0 ? `$${suggestion.potentialSavings.toLocaleString()}` : 'Non-monetary'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Implementation Time</p>
                          <p className="text-lg font-semibold">{suggestion.timeToImplement}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Confidence Level</p>
                          <div className="flex items-center space-x-2">
                            <Progress value={suggestion.confidence} className="flex-1 h-2" />
                            <span className="text-sm font-medium">{suggestion.confidence}%</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Expected Impact</p>
                          <p className={`text-lg font-semibold ${getImpactColor(suggestion.impact)} capitalize`}>
                            {suggestion.impact}
                          </p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-600 mb-2">Current vs Projected:</p>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl font-bold text-red-600">{suggestion.currentMetric}</span>
                            <ArrowRight className="h-4 w-4 text-gray-400" />
                            <span className="text-2xl font-bold text-green-600">{suggestion.projectedMetric}</span>
                          </div>
                          <Badge variant="outline" className="bg-blue-50">
                            {suggestion.category === 'cost' || suggestion.category === 'conflict' ? 
                              `${Math.abs(((suggestion.projectedMetric - suggestion.currentMetric) / suggestion.currentMetric * 100)).toFixed(1)}% ${suggestion.projectedMetric > suggestion.currentMetric ? 'increase' : 'reduction'}` :
                              `${Math.abs(((suggestion.projectedMetric - suggestion.currentMetric) / suggestion.currentMetric * 100)).toFixed(1)}% improvement`
                            }
                          </Badge>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-600 mb-2">Action Items:</p>
                        <ul className="space-y-1">
                          {suggestion.actions.map((action, index) => (
                            <li key={index} className="flex items-center space-x-2 text-sm">
                              <CheckCircle className="h-3 w-3 text-green-600" />
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-600 mb-2">Affected Resources:</p>
                        <div className="flex flex-wrap gap-2">
                          {suggestion.affectedResources.map((resource, index) => (
                            <Badge key={index} variant="outline">{resource}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2 ml-4">
                      <Button 
                        size="sm" 
                        onClick={() => implementSuggestion(suggestion.id)}
                        disabled={suggestion.status === 'in-progress'}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        {suggestion.status === 'in-progress' ? 'In Progress' : 'Implement'}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => dismissSuggestion(suggestion.id)}
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Suggestions by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Impact Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Impact vs Potential Savings</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={impactData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="savings" fill="#10b981" />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Optimization Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Optimization Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <Cpu className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">AI Processing</h3>
                  <p className="text-3xl font-bold text-blue-600">24/7</p>
                  <p className="text-sm text-gray-600">Continuous optimization monitoring</p>
                </div>
                
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center">
                    <Target className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Accuracy Rate</h3>
                  <p className="text-3xl font-bold text-green-600">{metrics.avgConfidence.toFixed(0)}%</p>
                  <p className="text-sm text-gray-600">Prediction accuracy</p>
                </div>
                
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                    <Lightbulb className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Suggestions Generated</h3>
                  <p className="text-3xl font-bold text-orange-600">{metrics.totalSuggestions}</p>
                  <p className="text-sm text-gray-600">Total optimization opportunities</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="implemented" className="space-y-4">
          <div className="grid gap-4">
            {suggestions.filter(s => s.status === 'implemented').map((suggestion) => (
              <Card key={suggestion.id} className="border-green-200 bg-green-50">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                        <h3 className="font-semibold text-lg">{suggestion.title}</h3>
                        <Badge variant="default" className="bg-green-100 text-green-800">Implemented</Badge>
                      </div>
                      
                      <p className="text-gray-600 mb-4">{suggestion.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Realized Savings</p>
                          <p className="text-lg font-bold text-green-600">
                            {suggestion.potentialSavings > 0 ? `$${suggestion.potentialSavings.toLocaleString()}` : 'Non-monetary'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Implementation Time</p>
                          <p className="text-lg font-semibold">{suggestion.timeToImplement}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Actual Impact</p>
                          <p className={`text-lg font-semibold ${getImpactColor(suggestion.impact)} capitalize`}>
                            {suggestion.impact}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Success Rate</p>
                          <p className="text-lg font-bold text-green-600">{suggestion.confidence}%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ScheduleOptimizationSuggestions;