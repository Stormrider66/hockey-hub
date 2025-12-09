/**
 * Import Optimization Utilities
 * 
 * Utilities to help detect and fix inefficient import patterns
 * for better tree-shaking and bundle optimization.
 */

import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Common libraries that should use specific imports instead of barrel imports
 */
export const OPTIMIZABLE_LIBRARIES = {
  'lodash': {
    transform: (importPath: string) => importPath.replace('lodash', 'lodash-es'),
    example: "import { debounce } from 'lodash-es'",
  },
  'date-fns': {
    transform: (importPath: string) => importPath,
    example: "import { format } from 'date-fns/format'",
  },
  'lucide-react': {
    transform: (importPath: string) => importPath,
    example: "import { Search } from 'lucide-react'",
  },
  '@mui/material': {
    transform: (importPath: string) => importPath,
    example: "import Button from '@mui/material/Button'",
  },
  '@mui/icons-material': {
    transform: (importPath: string) => importPath,
    example: "import SearchIcon from '@mui/icons-material/Search'",
  },
};

/**
 * Patterns that indicate barrel exports
 */
export const BARREL_EXPORT_PATTERNS = [
  /\/index\.(ts|tsx|js|jsx)$/,
  /\/(components|utils|hooks|types)$/,
  /\*\s+from/,
];

/**
 * Analyze imports in a file and return optimization suggestions
 */
export function analyzeImports(filePath: string): ImportAnalysis {
  const content = fs.readFileSync(filePath, 'utf-8');
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true
  );

  const issues: ImportIssue[] = [];
  const suggestions: ImportSuggestion[] = [];

  function visit(node: ts.Node) {
    if (ts.isImportDeclaration(node)) {
      const moduleSpecifier = node.moduleSpecifier;
      if (ts.isStringLiteral(moduleSpecifier)) {
        const importPath = moduleSpecifier.text;
        
        // Check for optimizable library imports
        for (const [lib, config] of Object.entries(OPTIMIZABLE_LIBRARIES)) {
          if (importPath === lib || importPath.startsWith(`${lib}/`)) {
            const importClause = node.importClause;
            if (importClause && importClause.namedBindings && 
                ts.isNamespaceImport(importClause.namedBindings)) {
              issues.push({
                type: 'namespace-import',
                library: lib,
                line: getLineNumber(sourceFile, node.pos),
                code: node.getText(),
              });
              suggestions.push({
                type: 'use-named-imports',
                library: lib,
                example: config.example,
              });
            }
          }
        }
        
        // Check for barrel imports
        if (BARREL_EXPORT_PATTERNS.some(pattern => pattern.test(importPath))) {
          issues.push({
            type: 'barrel-import',
            path: importPath,
            line: getLineNumber(sourceFile, node.pos),
            code: node.getText(),
          });
          suggestions.push({
            type: 'use-direct-imports',
            message: `Consider importing directly from the specific file instead of "${importPath}"`,
          });
        }
      }
    }
    
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return {
    filePath,
    issues,
    suggestions,
    estimatedSavings: calculateEstimatedSavings(issues),
  };
}

/**
 * Calculate import cost for a module
 */
export function calculateImportCost(modulePath: string): ImportCost {
  // This is a simplified version. In practice, you'd use webpack stats or similar
  const knownCosts: Record<string, number> = {
    'lodash': 71_000, // ~71KB
    'moment': 67_000, // ~67KB
    'date-fns': 13_000, // ~13KB per function
    '@mui/material': 30_000, // ~30KB per component
    'lucide-react': 1_000, // ~1KB per icon
  };

  const baseModule = Object.keys(knownCosts).find(mod => modulePath.includes(mod));
  const baseCost = baseModule ? knownCosts[baseModule] : 0;

  return {
    module: modulePath,
    sizeInBytes: baseCost,
    sizeFormatted: formatBytes(baseCost),
    treeshakeable: !modulePath.includes('lodash') || modulePath.includes('lodash-es'),
  };
}

/**
 * Generate optimized import statement
 */
export function generateOptimizedImport(
  originalImport: string,
  importedItems: string[],
  modulePath: string
): string {
  // Handle specific library optimizations
  if (modulePath === 'lodash') {
    return `import { ${importedItems.join(', ')} } from 'lodash-es';`;
  }
  
  if (modulePath.includes('@mui/material')) {
    return importedItems.map(item => 
      `import ${item} from '@mui/material/${item}';`
    ).join('\n');
  }
  
  if (modulePath.includes('@mui/icons-material')) {
    return importedItems.map(item => 
      `import ${item} from '@mui/icons-material/${item.replace(/Icon$/, '')}';`
    ).join('\n');
  }

  // Default: keep named imports
  return `import { ${importedItems.join(', ')} } from '${modulePath}';`;
}

