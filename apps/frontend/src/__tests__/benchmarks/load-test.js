const { performance } = require('perf_hooks');
const fetch = require('node-fetch');
const WebSocket = require('ws');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3010';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const WS_URL = process.env.WS_URL || 'ws://localhost:3002';

// Load test configuration
const LOAD_TEST_CONFIG = {
  users: 500,
  rampUpTime: 30000, // 30 seconds to ramp up to full load
  testDuration: 300000, // 5 minutes test duration
  scenarios: {
    browsingUser: 0.4, // 40% just browsing
    activeUser: 0.3, // 30% actively using features
    heavyUser: 0.2, // 20% heavy usage (coaches, trainers)
    idleUser: 0.1, // 10% idle/background
  },
};

// Metrics collector
class MetricsCollector {
  constructor() {
    this.metrics = {
      requests: [],
      errors: [],
      responseTimes: [],
      throughput: [],
      cacheHits: 0,
      cacheMisses: 0,
      memoryUsage: [],
      cpuUsage: [],
      websocketConnections: 0,
      websocketMessages: 0,
    };
    this.startTime = Date.now();
  }

  recordRequest(endpoint, responseTime, success = true, cached = false) {
    this.metrics.requests.push({
      endpoint,
      responseTime,
      success,
      cached,
      timestamp: Date.now() - this.startTime,
    });
    
    this.metrics.responseTimes.push(responseTime);
    
    if (cached) {
      this.metrics.cacheHits++;
    } else {
      this.metrics.cacheMisses++;
    }
    
    if (!success) {
      this.metrics.errors.push({
        endpoint,
        timestamp: Date.now() - this.startTime,
      });
    }
  }

  recordMemoryUsage() {
    if (process.memoryUsage) {
      this.metrics.memoryUsage.push({
        timestamp: Date.now() - this.startTime,
        heapUsed: process.memoryUsage().heapUsed,
        rss: process.memoryUsage().rss,
      });
    }
  }

  recordWebSocketActivity(type) {
    if (type === 'connection') {
      this.metrics.websocketConnections++;
    } else if (type === 'message') {
      this.metrics.websocketMessages++;
    }
  }

  calculateThroughput() {
    const duration = (Date.now() - this.startTime) / 1000; // in seconds
    const throughput = this.metrics.requests.length / duration;
    this.metrics.throughput.push({
      timestamp: Date.now() - this.startTime,
      requestsPerSecond: throughput,
    });
  }

  generateReport() {
    const totalRequests = this.metrics.requests.length;
    const successfulRequests = this.metrics.requests.filter(r => r.success).length;
    const failedRequests = totalRequests - successfulRequests;
    const avgResponseTime = this.metrics.responseTimes.reduce((a, b) => a + b, 0) / totalRequests;
    const maxResponseTime = Math.max(...this.metrics.responseTimes);
    const minResponseTime = Math.min(...this.metrics.responseTimes);
    const cacheHitRate = (this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)) * 100;
    
    // Calculate percentiles
    const sortedTimes = [...this.metrics.responseTimes].sort((a, b) => a - b);
    const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)];
    const p90 = sortedTimes[Math.floor(sortedTimes.length * 0.9)];
    const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
    const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)];
    
    return {
      summary: {
        totalRequests,
        successfulRequests,
        failedRequests,
        successRate: (successfulRequests / totalRequests * 100).toFixed(2) + '%',
        avgResponseTime: avgResponseTime.toFixed(2) + 'ms',
        minResponseTime: minResponseTime + 'ms',
        maxResponseTime: maxResponseTime + 'ms',
        cacheHitRate: cacheHitRate.toFixed(2) + '%',
        websocketConnections: this.metrics.websocketConnections,
        websocketMessages: this.metrics.websocketMessages,
      },
      percentiles: {
        p50: p50 + 'ms',
        p90: p90 + 'ms',
        p95: p95 + 'ms',
        p99: p99 + 'ms',
      },
      timeline: {
        requests: this.metrics.requests,
        throughput: this.metrics.throughput,
        memoryUsage: this.metrics.memoryUsage,
      },
    };
  }
}

