/**
 * Example: Import Optimization Patterns
 * 
 * This file demonstrates common import optimization patterns
 * used throughout the Hockey Hub codebase.
 */

// ❌ BEFORE: Inefficient imports
/*
import _ from 'lodash';
import * as Icons from 'lucide-react';
import { Button, TextField, Box, Card } from '@mui/material';
import { format, parseISO, startOfWeek, endOfWeek } from 'date-fns';
import moment from 'moment';
*/

// ✅ AFTER: Optimized imports

// 1. Lodash replacements (local minimal implementations to avoid extra deps)
function debounce<T extends (...args: any[]) => void>(fn: T, wait: number) {
  let timeout: any;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), wait);
  };
}

function groupBy<T extends Record<string, any>>(arr: T[], key: string): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  for (const item of arr) {
    const groupKey = String(item[key]);
    if (!result[groupKey]) result[groupKey] = [];
    result[groupKey].push(item);
  }
  return result;
}

// 2. Icons - Named imports are already optimized
import { 
  Search, 
  Calendar, 
  User, 
  Settings,
  ChevronDown 
} from 'lucide-react';

// 3. Material-UI - Use specific component imports
// Note: We don't use MUI in this project, but this shows the pattern
// import Button from '@mui/material/Button';
// import TextField from '@mui/material/TextField';

// 4. Date-fns - Use named imports for proper typing
import { format, parseISO, startOfWeek, endOfWeek } from 'date-fns';

// 5. Local imports - Import from specific files
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

// 6. Types - Group type imports separately
import type { 
  WorkoutSession, 
  Player, 
  Team 
} from '@/features/physical-trainer/types';

// 7. Dynamic imports for large components
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('@/components/charts/OptimizedChart'), {
  loading: () => <div>Loading chart...</div>,
  ssr: false
});

// Note: Placeholder for demo; real modal component not needed in this example
// const LargeModal = dynamic(() => import('@/components/modals/LargeModal'));

// Example component demonstrating optimized usage
export default function ImportOptimizationExample() {
  // Use debounced search with optimized lodash import
  const debouncedSearch = debounce((query: string) => {
    console.log('Searching:', query);
  }, 300);

  // Use grouped data with optimized import
  const players = [
    { id: 1, name: 'Sidney Crosby', team: 'Pittsburgh Penguins' },
    { id: 2, name: 'Connor McDavid', team: 'Edmonton Oilers' },
  ];

  const groupedPlayers = groupBy(players, 'team');

  // Use date formatting with optimized imports
  const formattedDate = format(new Date(), 'yyyy-MM-dd');
  const weekStart = startOfWeek(new Date());

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-5 w-5" />
        <h2 className="text-lg font-semibold">Import Optimization Example</h2>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            <Search className="inline h-4 w-4 mr-1" />
            Search Players
          </label>
          <Input
            placeholder="Type to search..."
            onChange={(e) => debouncedSearch(e.target.value)}
          />
        </div>

        <div>
          <p className="text-sm text-gray-600">
            Current date: {formattedDate}
          </p>
          <p className="text-sm text-gray-600">
            Week starts: {format(weekStart, 'MMM dd')}
          </p>
        </div>

        <div>
          <h3 className="font-medium mb-2">
            <User className="inline h-4 w-4 mr-1" />
            Players by Team
          </h3>
          {Object.entries(groupedPlayers).map(([team, teamPlayers]) => (
            <div key={team} className="mb-2">
              <p className="font-medium">{team}</p>
              <ul className="pl-4 text-sm text-gray-600">
                {teamPlayers.map(player => (
                  <li key={player.id}>{player.name}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button variant="default">
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
          <Button variant="outline">
            <ChevronDown className="h-4 w-4 mr-2" />
            More Options
          </Button>
        </div>

        {/* Dynamically loaded component */}
        <div className="mt-6">
          <HeavyChart
            data={[{ x: 0, y: 0 }, { x: 1, y: 2 }, { x: 2, y: 3 }]}
            type="line"
            xKey="x"
            yKeys={["y"]}
            height={240}
          />
        </div>
      </div>
    </Card>
  );
}

// Example of barrel export optimization
// Instead of exporting everything from an index file:

// ❌ AVOID: components/index.ts
/*
export * from './Button';
export * from './Input';
export * from './Card';
export * from './Modal';
export * from './Chart';
*/

// ✅ PREFER: Import directly from component files
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';

// Or use specific re-exports if needed:
export { Button as OptimizedButton } from '@/components/ui/button';
export { Input as OptimizedInput } from '@/components/ui/input';

// Utility function to demonstrate import cost analysis
export function analyzeImportExample() {
  return {
    message: 'This component demonstrates optimized import patterns',
    savings: {
      lodash: '~60KB saved by using lodash-es',
      icons: '~5KB per unused icon',
      dateLibrary: '~50KB saved by replacing moment with date-fns',
      dynamicImports: '~30KB deferred until needed'
    },
    recommendations: [
      'Use specific imports instead of barrel imports',
      'Replace moment.js with date-fns for smaller bundle',
      'Use dynamic imports for heavy components',
      'Group related imports together',
      'Use TypeScript path aliases to avoid deep relative imports'
    ]
  };
}

// Type definitions for the example
export interface OptimizationMetrics {
  bundleSize: {
    before: string;
    after: string;
    reduction: string;
  };
  loadTime: {
    firstContentfulPaint: string;
    timeToInteractive: string;
  };
  treeShaking: {
    deadCodeEliminated: string;
    unusedExports: number;
  };
}