/**
 * Check for circular dependencies
 */
export async function detectCircularDependencies(
  entryPath: string,
  projectRoot: string
): Promise<CircularDependency[]> {
  const visited = new Set<string>();
  const stack = new Set<string>();
  const circular: CircularDependency[] = [];

  async function visit(filePath: string): Promise<void> {
    if (stack.has(filePath)) {
      // Found circular dependency
      const cycle = Array.from(stack);
      const startIndex = cycle.indexOf(filePath);
      circular.push({
        files: cycle.slice(startIndex),
        entry: filePath,
      });
      return;
    }

    if (visited.has(filePath)) return;

    visited.add(filePath);
    stack.add(filePath);

    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      const imports = extractImports(content);
      
      for (const imp of imports) {
        const resolvedPath = resolveImportPath(imp, filePath, projectRoot);
        if (resolvedPath && resolvedPath.startsWith(projectRoot)) {
          await visit(resolvedPath);
        }
      }
    } catch (error) {
      // File not found or other error
    }

    stack.delete(filePath);
  }

  await visit(entryPath);
  return circular;
}

/**
 * Generate tree-shakeable export patterns
 */
export function generateTreeShakeableExports(
  exports: string[],
  fromPath: string
): string {
  return exports.map(exp => 
    `export { ${exp} } from '${fromPath}';`
  ).join('\n');
}

// Helper functions

function getLineNumber(sourceFile: ts.SourceFile, pos: number): number {
  return sourceFile.getLineAndCharacterOfPosition(pos).line + 1;
}

function calculateEstimatedSavings(issues: ImportIssue[]): number {
  let savings = 0;
  issues.forEach(issue => {
    if (issue.type === 'namespace-import') {
      savings += 50_000; // Rough estimate
    } else if (issue.type === 'barrel-import') {
      savings += 10_000; // Rough estimate
    }
  });
  return savings;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function extractImports(content: string): string[] {
  const importRegex = /import\s+.*?\s+from\s+['"](.*?)['"]/g;
  const imports: string[] = [];
  let match;
  
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  
  return imports;
}

function resolveImportPath(
  importPath: string,
  fromFile: string,
  projectRoot: string
): string | null {
  if (importPath.startsWith('.')) {
    const resolved = path.resolve(path.dirname(fromFile), importPath);
    // Try different extensions
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx'];
    
    for (const ext of extensions) {
      const fullPath = resolved + (resolved.endsWith(ext) ? '' : ext);
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }
  }
  
  return null;
}

// Types

export interface ImportAnalysis {
  filePath: string;
  issues: ImportIssue[];
  suggestions: ImportSuggestion[];
  estimatedSavings: number;
}

export interface ImportIssue {
  type: 'namespace-import' | 'barrel-import' | 'circular-dependency';
  library?: string;
  path?: string;
  line: number;
  code: string;
}

export interface ImportSuggestion {
  type: 'use-named-imports' | 'use-direct-imports' | 'use-dynamic-imports';
  library?: string;
  example?: string;
  message?: string;
}

export interface ImportCost {
  module: string;
  sizeInBytes: number;
  sizeFormatted: string;
  treeshakeable: boolean;
}

export interface CircularDependency {
  files: string[];
  entry: string;
}

/**
 * CLI utility to analyze a directory
 */
export async function analyzeDirectory(dir: string): Promise<void> {
  const files = await getTypeScriptFiles(dir);
  const allIssues: ImportIssue[] = [];
  
  for (const file of files) {
    const analysis = analyzeImports(file);
    allIssues.push(...analysis.issues);
    
    if (analysis.issues.length > 0) {
      console.log(`\n📁 ${file}`);
      analysis.issues.forEach(issue => {
        console.log(`  ⚠️  Line ${issue.line}: ${issue.type}`);
        console.log(`     ${issue.code}`);
      });
      analysis.suggestions.forEach(suggestion => {
        console.log(`  💡 ${suggestion.message || suggestion.example}`);
      });
    }
  }
  
  console.log(`\n📊 Summary: Found ${allIssues.length} import issues`);
  console.log(`💾 Estimated savings: ${formatBytes(calculateEstimatedSavings(allIssues))}`);
}

async function getTypeScriptFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  
  async function walk(currentDir: string) {
    const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory() && !entry.name.includes('node_modules')) {
        await walk(fullPath);
      } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
        files.push(fullPath);
      }
    }
  }
  
  await walk(dir);
  return files;
}