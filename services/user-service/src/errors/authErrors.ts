import { HttpError } from './httpError';

// Represents a 401 Unauthorized error
export class UnauthorizedError extends HttpError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

// Represents a 409 Conflict error
export class ConflictError extends HttpError {
  constructor(message: string = 'Conflict') {
    super(message, 409);
  }
}

// Add other auth-related errors here if needed (e.g., ForbiddenError - 403) 