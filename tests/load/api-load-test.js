import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.1'],    // Error rate must be below 10%
    errors: ['rate<0.1'],             // Custom error rate must be below 10%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Test data
const testUsers = [
  { email: 'player1@test.com', password: 'Test123!@#' },
  { email: 'player2@test.com', password: 'Test123!@#' },
  { email: 'coach1@test.com', password: 'Test123!@#' },
];

export function setup() {
  // Setup code - create test users if needed
  console.log('Setting up test data...');
  
  // Register test users
  testUsers.forEach(user => {
    const payload = JSON.stringify({
      email: user.email,
      password: user.password,
      name: user.email.split('@')[0],
      role: user.email.includes('coach') ? 'coach' : 'player',
    });

    const params = {
      headers: { 'Content-Type': 'application/json' },
    };

    http.post(`${BASE_URL}/api/auth/register`, payload, params);
  });

  return { testUsers };
}

export default function (data) {
  // Select a random test user
  const user = data.testUsers[Math.floor(Math.random() * data.testUsers.length)];
  
  // 1. Login
  const loginPayload = JSON.stringify({
    email: user.email,
    password: user.password,
  });

  const loginParams = {
    headers: { 'Content-Type': 'application/json' },
  };

  const loginRes = http.post(`${BASE_URL}/api/auth/login`, loginPayload, loginParams);
  
  const loginSuccess = check(loginRes, {
    'login successful': (r) => r.status === 200,
    'login has token': (r) => r.json('accessToken') !== '',
  });

  errorRate.add(!loginSuccess);

  if (!loginSuccess) {
    return;
  }

  const authToken = loginRes.json('accessToken');
  const authParams = {
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
  };

  // 2. Get user profile
  const profileRes = http.get(`${BASE_URL}/api/users/me`, authParams);
  check(profileRes, {
    'profile retrieved': (r) => r.status === 200,
  });

  sleep(1);

  // 3. Get dashboard data
  const dashboardRes = http.get(`${BASE_URL}/api/dashboard`, authParams);
  check(dashboardRes, {
    'dashboard loaded': (r) => r.status === 200,
  });

  sleep(1);

  // 4. Get calendar events
  const calendarRes = http.get(`${BASE_URL}/api/calendar/events`, authParams);
  check(calendarRes, {
    'calendar loaded': (r) => r.status === 200,
  });

  sleep(1);

  // 5. Submit wellness data (for players)
  if (user.email.includes('player')) {
    const wellnessPayload = JSON.stringify({
      sleepQuality: Math.floor(Math.random() * 5) + 1,
      energyLevel: Math.floor(Math.random() * 5) + 1,
      musclesSoreness: Math.floor(Math.random() * 5) + 1,
      stress: Math.floor(Math.random() * 5) + 1,
      mood: Math.floor(Math.random() * 5) + 1,
      hrvScore: Math.floor(Math.random() * 30) + 70,
    });

    const wellnessRes = http.post(`${BASE_URL}/api/wellness`, wellnessPayload, authParams);
    check(wellnessRes, {
      'wellness submitted': (r) => r.status === 201 || r.status === 200,
    });
  }

  sleep(1);

  // 6. Get notifications
  const notificationsRes = http.get(`${BASE_URL}/api/notifications`, authParams);
  check(notificationsRes, {
    'notifications loaded': (r) => r.status === 200,
  });

  sleep(1);

  // 7. Logout
  const logoutRes = http.post(`${BASE_URL}/api/auth/logout`, null, authParams);
  check(logoutRes, {
    'logout successful': (r) => r.status === 200,
  });

  sleep(Math.random() * 3 + 1); // Random sleep between 1-4 seconds
}

export function teardown(data) {
  // Cleanup code if needed
  console.log('Test completed');
}