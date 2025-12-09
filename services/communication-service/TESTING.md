# Communication Service Testing Guide

## Prerequisites

1. **PostgreSQL Database**: Ensure PostgreSQL is running with the communication database
2. **Install Dependencies**: Run `pnpm install` from the root directory
3. **Environment Setup**: Ensure `.env` file is configured properly

## Running the Service

```bash
# From the communication-service directory
pnpm run dev
```

The service should start on port 3002 (or the port specified in .env).

## Running Database Migrations

Before testing, ensure the database schema is up to date:

```bash
pnpm run migration:run
```

## Testing Methods

### 1. Quick Backend Test

We've provided a test script that verifies basic functionality:

```bash
pnpm run test:backend
```

This script will test:
- Health check endpoint
- Creating conversations
- Sending messages
- Presence updates
- Socket.io connections

**Note**: This script uses mock authentication. For production testing, you'll need to:
1. Update the JWT secret in `.env` to match your auth service
2. Modify the script to use real JWT tokens

### 2. Unit/Integration Tests

Run the Jest test suite:

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm run test:watch

# Run with coverage
pnpm run test:coverage
```

### 3. Manual Testing with cURL

#### Health Check
```bash
curl http://localhost:3002/health
```

#### Create Conversation (requires valid JWT)
```bash
curl -X POST http://localhost:3002/api/conversations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "group",
    "name": "Test Group",
    "participant_ids": ["user1", "user2"]
  }'
```

### 4. Testing with Postman/Insomnia

Import the following endpoints:

- `GET /health` - Health check
- `POST /api/conversations` - Create conversation
- `GET /api/conversations` - List conversations
- `POST /api/messages/conversations/:id/messages` - Send message
- `GET /api/messages/conversations/:id/messages` - Get messages
- `PUT /api/presence` - Update presence

### 5. Socket.io Testing

You can test Socket.io connections using the Socket.io client:

```javascript
const io = require('socket.io-client');

const socket = io('http://localhost:3002', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
});

socket.on('connect', () => {
  console.log('Connected:', socket.id);
  
  // Join a conversation
  socket.emit('conversation:join', 'conversation-id');
  
  // Send a message
  socket.emit('message:send', {
    conversationId: 'conversation-id',
    content: 'Hello from Socket.io!'
  });
});

socket.on('message:new', (data) => {
  console.log('New message:', data);
});
```

## Authentication Setup

The communication service expects JWT tokens with the following structure:

```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "organizationId": "org-id",
  "roles": ["user"]
}
```

For testing with the actual user service:
1. Start the user service
2. Register/login to get a valid JWT
3. Use that JWT in the Authorization header

## Common Issues

### Database Connection Failed
- Ensure PostgreSQL is running
- Check database credentials in `.env`
- Verify the database exists: `hockey_hub_communication`

### JWT Authentication Failed
- Ensure JWT_SECRET in `.env` matches your auth service
- Check token expiration
- Verify token format: `Bearer <token>`

### Socket.io Connection Failed
- Check CORS settings if testing from a browser
- Ensure the service is running
- Verify authentication token is valid

## Development Tips

1. **Enable Debug Logging**: Set `NODE_ENV=development` for detailed logs
2. **Database Inspection**: Use pgAdmin or psql to inspect database state
3. **Socket.io Admin UI**: Consider using Socket.io Admin UI for monitoring connections
4. **API Documentation**: Use Swagger/OpenAPI (to be implemented) for interactive API testing