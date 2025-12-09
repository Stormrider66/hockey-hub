'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Flag, AlertTriangle, CheckCircle, RefreshCw, 
  Trash2, Download, Upload, Zap
} from '@/components/icons';
import { featureFlags, useFeatureFlags, type PerformanceFeatureFlags } from '../../utils/featureFlags';

interface FlagConfig {
  key: keyof PerformanceFeatureFlags;
  label: string;
  description: string;
  risk: 'low' | 'medium' | 'high';
  phase: 1 | 2 | 3;
}

const FLAG_CONFIGS: FlagConfig[] = [
  // Phase 1 - Safe Quick Wins
  {
    key: 'OPTIMIZE_FONTS',
    label: 'Font Optimization',
    description: 'Use font-display: swap for faster text rendering',
    risk: 'low',
    phase: 1
  },
  {
    key: 'OPTIMIZE_ICONS',
    label: 'Icon Optimization',
    description: 'Use custom icons instead of lucide-react library',
    risk: 'low',
    phase: 1
  },
  
  // Phase 2 - Component Optimization
  {
    key: 'LAZY_LOAD_MODALS',
    label: 'Lazy Load Modals',
    description: 'Load modals only when opened',
    risk: 'medium',
    phase: 2
  },
  {
    key: 'PROGRESSIVE_TABS',
    label: 'Progressive Tab Loading',
    description: 'Only render active tab content',
    risk: 'high',
    phase: 2
  },
  {
    key: 'DEFER_INITIALIZATION',
    label: 'Defer Non-Critical Init',
    description: 'Defer initialization of non-critical systems',
    risk: 'high',
    phase: 2
  },
  {
    key: 'DEFER_WEBSOCKET',
    label: 'Defer WebSocket',
    description: 'Delay WebSocket connection by 3 seconds',
    risk: 'high',
    phase: 2
  },
  {
    key: 'DEFER_KEYBOARD_SHORTCUTS',
    label: 'Defer Keyboard Shortcuts',
    description: 'Delay keyboard shortcut initialization',
    risk: 'medium',
    phase: 2
  },
  
  // Phase 3 - Advanced Optimizations
  {
    key: 'LIGHTWEIGHT_CHARTS',
    label: 'Lightweight Charts',
    description: 'Replace recharts with custom SVG charts',
    risk: 'medium',
    phase: 3
  },
  {
    key: 'VIRTUAL_SCROLLING',
    label: 'Virtual Scrolling',
    description: 'Use virtual scrolling for long lists',
    risk: 'medium',
    phase: 3
  }
];

export function FeatureFlagDashboard() {
  const flags = useFeatureFlags();
  const [isMinimized, setIsMinimized] = useState(true);
  const [showWarning, setShowWarning] = useState(false);

  const handleFlagToggle = (flag: keyof PerformanceFeatureFlags, value: boolean) => {
    const config = FLAG_CONFIGS.find(c => c.key === flag);
    
    if (value && config?.risk === 'high') {
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 3000);
    }
    
    featureFlags.setFlag(flag, value);
  };

  const handleEnablePhase = (phase: 'phase1' | 'phase2' | 'phase3') => {
    featureFlags.enablePhase(phase);
  };

  const handleReset = () => {
    if (confirm('Reset all feature flags to defaults?')) {
      featureFlags.resetFlags();
    }
  };

  const handleExport = () => {
    const data = JSON.stringify(flags, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'feature-flags.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'destructive';
      default: return 'secondary';
    }
  };

  // Minimized view
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMinimized(false)}
          className="shadow-lg bg-background"
        >
          <Flag className="h-4 w-4 mr-2" />
          Feature Flags
          <Badge variant="secondary" className="ml-2">
            {Object.values(flags).filter(Boolean).length}
          </Badge>
        </Button>
      </div>
    );
  }

  // Full dashboard view
  return (
    <div className="fixed bottom-4 left-4 z-50 w-[480px] max-h-[700px] overflow-hidden">
      <Card className="shadow-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Flag className="h-5 w-5" />
                Performance Feature Flags
              </CardTitle>
              <CardDescription>
                Control performance optimizations
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleExport}
                className="h-8 w-8"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleReset}
                className="h-8 w-8"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMinimized(true)}
                className="h-8 w-8"
              >
                <span className="text-lg">−</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {showWarning && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                High-risk optimization enabled. Monitor for issues!
              </AlertDescription>
            </Alert>
          )}

          {/* Quick Actions */}
          <div className="flex gap-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEnablePhase('phase1')}
            >
              Enable Phase 1
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEnablePhase('phase2')}
            >
              Enable Phase 2
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEnablePhase('phase3')}
            >
              Enable Phase 3
            </Button>
          </div>

          {/* Phase Groups */}
          <div className="space-y-4 max-h-[500px] overflow-y-auto">
            {[1, 2, 3].map(phase => (
              <div key={phase}>
                <h3 className="font-medium text-sm mb-2 text-muted-foreground">
                  Phase {phase}
                </h3>
                <div className="space-y-2">
                  {FLAG_CONFIGS.filter(config => config.phase === phase).map(config => (
                    <div
                      key={config.key}
                      className="border rounded-lg p-3 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">
                              {config.label}
                            </span>
                            <Badge 
                              variant={getRiskBadge(config.risk) as any}
                              className="text-xs"
                            >
                              {config.risk} risk
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {config.description}
                          </p>
                        </div>
                        <Switch
                          checked={flags[config.key]}
                          onCheckedChange={(checked) => handleFlagToggle(config.key, checked)}
                          className="ml-3"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Monitoring Flags */}
          <div className="mt-4 pt-4 border-t">
            <h3 className="font-medium text-sm mb-2 text-muted-foreground">
              Monitoring & Debug
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Performance Monitoring</span>
                <Switch
                  checked={flags.PERFORMANCE_MONITORING}
                  onCheckedChange={(checked) => handleFlagToggle('PERFORMANCE_MONITORING', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Performance Dashboard</span>
                <Switch
                  checked={flags.PERFORMANCE_DASHBOARD}
                  onCheckedChange={(checked) => handleFlagToggle('PERFORMANCE_DASHBOARD', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Debug Mode</span>
                <Switch
                  checked={flags.DEBUG_MODE}
                  onCheckedChange={(checked) => handleFlagToggle('DEBUG_MODE', checked)}
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="mt-4 pt-3 border-t text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>
                {Object.values(flags).filter(Boolean).length} optimizations active
              </span>
              {featureFlags.isSafeToOptimize() ? (
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-3 w-3" />
                  Safe to optimize
                </span>
              ) : (
                <span className="flex items-center gap-1 text-red-600">
                  <AlertTriangle className="h-3 w-3" />
                  Issues detected
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Hook to conditionally show feature flag dashboard
 */
export function useFeatureFlagDashboard(enabled: boolean = false) {
  const [showDashboard, setShowDashboard] = useState(enabled);

  React.useEffect(() => {
    // Listen for keyboard shortcut (Ctrl+Shift+F)
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        setShowDashboard(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return { showDashboard, setShowDashboard };
}