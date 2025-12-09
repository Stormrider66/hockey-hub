# Exercise API Documentation

## Overview
The Exercise API provides endpoints for managing exercise templates in the Hockey Hub training system. These endpoints allow coaches and administrators to create, read, update, and delete exercise templates that can be used in workout sessions.

## Base URL
```
/api/v1/training/exercises
```

## Authentication
All endpoints require JWT authentication. The user must have appropriate roles for certain operations:
- **Read operations**: Any authenticated user
- **Create/Update/Delete operations**: Coach, Admin, or Superadmin roles required

## Endpoints

### 1. List Exercises
Get a paginated list of exercise templates with optional filtering.

**Endpoint:** `GET /api/v1/training/exercises`

**Query Parameters:**
- `category` (optional): Filter by exercise category (`strength`, `cardio`, `skill`, `mobility`, `recovery`)
- `search` (optional): Search exercises by name
- `isActive` (optional): Filter by active status (`true` or `false`)
- `skip` (optional): Number of records to skip (default: 0)
- `take` (optional): Number of records to return (default: 50, max: 100)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Barbell Squat",
      "category": "strength",
      "description": "A compound exercise that targets the quadriceps, hamstrings, and glutes",
      "primaryUnit": "kilograms",
      "equipment": ["barbell", "squat rack"],
      "muscleGroups": ["quadriceps", "hamstrings", "glutes", "core"],
      "instructions": "1. Position the barbell...",
      "videoUrl": "https://example.com/squat-video",
      "imageUrl": "https://example.com/squat-image.jpg",
      "defaultParameters": {
        "sets": 4,
        "reps": 8,
        "restDuration": 120,
        "intensityLevel": "high"
      },
      "progressionGuidelines": {
        "beginnerRange": { "min": 20, "max": 40 },
        "intermediateRange": { "min": 40, "max": 80 },
        "advancedRange": { "min": 80, "max": 150 },
        "unit": "kilograms"
      },
      "isActive": true,
      "createdBy": "user-id",
      "organizationId": "org-id",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 50,
  "skip": 0,
  "take": 50
}
```

### 2. Search Exercises
Search exercises by name with autocomplete functionality.

**Endpoint:** `GET /api/v1/training/exercises/search`

**Query Parameters:**
- `q` (required): Search query

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "name": "Squat",
      "category": "strength",
      // ... other fields
    }
  ]
}
```

### 3. Get Exercises by Category
Get all exercises in a specific category.

**Endpoint:** `GET /api/v1/training/exercises/category/:category`

**Path Parameters:**
- `category`: One of `strength`, `cardio`, `skill`, `mobility`, `recovery`

**Response:**
```json
{
  "success": true,
  "data": [
    // Array of exercises in the specified category
  ]
}
```

### 4. Get Exercise by ID
Get a specific exercise template by its ID.

**Endpoint:** `GET /api/v1/training/exercises/:id`

**Path Parameters:**
- `id`: Exercise template ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Barbell Squat",
    // ... all exercise fields
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": "Exercise not found: {id}"
}
```

### 5. Create Exercise
Create a new exercise template.

**Endpoint:** `POST /api/v1/training/exercises`

**Required Role:** Coach, Admin, or Superadmin

**Request Body:**
```json
{
  "name": "Barbell Squat",
  "category": "strength",
  "description": "A compound exercise that targets the quadriceps, hamstrings, and glutes",
  "primaryUnit": "kilograms",
  "equipment": ["barbell", "squat rack"],
  "muscleGroups": ["quadriceps", "hamstrings", "glutes", "core"],
  "instructions": "1. Position the barbell...",
  "videoUrl": "https://example.com/squat-video",
  "imageUrl": "https://example.com/squat-image.jpg",
  "defaultParameters": {
    "sets": 4,
    "reps": 8,
    "restDuration": 120,
    "intensityLevel": "high"
  },
  "progressionGuidelines": {
    "beginnerRange": { "min": 20, "max": 40 },
    "intermediateRange": { "min": 40, "max": 80 },
    "advancedRange": { "min": 80, "max": 150 },
    "unit": "kilograms"
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "newly-generated-id",
    // ... all fields from request plus system fields
  }
}
```

### 6. Update Exercise
Update an existing exercise template.

**Endpoint:** `PUT /api/v1/training/exercises/:id`

**Required Role:** Coach, Admin, or Superadmin

**Path Parameters:**
- `id`: Exercise template ID

**Request Body:** (All fields are optional)
```json
{
  "name": "Updated Exercise Name",
  "description": "Updated description",
  "category": "strength",
  "equipment": ["updated", "equipment"],
  "isActive": true
  // ... any other fields to update
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    // Updated exercise object
  }
}
```

### 7. Delete Exercise
Soft delete an exercise template (sets isActive to false).

**Endpoint:** `DELETE /api/v1/training/exercises/:id`

**Required Role:** Coach, Admin, or Superadmin

**Path Parameters:**
- `id`: Exercise template ID

**Response:**
```json
{
  "success": true,
  "message": "Exercise deleted successfully"
}
```

## Data Types

### Exercise Categories
- `strength`: Strength training exercises
- `cardio`: Cardiovascular exercises
- `skill`: Sport-specific skill exercises
- `mobility`: Flexibility and mobility exercises
- `recovery`: Recovery and rehabilitation exercises

### Exercise Units
- `reps`: Repetitions
- `seconds`: Time duration
- `meters`: Distance
- `watts`: Power output
- `kilograms`: Weight

### Intensity Levels
- `low`: Low intensity
- `medium`: Medium intensity
- `high`: High intensity
- `max`: Maximum intensity

## Error Handling
All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error

## Notes
- Exercises are scoped to organizations for multi-tenancy
- The `createdBy` field tracks which user created the exercise
- Soft delete is used to maintain data integrity
- Search functionality uses case-insensitive partial matching
- Pagination is recommended for large datasets