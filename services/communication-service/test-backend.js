const axios = require('axios');
const { io } = require('socket.io-client');

// Configuration
const API_URL = 'http://localhost:3002/api';
const SOCKET_URL = 'http://localhost:3002';

// Test users
const users = [
  { id: 'user1', email: 'user1@test.com', token: null },
  { id: 'user2', email: 'user2@test.com', token: null },
];

// Mock JWT tokens (in real app, these would come from auth service)
function generateMockToken(userId, email) {
  // This is a mock token - in production, use proper JWT
  const payload = {
    sub: userId,
    email: email,
    organizationId: 'test-org',
    roles: ['user'],
  };
  
  // For testing, we'll use a simple base64 encoding
  // In production, this should be a proper JWT
  return 'Bearer mock-' + Buffer.from(JSON.stringify(payload)).toString('base64');
}

// Generate tokens for test users
users[0].token = generateMockToken(users[0].id, users[0].email);
users[1].token = generateMockToken(users[1].id, users[1].email);

// Test functions
async function testHealthCheck() {
  console.log('\n🏥 Testing Health Check...');
  try {
    const response = await axios.get('http://localhost:3002/health');
    console.log('✅ Health check passed:', response.data);
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
  }
}

async function testCreateConversation() {
  console.log('\n💬 Testing Create Conversation...');
  try {
    const response = await axios.post(
      `${API_URL}/conversations`,
      {
        type: 'direct',
        participant_ids: [users[0].id, users[1].id],
      },
      {
        headers: { Authorization: users[0].token },
      }
    );
    
    console.log('✅ Conversation created:', response.data.data.id);
    return response.data.data.id;
  } catch (error) {
    console.error('❌ Create conversation failed:', error.response?.data || error.message);
    return null;
  }
}

async function testSendMessage(conversationId) {
  console.log('\n📨 Testing Send Message...');
  try {
    const response = await axios.post(
      `${API_URL}/messages/conversations/${conversationId}/messages`,
      {
        content: 'Hello from the test script!',
        type: 'text',
      },
      {
        headers: { Authorization: users[0].token },
      }
    );
    
    console.log('✅ Message sent:', response.data.data.id);
    return response.data.data.id;
  } catch (error) {
    console.error('❌ Send message failed:', error.response?.data || error.message);
    return null;
  }
}

async function testSocketConnection() {
  console.log('\n🔌 Testing Socket.io Connection...');
  
  return new Promise((resolve) => {
    // Extract token without 'Bearer ' prefix for socket auth
    const token = users[0].token.replace('Bearer ', '');
    
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });
    
    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
      
      // Test joining a conversation
      socket.emit('conversation:join', 'test-conversation-id');
      
      socket.on('conversation:joined', (data) => {
        console.log('✅ Joined conversation:', data.conversationId);
      });
      
      socket.on('error', (error) => {
        console.log('⚠️  Socket error:', error);
      });
      
      // Disconnect after 2 seconds
      setTimeout(() => {
        socket.disconnect();
        resolve();
      }, 2000);
    });
    
    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection failed:', error.message);
      resolve();
    });
  });
}

async function testPresenceUpdate() {
  console.log('\n👁 Testing Presence Update...');
  try {
    const response = await axios.put(
      `${API_URL}/presence`,
      {
        status: 'online',
        status_message: 'Testing the chat system',
      },
      {
        headers: { Authorization: users[0].token },
      }
    );
    
    console.log('✅ Presence updated');
  } catch (error) {
    console.error('❌ Presence update failed:', error.response?.data || error.message);
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Backend Tests...\n');
  console.log('Note: This test script uses mock authentication.');
  console.log('For production, integrate with your actual auth service.\n');
  
  // Run tests in sequence
  await testHealthCheck();
  
  // Create a conversation
  const conversationId = await testCreateConversation();
  
  if (conversationId) {
    // Send a message
    await testSendMessage(conversationId);
  }
  
  // Test presence
  await testPresenceUpdate();
  
  // Test socket connection
  await testSocketConnection();
  
  console.log('\n✨ Tests completed!');
  console.log('\nNote: Some tests may fail due to mock authentication.');
  console.log('To fully test the backend:');
  console.log('1. Update the JWT secret in .env to match your auth service');
  console.log('2. Use real JWT tokens from your auth service');
  console.log('3. Ensure the database is running and migrations are applied');
  
  process.exit(0);
}

// Check if service is running
axios.get('http://localhost:3002/health')
  .then(() => {
    console.log('✅ Communication service is running!');
    runTests();
  })
  .catch(() => {
    console.error('❌ Communication service is not running!');
    console.log('\nPlease start the service first:');
    console.log('  cd services/communication-service');
    console.log('  pnpm run dev');
    process.exit(1);
  });