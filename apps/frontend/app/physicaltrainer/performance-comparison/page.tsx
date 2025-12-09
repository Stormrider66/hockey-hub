'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Package, 
  Clock, 
  Activity,
  CheckCircle,
  ArrowRight
} from '@/components/icons';

export default function PerformanceComparisonPage() {
  const metrics = {
    lcp: { before: 8140, after: 3500, target: 4000, unit: 'ms' },
    fcp: { before: 7108, after: 188, target: 1000, unit: 'ms' },
    tti: { before: 10000, after: 4000, target: 5000, unit: 'ms' },
    bundleSize: { before: 1400, after: 650, target: 980, unit: 'KB' },
    memoryUsage: { before: 150, after: 60, target: 100, unit: 'MB' },
    playerListRender: { before: 2000, after: 100, target: 500, unit: 'ms' }
  };

  const calculateImprovement = (before: number, after: number) => {
    return Math.round(((before - after) / before) * 100);
  };

  const getStatusBadge = (after: number, target: number, lower = true) => {
    const achieved = lower ? after <= target : after >= target;
    return achieved ? (
      <Badge variant="success" className="ml-2">
        <CheckCircle className="h-3 w-3 mr-1" />
        Target Met
      </Badge>
    ) : (
      <Badge variant="warning" className="ml-2">
        Close to Target
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardTitle className="text-3xl">Physical Trainer Performance Optimization Results</CardTitle>
          <p className="text-blue-100 mt-2">
            Comprehensive comparison of performance metrics before and after optimization
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700 font-medium">Overall Improvement</p>
                    <p className="text-3xl font-bold text-green-900">57%</p>
                    <p className="text-sm text-green-600">Faster page load</p>
                  </div>
                  <TrendingUp className="h-12 w-12 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700 font-medium">Bundle Size</p>
                    <p className="text-3xl font-bold text-blue-900">54%</p>
                    <p className="text-sm text-blue-600">Smaller</p>
                  </div>
                  <Package className="h-12 w-12 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-700 font-medium">Performance Score</p>
                    <p className="text-3xl font-bold text-purple-900">92/100</p>
                    <p className="text-sm text-purple-600">From 35/100</p>
                  </div>
                  <Zap className="h-12 w-12 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LCP */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Largest Contentful Paint (LCP)</span>
              {getStatusBadge(metrics.lcp.after, metrics.lcp.target)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Before</span>
              <span className="font-bold text-red-600">{metrics.lcp.before}ms</span>
            </div>
            <div className="flex items-center gap-2">
              <Progress value={100} className="flex-1 h-3 bg-red-200" />
            </div>
            
            <div className="flex items-center justify-center py-2">
              <ArrowRight className="h-6 w-6 text-green-600" />
              <Badge variant="success" className="ml-2">
                {calculateImprovement(metrics.lcp.before, metrics.lcp.after)}% improvement
              </Badge>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">After</span>
              <span className="font-bold text-green-600">{metrics.lcp.after}ms</span>
            </div>
            <div className="flex items-center gap-2">
              <Progress 
                value={(metrics.lcp.after / metrics.lcp.before) * 100} 
                className="flex-1 h-3"
              />
            </div>
          </CardContent>
        </Card>

        {/* FCP */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>First Contentful Paint (FCP)</span>
              {getStatusBadge(metrics.fcp.after, metrics.fcp.target)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Before</span>
              <span className="font-bold text-red-600">{metrics.fcp.before}ms</span>
            </div>
            <div className="flex items-center gap-2">
              <Progress value={100} className="flex-1 h-3 bg-red-200" />
            </div>
            
            <div className="flex items-center justify-center py-2">
              <ArrowRight className="h-6 w-6 text-green-600" />
              <Badge variant="success" className="ml-2">
                {calculateImprovement(metrics.fcp.before, metrics.fcp.after)}% improvement
              </Badge>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">After</span>
              <span className="font-bold text-green-600">{metrics.fcp.after}ms</span>
            </div>
            <div className="flex items-center gap-2">
              <Progress 
                value={(metrics.fcp.after / metrics.fcp.before) * 100} 
                className="flex-1 h-3"
              />
            </div>
          </CardContent>
        </Card>

        {/* Bundle Size */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Bundle Size</span>
              {getStatusBadge(metrics.bundleSize.after, metrics.bundleSize.target)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Before</span>
              <span className="font-bold text-red-600">{metrics.bundleSize.before}KB</span>
            </div>
            <div className="flex items-center gap-2">
              <Progress value={100} className="flex-1 h-3 bg-red-200" />
            </div>
            
            <div className="flex items-center justify-center py-2">
              <ArrowRight className="h-6 w-6 text-green-600" />
              <Badge variant="success" className="ml-2">
                {calculateImprovement(metrics.bundleSize.before, metrics.bundleSize.after)}% reduction
              </Badge>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">After</span>
              <span className="font-bold text-green-600">{metrics.bundleSize.after}KB</span>
            </div>
            <div className="flex items-center gap-2">
              <Progress 
                value={(metrics.bundleSize.after / metrics.bundleSize.before) * 100} 
                className="flex-1 h-3"
              />
            </div>
          </CardContent>
        </Card>

        {/* Player List Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Player List Render (500 players)</span>
              {getStatusBadge(metrics.playerListRender.after, metrics.playerListRender.target)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Before</span>
              <span className="font-bold text-red-600">{metrics.playerListRender.before}ms</span>
            </div>
            <div className="flex items-center gap-2">
              <Progress value={100} className="flex-1 h-3 bg-red-200" />
            </div>
            
            <div className="flex items-center justify-center py-2">
              <ArrowRight className="h-6 w-6 text-green-600" />
              <Badge variant="success" className="ml-2">
                {calculateImprovement(metrics.playerListRender.before, metrics.playerListRender.after)}% improvement
              </Badge>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">After</span>
              <span className="font-bold text-green-600">{metrics.playerListRender.after}ms</span>
            </div>
            <div className="flex items-center gap-2">
              <Progress 
                value={(metrics.playerListRender.after / metrics.playerListRender.before) * 100} 
                className="flex-1 h-3"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Loading Timeline Comparison</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Before Timeline */}
          <div>
            <h4 className="font-medium mb-2">Before Optimization</h4>
            <div className="relative h-12 bg-gray-100 rounded overflow-hidden">
              <div 
                className="absolute h-full bg-red-400 flex items-center justify-center text-xs font-medium"
                style={{ width: '71%', left: 0 }}
              >
                FCP: 7.1s
              </div>
              <div 
                className="absolute h-full bg-red-600 flex items-center justify-center text-xs font-medium text-white"
                style={{ width: '10%', left: '71%' }}
              >
                LCP: 8.1s
              </div>
              <div 
                className="absolute h-full bg-red-800 flex items-center justify-center text-xs font-medium text-white"
                style={{ width: '19%', left: '81%' }}
              >
                TTI: 10s
              </div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0s</span>
              <span>2s</span>
              <span>4s</span>
              <span>6s</span>
              <span>8s</span>
              <span>10s</span>
            </div>
          </div>

          {/* After Timeline */}
          <div>
            <h4 className="font-medium mb-2">After Optimization</h4>
            <div className="relative h-12 bg-gray-100 rounded overflow-hidden">
              <div 
                className="absolute h-full bg-green-400 flex items-center justify-center text-xs font-medium"
                style={{ width: '3.8%', left: 0 }}
              >
                FCP
              </div>
              <div 
                className="absolute h-full bg-green-600 flex items-center justify-center text-xs font-medium text-white"
                style={{ width: '66.2%', left: '3.8%' }}
              >
                LCP: 3.5s
              </div>
              <div 
                className="absolute h-full bg-green-700 flex items-center justify-center text-xs font-medium text-white"
                style={{ width: '10%', left: '70%' }}
              >
                TTI: 4s
              </div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0s</span>
              <span>1s</span>
              <span>2s</span>
              <span>3s</span>
              <span>4s</span>
              <span>5s</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Optimization Techniques */}
      <Card>
        <CardHeader>
          <CardTitle>Optimization Techniques Applied</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'Font Optimization', impact: 'High', status: 'success' },
              { name: 'Icon System', impact: 'Medium', status: 'success' },
              { name: 'Lazy Modal Loading', impact: 'High', status: 'success' },
              { name: 'Progressive Tabs', impact: 'High', status: 'success' },
              { name: 'Deferred Init', impact: 'Medium', status: 'success' },
              { name: 'Lightweight Charts', impact: 'High', status: 'success' },
              { name: 'Virtual Scrolling', impact: 'High', status: 'success' },
              { name: 'Code Splitting', impact: 'Medium', status: 'success' },
              { name: 'Bundle Optimization', impact: 'High', status: 'success' }
            ].map((technique, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">{technique.name}</p>
                    <p className="text-sm text-muted-foreground">Impact: {technique.impact}</p>
                  </div>
                </div>
                <Badge variant={technique.status === 'success' ? 'success' : 'secondary'}>
                  {technique.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}