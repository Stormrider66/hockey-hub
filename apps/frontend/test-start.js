// Simple test to see if Next.js can start
const { spawn } = require('child_process');
const path = require('path');

console.log('Testing Next.js startup...');
console.log('Current directory:', process.cwd());
console.log('Node version:', process.version);

// Set environment variables
process.env.NODE_ENV = 'development';
process.env.PORT = '3003';

// Try to start Next.js
const next = spawn('npx', ['next', 'dev', '-p', '3003'], {
  cwd: __dirname,
  env: process.env,
  stdio: 'inherit'
});

next.on('error', (err) => {
  console.error('Failed to start Next.js:', err);
});

next.on('exit', (code) => {
  console.log('Next.js exited with code:', code);
});