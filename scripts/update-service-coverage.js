#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const servicesDir = path.join(__dirname, '..', 'services');
const services = fs.readdirSync(servicesDir).filter(dir => {
  const servicePath = path.join(servicesDir, dir);
  return fs.statSync(servicePath).isDirectory() && 
         fs.existsSync(path.join(servicePath, 'package.json'));
});

services.forEach(service => {
  const packagePath = path.join(servicesDir, service, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  // Update scripts
  if (!packageJson.scripts['test:coverage']) {
    packageJson.scripts['test:coverage'] = 'jest --coverage';
  }
  if (!packageJson.scripts['test:coverage:watch']) {
    packageJson.scripts['test:coverage:watch'] = 'jest --coverage --watch';
  }
  if (!packageJson.scripts['test:ci']) {
    packageJson.scripts['test:ci'] = 'jest --ci --coverage --maxWorkers=2';
  }
  
  // Write back
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log(`Updated ${service}/package.json with coverage scripts`);
});

// Update packages as well
const packagesDir = path.join(__dirname, '..', 'packages');
const packages = fs.readdirSync(packagesDir).filter(dir => {
  const packagePath = path.join(packagesDir, dir);
  return fs.statSync(packagePath).isDirectory() && 
         fs.existsSync(path.join(packagePath, 'package.json'));
});

packages.forEach(pkg => {
  const packagePath = path.join(packagesDir, pkg, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  if (packageJson.scripts) {
    // Update scripts
    if (!packageJson.scripts['test:coverage']) {
      packageJson.scripts['test:coverage'] = 'jest --coverage';
    }
    if (!packageJson.scripts['test:coverage:watch']) {
      packageJson.scripts['test:coverage:watch'] = 'jest --coverage --watch';
    }
    if (!packageJson.scripts['test:ci']) {
      packageJson.scripts['test:ci'] = 'jest --ci --coverage --maxWorkers=2';
    }
    
    // Write back
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
    console.log(`Updated ${pkg}/package.json with coverage scripts`);
  }
});

console.log('\nAll package.json files updated with coverage scripts!');