# Medical Service

## Overview

The Medical Service manages all health-related data for players including injuries, medical records, treatment plans, and player availability status.

## Features

- Injury tracking and management
- Medical record storage
- Treatment plan creation and tracking
- Player availability management
- Medical document uploads
- Injury history and analytics
- HIPAA-compliant data handling

## Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **File Storage**: AWS S3
- **Validation**: Joi
- **Documentation**: Swagger/OpenAPI

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- AWS S3 bucket (for document storage)

### Installation

```bash
cd services/medical-service
npm install
```

### Environment Variables

Create a `.env` file in the service root:

```env
# Server
PORT=3005
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hockey_hub_medical
DB_USER=postgres
DB_PASSWORD=postgres

# AWS S3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=hockey-hub-medical-docs

# Encryption
ENCRYPTION_KEY=your-encryption-key-for-sensitive-data
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

See [API Documentation](../../API.md#4-medical-service-port-3005) for detailed endpoint information.

### Key Endpoints

- `POST /injuries` - Report new injury
- `GET /injuries` - List injuries (filtered by team/player)
- `POST /injuries/:id/updates` - Add injury update
- `GET /players/:playerId/records` - Get player medical history
- `GET /availability` - Get team availability status

## Database Schema

### Injuries Table
```sql
CREATE TABLE injuries (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL,
  injury_type VARCHAR(100) NOT NULL,
  body_part VARCHAR(100) NOT NULL,
  severity VARCHAR(50) NOT NULL, -- minor, moderate, severe
  injury_date DATE NOT NULL,
  expected_return_date DATE,
  actual_return_date DATE,
  status VARCHAR(50) NOT NULL, -- active, recovering, recovered
  description TEXT,
  mechanism_of_injury TEXT,
  created_by INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Injury Updates Table
```sql
CREATE TABLE injury_updates (
  id SERIAL PRIMARY KEY,
  injury_id INTEGER REFERENCES injuries(id),
  update_date DATE NOT NULL,
  status VARCHAR(50) NOT NULL,
  notes TEXT NOT NULL,
  updated_by INTEGER NOT NULL,
  next_evaluation_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Medical Records Table
```sql
CREATE TABLE medical_records (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL,
  record_type VARCHAR(50) NOT NULL, -- checkup, test, vaccination, etc.
  record_date DATE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  provider_name VARCHAR(255),
  provider_type VARCHAR(100),
  confidential BOOLEAN DEFAULT false,
  created_by INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Medical Documents Table
```sql
CREATE TABLE medical_documents (
  id SERIAL PRIMARY KEY,
  record_id INTEGER REFERENCES medical_records(id),
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size INTEGER NOT NULL,
  s3_key VARCHAR(500) NOT NULL,
  encrypted BOOLEAN DEFAULT true,
  uploaded_by INTEGER NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Player Availability Table
```sql
CREATE TABLE player_availability (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL,
  date DATE NOT NULL,
  status VARCHAR(50) NOT NULL, -- available, injured, sick, personal
  injury_id INTEGER REFERENCES injuries(id),
  notes TEXT,
  updated_by INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(player_id, date)
);
```

### Treatment Plans Table
```sql
CREATE TABLE treatment_plans (
  id SERIAL PRIMARY KEY,
  injury_id INTEGER REFERENCES injuries(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  status VARCHAR(50) DEFAULT 'active',
  created_by INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Data Privacy & Security

### HIPAA Compliance
- All medical data is encrypted at rest and in transit
- Access control based on user roles
- Audit logging for all data access
- Secure document storage in S3 with encryption

### Access Control
- **Medical Staff**: Full access to all medical records
- **Coaches**: View injury status and availability only
- **Players**: View own medical records only
- **Parents**: View child's medical records (if player is minor)

## Business Rules

1. **Injury Reporting**
   - Only medical staff can create injury reports
   - Players can view their own injuries
   - Coaches can view injury status but not medical details

2. **Availability Management**
   - Automatically updated based on injury status
   - Manual overrides allowed by medical staff
   - Historical availability tracked for analytics

3. **Document Management**
   - All documents encrypted before S3 upload
   - Automatic virus scanning
   - Version control for updated documents

## Integration Points

### Webhooks
The service emits webhooks for:
- `player.injured` - New injury reported
- `player.recovered` - Player cleared to return
- `availability.updated` - Player availability changed

### External Services
- **User Service** - Player and staff information
- **Calendar Service** - Schedule conflicts with injuries
- **Statistics Service** - Injury analytics
- **Communication Service** - Notifications

## Error Handling

```json
{
  "success": false,
  "error": {
    "code": "MEDICAL_ACCESS_DENIED",
    "message": "You don't have permission to view this medical record"
  }
}
```

## Testing

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# All tests with coverage
npm run test:coverage
```

## Monitoring

- Health check: `GET /health`
- Metrics: `GET /metrics`
- Audit logs stored in PostgreSQL

## Deployment

```bash
docker build -t hockey-hub/medical-service .
docker run -p 3005:3005 --env-file .env hockey-hub/medical-service
```