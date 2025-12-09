# [Service Name]

## Overview

Brief description of what this service does and its role in the Hockey Hub ecosystem.

## Features

- Feature 1
- Feature 2
- Feature 3

## Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: TypeORM
- Additional technologies...

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Additional requirements...

### Installation

```bash
cd services/[service-name]
pnpm install
```

### Environment Variables

Create a `.env` file in the service root:

```env
# Server
PORT=[PORT_NUMBER]
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hockey_hub_[service]
DB_USER=postgres
DB_PASSWORD=postgres

# Additional config...
```

### Running the Service

```bash
# Development
pnpm run dev

# Production
pnpm run build
pnpm start

# Tests
pnpm test
```

## API Endpoints

See [API Documentation](../../API.md#[section]) for detailed endpoint information.

### Key Endpoints

- `GET /endpoint1` - Description
- `POST /endpoint2` - Description
- `PUT /endpoint3/:id` - Description

## Database Schema

### Main Table
```sql
CREATE TABLE table_name (
  id SERIAL PRIMARY KEY,
  -- columns
);
```

## Business Rules

1. **Rule 1**
   - Details

2. **Rule 2**
   - Details

## Integration Points

### External Services
- Service dependencies

### Events/Webhooks
- Events this service emits

## Error Handling

Standard error response format.

## Testing

```bash
pnpm test
```

## Deployment

```bash
docker build -t hockey-hub/[service-name] .
docker run -p [PORT]:[PORT] --env-file .env hockey-hub/[service-name]
```