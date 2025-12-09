#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Configuration
const config = {
  srcDir: path.join(__dirname, '../src'),
  extensions: ['tsx', 'jsx'],
  excludeDirs: ['node_modules', '.next', 'dist', 'build'],
  dryRun: process.argv.includes('--dry-run'),
  verbose: process.argv.includes('--verbose'),
};

// Image migration patterns
const migrationPatterns = [
  {
    name: 'Avatar images',
    pattern: /<img\s+([^>]*?)src=\{([^}]+)\}\s*([^>]*?)className="([^"]*rounded-full[^"]*)"([^>]*?)\/>/g,
    replacement: (match, before, src, middle, className, after) => {
      const altMatch = match.match(/alt=\{([^}]+)\}/);
      const alt = altMatch ? altMatch[1] : 'user.name';
      
      // Determine size based on className
      let size = 'md';
      if (className.includes('w-8') || className.includes('h-8')) size = 'sm';
      else if (className.includes('w-12') || className.includes('h-12')) size = 'md';
      else if (className.includes('w-16') || className.includes('h-16')) size = 'lg';
      else if (className.includes('w-20') || className.includes('h-20')) size = 'xl';
      
      return `<Avatar src={${src}} alt={${alt}} size="${size}" />`;
    },
    import: "import { Avatar } from '@/components/ui/OptimizedImage';",
  },
  {
    name: 'Static images with dimensions',
    pattern: /<img\s+src="([^"]+)"\s+alt="([^"]*)"\s+width="(\d+)"\s+height="(\d+)"([^>]*?)\/>/g,
    replacement: (match, src, alt, width, height, rest) => {
      const className = rest.match(/className="([^"]*)"/);
      const classStr = className ? ` className="${className[1]}"` : '';
      return `<OptimizedImage src="${src}" alt="${alt}" width={${width}} height={${height}}${classStr} />`;
    },
    import: "import { OptimizedImage } from '@/components/ui/OptimizedImage';",
  },
  {
    name: 'Dynamic images',
    pattern: /<img\s+([^>]*?)src=\{([^}]+)\}\s*([^>]*?)\/>/g,
    replacement: (match, before, src, after) => {
      // Skip if already using OptimizedImage or Avatar
      if (match.includes('OptimizedImage') || match.includes('Avatar')) return match;
      
      const altMatch = match.match(/alt=\{([^}]+)\}/);
      const alt = altMatch ? altMatch[1] : '""';
      
      const classMatch = match.match(/className=["']([^"']+)["']/);
      const className = classMatch ? ` className="${classMatch[1]}"` : '';
      
      // Check if it's likely a data URL or blob
      if (src.includes('data:') || src.includes('blob:') || src.includes('URL.createObjectURL')) {
        return `<DynamicImage src={${src}} alt={${alt}}${className} />`;
      }
      
      // For regular dynamic images
      const widthMatch = match.match(/width=\{(\d+)\}/);
      const heightMatch = match.match(/height=\{(\d+)\}/);
      
      if (widthMatch && heightMatch) {
        return `<OptimizedImage src={${src}} alt={${alt}} width={${widthMatch[1]}} height={${heightMatch[1]}}${className} />`;
      }
      
      // If no dimensions, keep original for manual review
      return match;
    },
    import: "import { OptimizedImage, DynamicImage } from '@/components/ui/OptimizedImage';",
  },
];

// Helper functions
function findFiles() {
  const pattern = `${config.srcDir}/**/*.{${config.extensions.join(',')}}`;
  return glob.sync(pattern, {
    ignore: config.excludeDirs.map(dir => `**/${dir}/**`),
  });
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let modified = content;
  const changes = [];
  const imports = new Set();

  // Apply migration patterns
  migrationPatterns.forEach(({ name, pattern, replacement, import: importStatement }) => {
    const matches = [...modified.matchAll(pattern)];
    if (matches.length > 0) {
      matches.forEach(match => {
        const replaced = typeof replacement === 'function' 
          ? replacement(...match) 
          : replacement;
        
        if (replaced !== match[0]) {
          changes.push({
            pattern: name,
            before: match[0],
            after: replaced,
          });
          
          modified = modified.replace(match[0], replaced);
          if (importStatement) {
            imports.add(importStatement);
          }
        }
      });
    }
  });

  // Add imports if needed
  if (imports.size > 0 && changes.length > 0) {
    const importStatements = Array.from(imports).join('\n');
    
    // Find the last import statement
    const lastImportMatch = modified.match(/(?:^|\n)(import[^;]+;)(?!.*\nimport)/s);
    if (lastImportMatch) {
      const insertPos = modified.indexOf(lastImportMatch[1]) + lastImportMatch[1].length;
      modified = modified.slice(0, insertPos) + '\n' + importStatements + modified.slice(insertPos);
    } else {
      // Add after 'use client' if present, otherwise at the beginning
      const useClientMatch = modified.match(/^'use client';?\s*\n/);
      if (useClientMatch) {
        modified = modified.replace(useClientMatch[0], useClientMatch[0] + importStatements + '\n\n');
      } else {
        modified = importStatements + '\n\n' + modified;
      }
    }
  }

  return { modified, changes };
}

function formatChanges(changes) {
  return changes.map(change => {
    return `
  Pattern: ${change.pattern}
  Before: ${change.before.replace(/\n/g, '\\n')}
  After:  ${change.after.replace(/\n/g, '\\n')}`;
  }).join('\n');
}

// Main execution
function main() {
  console.log('🖼️  Image Migration Tool');
  console.log('======================');
  console.log(`Mode: ${config.dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Directory: ${config.srcDir}`);
  console.log('');

  const files = findFiles();
  console.log(`Found ${files.length} files to process`);
  console.log('');

  let totalChanges = 0;
  const fileChanges = [];

  files.forEach((filePath, index) => {
    const { modified, changes } = processFile(filePath);
    
    if (changes.length > 0) {
      totalChanges += changes.length;
      fileChanges.push({ filePath, changes });
      
      console.log(`[${index + 1}/${files.length}] ${path.relative(config.srcDir, filePath)}`);
      console.log(`  Found ${changes.length} image tag(s) to migrate`);
      
      if (config.verbose) {
        console.log(formatChanges(changes));
      }
      
      if (!config.dryRun) {
        fs.writeFileSync(filePath, modified);
        console.log('  ✅ File updated');
      }
      
      console.log('');
    }
  });

  // Summary
  console.log('======================');
  console.log('Migration Summary');
  console.log('======================');
  console.log(`Total files processed: ${files.length}`);
  console.log(`Files with changes: ${fileChanges.length}`);
  console.log(`Total images migrated: ${totalChanges}`);
  
  if (config.dryRun) {
    console.log('\n⚠️  This was a dry run. No files were modified.');
    console.log('Run without --dry-run to apply changes.');
  }
  
  // Write report
  const reportPath = path.join(__dirname, '../image-migration-report.json');
  const report = {
    timestamp: new Date().toISOString(),
    mode: config.dryRun ? 'dry-run' : 'live',
    summary: {
      totalFiles: files.length,
      filesWithChanges: fileChanges.length,
      totalChanges: totalChanges,
    },
    changes: fileChanges.map(({ filePath, changes }) => ({
      file: path.relative(config.srcDir, filePath),
      changes: changes.length,
      details: config.verbose ? changes : undefined,
    })),
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Report saved to: ${path.relative(process.cwd(), reportPath)}`);
}

// Run the migration
main();