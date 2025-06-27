# Training Service

## Overview

The Training Service manages all training-related activities including workout sessions, exercises, physical tests, and training plans for players and teams.

## Features

- Training session management
- Exercise library with video demonstrations
- Physical test definitions and results tracking
- Training plan creation and assignment
- Real-time training metrics via WebSocket
- Performance analytics
- Progressive overload tracking

## Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Real-time**: Socket.io
- **Validation**: Joi
- **Media Storage**: AWS S3

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis (for real-time features)
- AWS S3 (for exercise videos)

### Installation

```bash
cd services/training-service
npm install
```

### Environment Variables

Create a `.env` file in the service root:

```env
# Server
PORT=3004
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hockey_hub_training
DB_USER=postgres
DB_PASSWORD=postgres

# Redis (for Socket.io)
REDIS_HOST=localhost
REDIS_PORT=6379

# AWS S3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=hockey-hub-training-media
```

### Running the Service

```bash
# Development
npm run dev

# Production
npm run build
npm start

# Tests
npm test
```

## API Endpoints

See [API Documentation](../../API.md#3-training-service-port-3004) for detailed endpoint information.

### Key Endpoints

- `GET /sessions` - List training sessions
- `POST /sessions` - Create training session
- `GET /exercises` - Browse exercise library
- `POST /tests/:id/results` - Submit test results
- `GET /plans` - List training plans

## Database Schema

### Exercises Table
```sql
CREATE TABLE exercises (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL, -- strength, cardio, skill, flexibility
  muscle_groups TEXT[], -- array of muscle groups
  equipment TEXT[], -- required equipment
  difficulty VARCHAR(50), -- beginner, intermediate, advanced
  description TEXT,
  instructions TEXT,
  video_url VARCHAR(500),
  thumbnail_url VARCHAR(500),
  duration_seconds INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Training Sessions Table
```sql
CREATE TABLE training_sessions (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  team_id INTEGER,
  session_type VARCHAR(50) NOT NULL, -- team, individual, recovery
  scheduled_date TIMESTAMP NOT NULL,
  duration_minutes INTEGER NOT NULL,
  location VARCHAR(255),
  status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled
  intensity_level INTEGER CHECK (intensity_level BETWEEN 1 AND 10),
  notes TEXT,
  created_by INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Session Exercises Table
```sql
CREATE TABLE session_exercises (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES training_sessions(id),
  exercise_id INTEGER REFERENCES exercises(id),
  phase VARCHAR(50), -- warmup, main, cooldown
  order_index INTEGER NOT NULL,
  sets INTEGER,
  reps INTEGER,
  duration_seconds INTEGER,
  rest_seconds INTEGER,
  weight_kg DECIMAL(5,2),
  notes TEXT
);
```

### Physical Test Definitions Table
```sql
CREATE TABLE test_definitions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL, -- speed, strength, endurance, agility
  description TEXT,
  instructions TEXT,
  unit VARCHAR(50) NOT NULL, -- seconds, meters, kg, reps, etc.
  equipment_needed TEXT[],
  norm_values JSONB, -- age/gender specific norms
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Test Results Table
```sql
CREATE TABLE test_results (
  id SERIAL PRIMARY KEY,
  test_id INTEGER REFERENCES test_definitions(id),
  player_id INTEGER NOT NULL,
  test_date DATE NOT NULL,
  result_value DECIMAL(10,2) NOT NULL,
  conditions TEXT, -- testing conditions/notes
  verified_by INTEGER,
  percentile INTEGER, -- calculated based on norms
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Training Plans Table
```sql
CREATE TABLE training_plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  duration_weeks INTEGER NOT NULL,
  difficulty VARCHAR(50),
  focus_areas TEXT[], -- strength, speed, endurance, etc.
  target_audience VARCHAR(100), -- age group or skill level
  created_by INTEGER NOT NULL,
  is_template BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Plan Assignments Table
```sql
CREATE TABLE plan_assignments (
  id SERIAL PRIMARY KEY,
  plan_id INTEGER REFERENCES training_plans(id),
  player_id INTEGER NOT NULL,
  assigned_by INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  status VARCHAR(50) DEFAULT 'active',
  progress_percentage INTEGER DEFAULT 0,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Real-time Features

### WebSocket Events

The service uses Socket.io for real-time features:

```javascript
// Client subscribes to session updates
socket.emit('join-session', { sessionId: 123 });

// Server emits live metrics
socket.emit('session-metrics', {
  sessionId: 123,
  heartRates: { player1: 165, player2: 172 },
  activeTime: 1800,
  intensity: 7.5
});
```

### Available Events
- `session-started` - Training session begins
- `session-metrics` - Live performance data
- `exercise-completed` - Player completes exercise
- `session-ended` - Training session ends

## Training Metrics

### Calculated Metrics
- **Training Load**: Duration × Intensity
- **Weekly Volume**: Sum of training loads
- **Acute:Chronic Ratio**: Last 7 days vs last 28 days
- **Recovery Status**: Based on HRV and wellness data

### Performance Tracking
- Progressive overload monitoring
- Personal records tracking
- Improvement trends
- Comparison with team averages

## Integration Points

### External Services
- **User Service** - Player and coach information
- **Calendar Service** - Training schedule
- **Medical Service** - Injury considerations
- **Statistics Service** - Performance analytics

### Webhooks
- `training.session.completed`
- `training.test.submitted`
- `training.plan.assigned`

## Business Rules

1. **Session Management**
   - Coaches can create/modify team sessions
   - Players can only modify individual sessions
   - Automatic reminders 24 hours before

2. **Test Results**
   - Must be verified by coach/trainer
   - Historical results preserved
   - Automatic percentile calculation

3. **Training Plans**
   - Templates can be reused
   - Progress tracked automatically
   - Adaptive based on performance

## Error Handling

```json
{
  "success": false,
  "error": {
    "code": "TRAINING_CONFLICT",
    "message": "Session conflicts with existing schedule"
  }
}
```

## Testing

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# Load tests (for WebSocket)
npm run test:load
```

## Deployment

```bash
docker build -t hockey-hub/training-service .
docker run -p 3004:3004 --env-file .env hockey-hub/training-service
```

## Performance Considerations

- Exercise videos served via CDN
- Database indexes on frequently queried fields
- Redis caching for exercise library
- WebSocket connection pooling