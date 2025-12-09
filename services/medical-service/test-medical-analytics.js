#!/usr/bin/env node

/**
 * Simple test script for Medical Analytics endpoints
 * Run this after starting the medical service to verify endpoints work
 */

const http = require('http');

// Test endpoints
const endpoints = [
  {
    name: 'Team Medical Overview',
    path: '/api/medical-analytics/team/team-001/overview',
    method: 'GET'
  },
  {
    name: 'Medical Alerts',
    path: '/api/medical-analytics/alerts?teamId=team-001&limit=10',
    method: 'GET'
  },
  {
    name: 'Recovery Analytics',
    path: '/api/medical-analytics/recovery?teamId=team-001&status=active',
    method: 'GET'
  },
  {
    name: 'Injury Trends',
    path: '/api/medical-analytics/injury-trends?teamId=team-001&period=30d',
    method: 'GET'
  },
  {
    name: 'Player Risk Prediction',
    path: '/api/medical-analytics/prediction/player-5?horizon=30d',
    method: 'GET'
  }
];

// Mock JWT token (physical_trainer role)
const mockToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiIxMjMiLCJyb2xlcyI6WyJwaHlzaWNhbF90cmFpbmVyIl0sImV4cCI6MTk5OTk5OTk5OX0.mock-token-for-testing';

function testEndpoint(endpoint) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3005,
      path: endpoint.path,
      method: endpoint.method,
      headers: {
        'Authorization': `Bearer ${mockToken}`,
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({
            name: endpoint.name,
            status: res.statusCode,
            success: res.statusCode === 200,
            data: response,
            error: res.statusCode !== 200 ? response : null
          });
        } catch (error) {
          resolve({
            name: endpoint.name,
            status: res.statusCode,
            success: false,
            data: null,
            error: `Parse error: ${error.message}. Raw data: ${data.substring(0, 200)}`
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        name: endpoint.name,
        status: 'ERROR',
        success: false,
        data: null,
        error: `Request error: ${error.message}`
      });
    });

    req.setTimeout(5000, () => {
      req.abort();
      resolve({
        name: endpoint.name,
        status: 'TIMEOUT',
        success: false,
        data: null,
        error: 'Request timeout'
      });
    });

    req.end();
  });
}

async function runTests() {
  console.log('🏥 Testing Medical Analytics Endpoints');
  console.log('=====================================\n');

  // Check if medical service is running
  try {
    const healthCheck = await testEndpoint({
      name: 'Health Check',
      path: '/health',
      method: 'GET'
    });

    if (!healthCheck.success) {
      console.log('❌ Medical service is not running on port 3005');
      console.log('   Please start the service first: cd services/medical-service && npm start');
      return;
    }
    console.log('✅ Medical service is running\n');
  } catch (error) {
    console.log('❌ Cannot connect to medical service:', error.message);
    return;
  }

  // Test all endpoints
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    
    if (result.success) {
      console.log(`✅ ${result.name}`);
      console.log(`   Status: ${result.status}`);
      
      // Show key data points for verification
      if (result.data) {
        if (result.name === 'Team Medical Overview') {
          console.log(`   Team ID: ${result.data.teamId}`);
          console.log(`   Total Players: ${result.data.totalPlayers}`);
          console.log(`   Healthy Players: ${result.data.healthyPlayers}`);
          console.log(`   Risk Score: ${result.data.averageRiskScore}`);
        } else if (result.name === 'Medical Alerts') {
          console.log(`   Alerts Count: ${result.data.alerts?.length || 0}`);
          console.log(`   Critical: ${result.data.summary?.critical || 0}`);
          console.log(`   High: ${result.data.summary?.high || 0}`);
        } else if (result.name === 'Recovery Analytics') {
          console.log(`   Active Recoveries: ${result.data.activeRecoveries}`);
          console.log(`   Completed: ${result.data.completedRecoveries}`);
          console.log(`   Overdue: ${result.data.overdueRecoveries}`);
        } else if (result.name === 'Injury Trends') {
          console.log(`   Total Injuries: ${result.data.totalInjuries}`);
          console.log(`   Trends Data: ${result.data.trendsData?.length || 0} categories`);
        } else if (result.name === 'Player Risk Prediction') {
          console.log(`   Player: ${result.data.playerName}`);
          console.log(`   Risk Score: ${result.data.riskScore}`);
          console.log(`   Risk Level: ${result.data.riskLevel}`);
        }
      }
    } else {
      console.log(`❌ ${result.name}`);
      console.log(`   Status: ${result.status}`);
      console.log(`   Error: ${result.error}`);
    }
    console.log('');
  }

  console.log('🏁 Testing complete!');
}

// Run the tests
runTests().catch(console.error);