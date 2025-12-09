const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Hockey Hub Development Environment (Simple Mode)');
console.log('==========================================================\n');

const services = [
  { name: 'Frontend', path: 'apps/frontend', port: 3002, command: 'npm', args: ['run', 'dev'] },
  { name: 'API Gateway', path: 'services/api-gateway', port: 3000, command: 'npm', args: ['run', 'dev'] },
  { name: 'User Service', path: 'services/user-service', port: 3001, command: 'npm', args: ['run', 'dev'] }
];

const processes = [];

services.forEach(service => {
  console.log(`Starting ${service.name} on port ${service.port}...`);
  
  const proc = spawn(service.command, service.args, {
    cwd: path.join(__dirname, service.path),
    stdio: 'pipe',
    shell: true
  });

  proc.stdout.on('data', (data) => {
    console.log(`[${service.name}] ${data.toString().trim()}`);
  });

  proc.stderr.on('data', (data) => {
    console.error(`[${service.name}] ERROR: ${data.toString().trim()}`);
  });

  proc.on('error', (error) => {
    console.error(`[${service.name}] Failed to start: ${error.message}`);
  });

  processes.push(proc);
});

console.log('\n✅ Services starting up...');
console.log('\n🌐 Access points:');
console.log('   Frontend: http://localhost:3002');
console.log('   API Gateway: http://localhost:3000\n');
console.log('Press Ctrl+C to stop all services\n');

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nShutting down services...');
  processes.forEach(proc => proc.kill());
  process.exit();
});