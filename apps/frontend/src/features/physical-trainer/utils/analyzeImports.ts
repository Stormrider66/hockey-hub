import { readFileSync } from 'fs';
import { join } from 'path';

interface ImportAnalysis {
  file: string;
  totalImports: number;
  unusedImports: string[];
  potentialSavings: number; // estimated KB
}

/**
 * Analyze imports in Physical Trainer components
 * This is a simplified analyzer - in production you'd use proper AST parsing
 */
export function analyzeImports(filePath: string): ImportAnalysis {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  const imports: Map<string, string> = new Map();
  const usedIdentifiers = new Set<string>();
  
  // Extract imports
  lines.forEach(line => {
    const importMatch = line.match(/import\s+(?:{([^}]+)}|(\w+))\s+from\s+['"]([^'"]+)['"]/);
    if (importMatch) {
      if (importMatch[1]) {
        // Named imports
        importMatch[1].split(',').forEach(imp => {
          const cleaned = imp.trim().split(' as ')[0];
          if (cleaned) imports.set(cleaned, importMatch[3]);
        });
      } else if (importMatch[2]) {
        // Default import
        imports.set(importMatch[2], importMatch[3]);
      }
    }
  });
  
  // Find used identifiers (simplified - looks for word boundaries)
  const codeWithoutImports = lines
    .filter(line => !line.trim().startsWith('import'))
    .join('\n');
    
  imports.forEach((source, identifier) => {
    // Check if identifier is used in the code
    const regex = new RegExp(`\\b${identifier}\\b`);
    if (regex.test(codeWithoutImports)) {
      usedIdentifiers.add(identifier);
    }
  });
  
  // Find unused imports
  const unusedImports: string[] = [];
  imports.forEach((source, identifier) => {
    if (!usedIdentifiers.has(identifier)) {
      unusedImports.push(`${identifier} from '${source}'`);
    }
  });
  
  // Estimate potential savings (rough estimate)
  const potentialSavings = unusedImports.length * 5; // ~5KB per unused import
  
  return {
    file: filePath,
    totalImports: imports.size,
    unusedImports,
    potentialSavings
  };
}

// List of files to analyze
export const PHYSICAL_TRAINER_FILES = [
  'components/PhysicalTrainerDashboard.tsx',
  'components/PhysicalTrainerDashboardMonitored.tsx',
  'components/tabs/OverviewTab.tsx',
  'components/tabs/SessionsTab.tsx',
  'components/tabs/CalendarTab.tsx',
  'components/tabs/ExerciseLibraryTab.tsx',
  'components/tabs/TestingTab.tsx',
  'components/tabs/PlayerStatusTab.tsx',
  'components/tabs/TemplatesTab.tsx',
  'components/SessionBuilder/SessionBuilder.tsx',
  'components/AgilityWorkoutBuilder.tsx',
  'components/ConditioningWorkoutBuilderSimple.tsx',
  'components/HybridWorkoutBuilderEnhanced.tsx',
];