// Virtual user simulation
class VirtualUser {
  constructor(userId, scenario, metricsCollector) {
    this.userId = userId;
    this.scenario = scenario;
    this.metrics = metricsCollector;
    this.cache = new Map();
    this.active = true;
    this.websocket = null;
  }

  async makeRequest(endpoint, useCache = true) {
    const url = `${API_BASE_URL}${endpoint}`;
    const cached = useCache && this.cache.has(url);
    
    if (cached) {
      const cachedData = this.cache.get(url);
      this.metrics.recordRequest(endpoint, 1, true, true); // 1ms for cached response
      return cachedData;
    }
    
    const startTime = performance.now();
    
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer mock-token-${this.userId}`,
          'Content-Type': 'application/json',
        },
      });
      
      const responseTime = performance.now() - startTime;
      const data = await response.json();
      
      if (useCache) {
        this.cache.set(url, data);
      }
      
      this.metrics.recordRequest(endpoint, responseTime, response.ok, false);
      return data;
    } catch (error) {
      const responseTime = performance.now() - startTime;
      this.metrics.recordRequest(endpoint, responseTime, false, false);
      throw error;
    }
  }

  async loadDashboard(dashboardType) {
    const endpoints = this.getDashboardEndpoints(dashboardType);
    
    // Simulate parallel loading of dashboard data
    const promises = endpoints.map(endpoint => 
      this.makeRequest(endpoint).catch(err => console.error(`Error loading ${endpoint}:`, err))
    );
    
    await Promise.all(promises);
  }

  getDashboardEndpoints(dashboardType) {
    const commonEndpoints = [
      '/api/users/profile',
      '/api/notifications/unread',
      '/api/calendar/events',
    ];
    
    const dashboardSpecific = {
      player: [
        '/api/training/sessions/upcoming',
        '/api/medical/wellness',
        '/api/statistics/personal',
      ],
      coach: [
        '/api/teams/roster',
        '/api/training/team-sessions',
        '/api/planning/season',
      ],
      trainer: [
        '/api/training/sessions',
        '/api/users/players',
        '/api/training/templates',
        '/api/medical/reports',
      ],
      parent: [
        '/api/users/children',
        '/api/payment/invoices',
        '/api/calendar/child-events',
      ],
    };
    
    return [...commonEndpoints, ...(dashboardSpecific[dashboardType] || [])];
  }

  async simulateWebSocketConnection() {
    return new Promise((resolve) => {
      this.websocket = new WebSocket(`${WS_URL}/socket.io/?EIO=4&transport=websocket`);
      
      this.websocket.on('open', () => {
        this.metrics.recordWebSocketActivity('connection');
        resolve();
      });
      
      this.websocket.on('message', () => {
        this.metrics.recordWebSocketActivity('message');
      });
      
      this.websocket.on('error', (error) => {
        console.error(`WebSocket error for user ${this.userId}:`, error);
      });
    });
  }

  async simulateVirtualScrolling() {
    // Simulate scrolling through large dataset
    const pageSize = 50;
    const totalPages = 10;
    
    for (let page = 0; page < totalPages && this.active; page++) {
      await this.makeRequest(`/api/users/players?page=${page}&size=${pageSize}`);
      
      // Simulate scroll delay
      await this.delay(100 + Math.random() * 200);
    }
  }

  async runScenario() {
    try {
      // Initial dashboard load
      const dashboardType = this.getDashboardType();
      await this.loadDashboard(dashboardType);
      
      // Establish WebSocket connection for real-time features
      if (this.scenario !== 'idleUser') {
        await this.simulateWebSocketConnection();
      }
      
      // Run scenario-specific behavior
      switch (this.scenario) {
        case 'browsingUser':
          await this.simulateBrowsing();
          break;
        case 'activeUser':
          await this.simulateActiveUsage();
          break;
        case 'heavyUser':
          await this.simulateHeavyUsage();
          break;
        case 'idleUser':
          await this.simulateIdleUser();
          break;
      }
    } catch (error) {
      console.error(`Error in user ${this.userId} scenario:`, error);
    }
  }

  async simulateBrowsing() {
    while (this.active) {
      // Navigate between different views
      await this.makeRequest('/api/calendar/events');
      await this.delay(3000);
      
      await this.makeRequest('/api/notifications/all');
      await this.delay(5000);
      
      await this.makeRequest('/api/statistics/overview');
      await this.delay(4000);
    }
  }

  async simulateActiveUsage() {
    while (this.active) {
      // Perform CRUD operations
      await this.makeRequest('/api/training/sessions');
      await this.delay(2000);
      
      // Simulate creating a new session
      await this.makeRequest('/api/training/sessions', false); // No cache for POST
      await this.delay(1000);
      
      // Load player data with virtual scrolling
      await this.simulateVirtualScrolling();
      await this.delay(3000);
      
      // Check messages
      await this.makeRequest('/api/messages/conversations');
      await this.delay(2000);
    }
  }

  async simulateHeavyUsage() {
    while (this.active) {
      // Heavy operations like bulk updates
      const players = await this.makeRequest('/api/users/players?size=100');
      await this.delay(1000);
      
      // Simulate workout builder usage
      await this.makeRequest('/api/training/exercises');
      await this.makeRequest('/api/training/templates');
      await this.delay(2000);
      
      // Generate reports
      await this.makeRequest('/api/statistics/team-report');
      await this.delay(5000);
      
      // Medical integration
      await this.makeRequest('/api/medical/reports/team');
      await this.delay(3000);
    }
  }

  async simulateIdleUser() {
    // Just maintain session with periodic heartbeat
    while (this.active) {
      await this.makeRequest('/api/users/heartbeat');
      await this.delay(30000); // Every 30 seconds
    }
  }

  getDashboardType() {
    const types = ['player', 'coach', 'trainer', 'parent'];
    return types[Math.floor(Math.random() * types.length)];
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  stop() {
    this.active = false;
    if (this.websocket) {
      this.websocket.close();
    }
  }
}

// Load test orchestrator
class LoadTestOrchestrator {
  constructor(config = LOAD_TEST_CONFIG) {
    this.config = config;
    this.metrics = new MetricsCollector();
    this.users = [];
  }

  async run() {
    console.log(`Starting load test with ${this.config.users} virtual users...`);
    console.log(`Ramp up time: ${this.config.rampUpTime / 1000}s`);
    console.log(`Test duration: ${this.config.testDuration / 1000}s\n`);
    
    // Start metrics collection
    this.startMetricsCollection();
    
    // Ramp up users
    await this.rampUpUsers();
    
    // Run for specified duration
    await this.delay(this.config.testDuration);
    
    // Stop all users
    this.stopAllUsers();
    
    // Generate and display report
    const report = this.metrics.generateReport();
    this.displayReport(report);
    
    // Save detailed report
    await this.saveReport(report);
  }

  async rampUpUsers() {
    const usersPerBatch = 10;
    const batchDelay = this.config.rampUpTime / (this.config.users / usersPerBatch);
    
    for (let i = 0; i < this.config.users; i += usersPerBatch) {
      const batch = [];
      
      for (let j = 0; j < usersPerBatch && i + j < this.config.users; j++) {
        const userId = i + j;
        const scenario = this.selectScenario();
        const user = new VirtualUser(userId, scenario, this.metrics);
        
        this.users.push(user);
        batch.push(user.runScenario());
      }
      
      await Promise.all(batch);
      
      console.log(`Started ${i + batch.length} users...`);
      
      if (i + usersPerBatch < this.config.users) {
        await this.delay(batchDelay);
      }
    }
    
    console.log(`All ${this.config.users} users started!\n`);
  }

  selectScenario() {
    const random = Math.random();
    let cumulative = 0;
    
    for (const [scenario, probability] of Object.entries(this.config.scenarios)) {
      cumulative += probability;
      if (random < cumulative) {
        return scenario;
      }
    }
    
    return 'browsingUser';
  }

  startMetricsCollection() {
    // Collect metrics every 5 seconds
    this.metricsInterval = setInterval(() => {
      this.metrics.recordMemoryUsage();
      this.metrics.calculateThroughput();
    }, 5000);
  }

  stopAllUsers() {
    console.log('\nStopping all users...');
    this.users.forEach(user => user.stop());
    clearInterval(this.metricsInterval);
  }

  displayReport(report) {
    console.log('\n=== LOAD TEST REPORT ===\n');
    
    console.log('SUMMARY:');
    Object.entries(report.summary).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    
    console.log('\nRESPONSE TIME PERCENTILES:');
    Object.entries(report.percentiles).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    
    console.log('\nPERFORMANCE TARGETS:');
    console.log(`  ✓ Success rate > 99%: ${parseFloat(report.summary.successRate) > 99 ? 'PASS' : 'FAIL'}`);
    console.log(`  ✓ Average response time < 200ms: ${parseFloat(report.summary.avgResponseTime) < 200 ? 'PASS' : 'FAIL'}`);
    console.log(`  ✓ P95 response time < 500ms: ${parseFloat(report.percentiles.p95) < 500 ? 'PASS' : 'FAIL'}`);
    console.log(`  ✓ Cache hit rate > 60%: ${parseFloat(report.summary.cacheHitRate) > 60 ? 'PASS' : 'FAIL'}`);
  }

  async saveReport(report) {
    const fs = require('fs').promises;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `load-test-report-${timestamp}.json`;
    
    await fs.writeFile(filename, JSON.stringify(report, null, 2));
    console.log(`\nDetailed report saved to: ${filename}`);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Service Worker cache simulation
class ServiceWorkerSimulator {
  constructor() {
    this.cache = new Map();
    this.cacheStats = {
      hits: 0,
      misses: 0,
      updates: 0,
    };
  }

  async fetch(url) {
    if (this.shouldCache(url)) {
      const cached = this.cache.get(url);
      
      if (cached && !this.isStale(cached)) {
        this.cacheStats.hits++;
        return cached.data;
      }
      
      this.cacheStats.misses++;
      const data = await this.fetchFromNetwork(url);
      
      this.cache.set(url, {
        data,
        timestamp: Date.now(),
      });
      
      return data;
    }
    
    return this.fetchFromNetwork(url);
  }

  shouldCache(url) {
    // Cache static assets and GET API requests
    return url.includes('/api/') || 
           url.includes('.js') || 
           url.includes('.css') || 
           url.includes('.json');
  }

  isStale(cached) {
    const maxAge = 60000; // 1 minute
    return Date.now() - cached.timestamp > maxAge;
  }

  async fetchFromNetwork(url) {
    // Simulate network fetch
    await this.delay(50 + Math.random() * 100);
    return { url, data: 'mock data', timestamp: Date.now() };
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getStats() {
    const total = this.cacheStats.hits + this.cacheStats.misses;
    const hitRate = total > 0 ? (this.cacheStats.hits / total) * 100 : 0;
    
    return {
      ...this.cacheStats,
      hitRate: hitRate.toFixed(2) + '%',
      cacheSize: this.cache.size,
    };
  }
}

// CLI entry point
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'full':
      const orchestrator = new LoadTestOrchestrator();
      await orchestrator.run();
      break;
      
    case 'quick':
      const quickConfig = {
        ...LOAD_TEST_CONFIG,
        users: 50,
        rampUpTime: 10000,
        testDuration: 60000,
      };
      const quickTest = new LoadTestOrchestrator(quickConfig);
      await quickTest.run();
      break;
      
    case 'cache':
      console.log('Testing service worker cache performance...');
      const sw = new ServiceWorkerSimulator();
      const cacheMetrics = new MetricsCollector();
      
      // Simulate cache usage
      for (let i = 0; i < 1000; i++) {
        const url = `/api/endpoint-${i % 20}`; // 20 unique endpoints
        const start = performance.now();
        await sw.fetch(url);
        const duration = performance.now() - start;
        cacheMetrics.recordRequest(url, duration, true, sw.cacheStats.hits > 0);
      }
      
      console.log('Cache performance:', sw.getStats());
      break;
      
    default:
      console.log('Hockey Hub Load Testing Tool');
      console.log('');
      console.log('Usage:');
      console.log('  node load-test.js full   - Run full load test (500 users, 5 minutes)');
      console.log('  node load-test.js quick  - Run quick test (50 users, 1 minute)');
      console.log('  node load-test.js cache  - Test service worker cache performance');
  }
}

// Export for programmatic use
module.exports = {
  LoadTestOrchestrator,
  VirtualUser,
  MetricsCollector,
  ServiceWorkerSimulator,
};

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}