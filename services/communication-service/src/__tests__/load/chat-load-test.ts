/**
 * Load Testing for Chat System
 * 
 * This file contains load test scenarios for the Hockey Hub chat system.
 * It can be used with tools like:
 * - k6 (recommended)
 * - Artillery
 * - JMeter
 * - Gatling
 * 
 * The tests simulate realistic user behavior and measure system performance
 * under various load conditions.
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { WebSocket } from 'k6/experimental/websockets';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const messagesSent = new Counter('messages_sent');
const messagesReceived = new Counter('messages_received');
const messageSendTime = new Trend('message_send_time');
const websocketConnections = new Counter('websocket_connections');
const failedRequests = new Rate('failed_requests');

// Test configuration
export const options = {
  scenarios: {
    // Scenario 1: Gradual ramp-up
    gradual_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 },   // Ramp up to 50 users in 2 min
        { duration: '5m', target: 100 },  // Ramp up to 100 users in 5 min
        { duration: '10m', target: 200 }, // Stay at 200 users for 10 min
        { duration: '5m', target: 100 },  // Ramp down to 100 users
        { duration: '2m', target: 0 },    // Ramp down to 0
      ],
      gracefulRampDown: '30s',
    },
    
    // Scenario 2: Spike test
    spike_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 10 },   // Warm up
        { duration: '30s', target: 500 }, // Spike to 500 users
        { duration: '2m', target: 500 },  // Hold the spike
        { duration: '1m', target: 10 },   // Back to normal
      ],
      startTime: '25m', // Start after gradual load test
    },
    
    // Scenario 3: Stress test
    stress_test: {
      executor: 'constant-vus',
      vus: 300,
      duration: '10m',
      startTime: '35m', // Start after spike test
    },
  },
  
  thresholds: {
    // HTTP request thresholds
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.05'], // Error rate under 5%
    
    // Custom metric thresholds
    message_send_time: ['p(95)<200', 'p(99)<500'], // Message send latency
    failed_requests: ['rate<0.05'], // Failed request rate under 5%
    
    // WebSocket thresholds
    ws_connecting: ['p(95)<1000'], // WebSocket connection time
    ws_session_duration: ['p(95)>30000'], // Sessions should last > 30s
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const WS_URL = __ENV.WS_URL || 'ws://localhost:3000';

// Test data
const testUsers = generateTestUsers(1000);
const testMessages = generateTestMessages();
const testFiles = generateTestFiles();

export function setup() {
  // Setup code - create test users, cleanup old data, etc.
  console.log('Setting up load test environment...');
  
  // Create test conversations
  const conversations = [];
  for (let i = 0; i < 100; i++) {
    const response = http.post(`${BASE_URL}/api/conversations`, JSON.stringify({
      type: i % 3 === 0 ? 'group' : 'direct',
      name: `Load Test Conversation ${i}`,
      participant_ids: getRandomUsers(i % 3 === 0 ? 5 : 2),
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + getAdminToken(),
      },
    });
    
    if (response.status === 201) {
      conversations.push(JSON.parse(response.body).data);
    }
  }
  
  return { conversations, users: testUsers };
}

export default function (data) {
  const user = testUsers[__VU % testUsers.length];
  const token = authenticateUser(user);
  
  // Simulate different user behaviors
  const behavior = __VU % 5;
  
  switch (behavior) {
    case 0:
      activeChatter(token, data);
      break;
    case 1:
      casualUser(token, data);
      break;
    case 2:
      fileSharer(token, data);
      break;
    case 3:
      groupChatUser(token, data);
      break;
    case 4:
      lurker(token, data);
      break;
  }
}

// User behavior patterns
function activeChatter(token: string, data: any) {
  // Very active user - sends many messages
  const ws = new WebSocket(`${WS_URL}/socket.io/?token=${token}`);
  
  ws.on('open', () => {
    websocketConnections.add(1);
    
    // Join multiple conversations
    const conversations = getRandomItems(data.conversations, 5);
    conversations.forEach(conv => {
      ws.send(JSON.stringify({
        event: 'join_conversation',
        data: { conversation_id: conv.id },
      }));
    });
  });
  
  ws.on('message', (msg) => {
    messagesReceived.add(1);
    const data = JSON.parse(msg);
    
    if (data.event === 'new_message') {
      // React to messages occasionally
      if (Math.random() < 0.3) {
        sendReaction(token, data.message.id);
      }
    }
  });
  
  // Send messages frequently
  for (let i = 0; i < 20; i++) {
    sleep(randomBetween(2, 10));
    
    const conversation = getRandomItem(data.conversations);
    const start = Date.now();
    
    const response = http.post(`${BASE_URL}/api/messages`, JSON.stringify({
      conversation_id: conversation.id,
      content: getRandomMessage(),
      type: 'text',
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    messageSendTime.add(Date.now() - start);
    
    check(response, {
      'message sent successfully': (r) => r.status === 201,
    }) || failedRequests.add(1);
    
    if (response.status === 201) {
      messagesSent.add(1);
    }
  }
  
  ws.close();
}

function casualUser(token: string, data: any) {
  // Moderate activity - checks messages, sends occasionally
  const ws = new WebSocket(`${WS_URL}/socket.io/?token=${token}`);
  
  ws.on('open', () => {
    websocketConnections.add(1);
    
    // Join 1-2 conversations
    const conversations = getRandomItems(data.conversations, 2);
    conversations.forEach(conv => {
      ws.send(JSON.stringify({
        event: 'join_conversation',
        data: { conversation_id: conv.id },
      }));
    });
  });
  
  // Check messages
  const conversations = getRandomItems(data.conversations, 3);
  conversations.forEach(conv => {
    const response = http.get(`${BASE_URL}/api/messages?conversation_id=${conv.id}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    
    check(response, {
      'messages retrieved': (r) => r.status === 200,
    }) || failedRequests.add(1);
    
    sleep(randomBetween(5, 15));
  });
  
  // Send a few messages
  for (let i = 0; i < 5; i++) {
    sleep(randomBetween(10, 30));
    
    const conversation = getRandomItem(conversations);
    sendMessage(token, conversation.id, getRandomMessage());
  }
  
  // Mark messages as read
  conversations.forEach(conv => {
    markMessagesAsRead(token, conv.id);
    sleep(2);
  });
  
  ws.close();
}

function fileSharer(token: string, data: any) {
  // Shares files in conversations
  const conversation = getRandomItem(data.conversations);
  
  // Upload and share files
  for (let i = 0; i < 3; i++) {
    const file = getRandomFile();
    
    // Simulate file upload
    const uploadResponse = http.post(`${BASE_URL}/api/files/upload`, file.content, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': file.mimeType,
      },
    });
    
    if (uploadResponse.status === 200) {
      const fileUrl = JSON.parse(uploadResponse.body).data.url;
      
      // Send message with file
      sendMessage(token, conversation.id, 'Check out this file', [{
        file_url: fileUrl,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.mimeType,
      }]);
    }
    
    sleep(randomBetween(20, 40));
  }
}

function groupChatUser(token: string, data: any) {
  // Active in group chats
  const groupConversations = data.conversations.filter(c => c.type === 'group');
  const ws = new WebSocket(`${WS_URL}/socket.io/?token=${token}`);
  
  ws.on('open', () => {
    websocketConnections.add(1);
    
    // Join all group conversations
    groupConversations.forEach(conv => {
      ws.send(JSON.stringify({
        event: 'join_conversation',
        data: { conversation_id: conv.id },
      }));
    });
  });
  
  // Participate in group discussions
  groupConversations.forEach(conv => {
    // Send typing indicator
    ws.send(JSON.stringify({
      event: 'typing',
      data: {
        conversation_id: conv.id,
        is_typing: true,
      },
    }));
    
    sleep(randomBetween(2, 5));
    
    // Send message with mentions
    const mentions = getRandomItems(conv.participants, 2).map(p => p.user_id);
    sendMessage(token, conv.id, getMentionMessage(mentions), null, mentions);
    
    // Stop typing
    ws.send(JSON.stringify({
      event: 'typing',
      data: {
        conversation_id: conv.id,
        is_typing: false,
      },
    }));
    
    sleep(randomBetween(10, 20));
  });
  
  ws.close();
}

function lurker(token: string, data: any) {
  // Mostly reads, rarely participates
  const ws = new WebSocket(`${WS_URL}/socket.io/?token=${token}`);
  
  ws.on('open', () => {
    websocketConnections.add(1);
    
    // Join many conversations but don't participate
    const conversations = getRandomItems(data.conversations, 10);
    conversations.forEach(conv => {
      ws.send(JSON.stringify({
        event: 'join_conversation',
        data: { conversation_id: conv.id },
      }));
    });
  });
  
  ws.on('message', (msg) => {
    messagesReceived.add(1);
  });
  
  // Just stay connected and receive messages
  sleep(60);
  
  // Occasionally mark messages as read
  const conversation = getRandomItem(data.conversations);
  markMessagesAsRead(token, conversation.id);
  
  ws.close();
}

// Helper functions
function authenticateUser(user: any): string {
  const response = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: user.email,
    password: user.password,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  check(response, {
    'authenticated successfully': (r) => r.status === 200,
  }) || failedRequests.add(1);
  
  return response.status === 200 ? JSON.parse(response.body).data.token : '';
}

function sendMessage(
  token: string, 
  conversationId: string, 
  content: string, 
  attachments?: any[],
  mentions?: string[]
) {
  const start = Date.now();
  
  const response = http.post(`${BASE_URL}/api/messages`, JSON.stringify({
    conversation_id: conversationId,
    content: content,
    type: attachments ? 'file' : 'text',
    attachments: attachments,
    mentions: mentions,
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
  
  messageSendTime.add(Date.now() - start);
  
  check(response, {
    'message sent': (r) => r.status === 201,
  }) || failedRequests.add(1);
  
  if (response.status === 201) {
    messagesSent.add(1);
  }
}

function sendReaction(token: string, messageId: string) {
  const emojis = ['👍', '❤️', '😂', '🎉', '👏', '🔥'];
  
  http.post(`${BASE_URL}/api/messages/${messageId}/reactions`, JSON.stringify({
    emoji: getRandomItem(emojis),
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
}

function markMessagesAsRead(token: string, conversationId: string) {
  const response = http.get(`${BASE_URL}/api/messages?conversation_id=${conversationId}&limit=10`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  
  if (response.status === 200) {
    const messages = JSON.parse(response.body).data;
    const unreadIds = messages
      .filter(m => !m.read_by.includes(__VU.toString()))
      .map(m => m.id);
    
    if (unreadIds.length > 0) {
      http.post(`${BASE_URL}/api/messages/read`, JSON.stringify({
        message_ids: unreadIds,
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
    }
  }
}

// Data generation functions
function generateTestUsers(count: number) {
  const users = [];
  for (let i = 0; i < count; i++) {
    users.push({
      id: `loadtest-user-${i}`,
      email: `loadtest${i}@test.com`,
      password: 'LoadTest123!',
      name: `Load Test User ${i}`,
    });
  }
  return users;
}

function generateTestMessages() {
  return [
    'Hey, how are you?',
    'Did you see the game last night?',
    'Great practice today!',
    'When is the next team meeting?',
    'Thanks for the help!',
    'See you at the rink',
    'Don\'t forget about tomorrow\'s game',
    'Good luck everyone!',
    'Has anyone seen my water bottle?',
    'Coach wants us there 30 min early',
  ];
}

function generateTestFiles() {
  return [
    { name: 'schedule.pdf', size: 1024000, mimeType: 'application/pdf', content: 'PDF_CONTENT' },
    { name: 'team-photo.jpg', size: 2048000, mimeType: 'image/jpeg', content: 'JPEG_CONTENT' },
    { name: 'plays.docx', size: 512000, mimeType: 'application/docx', content: 'DOCX_CONTENT' },
  ];
}

// Utility functions
function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = array.slice().sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function getRandomMessage(): string {
  return getRandomItem(testMessages);
}

function getRandomFile() {
  return getRandomItem(testFiles);
}

function getRandomUsers(count: number): string[] {
  return getRandomItems(testUsers, count).map(u => u.id);
}

function getMentionMessage(mentions: string[]): string {
  const templates = [
    '@{user} what do you think?',
    'Hey @{user}, can you check this?',
    '@{user} @{user2} meeting in 5 minutes',
    'Thanks @{user} for the help!',
  ];
  
  let message = getRandomItem(templates);
  mentions.forEach((mention, i) => {
    message = message.replace(`{user${i > 0 ? i + 1 : ''}}`, mention);
  });
  
  return message;
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getAdminToken(): string {
  // This would authenticate as an admin user for setup
  return 'ADMIN_TOKEN';
}

export function teardown(data) {
  // Cleanup code - remove test data, close connections, etc.
  console.log('Cleaning up load test environment...');
  console.log(`Total messages sent: ${messagesSent.count}`);
  console.log(`Total messages received: ${messagesReceived.count}`);
  console.log(`Average message send time: ${messageSendTime.avg}ms`);
}