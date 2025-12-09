'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, ChevronRight, Zap, Flag, BarChart, 
  CheckCircle, AlertTriangle, Info, ExternalLink 
} from '@/components/icons';

export default function PerformanceDemoPage() {
  const [showInstructions, setShowInstructions] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Physical Trainer Performance Monitoring Demo</h1>
          <p className="text-gray-600">Learn how to use the performance monitoring tools to optimize the dashboard</p>
        </div>

        {showInstructions && (
          <>
            <Alert className="mb-6">
              <Info className="h-4 w-4" />
              <AlertDescription>
                This demo shows you how to use the performance monitoring system. Follow the steps below to get started.
              </AlertDescription>
            </Alert>
            <Alert className="mb-6 border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>Note:</strong> You may see performance threshold violation warnings in the console (FCP, TTFB, LCP). 
                These are expected - they show that the monitoring system is correctly detecting performance issues that need optimization.
              </AlertDescription>
            </Alert>
          </>
        )}

        <div className="grid gap-6">
          {/* Step 1: Access Monitored Dashboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-sm font-bold">1</span>
                Access the Monitored Dashboard
              </CardTitle>
              <CardDescription>
                Start by opening the special monitored version of the Physical Trainer dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  The monitored dashboard includes performance tracking and feature flags without affecting the main dashboard.
                </p>
                <div className="flex gap-4">
                  <Link href="/physicaltrainer/monitored" target="_blank">
                    <Button className="gap-2">
                      <Activity className="h-4 w-4" />
                      Open Monitored Dashboard
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </Link>
                  <Link href="/physicaltrainer" target="_blank">
                    <Button variant="outline" className="gap-2">
                      Compare with Normal Dashboard
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Enable Monitoring Tools */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-sm font-bold">2</span>
                Enable Monitoring Tools
              </CardTitle>
              <CardDescription>
                Use keyboard shortcuts to toggle the performance and feature flag dashboards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart className="h-5 w-5 text-blue-600" />
                    <h3 className="font-medium">Performance Dashboard</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Shows real-time performance metrics</p>
                  <div className="space-y-2">
                    <Badge variant="secondary" className="w-full justify-center">
                      Ctrl + Shift + P
                    </Badge>
                    <ul className="text-sm space-y-1">
                      <li className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        Component render times
                      </li>
                      <li className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        API call durations
                      </li>
                      <li className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        Performance classification
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Flag className="h-5 w-5 text-purple-600" />
                    <h3 className="font-medium">Feature Flag Dashboard</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Control performance optimizations</p>
                  <div className="space-y-2">
                    <Badge variant="secondary" className="w-full justify-center">
                      Ctrl + Shift + F
                    </Badge>
                    <ul className="text-sm space-y-1">
                      <li className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        Phase-based rollout
                      </li>
                      <li className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        Risk level indicators
                      </li>
                      <li className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        Safe rollback options
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 3: Collect Baseline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-sm font-bold">3</span>
                Collect Baseline Metrics
              </CardTitle>
              <CardDescription>
                Navigate through the dashboard to establish performance baselines
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Actions to perform:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Click through all tabs (Overview, Sessions, Calendar, etc.)</li>
                    <li>Open and close modals</li>
                    <li>Create a sample workout</li>
                    <li>Switch between teams</li>
                    <li>Use search and filters</li>
                  </ol>
                </div>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Expected baseline: Overview Tab ~1000ms, Sessions Tab ~1500ms, Modals ~600ms
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>

          {/* Step 4: Enable Optimizations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-sm font-bold">4</span>
                Enable Optimizations Progressively
              </CardTitle>
              <CardDescription>
                Use the Feature Flag Dashboard to enable optimizations in phases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Phase 1: Safe Quick Wins</h4>
                      <p className="text-sm text-gray-600">Font & Icon optimizations</p>
                    </div>
                    <Badge variant="success">Low Risk</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Phase 2: Component Optimization</h4>
                      <p className="text-sm text-gray-600">Lazy loading & Progressive rendering</p>
                    </div>
                    <Badge variant="warning">Medium Risk</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Phase 3: Advanced Optimizations</h4>
                      <p className="text-sm text-gray-600">Lightweight charts & Virtual scrolling</p>
                    </div>
                    <Badge variant="destructive">High Risk</Badge>
                  </div>
                </div>
                <Alert className="bg-green-50 border-green-200">
                  <Zap className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Enable one phase at a time and test thoroughly before proceeding to the next.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>

          {/* Step 5: Monitor Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-sm font-bold">5</span>
                Monitor and Compare Results
              </CardTitle>
              <CardDescription>
                Track improvements and watch for any issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">🟢</div>
                    <p className="font-medium mt-2">Good</p>
                    <p className="text-sm text-gray-600">&lt; 16ms render</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">🟡</div>
                    <p className="font-medium mt-2">Acceptable</p>
                    <p className="text-sm text-gray-600">&lt; 50ms render</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-red-600">🔴</div>
                    <p className="font-medium mt-2">Needs Work</p>
                    <p className="text-sm text-gray-600">&gt; 100ms render</p>
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Target Improvements:</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Initial Load: 8s → &lt;2s</li>
                    <li>• LCP: 6900ms → &lt;2400ms</li>
                    <li>• Bundle Size: 1.4MB → &lt;350KB</li>
                    <li>• Tab Switches: 1500ms → &lt;500ms</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Resources */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Resources</CardTitle>
              <CardDescription>
                Learn more about performance optimization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Link href="/docs/PERFORMANCE-MONITORING-SETUP.md" className="block">
                  <Button variant="link" className="justify-start p-0 h-auto">
                    <ChevronRight className="h-4 w-4 mr-1" />
                    Performance Monitoring Setup Guide
                  </Button>
                </Link>
                <Link href="/docs/PHYSICAL-TRAINER-PERFORMANCE-OPTIMIZATION-V2.md" className="block">
                  <Button variant="link" className="justify-start p-0 h-auto">
                    <ChevronRight className="h-4 w-4 mr-1" />
                    V2 Performance Optimization Plan
                  </Button>
                </Link>
                <Link href="/docs/PERFORMANCE-MONITORING-EXAMPLE.md" className="block">
                  <Button variant="link" className="justify-start p-0 h-auto">
                    <ChevronRight className="h-4 w-4 mr-1" />
                    Detailed Example Workflow
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center text-sm text-gray-600">
          <p>Remember: Always test one optimization at a time and monitor for any issues.</p>
        </div>
      </div>
    </div>
  );
}