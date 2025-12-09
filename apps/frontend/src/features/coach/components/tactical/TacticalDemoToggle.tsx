/**
 * Tactical Demo Toggle Component
 * Provides a toggle switch to switch between demo mode and real data mode
 */

import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Info, Database, TestTube } from '@/components/icons';
import { useFeatureFlags } from '@/config/featureFlags';
import { tacticalDataService } from '../../services/tacticalDataService';

interface TacticalDemoToggleProps {
  className?: string;
  compact?: boolean;
}

export const TacticalDemoToggle: React.FC<TacticalDemoToggleProps> = ({
  className = '',
  compact = false
}) => {
  const { isTacticalDemoMode, setTacticalDemoMode, isEnabled } = useFeatureFlags();

  const handleToggle = (enabled: boolean) => {
    setTacticalDemoMode(enabled);
    
    // Optional: Refresh data after switching modes
    if (window.location.pathname.includes('coach') && window.location.hash.includes('tactical')) {
      window.location.reload();
    }
  };

  if (!isEnabled('tactical.enabled')) {
    return null;
  }

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Switch
          id="tactical-demo-mode"
          checked={isTacticalDemoMode()}
          onCheckedChange={handleToggle}
        />
        <Label htmlFor="tactical-demo-mode" className="text-sm font-medium">
          Demo Mode
        </Label>
        {isTacticalDemoMode() && (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
            <TestTube className="h-3 w-3 mr-1" />
            Demo
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="pt-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-600" />
              <Label htmlFor="tactical-demo-mode-full" className="font-medium">
                Data Source Mode
              </Label>
            </div>
            <Switch
              id="tactical-demo-mode-full"
              checked={isTacticalDemoMode()}
              onCheckedChange={handleToggle}
            />
          </div>

          <div className="flex items-start gap-3">
            <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-gray-600">
              {isTacticalDemoMode() ? (
                <div>
                  <p className="font-medium text-blue-800 mb-1">Demo Mode Active</p>
                  <p>
                    Using simulated tactical data with realistic patterns and statistics. 
                    Perfect for demonstrations, training, and testing new features without 
                    affecting real team data.
                  </p>
                  <div className="mt-2 space-y-1">
                    <div className="text-xs text-gray-500">Demo includes:</div>
                    <div className="text-xs text-gray-500">• NHL player examples (McDavid, Draisaitl)</div>
                    <div className="text-xs text-gray-500">• Realistic play success rates and trends</div>
                    <div className="text-xs text-gray-500">• Formation analytics and opponent data</div>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="font-medium text-green-800 mb-1">Live Data Mode</p>
                  <p>
                    Connected to your team's real tactical data from games, practices, 
                    and training sessions. All statistics and analytics reflect actual 
                    performance metrics.
                  </p>
                  <div className="mt-2 space-y-1">
                    <div className="text-xs text-gray-500">Live data includes:</div>
                    <div className="text-xs text-gray-500">• Real player performance metrics</div>
                    <div className="text-xs text-gray-500">• Actual game and practice statistics</div>
                    <div className="text-xs text-gray-500">• Historical trend analysis</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {isTacticalDemoMode() && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <TestTube className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800 text-sm">Demo Features</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
                <div>• 4 Tactical plays</div>
                <div>• 2 Formations</div>
                <div>• NHL player data</div>
                <div>• Realistic analytics</div>
                <div>• Export simulation</div>
                <div>• AI analysis mock</div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Quick Demo Mode Indicator for headers
 */
export const DemoModeIndicator: React.FC<{ className?: string }> = ({ 
  className = '' 
}) => {
  const { isTacticalDemoMode } = useFeatureFlags();

  if (!isTacticalDemoMode()) return null;

  return (
    <Badge 
      variant="secondary" 
      className={`bg-blue-100 text-blue-800 border-blue-200 ${className}`}
    >
      <TestTube className="h-3 w-3 mr-1" />
      Demo Mode
    </Badge>
  );
};

/**
 * Data Source Status Component
 */
export const DataSourceStatus: React.FC<{ className?: string }> = ({ 
  className = '' 
}) => {
  const { isTacticalDemoMode, isEnabled } = useFeatureFlags();

  if (!isEnabled('tactical.enabled')) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      <Database className="h-4 w-4 text-gray-500" />
      <span className="text-gray-600">Data Source:</span>
      <Badge 
        variant={isTacticalDemoMode() ? "secondary" : "default"}
        className={isTacticalDemoMode() 
          ? "bg-blue-100 text-blue-800 border-blue-200" 
          : "bg-green-100 text-green-800 border-green-200"
        }
      >
        {isTacticalDemoMode() ? "Demo" : "Live"}
      </Badge>
    </div>
  );
};

export default TacticalDemoToggle;