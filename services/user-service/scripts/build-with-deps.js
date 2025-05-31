#!/usr/bin/env node

/**
 * Build script that ensures dependencies are built before the service
 * 
 * This script builds the shared types package before building the user service
 * to ensure that all dependencies are up-to-date.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Define paths
const rootDir = path.resolve(__dirname, '../../..');
const sharedTypesDir = path.join(rootDir, 'shared/types');
const userServiceDir = path.join(rootDir, 'services/user-service');

// Helper function to execute commands
function runCommand(command, cwd) {
  console.log(`Running command: ${command} in ${cwd}`);
  try {
    execSync(command, {
      cwd,
      stdio: 'inherit',
    });
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    process.exit(1);
  }
}

// Main function to orchestrate the build process
function buildWithDependencies() {
  console.log('Starting build process with dependencies...');
  
  // Check if shared types directory exists
  if (!fs.existsSync(sharedTypesDir)) {
    console.error(`Shared types directory not found: ${sharedTypesDir}`);
    process.exit(1);
  }
  
  // Step 1: Build shared types package
  console.log('\n=== Building shared types package ===');
  runCommand('npm run build', sharedTypesDir);
  
  // Step 2: Build user service
  console.log('\n=== Building user service ===');
  runCommand('npm run build', userServiceDir);
  
  console.log('\n=== Build completed successfully ===');
  
  // Verify the existence of critical files
  const distTypesDir = path.join(sharedTypesDir, 'dist');
  const userServiceDistDir = path.join(userServiceDir, 'dist');
  
  if (!fs.existsSync(path.join(distTypesDir, 'index.js')) || 
      !fs.existsSync(path.join(distTypesDir, 'validation.js'))) {
    console.warn('Warning: Some shared types files may be missing!');
  }
  
  if (!fs.existsSync(path.join(userServiceDistDir, 'index.js'))) {
    console.warn('Warning: User service build may be incomplete!');
  }
}

// Execute the build
buildWithDependencies(); 