const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create dist directory
if (!fs.existsSync('./dist')) {
  fs.mkdirSync('./dist', { recursive: true });
}
if (!fs.existsSync('./dist/entities')) {
  fs.mkdirSync('./dist/entities', { recursive: true });
}

// Copy TypeScript files as JavaScript (temporary workaround)
const files = [
  'index.ts',
  'entities/BaseEntity.ts'
];

files.forEach(file => {
  const srcPath = path.join('./src', file);
  const distPath = path.join('./dist', file.replace('.ts', '.js'));
  
  if (fs.existsSync(srcPath)) {
    // For now, just copy the structure
    const content = fs.readFileSync(srcPath, 'utf8');
    fs.writeFileSync(distPath, content);
    
    // Create .d.ts file
    fs.writeFileSync(distPath.replace('.js', '.d.ts'), content);
  }
});

console.log('Temporary build complete');