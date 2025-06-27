# Authentication Testing Guide

## Current Setup
- Frontend: http://localhost:3010
- API Gateway: http://localhost:3000
- User Service: http://localhost:3001
- Database: PostgreSQL containers on ports 5432-5440

## Test Authentication Flow

### 1. Access the Login Page
Navigate to: http://localhost:3010/login

### 2. Test with Demo Credentials
The system automatically creates these demo users on startup:

| Role | Email | Password | Dashboard URL |
|------|-------|----------|---------------|
| Player | player@hockeyhub.com | demo123 | /player |
| Coach | coach@hockeyhub.com | demo123 | /coach |
| Parent | parent@hockeyhub.com | demo123 | /parent |
| Medical Staff | medical@hockeyhub.com | demo123 | /medicalstaff |

### 3. Authentication Flow
1. Enter credentials on login page
2. Frontend sends POST to `/api/v1/auth/login`
3. Request is proxied through Next.js to API Gateway (port 3000)
4. API Gateway forwards to User Service (port 3001)
5. User Service validates against PostgreSQL database
6. JWT tokens are returned on successful login
7. User is redirected to role-specific dashboard

### 4. Troubleshooting

#### Services Not Running
- Check console output from `pnpm run dev`
- User service should show: "✅ Database connected"
- API Gateway should show proxy routes

#### Database Connection Issues
- Ensure Docker containers are running: `docker-compose ps`
- All database containers should show as "healthy"
- User service connects to `localhost:5432` (db-users)

#### Login Failures
- Check browser console for errors
- Check API Gateway logs for proxy errors
- Verify user service created demo users (check console logs)

### 5. Testing New User Registration
1. Click "Register" tab on login page
2. Fill in all required fields
3. Submit to create new account
4. Login with new credentials

### 6. API Endpoints
- Login: POST `/api/v1/auth/login`
- Register: POST `/api/v1/auth/register`
- Get Current User: GET `/api/v1/auth/me`
- Logout: POST `/api/v1/auth/logout`
- Refresh Token: POST `/api/v1/auth/refresh`