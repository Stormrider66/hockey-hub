const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Patterns to search for old spinner implementations
const oldSpinnerPatterns = [
  /className\s*=\s*["'].*(?:animate-spin|spinner).*["']/gi,
  /<div[^>]*className\s*=\s*["'][^"']*animate-spin[^"']*["'][^>]*>/gi,
  /Loading\.\.\./gi,
  /<svg[^>]*className\s*=\s*["'][^"']*animate-spin[^"']*["'][^>]*>/gi,
  /CircularProgress/gi,
  /LinearProgress/gi,
  /<Spinner/gi,
  /makeStyles.*spinner/gi,
  /\.spinner\s*{/gi
];

// Directories to exclude
const excludeDirs = [
  'node_modules',
  '.next',
  'dist',
  'build',
  '.git',
  'coverage',
  'scripts',
  'app/test-loading' // Exclude our test page
];

// Files to check
const filesToCheck = glob.sync('**/*.{tsx,ts,jsx,js,css,scss}', {
  cwd: '/mnt/c/Hockey Hub/apps/frontend',
  absolute: true,
  ignore: excludeDirs.map(dir => `**/${dir}/**`)
});

console.log(`Checking ${filesToCheck.length} files for old spinner implementations...\n`);

let totalMatches = 0;
const findings = [];

filesToCheck.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const relativeFile = path.relative('/mnt/c/Hockey Hub/apps/frontend', file);
  
  oldSpinnerPatterns.forEach((pattern, index) => {
    const matches = content.match(pattern);
    if (matches && matches.length > 0) {
      // Skip if it's in our new loading components
      if (relativeFile.includes('components/ui/loading') || 
          relativeFile.includes('components/ui/skeletons')) {
        return;
      }
      
      findings.push({
        file: relativeFile,
        pattern: pattern.toString(),
        matches: matches.length,
        samples: matches.slice(0, 3)
      });
      totalMatches += matches.length;
    }
  });
});

if (findings.length === 0) {
  console.log('✅ No old spinner implementations found!');
  console.log('All components are using the standardized loading system.');
} else {
  console.log(`❌ Found ${totalMatches} potential old spinner implementations in ${findings.length} files:\n`);
  
  // Group by file
  const byFile = {};
  findings.forEach(finding => {
    if (!byFile[finding.file]) {
      byFile[finding.file] = [];
    }
    byFile[finding.file].push(finding);
  });
  
  Object.entries(byFile).forEach(([file, fileFindings]) => {
    console.log(`\n📄 ${file}`);
    fileFindings.forEach(finding => {
      console.log(`   Pattern: ${finding.pattern}`);
      console.log(`   Matches: ${finding.matches}`);
      console.log(`   Samples:`);
      finding.samples.forEach(sample => {
        console.log(`     - ${sample.trim()}`);
      });
    });
  });
}

console.log('\n---\nScan complete.');